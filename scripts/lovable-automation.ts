import { chromium, Browser, Page } from '@playwright/test';

/**
 * Lovable.dev Automation Script
 * Automates account creation, login, project creation, and publishing
 */

interface LovableAutomationConfig {
  inviteLink: string;
  email: string;
  password: string;
  projectName?: string;
  headless?: boolean;
}

interface AutomationResult {
  success: boolean;
  email: string;
  projectId?: string;
  projectUrl?: string;
  error?: string;
  steps: string[];
}

export class LovableAutomation {
  private browser?: Browser;
  private page?: Page;
  private config: LovableAutomationConfig;
  private steps: string[] = [];

  constructor(config: LovableAutomationConfig) {
    this.config = {
      projectName: 'Automated Project',
      headless: true,
      ...config,
    };
  }

  private log(message: string) {
    console.log(`[Lovable] ${message}`);
    this.steps.push(message);
  }

  async run(): Promise<AutomationResult> {
    try {
      this.log('Starting Lovable automation...');
      
      // Launch browser
      await this.launchBrowser();
      
      // Navigate to invite link
      await this.navigateToInvite();
      
      // Register account
      await this.registerAccount();
      
      // Login
      await this.login();
      
      // Create project
      const projectId = await this.createProject();
      
      // Publish project
      const projectUrl = await this.publishProject();
      
      this.log('✅ Automation completed successfully!');
      
      return {
        success: true,
        email: this.config.email,
        projectId,
        projectUrl,
        steps: this.steps,
      };
    } catch (error) {
      this.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        email: this.config.email,
        error: error instanceof Error ? error.message : String(error),
        steps: this.steps,
      };
    } finally {
      await this.cleanup();
    }
  }

  private async launchBrowser() {
    this.log('Launching browser...');
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });
    this.page = await this.browser.newPage();
    this.log('Browser launched');
  }

  private async navigateToInvite() {
    if (!this.page) throw new Error('Page not initialized');
    
    this.log(`Navigating to invite link: ${this.config.inviteLink}`);
    await this.page.goto(this.config.inviteLink, { waitUntil: 'networkidle' });
    this.log('Invite page loaded');
  }

  private async registerAccount() {
    if (!this.page) throw new Error('Page not initialized');
    
    this.log('Registering account...');
    
    // Wait for registration form
    await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Fill email
    const emailInputs = await this.page.$$('input[type="email"], input[name="email"]');
    if (emailInputs.length > 0) {
      await emailInputs[0].fill(this.config.email);
      this.log(`Email entered: ${this.config.email}`);
    }
    
    // Fill password
    const passwordInputs = await this.page.$$('input[type="password"], input[name="password"]');
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill(this.config.password);
      this.log('Password entered');
    }
    
    // Click register/signup button
    const buttons = await this.page.$$('button');
    let clicked = false;
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (text.toLowerCase().includes('register') || text.toLowerCase().includes('sign up') || text.toLowerCase().includes('criar'))) {
        await button.click();
        clicked = true;
        this.log('Register button clicked');
        break;
      }
    }
    
    if (!clicked) {
      // Try clicking the first button if no register button found
      if (buttons.length > 0) {
        await buttons[0].click();
        this.log('First button clicked');
      }
    }
    
    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await this.page.waitForTimeout(2000);
    this.log('Account registered');
  }

  private async login() {
    if (!this.page) throw new Error('Page not initialized');
    
    this.log('Logging in...');
    
    // Check if already logged in
    const isLoggedIn = await this.page.evaluate(() => {
      return !!document.querySelector('[data-testid="user-menu"], .user-profile, [aria-label="User menu"]');
    });
    
    if (isLoggedIn) {
      this.log('Already logged in');
      return;
    }
    
    // Try to find and fill login form
    const emailInputs = await this.page.$$('input[type="email"], input[name="email"]');
    if (emailInputs.length > 0) {
      await emailInputs[0].fill(this.config.email);
      this.log('Email entered for login');
    }
    
    const passwordInputs = await this.page.$$('input[type="password"], input[name="password"]');
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill(this.config.password);
      this.log('Password entered for login');
    }
    
    // Click login button
    const buttons = await this.page.$$('button');
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (text.toLowerCase().includes('login') || text.toLowerCase().includes('sign in') || text.toLowerCase().includes('entrar'))) {
        await button.click();
        this.log('Login button clicked');
        break;
      }
    }
    
    // Wait for dashboard
    await this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await this.page.waitForTimeout(2000);
    this.log('Logged in successfully');
  }

  private async createProject(): Promise<string | undefined> {
    if (!this.page) throw new Error('Page not initialized');
    
    this.log('Creating project...');
    
    // Look for "New Project" or "Create Project" button
    const buttons = await this.page.$$('button');
    let projectCreated = false;
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (text.toLowerCase().includes('new') || text.toLowerCase().includes('create') || text.toLowerCase().includes('novo'))) {
        await button.click();
        projectCreated = true;
        this.log('Create project button clicked');
        break;
      }
    }
    
    if (!projectCreated) {
      // Try clicking the first button if no create button found
      if (buttons.length > 0) {
        await buttons[0].click();
        this.log('First button clicked to create project');
      }
    }
    
    // Wait for project creation form
    await this.page.waitForTimeout(2000);
    
    // Fill project name if there's an input
    const inputs = await this.page.$$('input[type="text"], input[name="name"], input[placeholder*="project" i]');
    if (inputs.length > 0) {
      await inputs[0].fill(this.config.projectName || 'Automated Project');
      this.log(`Project name entered: ${this.config.projectName}`);
    }
    
    // Click create/confirm button
    const createButtons = await this.page.$$('button');
    for (const button of createButtons) {
      const text = await button.textContent();
      if (text && (text.toLowerCase().includes('create') || text.toLowerCase().includes('confirm') || text.toLowerCase().includes('criar'))) {
        await button.click();
        this.log('Create project confirmed');
        break;
      }
    }
    
    // Wait for project to be created
    await this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await this.page.waitForTimeout(3000);
    
    // Extract project ID from URL
    const url = this.page.url();
    const projectIdMatch = url.match(/project\/([a-zA-Z0-9]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : undefined;
    
    this.log(`Project created with ID: ${projectId}`);
    return projectId;
  }

  private async publishProject(): Promise<string | undefined> {
    if (!this.page) throw new Error('Page not initialized');
    
    this.log('Publishing project...');
    
    // Look for publish button
    const buttons = await this.page.$$('button');
    let published = false;
    
    for (const button of buttons) {
      const text = await button.textContent();
      if (text && (text.toLowerCase().includes('publish') || text.toLowerCase().includes('deploy') || text.toLowerCase().includes('publicar'))) {
        await button.click();
        published = true;
        this.log('Publish button clicked');
        break;
      }
    }
    
    if (!published) {
      this.log('⚠️ Publish button not found, skipping publish step');
    }
    
    // Wait for publishing to complete
    await this.page.waitForTimeout(3000);
    
    // Get published URL
    const url = this.page.url();
    this.log(`Project URL: ${url}`);
    
    return url;
  }

  private async cleanup() {
    this.log('Cleaning up...');
    if (this.browser) {
      await this.browser.close();
      this.log('Browser closed');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  // Example usage
  const config: LovableAutomationConfig = {
    inviteLink: process.env.LOVABLE_INVITE_LINK || 'https://lovable.dev/invite/...',
    email: process.env.LOVABLE_EMAIL || 'test@example.com',
    password: process.env.LOVABLE_PASSWORD || 'password123',
    projectName: 'Test Project',
    headless: process.env.HEADLESS !== 'false',
  };

  const automation = new LovableAutomation(config);
  const result = await automation.run();

  console.log('\n=== Automation Result ===');
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default LovableAutomation;
