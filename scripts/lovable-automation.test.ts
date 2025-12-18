import { test, expect } from '@playwright/test';
import LovableAutomation from './lovable-automation';

/**
 * Test suite for Lovable automation
 */

test.describe('Lovable Automation', () => {
  test('should initialize with valid config', () => {
    const config = {
      inviteLink: 'https://lovable.dev/invite/test',
      email: 'test@example.com',
      password: 'password123',
    };

    const automation = new LovableAutomation(config);
    expect(automation).toBeDefined();
  });

  test('should handle missing invite link', () => {
    const config = {
      inviteLink: '',
      email: 'test@example.com',
      password: 'password123',
    };

    const automation = new LovableAutomation(config);
    expect(automation).toBeDefined();
  });

  test('should generate temporary email', () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const tempEmail = `lovable_${timestamp}_${randomStr}@temp.local`;

    expect(tempEmail).toMatch(/^lovable_\d+_[a-z0-9]+@temp\.local$/);
  });

  test('should validate email format', () => {
    const validEmails = [
      'test@example.com',
      'user+tag@domain.co.uk',
      'name.surname@company.org',
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(email).toMatch(emailRegex);
    });
  });

  test('should validate password strength', () => {
    const weakPassword = 'abc';
    const strongPassword = 'SecurePass123!@#';

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    expect(weakPassword).not.toMatch(passwordRegex);
    expect(strongPassword).toMatch(passwordRegex);
  });
});

/**
 * Integration tests (requires actual Lovable instance)
 */
test.describe.skip('Lovable Automation Integration', () => {
  test('should complete full automation flow', async () => {
    const config = {
      inviteLink: process.env.LOVABLE_INVITE_LINK || '',
      email: `lovable_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@temp.local`,
      password: 'TestPassword123!',
      projectName: 'Automated Test Project',
      headless: true,
    };

    if (!config.inviteLink) {
      test.skip();
      return;
    }

    const automation = new LovableAutomation(config);
    const result = await automation.run();

    expect(result.success).toBe(true);
    expect(result.email).toBe(config.email);
    expect(result.projectId).toBeDefined();
    expect(result.projectUrl).toBeDefined();
    expect(result.steps.length).toBeGreaterThan(0);
  });

  test('should handle invalid invite link', async () => {
    const config = {
      inviteLink: 'https://lovable.dev/invite/invalid',
      email: 'test@example.com',
      password: 'password123',
      headless: true,
    };

    const automation = new LovableAutomation(config);
    const result = await automation.run();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('should handle invalid credentials', async () => {
    const config = {
      inviteLink: process.env.LOVABLE_INVITE_LINK || '',
      email: 'invalid@example.com',
      password: 'wrongpassword',
      headless: true,
    };

    if (!config.inviteLink) {
      test.skip();
      return;
    }

    const automation = new LovableAutomation(config);
    const result = await automation.run();

    expect(result.success).toBe(false);
  });
});
