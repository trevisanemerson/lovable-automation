import { describe, it, expect } from "vitest";
import * as auth from "./auth";

describe("Authentication", () => {
  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const password = "TestPassword123";
      const hash = await auth.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it("should verify a correct password", async () => {
      const password = "TestPassword123";
      const hash = await auth.hashPassword(password);
      const isValid = await auth.verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "TestPassword123";
      const wrongPassword = "WrongPassword456";
      const hash = await auth.hashPassword(password);
      const isValid = await auth.verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe("Email Validation", () => {
    it("should validate a correct email", () => {
      const validEmails = [
        "test@example.com",
        "user.name@example.co.uk",
        "user+tag@example.com",
      ];
      
      validEmails.forEach(email => {
        expect(auth.validateEmail(email)).toBe(true);
      });
    });

    it("should reject an invalid email", () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
      ];
      
      invalidEmails.forEach(email => {
        expect(auth.validateEmail(email)).toBe(false);
      });
    });
  });

  describe("Password Validation", () => {
    it("should validate a strong password", () => {
      const password = "StrongPass123";
      const result = auth.validatePassword(password);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject a password that is too short", () => {
      const password = "Short1A";
      const result = auth.validatePassword(password);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("8 caracteres");
    });

    it("should reject a password without uppercase", () => {
      const password = "lowercase123";
      const result = auth.validatePassword(password);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("maiúscula");
    });

    it("should reject a password without lowercase", () => {
      const password = "UPPERCASE123";
      const result = auth.validatePassword(password);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("minúscula");
    });

    it("should reject a password without numbers", () => {
      const password = "NoNumbers";
      const result = auth.validatePassword(password);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain("número");
    });
  });

  describe("Token Generation", () => {
    it("should generate a token", () => {
      const token = auth.generateToken();
      
      expect(token).toBeDefined();
      expect(token.length).toBe(32);
    });

    it("should generate unique tokens", () => {
      const token1 = auth.generateToken();
      const token2 = auth.generateToken();
      
      expect(token1).not.toBe(token2);
    });

    it("should generate a token with custom length", () => {
      const token = auth.generateToken(16);
      
      expect(token.length).toBe(16);
    });
  });

  describe("Temporary Email Generation", () => {
    it("should generate a temporary email", () => {
      const email = auth.generateTemporaryEmail();
      
      expect(email).toBeDefined();
      expect(email).toMatch(/^lovable_\d+_[a-zA-Z0-9_-]+@temp\.local$/);
    });

    it("should generate unique temporary emails", () => {
      const email1 = auth.generateTemporaryEmail();
      const email2 = auth.generateTemporaryEmail();
      
      expect(email1).not.toBe(email2);
    });
  });
});
