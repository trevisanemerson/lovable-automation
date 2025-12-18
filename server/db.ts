import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  creditPlans,
  userCredits,
  transactions,
  tasks,
  taskLogs,
  InsertTask,
  InsertTaskLog,
  InsertUserCredit,
  InsertTransaction,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.email) {
    throw new Error("User openId or email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId || null,
      email: user.email || "",
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.email !== undefined) {
      values.email = user.email;
      updateSet.email = user.email;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserCreditBalance(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateUserCredit(
  userId: number,
  totalCredits: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getUserCreditBalance(userId);
  const availableCredits = totalCredits - (existing?.usedCredits || 0);

  if (existing) {
    await db
      .update(userCredits)
      .set({
        totalCredits,
        availableCredits,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId));
  } else {
    await db.insert(userCredits).values({
      userId,
      totalCredits,
      usedCredits: 0,
      availableCredits: totalCredits,
    });
  }
}

export async function deductCredits(
  userId: number,
  amount: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const balance = await getUserCreditBalance(userId);
  if (!balance || balance.availableCredits < amount) {
    return false;
  }

  await db
    .update(userCredits)
    .set({
      usedCredits: balance.usedCredits + amount,
      availableCredits: balance.availableCredits - amount,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId));

  return true;
}

export async function refundCredits(
  userId: number,
  amount: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const balance = await getUserCreditBalance(userId);
  if (!balance) return;

  await db
    .update(userCredits)
    .set({
      usedCredits: Math.max(0, balance.usedCredits - amount),
      availableCredits: balance.availableCredits + amount,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId));
}

export async function getAllCreditPlans() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(creditPlans)
    .where(eq(creditPlans.isActive, true))
    .orderBy(creditPlans.displayOrder);
}

export async function createTransaction(
  userId: number,
  planId: number,
  amount: string,
  amountInCents: number
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(transactions).values({
    userId,
    planId,
    amount,
    amountInCents,
    status: "pending",
  });

  return result;
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getTransactionByExternalId(externalId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.externalId, externalId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTransactionStatus(
  id: number,
  status: "pending" | "confirmed" | "failed" | "expired",
  paidAt?: Date
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(transactions)
    .set({
      status,
      paidAt: paidAt || undefined,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id));
}

export async function createTask(
  userId: number,
  lovableInviteLink: string,
  quantityRequested: number
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(tasks).values({
    userId,
    lovableInviteLink,
    quantityRequested,
    status: "pending",
  });

  return result;
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getUserTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(tasks.createdAt);
}

export async function updateTaskStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  updates?: Partial<InsertTask>
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(tasks)
    .set({
      status,
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id));
}

export async function createTaskLog(
  taskId: number,
  accountNumber: number,
  email?: string
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(taskLogs).values({
    taskId,
    accountNumber,
    email,
    status: "pending",
  });

  return result;
}

export async function getTaskLogs(taskId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(taskLogs)
    .where(eq(taskLogs.taskId, taskId))
    .orderBy(taskLogs.accountNumber);
}

export async function updateTaskLog(
  id: number,
  updates: Partial<InsertTaskLog>
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(taskLogs)
    .set(updates)
    .where(eq(taskLogs.id, id));
}
