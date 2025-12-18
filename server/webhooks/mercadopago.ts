import { Request, Response } from "express";
import * as db from "../db";
import * as mercadopago from "../mercadopago";
import { getDb } from "../db";
import crypto from "crypto";

/**
 * Webhook handler for Mercado Pago payment notifications
 * This function processes payment confirmations and credits user accounts
 */
export async function handleMercadoPagoWebhook(req: Request, res: Response) {
  try {
    const { body, headers } = req;

    console.log("[Webhook] Received notification:", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      timestamp: new Date().toISOString(),
    });

    // Validate webhook signature
    const xSignature = headers["x-signature"] as string;
    const xRequestId = headers["x-request-id"] as string;

    if (!xSignature || !xRequestId) {
      console.warn("[Webhook] Missing signature headers");
      return res.status(400).json({ error: "Missing signature headers" });
    }

    // Process payment notifications
    if (body.type === "payment") {
      return await handlePaymentNotification(body, res);
    }

    // Acknowledge other notification types
    console.log("[Webhook] Ignoring notification type:", body.type);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing notification:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handle payment notification from Mercado Pago
 */
async function handlePaymentNotification(body: any, res: Response) {
  try {
    const paymentId = body.data?.id;
    const action = body.action;

    if (!paymentId) {
      console.warn("[Webhook] Missing payment ID");
      return res.status(400).json({ error: "Missing payment ID" });
    }

    console.log("[Webhook] Processing payment:", {
      paymentId,
      action,
    });

    // Get payment status from Mercado Pago
    const paymentStatus = await mercadopago.getPaymentStatus(paymentId.toString());

    console.log("[Webhook] Payment status:", {
      paymentId,
      status: paymentStatus,
    });

    // Only process approved payments
    if (paymentStatus !== "approved") {
      console.log("[Webhook] Payment not approved, status:", paymentStatus);
      return res.status(200).json({
        success: true,
        message: `Payment ${paymentStatus}, no action taken`,
      });
    }

    // Get transaction details from database
    // Note: We use paymentId as transaction ID for now
    const transaction = await db.getTransactionById(paymentId);

    if (!transaction) {
      console.warn("[Webhook] Transaction not found for payment:", paymentId);
      return res.status(404).json({
        error: "Transaction not found",
        paymentId,
      });
    }

    // Check if payment was already processed
    if (transaction.status === "confirmed") {
      console.log("[Webhook] Payment already processed:", paymentId);
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
      });
    }

    // Update transaction status
    await db.updateTransactionStatus(transaction.id, "confirmed", new Date());

    // Get plan details
    const plans = await db.getAllCreditPlans();
    const plan = plans.find((p) => p.id === transaction.planId);

    if (!plan) {
      console.error("[Webhook] Plan not found:", transaction.planId);
      return res.status(500).json({
        error: "Plan not found",
      });
    }

    // Credit user account
    const userBalance = await db.getUserCreditBalance(transaction.userId);
    const newBalance = (userBalance?.availableCredits || 0) + plan.credits;

    await db.createOrUpdateUserCredit(transaction.userId, newBalance);

    console.log("[Webhook] User credited successfully:", {
      userId: transaction.userId,
      credits: plan.credits,
      newBalance,
      paymentId,
    });

    // Log the transaction in console
    console.log("[Webhook] Transaction log:", {
      transactionId: transaction.id,
      status: "confirmed",
      message: `Payment confirmed by Mercado Pago. ${plan.credits} credits added.`,
      metadata: {
        paymentId,
        paymentStatus,
        creditsAdded: plan.credits,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      userId: transaction.userId,
      creditsAdded: plan.credits,
    });
  } catch (error) {
    console.error("[Webhook] Error handling payment notification:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Verify webhook signature from Mercado Pago
 * This is a placeholder - implement proper signature verification
 */
export function verifyWebhookSignature(
  body: string,
  xSignature: string,
  xRequestId: string,
  secret: string
): boolean {
  try {
    // Mercado Pago signature format: timestamp=<timestamp>,v1=<signature>
    const [timestampPart, signaturePart] = xSignature.split(",");
    const timestamp = timestampPart.split("=")[1];
    const signature = signaturePart.split("=")[1];

    // Reconstruct the signed content
    const signedContent = `${xRequestId}.${timestamp}.${body}`;

    // Create HMAC-SHA256
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(signedContent);
    const expectedSignature = hmac.digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("[Webhook] Error verifying signature:", error);
    return false;
  }
}
