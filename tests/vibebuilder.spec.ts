import { test, expect } from '@playwright/test';

test.describe('Zentro Workspace E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Open the local workspace application
    await page.goto('/workspace');
  });

  test('should load the workspace interface correctly', async ({ page }) => {
    // Check header logos and layout controls
    await expect(page.locator('header').getByText('ZENTRO')).toBeVisible();
    await expect(page.locator('text=Browser AI Workspace')).toBeVisible();
    
    // Check main panels (chats history list, Monaco editor container, Preview frame)
    await expect(page.locator('text=Sessions History')).toBeVisible();
    await expect(page.locator('text=5-Pass Visual Pipeline')).toBeVisible();
    await expect(page.locator('text=index.html').first()).toBeVisible();
    await expect(page.locator('text=Sandbox Preview')).toBeVisible();
  });

  test('should trigger the 5-pass visual pipeline and load generated code', async ({ page }) => {
    // Locate the prompt input at the bottom
    const promptInput = page.locator('input[placeholder*="Build an interactive CRM"]');
    await expect(promptInput).toBeVisible();

    // Type prompt and submit
    await promptInput.fill('create a simple crm client database app');
    await promptInput.press('Enter');

    // Wait for the visual pipeline logs and completion ticks to succeed
    // We target Pass 1 (Analyze Request), Pass 3 (Generate Code), and Pass 5 (Polish UX)
    const pass1Badge = page.locator('aside span:has-text("1")').first();
    const pass3Badge = page.locator('aside span:has-text("3")').first();
    const pass5Badge = page.locator('aside span:has-text("5")').first();
    
    await expect(pass1Badge).toBeVisible();
    await expect(pass3Badge).toBeVisible();
    await expect(pass5Badge).toBeVisible();

    // Check if Monaco Editor container compiles the files
    const liveSyncBadge = page.locator('text=Live Sync');
    await expect(liveSyncBadge).toBeVisible();

    // Wait for the iframe sandboxed preview to load the index page
    const iframe = page.frameLocator('iframe[title="App Sandbox"]');
    await expect(iframe.locator('body')).toBeVisible();
  });

  test('should render the offline AI utilities tools dashboard', async ({ page }) => {
    // Click on the Tools link in the top header
    const toolsLink = page.locator('a[title="Open Offline Developer Utilities"]');
    await expect(toolsLink).toBeVisible();
    await toolsLink.click();

    // Verify we navigated to the toolbox page
    await expect(page).toHaveURL(/\/toolbox/);

    // Verify initial tools dashboard title is visible
    await expect(page.locator('text=Explore Utilities Dashboard')).toBeVisible();
    
    // Click Regex Sandbox card
    const regexCard = page.locator('text=Regex Sandbox').first();
    await expect(regexCard).toBeVisible();
    await regexCard.click({ force: true });
    
    // Verify Regex Sandbox view is loaded
    await expect(page.locator('text=Regex Sandbox & Evaluator')).toBeVisible();

    // Go back to the dashboard grid and reset category filters
    await page.locator('span:has-text("Toolbox")').first().click();

    // Click SQL Query Assistant card
    const sqlCard = page.locator('text=SQL Query Assistant').first();
    await expect(sqlCard).toBeVisible();
    await sqlCard.click({ force: true });
    await expect(page.locator('text=AI SQL Assistant')).toBeVisible();

    // Go back to the dashboard grid and reset category filters
    await page.locator('span:has-text("Toolbox")').first().click();

    // Click JSON Prettify & Validator card
    const jsonCard = page.locator('text=JSON Prettify & Validator').first();
    await expect(jsonCard).toBeVisible();
    await jsonCard.click({ force: true });
    await expect(page.locator('text=JSON Formatter & Validator')).toBeVisible();
    
    // Go back to the dashboard grid and reset category filters
    await page.locator('span:has-text("Toolbox")').first().click();

    // Click HTTP Client Playground card
    const apiCard = page.locator('text=HTTP Client Playground').first();
    await expect(apiCard).toBeVisible();
    await apiCard.click({ force: true });
    await expect(page.locator('text=HTTP REST Client Console')).toBeVisible();
  });
});

test.describe('Zentro General Assistant E2E Tests', () => {
  test('should load assistant page and toggle its config selectors', async ({ page }) => {
    await page.goto('/assistant');
    
    // Validate title and branding
    await expect(page.locator('text=ON-DEVICE CHAT CO-PILOT')).toBeVisible();
    await expect(page.locator('h3:has-text("Zentro general-purpose assistant")')).toBeVisible();

    // Validate sidebars elements (Presets & Memory input)
    await expect(page.locator('text=System Personas')).toBeVisible();
    await expect(page.locator('text=Persistent Memories')).toBeVisible();

    // Fill in a persistent memory rule
    const memoryInput = page.locator('input[placeholder*="Remember"]');
    await expect(memoryInput).toBeVisible();
    await memoryInput.fill('Write clean responsive code');
    await page.locator('button:has-text("Add")').click();
    await expect(page.locator('text=Write clean responsive code')).toBeVisible();
  });
});
