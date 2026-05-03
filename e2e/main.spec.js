import { test, expect } from '@playwright/test';
import { demoAccount, newMemberEmail } from './fixtures.js';

test.describe('Collaborative Team Hub E2E', () => {
  test('1. Register a new user → redirected to dashboard', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /register/i }).click();

    const testEmail = `test${Date.now()}@example.com`;
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill('TestPass123!');
    await page.getByLabel(/name/i).fill('Test User');

    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('2. Create a new workspace → appears in workspace switcher', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(demoAccount.email);
    await page.getByLabel(/password/i).fill(demoAccount.password);
    await page.getByRole('button', { name: /log.?in/i }).click();
    await page.waitForURL(/dashboard/);

    await page.getByRole('button', { name: /create.*(workspace|team)/i }).click();

    const workspaceName = `Workspace-${Date.now()}`;
    await page.getByLabel(/workspace.*name|team.*name/i).fill(workspaceName);
    await page.getByLabel(/description/i).fill('E2E test workspace');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page.getByRole('button', { name: workspaceName })).toBeVisible();
  });

  test('3. Create a goal → appears in goals list with NOT_STARTED status', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(demoAccount.email);
    await page.getByLabel(/password/i).fill(demoAccount.password);
    await page.getByRole('button', { name: /log.?in/i }).click();
    await page.waitForURL(/dashboard/);

    await page.getByRole('link', { name: /goals/i }).click();
    await page.getByRole('button', { name: /create.*goal/i }).click();

    const goalTitle = `Goal-${Date.now()}`;
    await page.getByLabel(/title/i).fill(goalTitle);
    await page.getByLabel(/description/i).fill('E2E test goal');
    await page.getByRole('button', { name: /create/i }).click();

    const goalItem = page.getByText(goalTitle);
    await expect(goalItem).toBeVisible();
    await expect(page.getByText(/not.?started/i)).toBeVisible();
  });

  test('4. Post an announcement as Admin → appears at top of feed', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(demoAccount.email);
    await page.getByLabel(/password/i).fill(demoAccount.password);
    await page.getByRole('button', { name: /log.?in/i }).click();
    await page.waitForURL(/dashboard/);

    await page.getByRole('link', { name: /announcements/i }).click();

    const announcementContent = `Announcement-${Date.now()}`;
    await page.getByRole('textbox', { name: /announcement|content|post/i }).fill(announcementContent);
    await page.getByRole('button', { name: /post|create|publish/i }).click();

    const firstAnnouncement = page.locator('[data-testid="announcement"], article, .announcement').first();
    await expect(firstAnnouncement).toContainText(announcementContent);
  });

  test('5. React with emoji to an announcement → reaction count updates instantly', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(demoAccount.email);
    await page.getByLabel(/password/i).fill(demoAccount.password);
    await page.getByRole('button', { name: /log.?in/i }).click();
    await page.waitForURL(/dashboard/);

    await page.getByRole('link', { name: /announcements/i }).click();

    const firstAnnouncement = page.locator('[data-testid="announcement"], article, .announcement').first();
    await firstAnnouncement.getByRole('button', { name: /react|emoji|👍|🎉|❤️/i }).first().click();

    await expect(firstAnnouncement.getByText(/\b[1-9]\d*\b/)).toBeVisible();
  });

  test('6. Drag action item from TODO to IN_PROGRESS on Kanban board', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(demoAccount.email);
    await page.getByLabel(/password/i).fill(demoAccount.password);
    await page.getByRole('button', { name: /log.?in/i }).click();
    await page.waitForURL(/dashboard/);

    await page.getByRole('link', { name: /action.*(items|tasks)|kanban/i }).click();

    const todoColumn = page.getByRole('region', { name: /todo/i });
    const inProgressColumn = page.getByRole('region', { name: /in.?progress/i });

    const actionItem = todoColumn.locator('[draggable="true"], .kanban-item, [data-draggable]').first();

    if (await actionItem.isVisible()) {
      await actionItem.dragTo(inProgressColumn.locator('[data-drop-target], .kanban-column-body').first());
      await expect(inProgressColumn.getByText(await actionItem.textContent())).toBeVisible();
    } else {
      await page.getByRole('button', { name: /create.*action.*item/i }).click();
      const itemTitle = `Task-${Date.now()}`;
      await page.getByLabel(/title/i).fill(itemTitle);
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForTimeout(500);
      await todoColumn.getByText(itemTitle).dragTo(inProgressColumn.locator('[data-drop-target], .kanban-column-body').first());
      await expect(inProgressColumn.getByText(itemTitle)).toBeVisible();
    }
  });

  test('7. Invite a member by email → member appears in members list', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(demoAccount.email);
    await page.getByLabel(/password/i).fill(demoAccount.password);
    await page.getByRole('button', { name: /log.?in/i }).click();
    await page.waitForURL(/dashboard/);

    await page.getByRole('link', { name: /members|settings/i }).click();
    await page.getByRole('button', { name: /invite.*member/i }).click();

    await page.getByLabel(/email/i).fill(newMemberEmail);
    await page.getByRole('combobox, listbox', { name: /role/i }).selectOption('MEMBER');
    await page.getByRole('button', { name: /send.*invite|invite/i }).click();

    await expect(page.getByText(newMemberEmail)).toBeVisible();
  });

  test('8. Log out → redirected to login page, dashboard is inaccessible', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill(demoAccount.email);
    await page.getByLabel(/password/i).fill(demoAccount.password);
    await page.getByRole('button', { name: /log.?in/i }).click();
    await page.waitForURL(/dashboard/);

    await page.getByRole('button', { name: /profile|account|logout/i }).click();
    await page.getByRole('menuitem, button', { name: /log.?out/i }).click();

    await expect(page).toHaveURL(/auth.*login|login/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth.*login|login/);
  });
});
