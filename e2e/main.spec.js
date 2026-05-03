import { test, expect } from '@playwright/test';
import { demoAccount, newMemberEmail } from './fixtures.js';

test.describe('Collaborative Team Hub E2E', () => {
  test('1. Register a new user → redirected to dashboard', async ({ page }) => {
    await page.goto('/register');

    const testEmail = `test${Date.now()}@example.com`;
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('TestPass123!');
    await page.getByLabel('Confirm Password').fill('TestPass123!');
    await page.getByRole('button', { name: /register/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /no workspace selected/i })).toBeVisible({ timeout: 10000 });
  });

  test('2. Login with demo account', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 15000 });
  });

  test('3. Dashboard loads with stats', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/total goals/i)).toBeVisible();
    await expect(page.getByText(/completed this week/i)).toBeVisible();
    await expect(page.getByText(/overdue goals/i)).toBeVisible();
  });

  test('4. Create a goal → appears in goals list', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Select a workspace from the sidebar
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();

    // Navigate to Goals
    await page.getByRole('link', { name: 'Goals' }).click();
    await page.waitForURL(/\/goals/);

    await page.getByRole('button', { name: /add goal/i }).click();
    const goalTitle = `E2E Goal-${Date.now()}`;
    await page.getByPlaceholder('Goal title').fill(goalTitle);
    await page.getByRole('button', { name: /create goal/i }).click();

    await expect(page.getByText(goalTitle)).toBeVisible({ timeout: 15000 });
  });

  test('5. Add milestone to existing goal', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Select a workspace
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();

    // Navigate to Goals
    await page.getByRole('link', { name: 'Goals' }).click();
    await page.waitForURL(/\/goals/);

    // Create a goal first
    await page.getByRole('button', { name: /add goal/i }).click();
    const goalTitle = `Milestone Test-${Date.now()}`;
    await page.getByPlaceholder('Goal title').fill(goalTitle);
    await page.getByRole('button', { name: /create goal/i }).click();
    await expect(page.getByText(goalTitle)).toBeVisible({ timeout: 15000 });

    // Click to expand the goal
    await page.getByText(goalTitle).click();
    
    // Add milestone
    await page.getByRole('button', { name: /add milestone/i }).click();
    const milestoneTitle = `Milestone-${Date.now()}`;
    await page.getByPlaceholder('Milestone title').fill(milestoneTitle);
    await page.getByRole('button', { name: /save milestone/i }).click();

    await expect(page.getByText(milestoneTitle)).toBeVisible({ timeout: 15000 });
  });

  test('6. Post an update on a goal', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Select a workspace
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();

    // Navigate to Goals
    await page.getByRole('link', { name: 'Goals' }).click();
    await page.waitForURL(/\/goals/);

    // Create a goal first
    await page.getByRole('button', { name: /add goal/i }).click();
    const goalTitle = `Update Test-${Date.now()}`;
    await page.getByPlaceholder('Goal title').fill(goalTitle);
    await page.getByRole('button', { name: /create goal/i }).click();
    await expect(page.getByText(goalTitle)).toBeVisible({ timeout: 15000 });

    // Click to expand the goal
    await page.getByText(goalTitle).click();

    // Post an update
    const updateContent = `Test update-${Date.now()}`;
    await page.getByPlaceholder('Post an update...').fill(updateContent);
    await page.getByRole('button', { name: /send/i }).click();

    await expect(page.getByText(updateContent)).toBeVisible({ timeout: 15000 });
  });

  test('7. View announcements page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Select a workspace
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();

    await page.getByRole('link', { name: 'Announcements' }).click();
    await page.waitForURL(/\/announcements/);
    
    await expect(page.getByRole('heading', { name: /announcements/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('8. View action items page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Select a workspace
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();

    await page.getByRole('link', { name: 'Action Items' }).click();
    await page.waitForURL(/\/action-items/);
    
    await expect(page.getByRole('heading', { name: /action items/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('9. View members page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Select a workspace
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();

    await page.getByRole('link', { name: 'Members' }).click();
    await page.waitForURL(/\/members/);
    
    await expect(page.getByRole('heading', { name: /members/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('10. View analytics page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Select a workspace
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();

    await page.getByRole('link', { name: 'Analytics' }).click();
    await page.waitForURL(/\/analytics/);
    
    await expect(page.getByRole('heading', { name: /analytics/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('11. Navigate to profile page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Click profile link (user name/email link in sidebar)
    await page.getByRole('link', { name: demoAccount.email }).click();
    await page.waitForURL(/\/profile/);
    
    await expect(page.getByRole('heading', { name: /profile settings/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('12. Logout → redirected to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Click logout button (aria-label based)
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.waitForURL('/login');
    
    // Verify dashboard is inaccessible
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
