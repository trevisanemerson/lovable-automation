import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const tasksRouter = router({
  /**
   * Create a new automation task
   */
  create: protectedProcedure
    .input(
      z.object({
        lovableInviteLink: z.string().url(),
        quantity: z.number().int().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate user has enough credits
      const balance = await db.getUserCreditBalance(ctx.user.id);
      if (!balance || balance.availableCredits < input.quantity) {
        throw new Error("Insufficient credits");
      }

      // Create task
      const result = await db.createTask(
        ctx.user.id,
        input.lovableInviteLink,
        input.quantity
      );

      return {
        taskId: (result as any)?.insertId,
        status: "pending",
        quantity: input.quantity,
      };
    }),

  /**
   * Get task details and progress
   */
  getProgress: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.taskId);

      if (!task) {
        throw new Error("Task not found");
      }

      // Verify user owns this task
      if (task.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Get task logs
      const logs = await db.getTaskLogs(input.taskId);

      return {
        id: task.id,
        status: task.status,
        quantity: task.quantityRequested,
        completed: logs.filter((l) => l.status === "success").length,
        failed: logs.filter((l) => l.status === "failed").length,
        progress: task.quantityRequested > 0
          ? Math.round(
              ((logs.filter((l) => l.status === "success").length +
                logs.filter((l) => l.status === "failed").length) /
                task.quantityRequested) *
                100
            )
          : 0,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        logs: logs.map((log) => ({
          accountNumber: log.accountNumber,
          email: log.email,
          status: log.status,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
        })),
      };
    }),

  /**
   * Get all tasks for current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await db.getUserTasks(ctx.user.id);

    return tasks.map((task) => ({
      id: task.id,
      status: task.status,
      quantity: task.quantityRequested,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  }),

  /**
   * Get task history with logs
   */
  getHistory: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.taskId);

      if (!task) {
        throw new Error("Task not found");
      }

      // Verify user owns this task
      if (task.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Get task logs
      const logs = await db.getTaskLogs(input.taskId);

      return {
        taskId: task.id,
        status: task.status,
        quantity: task.quantityRequested,
        createdAt: task.createdAt,
        completedAt: task.updatedAt,
        logs: logs.map((log) => ({
          accountNumber: log.accountNumber,
          email: log.email,
          status: log.status,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
        })),
      };
    }),

  /**
   * Cancel a pending task
   */
  cancel: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.taskId);

      if (!task) {
        throw new Error("Task not found");
      }

      // Verify user owns this task
      if (task.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Only allow canceling pending tasks
      if (task.status !== "pending") {
        throw new Error("Cannot cancel a task that is not pending");
      }

      // Update task status
      await db.updateTaskStatus(input.taskId, "cancelled");

      // Refund credits
      await db.refundCredits(ctx.user.id, task.quantityRequested);

      return { success: true };
    }),
});
