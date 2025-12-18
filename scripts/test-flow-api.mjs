#!/usr/bin/env node

/**
 * Complete Flow Test via API
 * Tests the entire automation workflow using tRPC API
 */

const API_URL = "https://3000-iyzhjui8w25xyk13cjsgo-dd6374fc.manusvm.computer";
const LOVABLE_INVITE_LINK = "https://lovable.dev/invite/OKUKR3K";
const QUANTITY = 1;

async function logStep(step, message) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📍 STEP ${step}: ${message}`);
  console.log(`${"=".repeat(60)}`);
}

async function callTRPC(procedure, input) {
  const response = await fetch(`${API_URL}/api/trpc/${procedure}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ json: input }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.result?.data || data;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  try {
    await logStep(1, "Get Current User");
    const user = await callTRPC("auth.me");
    console.log(`✅ Logged in as: ${user.name} (ID: ${user.id})`);

    await logStep(2, "Check Initial Credits");
    const initialBalance = await callTRPC("credits.getBalance");
    console.log(`Initial Credits: ${JSON.stringify(initialBalance, null, 2)}`);

    if (initialBalance.availableCredits < QUANTITY) {
      console.error("❌ Insufficient credits to run test");
      process.exit(1);
    }

    await logStep(3, "Create Task");
    const taskResult = await callTRPC("tasks.create", {
      lovableInviteLink: LOVABLE_INVITE_LINK,
      quantity: QUANTITY,
    });
    console.log(`✅ Task created: ${JSON.stringify(taskResult, null, 2)}`);
    const taskId = taskResult.taskId;

    await logStep(4, "Wait for TaskProcessor to Process");
    console.log(`⏳ Waiting for task processing (max 2 minutes)...`);
    
    let taskProgress = null;
    let maxAttempts = 24; // 24 * 5 seconds = 120 seconds
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        taskProgress = await callTRPC("tasks.getProgress", { taskId });
        console.log(`   Status: ${taskProgress.status} | Progress: ${taskProgress.progress}% | Completed: ${taskProgress.completed}/${taskProgress.quantity}`);

        if (taskProgress.status === "completed" || taskProgress.status === "failed") {
          break;
        }
      } catch (error) {
        console.log(`   Waiting for task to be processed...`);
      }

      await sleep(5000);
      attempt++;
    }

    if (!taskProgress) {
      throw new Error("Could not retrieve task progress");
    }

    await logStep(5, "Check Task Details");
    console.log(`Task Progress: ${JSON.stringify(taskProgress, null, 2)}`);

    await logStep(6, "Validate Credit Deduction");
    const finalBalance = await callTRPC("credits.getBalance");
    console.log(`Final Credits: ${JSON.stringify(finalBalance, null, 2)}`);

    const creditsUsed = initialBalance.availableCredits - finalBalance.availableCredits;
    console.log(`\n📊 Credit Analysis:`);
    console.log(`   Initial: ${initialBalance.availableCredits}`);
    console.log(`   Final: ${finalBalance.availableCredits}`);
    console.log(`   Used: ${creditsUsed}`);
    console.log(`   Expected: ${QUANTITY}`);

    await logStep(7, "Test Result");
    console.log(`\n🎯 Final Results:`);
    console.log(`   Task Status: ${taskProgress.status}`);
    console.log(`   Progress: ${taskProgress.progress}%`);
    console.log(`   Completed: ${taskProgress.completed}/${taskProgress.quantity}`);
    console.log(`   Failed: ${taskProgress.failed}`);
    console.log(`   Credits Used: ${creditsUsed}/${QUANTITY}`);

    if (taskProgress.completed === QUANTITY && creditsUsed === QUANTITY) {
      console.log(`\n✅ ✅ ✅ TEST PASSED! ✅ ✅ ✅`);
      console.log(`All accounts created successfully and credits deducted!`);
      
      // Display logs
      if (taskProgress.logs && taskProgress.logs.length > 0) {
        console.log(`\n📋 Account Logs:`);
        taskProgress.logs.forEach((log, index) => {
          console.log(`\n   Account ${index + 1}:`);
          console.log(`   - Email: ${log.email}`);
          console.log(`   - Status: ${log.status}`);
          if (log.errorMessage) {
            console.log(`   - Error: ${log.errorMessage}`);
          }
        });
      }

      process.exit(0);
    } else {
      console.log(`\n⚠️  TEST INCOMPLETE`);
      console.log(`Expected ${QUANTITY} successful accounts and ${QUANTITY} credits used`);
      console.log(`Got ${taskProgress.completed} successful accounts and ${creditsUsed} credits used`);
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
