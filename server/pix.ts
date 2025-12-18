import { nanoid } from "nanoid";

/**
 * PIX Service - Simulated PIX payment processing
 * In production, this would integrate with a real PIX provider like:
 * - Mercado Pago
 * - Stripe
 * - PagSeguro
 * - Braspag
 * etc.
 */

export interface PixPaymentData {
  qrCode: string;
  copyPaste: string;
  externalId: string;
  expiresAt: Date;
}

/**
 * Generate PIX payment data (simulated)
 * In production, this would call the actual PIX provider API
 */
export function generatePixPayment(
  amountInCents: number,
  description: string
): PixPaymentData {
  const externalId = `PAY_${nanoid(16)}`;
  
  // Simulated PIX data
  // In production, these would come from the PIX provider
  const qrCode = `00020126580014br.gov.bcb.pix0136${externalId}5204000053039865802BR5913LOVABLE6009SAO PAULO62410503***63041D3D`;
  const copyPaste = `00020126580014br.gov.bcb.pix0136${externalId}5204000053039865802BR5913LOVABLE6009SAO PAULO62410503***63041D3D`;
  
  return {
    qrCode,
    copyPaste,
    externalId,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  };
}

/**
 * Verify PIX payment (simulated)
 * In production, this would call the PIX provider API to check payment status
 */
export async function verifyPixPayment(externalId: string): Promise<boolean> {
  // Simulated verification
  // In production, this would check with the PIX provider
  console.log(`[PIX] Verifying payment: ${externalId}`);
  return false;
}

/**
 * Format amount for display
 */
export function formatAmount(amountInCents: number): string {
  return (amountInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Format amount as decimal string
 */
export function amountToDecimal(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2);
}
