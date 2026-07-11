import { test, expect } from '@playwright/test';

test.describe('MonsoonMind Onboarding & Dashboard E2E Tests', () => {
  test('Complete Onboarding, Switch Context, and Evaluate Route', async ({ page }) => {
    // 1. Load the login page and authenticate to enter onboarding wizard
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('MonsoonMind');
    
    await page.fill('input[placeholder="e.g. name@domain.com"]', 'amit@sharma.com');
    await page.fill('input[placeholder="••••••••"]', 'password');
    await page.click('button:has-text("Sign In to Platform")');
    
    // Check Wizard page header
    await expect(page.locator('h1')).toContainText('Configure Your MonsoonMind Profile');
    
    // Step 1: Fill Name and Location
    await page.fill('input[placeholder="e.g. Rajesh Kulkarni"]', 'Amit Sharma');
    await page.fill('input[placeholder="Enter your street or neighborhood"]', 'Indiranagar, Bengaluru');
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Step 2: Household Counter increment
    // Check if we are on step 2 by expecting the counter rows
    await expect(page.locator('text=Infants / Children')).toBeVisible();
    // Increment Kids
    await page.click('div:has-text("Infants / Children") >> button:has-text("+")');
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Step 3: Infrastructure selections
    await expect(page.locator('text=Power Inverter Backup?')).toBeVisible();
    // Choose ground floor card
    await page.click('button:has-text("Ground Floor")');
    
    // Save & Launch Dashboard
    await page.click('button:has-text("Save & Launch Dashboard")');
    
    // 2. Main Dashboard Verification
    // Header brand verification
    await expect(page.locator('header')).toContainText('MonsoonMind');
    // Active Profile name verification
    await expect(page.locator('header')).toContainText('Amit Sharma');
    
    // 3. Context Switcher Dropdown Verification
    await page.click('header >> text=Amit Sharma');
    // Switch to Rajesh Kulkarni profile using evaluate to prevent viewport scrolling issues
    await page.locator('button:has-text("Rajesh Kulkarni")').evaluate(node => node.click());
    // Verify context switch
    await expect(page.locator('header')).toContainText('Rajesh Kulkarni');

    // 4. Weather Feed Zone Selector
    await page.click('button:has-text("Live GPS Zone")');
    await expect(page.locator('button:has-text("Live GPS Zone")')).toHaveClass(/bg-white/);
    
    // 5. Route Safety Advisory Verification
    await page.fill('input[value="Kurla, Mumbai"]', 'Kurla Station');
    await page.fill('input[placeholder="e.g. HAL Airport Road"]', 'Dharavi, Mumbai');
    await page.click('button:has-text("Evaluate Route Safety")');
    
    // Expect safety status block to render
    await expect(page.locator('h3:has-text("Status:")')).toBeVisible();
    
    // 6. Weatherman AI Chatbot Drawer
    const chatbotFab = page.locator('#chat-fab');
    await chatbotFab.click();
    
    // Expect chatbot header
    await expect(page.locator('text=WeatherMan Bot')).toBeVisible();
    // Type query
    await page.fill('input[placeholder="Ask WeatherMan..."]', 'Is it safe to drive right now?');
    await page.click('button:has-text("send")');
    
    // Verify reply card renders
    await expect(page.locator('div >> text=Is it safe to drive right now?')).toBeVisible();

    // 7. Incident Reporting Map Modal
    await page.click('button:has-text("Report Incident")');
    await expect(page.locator('text=Broadcast Local Emergency Alert')).toBeVisible();
    // Expect Leaflet map to load
    await expect(page.locator('#leaflet-incident-map')).toBeVisible();
  });
});
