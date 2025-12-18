import { MercadoPagoConfig, Payment, PreApprovalPlan } from "mercadopago";
import { ENV } from "./_core/env";
import QRCode from "qrcode";

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: ENV.mercadoPagoAccessToken,
});

const payment = new Payment(client);

export interface CreatePixPaymentParams {
  planId: number;
  planName: string;
  credits: number;
  priceInCents: number;
  userEmail: string;
  userId: number;
  externalReference: string; // Unique identifier for tracking
}

export interface PixPaymentResponse {
  id: string;
  qrCode: string;
  qrCodeUrl: string;
  copyPaste: string;
  externalId: string;
  status: string;
  expiresAt: Date;
}

/**
 * Create a PIX payment using Mercado Pago
 */
export async function createPixPayment(
  params: CreatePixPaymentParams
): Promise<PixPaymentResponse> {
  try {
    const paymentData = {
      transaction_amount: params.priceInCents / 100,
      payment_method_id: "pix",
      payer: {
        email: params.userEmail,
      },
      description: `${params.planName} - ${params.credits} créditos`,
      external_reference: params.externalReference,
      notification_url: "https://lovableapp-8ae3qare.manus.space/api/webhooks/mercadopago",
    };

    const response = await payment.create({ body: paymentData });

    if (!response.point_of_interaction?.transaction_data?.qr_code) {
      throw new Error("Failed to generate PIX QR Code from Mercado Pago");
    }

    const copyPasteCode = response.point_of_interaction.transaction_data.qr_code;
    
    // Generate QR Code as PNG in base64
    const qrCodeDataUrl = await QRCode.toDataURL(copyPasteCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300,
    });
    
    // Extract base64 from data URL
    const base64QrCode = qrCodeDataUrl.replace('data:image/png;base64,', '');

    return {
      id: response.id?.toString() || "",
      qrCode: base64QrCode as string,
      qrCodeUrl: qrCodeDataUrl as string,
      copyPaste: copyPasteCode,
      externalId: params.externalReference,
      status: response.status || "pending",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  } catch (error) {
    console.error("[MercadoPago] Error creating PIX payment:", error);
    throw new Error(
      `Failed to create PIX payment: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get payment status from Mercado Pago
 */
export async function getPaymentStatus(paymentId: string): Promise<string> {
  try {
    const response = await payment.get({ id: paymentId });
    return response.status || "unknown";
  } catch (error) {
    console.error("[MercadoPago] Error getting payment status:", error);
    throw new Error(
      `Failed to get payment status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Verify webhook signature from Mercado Pago
 */
export function verifyWebhookSignature(
  body: Record<string, any>,
  xSignature: string,
  xRequestId: string
): boolean {
  // Mercado Pago signature verification
  // In production, implement proper signature verification
  // For now, we'll accept all webhooks (not recommended for production)
  return true;
}

/**
 * Handle webhook notification from Mercado Pago
 */
export async function handleWebhookNotification(
  body: Record<string, any>
): Promise<{
  paymentId: string;
  status: string;
  externalReference: string;
}> {
  try {
    const { data, type } = body;

    if (type === "payment") {
      const paymentId = data.id;
      const paymentStatus = await getPaymentStatus(paymentId);

      return {
        paymentId: paymentId.toString(),
        status: paymentStatus,
        externalReference: data.external_reference || "",
      };
    }

    throw new Error(`Unknown webhook type: ${type}`);
  } catch (error) {
    console.error("[MercadoPago] Error handling webhook:", error);
    throw error;
  }
}
