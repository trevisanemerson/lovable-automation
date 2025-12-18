import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 320;
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Senha deve conter pelo menos uma letra maiúscula" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Senha deve conter pelo menos uma letra minúscula" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Senha deve conter pelo menos um número" };
  }
  
  return { valid: true };
}

export function generateToken(length: number = 32): string {
  return nanoid(length);
}

export function generateTemporaryEmail(): string {
  const timestamp = Date.now();
  const random = nanoid(8);
  return `lovable_${timestamp}_${random}@temp.local`;
}
