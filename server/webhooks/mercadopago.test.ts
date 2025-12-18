import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMercadoPagoWebhook } from "./mercadopago";
import * as db from "../db";
import * as mercadopago from "../mercadopago";

// Mock dependencies
vi.mock("../db");
vi.mock("../mercadopago");

describe("Mercado Pago Webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle payment approved notification", async () => {
    // Mock request and response
    const req = {
      body: {
        type: "payment",
        action: "payment.created",
        data: {
          id: 12345,
        },
      },
      headers: {
        "x-signature": "timestamp=1234567890,v1=signature123",
        "x-request-id": "request-123",
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    // Mock Mercado Pago API response
    vi.mocked(mercadopago.getPaymentStatus).mockResolvedValue("approved");

    // Mock database responses
    const mockTransaction = {
      id: 1,
      userId: 1,
      planId: 1,
      status: "pending",
      amount: "99.00",
      amountInCents: 9900,
    };

    vi.mocked(db.getTransactionById).mockResolvedValue(mockTransaction as any);

    const mockPlan = {
      id: 1,
      name: "Test Plan",
      credits: 100,
      price: "R$ 99,00",
      priceInCents: 9900,
    };

    vi.mocked(db.getAllCreditPlans).mockResolvedValue([mockPlan] as any);

    const mockBalance = {
      userId: 1,
      totalCredits: 0,
      usedCredits: 0,
      availableCredits: 0,
    };

    vi.mocked(db.getUserCreditBalance).mockResolvedValue(mockBalance as any);

    // Call webhook handler
    await handleMercadoPagoWebhook(req, res);

    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Payment processed successfully",
      })
    );

    // Verify database calls
    expect(db.getTransactionById).toHaveBeenCalledWith(12345);
    expect(db.updateTransactionStatus).toHaveBeenCalledWith(1, "confirmed", expect.any(Date));
    expect(db.createOrUpdateUserCredit).toHaveBeenCalledWith(1, 100);
  });

  it("should ignore non-approved payments", async () => {
    const req = {
      body: {
        type: "payment",
        action: "payment.created",
        data: {
          id: 12345,
        },
      },
      headers: {
        "x-signature": "timestamp=1234567890,v1=signature123",
        "x-request-id": "request-123",
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    // Mock payment as pending
    vi.mocked(mercadopago.getPaymentStatus).mockResolvedValue("pending");

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining("no action taken"),
      })
    );
  });

  it("should handle missing payment ID", async () => {
    const req = {
      body: {
        type: "payment",
        action: "payment.created",
        data: {},
      },
      headers: {
        "x-signature": "timestamp=1234567890,v1=signature123",
        "x-request-id": "request-123",
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Missing payment ID",
      })
    );
  });

  it("should handle missing signature headers", async () => {
    const req = {
      body: {
        type: "payment",
        data: { id: 12345 },
      },
      headers: {},
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Missing signature headers",
      })
    );
  });

  it("should prevent duplicate payment processing", async () => {
    const req = {
      body: {
        type: "payment",
        action: "payment.created",
        data: {
          id: 12345,
        },
      },
      headers: {
        "x-signature": "timestamp=1234567890,v1=signature123",
        "x-request-id": "request-123",
      },
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    // Mock payment as already confirmed
    vi.mocked(mercadopago.getPaymentStatus).mockResolvedValue("approved");

    const mockTransaction = {
      id: 1,
      userId: 1,
      planId: 1,
      status: "confirmed", // Already confirmed
      amount: "99.00",
      amountInCents: 9900,
    };

    vi.mocked(db.getTransactionById).mockResolvedValue(mockTransaction as any);

    await handleMercadoPagoWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Payment already processed",
      })
    );

    // Should NOT update transaction or credit user
    expect(db.updateTransactionStatus).not.toHaveBeenCalled();
    expect(db.createOrUpdateUserCredit).not.toHaveBeenCalled();
  });
});
