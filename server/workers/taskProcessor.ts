import * as db from "../db";
import LovableAutomation from "../../scripts/lovable-automation";
import { RetryHandler, DEFAULT_RETRY_CONFIG } from "./retryHandler";

/**
 * Task Processor Worker
 * Processes automation tasks from the database queue
 */

interface TaskProcessingResult {
  taskId: number;
  success: boolean;
  projectId?: string;
  projectUrl?: string;
  error?: string;
  completedAt: Date;
  accountsCreated: number;
  accountsFailed: number;
}

export class TaskProcessor {
  private isRunning = false;
  private processInterval = 5000; // 5 seconds
  private retryHandler: RetryHandler;

  constructor() {
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
    });
  }

  /**
   * Start the task processor
   */
  start() {
    if (this.isRunning) {
      console.log("[TaskProcessor] Already running");
      return;
    }

    this.isRunning = true;
    console.log("[TaskProcessor] Started");
    this.processNextTask();
  }

  /**
   * Stop the task processor
   */
  stop() {
    this.isRunning = false;
    console.log("[TaskProcessor] Stopped");
  }

  /**
   * Process the next pending task
   */
  private async processNextTask() {
    if (!this.isRunning) return;

    try {
      // Get next pending task
      const task = await db.getTaskById(1); // Simplified for now

      if (task && task.status === "pending") {
        console.log(`[TaskProcessor] Processing task ${task.id}`);
        await this.processTask(task);
      }

      // Schedule next check
      setTimeout(() => this.processNextTask(), this.processInterval);
    } catch (error) {
      console.error("[TaskProcessor] Error processing task:", error);
      setTimeout(() => this.processNextTask(), this.processInterval);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: {
    id: number;
    userId: number;
    lovableInviteLink: string;
    quantityRequested: number;
    status: string;
  }) {
    let accountsCreated = 0;
    let accountsFailed = 0;

    try {
      // Update task status to processing
      await db.updateTaskStatus(task.id, "processing");

      // Generate temporary emails and passwords
      const accounts = this.generateAccounts(task.quantityRequested);

      // Process each account
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];

        try {
          console.log(
            `[TaskProcessor] Creating account ${i + 1}/${accounts.length} for task ${task.id}`
          );

          // Run Playwright automation with retry
          const result = await this.retryHandler.execute(
            async () => {
              const automation = new LovableAutomation({
                inviteLink: task.lovableInviteLink,
                email: account.email,
                password: account.password,
                projectName: `Project ${i + 1}`,
                headless: true,
              });

              return await automation.run();
            },
            (attempt, error, nextDelay) => {
              console.log(
                `[TaskProcessor] Retry attempt ${attempt} for account ${account.email} in ${nextDelay}ms - Error: ${error.message}`
              );
            }
          );

          if (result.success) {
            accountsCreated++;

            // Log successful account creation
            await db.createTaskLog(task.id, i + 1);

            console.log(
              `[TaskProcessor] ✅ Account created: ${account.email}`
            );
          } else {
            accountsFailed++;

            console.log(
              `[TaskProcessor] ❌ Account creation failed: ${account.email} - ${result.error}`
            );
          }
        } catch (error) {
          accountsFailed++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          // Check if error is retryable
          const isRetryable = this.retryHandler.isRetryable(
            error instanceof Error ? error : new Error(errorMessage)
          );

          console.error(
            `[TaskProcessor] Error processing account ${i + 1} (retryable: ${isRetryable}):`,
            error
          );
        }

        // Update task progress
        const progress = Math.round(((i + 1) / accounts.length) * 100);
        await db.updateTaskStatus(task.id, "processing");
      }

      // Debit user credits
      const creditsToDebit = task.quantityRequested;
      await db.deductCredits(task.userId, creditsToDebit);

      // Update task status to completed
      await db.updateTaskStatus(task.id, "completed");

      console.log(
        `[TaskProcessor] ✅ Task ${task.id} completed: ${accountsCreated} created, ${accountsFailed} failed`
      );
    } catch (error) {
      // Update task status to failed
      await db.updateTaskStatus(task.id, "failed");

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[TaskProcessor] Task ${task.id} failed:`, errorMessage);
    }
  }

  /**
   * Generate temporary accounts
   */
  private generateAccounts(
    quantity: number
  ): Array<{ email: string; password: string }> {
    const accounts = [];
    const timestamp = Date.now();

    for (let i = 0; i < quantity; i++) {
      const randomStr = Math.random().toString(36).substring(2, 8);
      const email = `lovable_${timestamp}_${i}_${randomStr}@temp.local`;
      const password = this.generatePassword();

      accounts.push({ email, password });
    }

    return accounts;
  }

  /**
   * Generate a strong password
   */
  private generatePassword(): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*";

    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Add random characters to reach 12 characters
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
}

/**
 * Global task processor instance
 */
let processor: TaskProcessor | null = null;

/**
 * Get or create task processor
 */
export function getTaskProcessor(): TaskProcessor {
  if (!processor) {
    processor = new TaskProcessor();
  }
  return processor;
}

/**
 * Start task processor
 */
export function startTaskProcessor() {
  const processor = getTaskProcessor();
  processor.start();
}

/**
 * Stop task processor
 */
export function stopTaskProcessor() {
  const processor = getTaskProcessor();
  processor.stop();
}

export default TaskProcessor;
