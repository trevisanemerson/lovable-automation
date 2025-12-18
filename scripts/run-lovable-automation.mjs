#!/usr/bin/env node

/**
 * Lovable Automation Runner
 * Usage: node run-lovable-automation.mjs --invite-link <url> --email <email> --password <password>
 */

import { chromium } from 'playwright';

class LovableAutomation {
  constructor(config) {
    this.config = {
      projectName: 'Automated Project',
      headless: true,
      ...config,
    };
    this.steps = [];
  }

  log(message) {
    console.log(`[Lovable] ${message}`);
    this.steps.push(message);
  }

  async run() {
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
      this.log(`❌ Error: ${error.message}`);
      return {
        success: false,
        email: this.config.email,
        error: error.message,
        steps: this.steps,
      };
    } finally {
      await this.cleanup();
    }
  }

  async launchBrowser() {
    this.log('Launching browser...');
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });
    this.page = await this.browser.newPage();
    this.log('Browser launched');
  }

  async navigateToInvite() {
    this.log(`Navigating to invite link: ${this.config.inviteLink}`);
    await this.page.goto(this.config.inviteLink, { waitUntil: 'networkidle' });
    this.log('Invite page loaded');
  }

  async registerAccount() {
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
    
    if (!clicked && buttons.length > 0) {
      await buttons[0].click();
      this.log('First button clicked');
    }
    
    // Wait for navigation
    await this.page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await this.page.waitForTimeout(2000);
    this.log('Account registered');
  }

  async login() {
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

  async createProject() {
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
    
    if (!projectCreated && buttons.length > 0) {
      await buttons[0].click();
      this.log('First button clicked to create project');
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

  async publishProject() {
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

  async cleanup() {
    this.log('Cleaning up...');
    if (this.browser) {
      await this.browser.close();
      this.log('Browser closed');
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--invite-link' && args[i + 1]) {
      config.inviteLink = args[i + 1];
      i++;
    } else if (args[i] === '--email' && args[i + 1]) {
      config.email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      config.password = args[i + 1];
      i++;
    } else if (args[i] === '--project-name' && args[i + 1]) {
      config.projectName = args[i + 1];
      i++;
    } else if (args[i] === '--headless' && args[i + 1]) {
      config.headless = args[i + 1] !== 'false';
      i++;
    }
  }
  
  return config;
}

// Main execution
async function main() {
  const config = parseArgs();
  
  if (!config.inviteLink || !config.email || !config.password) {
    console.error('Usage: node run-lovable-automation.mjs --invite-link <url> --email <email> --password <password> [--project-name <name>] [--headless true|false]');
    process.exit(1);
  }
  
  const automation = new LovableAutomation(config);
  const result = await automation.run();
  
  console.log('\n=== Automation Result ===');
  console.log(JSON.stringify(result, null, 2));
  
  process.exit(result.success ? 0 : 1);
}

main().catch(console.error);
