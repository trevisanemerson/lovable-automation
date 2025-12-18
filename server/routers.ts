import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as auth from "./auth";
import { TRPCError } from "@trpc/server";
import * as mercadopago from "./mercadopago";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { email, password, name } = input;

        if (!auth.validateEmail(email)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email inválido",
          });
        }

        const passwordValidation = auth.validatePassword(password);
        if (!passwordValidation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: passwordValidation.error || "Senha inválida",
          });
        }

        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email já registrado",
          });
        }

        const passwordHash = await auth.hashPassword(password);
        
        try {
          await db.upsertUser({
            email,
            passwordHash,
            name: name || null,
            loginMethod: "email",
            lastSignedIn: new Date(),
          });

          const newUser = await db.getUserByEmail(email);
          if (!newUser) {
            throw new Error("Falha ao criar usuário");
          }

          await db.createOrUpdateUserCredit(newUser.id, 0);

          return {
            success: true,
            userId: newUser.id,
            email: newUser.email,
          };
        } catch (error) {
          console.error("[Auth] Registration error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao registrar usuário",
          });
        }
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { email, password } = input;

        const user = await db.getUserByEmail(email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos",
          });
        }

        const passwordMatch = await auth.verifyPassword(password, user.passwordHash);
        if (!passwordMatch) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos",
          });
        }

        await db.upsertUser({
          email: user.email,
          lastSignedIn: new Date(),
        });

        return {
          success: true,
          userId: user.id,
          email: user.email,
          name: user.name,
        };
      }),
  }),

  credits: router({
    getBalance: protectedProcedure
      .query(async ({ ctx }) => {
        const balance = await db.getUserCreditBalance(ctx.user.id);
        return balance || {
          id: 0,
          userId: ctx.user.id,
          totalCredits: 0,
          usedCredits: 0,
          availableCredits: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

    getPlans: publicProcedure
      .query(async () => {
        return await db.getAllCreditPlans();
      }),
  }),

  transactions: router({
    create: protectedProcedure
      .input(z.object({
        planId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const plan = await db.getAllCreditPlans();
        const selectedPlan = plan.find(p => p.id === input.planId);

        if (!selectedPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plano não encontrado",
          });
        }

        const result = await db.createTransaction(
          ctx.user.id,
          input.planId,
          selectedPlan.price,
          selectedPlan.priceInCents
        );

        const transactionId = (result as any)?.insertId || 0;

        try {
          const pixPayment = await mercadopago.createPixPayment({
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            credits: selectedPlan.credits,
            priceInCents: selectedPlan.priceInCents,
            userEmail: ctx.user.email || "user@lovable.dev",
            userId: ctx.user.id,
            externalReference: `txn-${transactionId}`,
          });

          return {
            success: true,
            transactionId,
            amount: selectedPlan.price,
            amountInCents: selectedPlan.priceInCents,
            pixPayment: {
              id: pixPayment.id,
              qrCode: pixPayment.qrCode,
              copyPaste: pixPayment.copyPaste,
              expiresAt: pixPayment.expiresAt,
            },
          };
        } catch (error) {
          console.error("[Transactions] Error creating PIX payment:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao gerar código PIX. Tente novamente.",
          });
        }
      }),

    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const transaction = await db.getTransactionById(input.id);

        if (!transaction || transaction.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transação não encontrada",
          });
        }

        return transaction;
      }),
  }),

  tasks: router({
    create: protectedProcedure
      .input(z.object({
        lovableInviteLink: z.string().url(),
        quantityRequested: z.number().min(1).max(1000),
      }))
      .mutation(async ({ input, ctx }) => {
        const balance = await db.getUserCreditBalance(ctx.user.id);
        const creditsNeeded = input.quantityRequested;

        if (!balance || balance.availableCredits < creditsNeeded) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Créditos insuficientes",
          });
        }

        const result = await db.createTask(
          ctx.user.id,
          input.lovableInviteLink,
          input.quantityRequested
        );

        const taskId = (result as any)?.insertId || 0;

        return {
          success: true,
          taskId,
          quantityRequested: input.quantityRequested,
        };
      }),

    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.id);

        if (!task || task.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tarefa não encontrada",
          });
        }

        return task;
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserTasks(ctx.user.id);
      }),

    getLogs: protectedProcedure
      .input(z.object({
        taskId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const task = await db.getTaskById(input.taskId);

        if (!task || task.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tarefa não encontrada",
          });
        }

        return await db.getTaskLogs(input.taskId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
