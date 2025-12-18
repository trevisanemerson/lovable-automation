import { describe, it, expect } from "vitest";
import { createPixPayment } from "./mercadopago";

describe("Mercado Pago Integration", () => {
  it("should validate Mercado Pago credentials", async () => {
    // Test if the API token is valid by attempting to create a payment
    try {
      const result = await createPixPayment({
        planId: 1,
        planName: "Test Plan",
        credits: 100,
        priceInCents: 9900, // R$ 99.00
        userEmail: "test@example.com",
        userId: 1,
        externalReference: `test-${Date.now()}`,
      });

      // If we get here, the credentials are valid
      expect(result).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.qrCode.length).toBeGreaterThan(0);
      expect(result.id).toBeDefined();
      expect(result.status).toBe("pending");
    } catch (error) {
      // If credentials are invalid, this will throw
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's an authentication error
      if (errorMessage.includes("401") || errorMessage.includes("unauthorized") || errorMessage.includes("Unauthorized")) {
        throw new Error("Invalid Mercado Pago credentials. Please check your Access Token.");
      }
      
      // For other errors, re-throw
      throw error;
    }
  });
});
