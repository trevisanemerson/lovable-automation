#!/usr/bin/env node

/**
 * Complete Flow Test
 * Tests the entire automation workflow:
 * 1. Create a task with Lovable invite link
 * 2. Wait for TaskProcessor to process it
 * 3. Verify account creation and project publication
 * 4. Validate credit deduction
 */

import mysql from "mysql2/promise";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_CONFIG = {
  host: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("//")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[1]?.split("@")[0] || "",
  database: process.env.DATABASE_URL?.split("/").pop() || "lovable_automation",
};

const LOVABLE_INVITE_LINK = "https://lovable.dev/invite/OKUKR3K";
const TEST_USER_ID = 1; // Emerson Trevisan
const QUANTITY = 1;
const INITIAL_CREDITS = 10; // Start with 10 credits

async function getConnection() {
  return await mysql.createConnection(DB_CONFIG);
}

async function logStep(step, message) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📍 STEP ${step}: ${message}`);
  console.log(`${"=".repeat(60)}`);
}

async function getUserCredits(userId) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT availableCredits, totalCredits FROM userCredits WHERE userId = ?",
      [userId]
    );
    conn.end();
    return rows[0] || null;
  } catch (error) {
    conn.end();
    throw error;
  }
}

async function createTestTask() {
  const conn = await getConnection();
  try {
    const [result] = await conn.query(
      "INSERT INTO tasks (userId, lovableInviteLink, quantityRequested, status) VALUES (?, ?, ?, ?)",
      [TEST_USER_ID, LOVABLE_INVITE_LINK, QUANTITY, "pending"]
    );
    conn.end();
    return result.insertId;
  } catch (error) {
    conn.end();
    throw error;
  }
}

async function getTaskStatus(taskId) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT id, status, lovableInviteLink, quantityRequested FROM tasks WHERE id = ?",
      [taskId]
    );
    conn.end();
    return rows[0] || null;
  } catch (error) {
    conn.end();
    throw error;
  }
}

async function getTaskLogs(taskId) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT accountNumber, email, status, errorMessage, createdEmail, projectUrl FROM taskLogs WHERE taskId = ? ORDER BY accountNumber ASC",
      [taskId]
    );
    conn.end();
    return rows;
  } catch (error) {
    conn.end();
    throw error;
  }
}

async function waitForTaskCompletion(taskId, maxWaitTime = 120000) {
  const startTime = Date.now();
  const pollInterval = 5000; // Check every 5 seconds

  while (Date.now() - startTime < maxWaitTime) {
    const task = await getTaskStatus(taskId);

    if (task.status === "completed" || task.status === "failed") {
      return task;
    }

    console.log(`⏳ Task ${taskId} status: ${task.status}... waiting...`);
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Task ${taskId} did not complete within ${maxWaitTime}ms`);
}

async function runTest() {
  try {
    await logStep(1, "Check Initial Credits");
    const initialCredits = await getUserCredits(TEST_USER_ID);
    console.log(`Initial Credits: ${JSON.stringify(initialCredits, null, 2)}`);

    if (!initialCredits || initialCredits.availableCredits < QUANTITY) {
      console.error("❌ Insufficient credits to run test");
      process.exit(1);
    }

    await logStep(2, "Create Task");
    const taskId = await createTestTask();
    console.log(`✅ Task created with ID: ${taskId}`);
    console.log(`   Link: ${LOVABLE_INVITE_LINK}`);
    console.log(`   Quantity: ${QUANTITY}`);

    await logStep(3, "Wait for TaskProcessor to Process");
    console.log(`⏳ Waiting for task processing (max 2 minutes)...`);
    const completedTask = await waitForTaskCompletion(taskId, 120000);
    console.log(`✅ Task completed with status: ${completedTask.status}`);

    await logStep(4, "Check Task Logs");
    const logs = await getTaskLogs(taskId);
    console.log(`📋 Task Logs (${logs.length} accounts):`);
    logs.forEach((log, index) => {
      console.log(`\n   Account ${log.accountNumber}:`);
      console.log(`   - Email: ${log.email}`);
      console.log(`   - Status: ${log.status}`);
      console.log(`   - Created Email: ${log.createdEmail}`);
      console.log(`   - Project URL: ${log.projectUrl}`);
      if (log.errorMessage) {
        console.log(`   - Error: ${log.errorMessage}`);
      }
    });

    await logStep(5, "Validate Credit Deduction");
    const finalCredits = await getUserCredits(TEST_USER_ID);
    console.log(`Final Credits: ${JSON.stringify(finalCredits, null, 2)}`);

    const creditsUsed = initialCredits.availableCredits - finalCredits.availableCredits;
    console.log(`\n📊 Credit Analysis:`);
    console.log(`   Initial: ${initialCredits.availableCredits}`);
    console.log(`   Final: ${finalCredits.availableCredits}`);
    console.log(`   Used: ${creditsUsed}`);
    console.log(`   Expected: ${QUANTITY}`);

    if (creditsUsed === QUANTITY) {
      console.log(`✅ Credits deducted correctly!`);
    } else {
      console.log(`⚠️  Credit deduction mismatch!`);
    }

    await logStep(6, "Test Result");
    const successCount = logs.filter((l) => l.status === "success").length;
    const failureCount = logs.filter((l) => l.status === "failed").length;

    console.log(`\n🎯 Final Results:`);
    console.log(`   Total Accounts: ${logs.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log(`   Credits Used: ${creditsUsed}/${QUANTITY}`);

    if (successCount === QUANTITY && creditsUsed === QUANTITY) {
      console.log(`\n✅ ✅ ✅ TEST PASSED! ✅ ✅ ✅`);
      console.log(`All accounts created successfully and credits deducted!`);
      process.exit(0);
    } else {
      console.log(`\n❌ TEST FAILED`);
      console.log(`Expected ${QUANTITY} successful accounts and ${QUANTITY} credits used`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Test Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runTest();
