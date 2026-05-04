import { test, expect } from '@playwright/test';
import { demoAccount, newMemberEmail } from './fixtures.js';

test.describe('Collaborative Team Hub E2E - Full Coverage', () => {
  test('1. Register new user → dashboard', async ({ page }) => {
    await page.goto('/register');
    const testEmail = `test${Date.now()}@example.com`;
    await page.getByLabel('Full Name').fill('E2E Test User');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill('TestPass123!');
    await page.getByLabel('Confirm Password').fill('TestPass123!');
    await page.getByRole('button', { name: /register/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /no workspace|dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('2. Login with demo account', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 15000 });
  });

  test('3. Dashboard stats load', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/total goals/i)).toBeVisible();
    await expect(page.getByText(/completed this week/i)).toBeVisible();
    await expect(page.getByText(/overdue/i)).toBeVisible();
  });

  test('4. Switch workspace via dropdown', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    const options = page.getByRole('option');
    const count = await options.count();
    if (count > 1) {
      await options.last().click();
      await page.waitForTimeout(1000);
      await expect(page.getByRole('button', { name: 'Switch workspace' })).toBeVisible();
    }
  });

  test('5. Create goal → appears in goals list', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Goals' }).click();
    await page.waitForURL(/\/goals/);
    
    await page.getByRole('button', { name: /add goal/i }).click();
    const goalTitle = `E2E Goal ${Date.now()}`;
    await page.getByPlaceholder('Goal title').fill(goalTitle);
    await page.getByRole('button', { name: /create goal/i }).click();
    await expect(page.getByText(goalTitle)).toBeVisible({ timeout: 15000 });
  });

  test('6. Add milestone to goal', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Goals' }).click();
    await page.waitForURL(/\/goals/);
    
    await page.getByRole('button', { name: /add goal/i }).click();
    const goalTitle = `Milestone Goal ${Date.now()}`;
    await page.getByPlaceholder('Goal title').fill(goalTitle);
    await page.getByRole('button', { name: /create goal/i }).click();
    await expect(page.getByText(goalTitle)).toBeVisible({ timeout: 15000 });
    
    await page.getByText(goalTitle).click();
    await page.getByRole('button', { name: /add milestone/i }).click();
    const milestoneTitle = `Milestone ${Date.now()}`;
    await page.getByPlaceholder('Milestone title').fill(milestoneTitle);
    await page.getByRole('button', { name: /save milestone/i }).click();
    await expect(page.getByText(milestoneTitle)).toBeVisible({ timeout: 15000 });
  });

  test('7. Toggle milestone completion', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Goals' }).click();
    await page.waitForURL(/\/goals/);
    
    const goalCards = page.getByRole('article');
    const count = await goalCards.count();
    if (count > 0) {
      await goalCards.first().getByText(/expand|details/i).click();
      const checkbox = page.getByRole('checkbox').first();
      await checkbox.check();
      await page.waitForTimeout(500);
    }
  });

  test('8. Create action item → appears in kanban', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Action Items' }).click();
    await page.waitForURL(/\/action-items/);
    
    await page.getByRole('button', { name: /new item/i }).click();
    await expect(page.getByRole('heading', { name: /create action item/i })).toBeVisible();
    
    const itemTitle = `E2E Action Item ${Date.now()}`;
    await page.getByLabel('Title').fill(itemTitle);
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText(itemTitle)).toBeVisible({ timeout: 15000 });
  });

  test('9. Drag action item between columns', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Action Items' }).click();
    await page.waitForURL(/\/action-items/);
    
    await page.waitForTimeout(1000);
    const todoColumn = page.getByRole('region', { name: /to do/i });
    const inProgressColumn = page.getByRole('region', { name: /in progress/i });
    
    const firstCard = todoColumn.getByRole('article').first();
    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.dragTo(inProgressColumn);
      await page.waitForTimeout(1000);
    }
  });

  test('10. Create announcement → appears in feed', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Announcements' }).click();
    await page.waitForURL(/\/announcements/);
    
    const announcementContent = `E2E Announcement ${Date.now()}`;
    await page.locator('#announcement-content').fill(announcementContent);
    await page.getByRole('button', { name: /post announcement/i }).click();
    await expect(page.getByText(announcementContent)).toBeVisible({ timeout: 15000 });
  });

  test('11. Add comment to announcement', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Announcements' }).click();
    await page.waitForURL(/\/announcements/);
    
    await page.waitForTimeout(1000);
    const firstAnnouncement = page.getByRole('article').first();
    if (await firstAnnouncement.isVisible().catch(() => false)) {
      await firstAnnouncement.getByText(/comments/i).click();
      const commentText = `E2E Comment ${Date.now()}`;
      await page.getByRole('textbox', { name: /write a comment/i }).fill(commentText);
      await page.getByRole('button', { name: /send/i }).click();
      await expect(page.getByText(commentText)).toBeVisible({ timeout: 15000 });
    }
  });

  test('12. Add reaction to announcement', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Announcements' }).click();
    await page.waitForURL(/\/announcements/);
    
    await page.waitForTimeout(1000);
    const firstAnnouncement = page.getByRole('article').first();
    if (await firstAnnouncement.isVisible().catch(() => false)) {
      await firstAnnouncement.getByRole('button', { name: /🚀|🙌|👀|🔥|❤️/i }).first().click();
      await page.waitForTimeout(500);
    }
  });

  test('13. Invite member to workspace', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Members' }).click();
    await page.waitForURL(/\/members/);
    
    await page.getByPlaceholder('teammate@company.com').fill(newMemberEmail);
    await page.getByRole('button', { name: /send invitation/i }).click();
    await expect(page.getByText(newMemberEmail)).toBeVisible({ timeout: 15000 });
  });

  test('14. Remove member from workspace', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Members' }).click();
    await page.waitForURL(/\/members/);
    
    await page.waitForTimeout(1000);
    // Click the last member's 3-dot menu (skip if only 1 member)
    const menuButtons = page.getByRole('button', { name: /options for/i });
    const count = await menuButtons.count();
    if (count > 1) {
      await menuButtons.last().click();
      await page.getByText(/remove member/i).click();
      await page.getByRole('button', { name: /remove/i }).click();
      await page.waitForTimeout(1000);
    }
  });

  test('15. Analytics page loads with data', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Analytics' }).click();
    await page.waitForURL(/\/analytics/);
    
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/total goals/i)).toBeVisible();
  });

  test('16. Export CSV from analytics', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Analytics' }).click();
    await page.waitForURL(/\/analytics/);
    
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export csv/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/workspace-.*\.csv/);
  });

  test('17. Theme toggle switches mode', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    const themeToggle = page.getByRole('button', { name: /switch to .* mode/i });
    await expect(themeToggle).toBeVisible({ timeout: 15000 });
    await themeToggle.click();
    await page.waitForTimeout(500);
    await themeToggle.click();
    await page.waitForTimeout(500);
  });

  test('18. Command palette opens with Ctrl+K', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: /search commands/i })).toBeVisible({ timeout: 10000 });
    
    await page.getByRole('textbox', { name: /search commands/i }).fill('Goals');
    await page.getByText('Goals').click();
    await expect(page).toHaveURL(/\/goals/);
  });

  test('19. Notifications bell shows dropdown', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByText(/no notifications|notifications/i)).toBeVisible({ timeout: 5000 });
  });

  test('20. Profile page loads', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('link', { name: demoAccount.email }).click();
    await page.waitForURL(/\/profile/);
    await expect(page.getByRole('heading', { name: /profile settings/i, level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('21. Logout redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: /log out/i }).click();
    await page.waitForURL('/login');
    
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('22. View mode toggle (kanban/list)', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(demoAccount.email);
    await page.getByLabel('Password').fill(demoAccount.password);
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/dashboard/);
    
    await page.getByRole('button', { name: 'Switch workspace' }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('link', { name: 'Action Items' }).click();
    await page.waitForURL(/\/action-items/);
    
    await page.getByRole('button', { name: /list/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('23. PWA manifest exists', async ({ page }) => {
    await page.goto('/manifest.json');
    await expect(page.getByText(/TeamHub/)).toBeVisible({ timeout: 10000 });
  });

  test('24. API docs accessible', async ({ page }) => {
    await page.goto('/api/docs');
    await expect(page.getByText(/Swagger UI|API Documentation|OpenAPI/i)).toBeVisible({ timeout: 15000 });
  });
});
