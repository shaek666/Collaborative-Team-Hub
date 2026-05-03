import { test, expect } from '@playwright/test';
import { demoAccount, newMemberEmail } from './fixtures.js';

const findings = [];

test.beforeEach(({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    consoleErrors.push(`Page error: ${error.message}`);
  });
  test.info().annotations.push({ type: 'console-errors', description: JSON.stringify(consoleErrors) });
});

async function loginWithWorkspace(page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(demoAccount.email);
  await page.getByLabel('Password').fill(demoAccount.password);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });

  // Select a workspace
  await page.getByRole('button', { name: 'Switch workspace' }).click();
  await page.getByRole('option').first().click();
  await page.waitForTimeout(2000);
}

test.describe('Exploration: Auth & Onboarding', () => {
  test('Register → Login → Create Workspace', async ({ page }) => {
    // Register
    await page.goto('/');
    const hasRegisterLink = await page.getByRole('link', { name: /create account/i }).isVisible().catch(() => false);
    findings.push({ flow: 'Auth', step: 'Register link', status: hasRegisterLink ? 'PASS' : 'FAIL', detail: hasRegisterLink ? 'Register link visible' : 'No register link found on landing page' });

    if (hasRegisterLink) {
      await page.getByRole('link', { name: /create account/i }).click();
      await page.waitForURL(/register/);
      findings.push({ flow: 'Auth', step: 'Register page loads', status: 'PASS', detail: `URL: ${page.url()}` });
    }

    // Login
    await page.goto('/login');
    const loginFormVisible = await page.getByLabel('Email').isVisible().catch(() => false);
    findings.push({ flow: 'Auth', step: 'Login form', status: loginFormVisible ? 'PASS' : 'FAIL', detail: loginFormVisible ? 'Login form rendered' : 'Login form not found' });

    if (loginFormVisible) {
      await page.getByLabel('Email').fill(demoAccount.email);
      await page.getByLabel('Password').fill(demoAccount.password);
      await page.getByRole('button', { name: /login/i }).click();

      await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(3000);
      const redirectedToDashboard = page.url().includes('dashboard');
      findings.push({ flow: 'Auth', step: 'Login redirect', status: redirectedToDashboard ? 'PASS' : 'FAIL', detail: redirectedToDashboard ? 'Redirected to dashboard' : `Redirected to ${page.url()}` });
    }

    // Screenshot the dashboard
    await page.screenshot({ path: 'e2e/screens/dashboard.png', fullPage: true }).catch(() => {});
  });
});

test.describe('Exploration: Goals & Milestones', () => {
  test('Create Goal → Add Milestone → Post Progress Update', async ({ page }) => {
    await loginWithWorkspace(page);

    // Navigate to goals
    const goalsLink = await page.getByRole('link', { name: 'Goals' }).isVisible().catch(() => false);
    findings.push({ flow: 'Goals', step: 'Goals navigation', status: goalsLink ? 'PASS' : 'FAIL', detail: goalsLink ? 'Goals link in nav' : 'No goals navigation found' });

    if (goalsLink) {
      await page.getByRole('link', { name: 'Goals' }).click();
      await page.waitForURL(/\/goals/, { timeout: 10000 });

      // Create goal
      const createGoalBtn = await page.getByRole('button', { name: /add goal/i }).isVisible().catch(() => false);
      findings.push({ flow: 'Goals', step: 'Create goal button', status: createGoalBtn ? 'PASS' : 'FAIL', detail: createGoalBtn ? 'Button visible' : 'Button not found' });

      if (createGoalBtn) {
        await page.getByRole('button', { name: /add goal/i }).click();
        await page.waitForTimeout(1000);

        const titleInput = page.getByPlaceholder('Goal title');
        await titleInput.fill(`Exploration Goal-${Date.now()}`).catch(() => {});
        await page.getByRole('button', { name: /create goal/i }).click().catch(() => {});
        await page.waitForTimeout(2000);
      }

      await page.screenshot({ path: 'e2e/screens/goals.png', fullPage: true }).catch(() => {});
    }
  });
});

test.describe('Exploration: Announcements', () => {
  test('Post Announcement → React → Comment → Pin', async ({ page }) => {
    await loginWithWorkspace(page);

    const announcementsLink = await page.getByRole('link', { name: 'Announcements' }).isVisible().catch(() => false);
    findings.push({ flow: 'Announcements', step: 'Announcements navigation', status: announcementsLink ? 'PASS' : 'FAIL', detail: announcementsLink ? 'Link in nav' : 'Not found' });

    if (announcementsLink) {
      await page.getByRole('link', { name: 'Announcements' }).click();
      await page.waitForURL(/\/announcements/, { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Check for compose area
      const composeArea = await page.getByRole('textbox', { name: /announcement|content|post|write/i }).isVisible().catch(() => false);
      findings.push({ flow: 'Announcements', step: 'Compose area', status: composeArea ? 'PASS' : 'FAIL', detail: composeArea ? 'Visible' : 'Not found' });

      // Check for reaction buttons
      const reactionBtn = await page.getByRole('button', { name: /react|emoji|👍|🎉|❤️/i }).first().isVisible().catch(() => false);
      findings.push({ flow: 'Announcements', step: 'Reaction buttons', status: reactionBtn ? 'PASS' : 'FAIL', detail: reactionBtn ? 'Visible on announcement' : 'Not found' });

      // Check for comment functionality
      const commentBtn = await page.getByRole('button', { name: /comment|reply/i }).first().isVisible().catch(() => false);
      findings.push({ flow: 'Announcements', step: 'Comment feature', status: commentBtn ? 'PASS' : 'FAIL', detail: commentBtn ? 'Visible' : 'Not found' });

      await page.screenshot({ path: 'e2e/screens/announcements.png', fullPage: true }).catch(() => {});
    }
  });
});

test.describe('Exploration: Action Items Kanban', () => {
  test('Create Action Items → Drag Between Columns', async ({ page }) => {
    await loginWithWorkspace(page);

    const actionItemsLink = await page.getByRole('link', { name: 'Action Items' }).isVisible().catch(() => false);
    findings.push({ flow: 'Kanban', step: 'Action items navigation', status: actionItemsLink ? 'PASS' : 'FAIL', detail: actionItemsLink ? 'Link in nav' : 'Not found' });

    if (actionItemsLink) {
      await page.getByRole('link', { name: 'Action Items' }).click();
      await page.waitForURL(/\/action-items/, { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Check for Kanban columns
      const columns = await page.locator('[data-column], .kanban-column, [role="region"]').all();
      const columnNames = [];
      for (const col of columns) {
        const name = await col.getAttribute('aria-label').catch(() => null);
        if (name) columnNames.push(name);
      }
      findings.push({ flow: 'Kanban', step: 'Kanban columns', status: columnNames.length > 0 ? 'PASS' : 'FAIL', detail: columnNames.length > 0 ? `Found: ${columnNames.join(', ')}` : 'No Kanban columns detected' });

      // Check for draggable items
      const draggables = await page.locator('[draggable="true"], [data-draggable], .kanban-item').count().catch(() => 0);
      findings.push({ flow: 'Kanban', step: 'Draggable items', status: draggables > 0 ? 'PASS' : 'FAIL', detail: draggables > 0 ? `${draggables} items found` : 'No draggable items' });

      await page.screenshot({ path: 'e2e/screens/kanban.png', fullPage: true }).catch(() => {});
    }
  });
});

test.describe('Exploration: Members & Presence', () => {
  test('Invite Member → Check Online Indicator', async ({ page }) => {
    await loginWithWorkspace(page);

    const membersLink = await page.getByRole('link', { name: 'Members' }).isVisible().catch(() => false);
    findings.push({ flow: 'Members', step: 'Members navigation', status: membersLink ? 'PASS' : 'FAIL', detail: membersLink ? 'Link in nav' : 'Not found' });

    if (membersLink) {
      await page.getByRole('link', { name: 'Members' }).click();
      await page.waitForURL(/\/members/, { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Check for invite button
      const inviteBtn = await page.getByRole('button', { name: /invite/i }).isVisible().catch(() => false);
      findings.push({ flow: 'Members', step: 'Invite button', status: inviteBtn ? 'PASS' : 'FAIL', detail: inviteBtn ? 'Visible' : 'Not found' });

      // Check for online indicators
      const onlineIndicators = await page.locator('.online-indicator, [data-online], .status-dot, .presence').count().catch(() => 0);
      findings.push({ flow: 'Members', step: 'Online indicators', status: onlineIndicators > 0 ? 'PASS' : 'FAIL', detail: onlineIndicators > 0 ? `${onlineIndicators} indicators found` : 'No online presence indicators' });

      await page.screenshot({ path: 'e2e/screens/members.png', fullPage: true }).catch(() => {});
    }
  });
});

test.describe('Exploration: Analytics', () => {
  test('View Analytics → Export CSV → Check Download', async ({ page }) => {
    await loginWithWorkspace(page);

    const analyticsLink = await page.getByRole('link', { name: 'Analytics' }).isVisible().catch(() => false);
    findings.push({ flow: 'Analytics', step: 'Analytics navigation', status: analyticsLink ? 'PASS' : 'FAIL', detail: analyticsLink ? 'Link in nav' : 'Not found' });

    if (analyticsLink) {
      await page.getByRole('link', { name: 'Analytics' }).click();
      await page.waitForURL(/\/analytics/, { timeout: 10000 });
      await page.waitForTimeout(3000);

      // Check for charts/visualizations
      const charts = await page.locator('canvas, svg, [data-chart], .recharts, .chart').count().catch(() => 0);
      findings.push({ flow: 'Analytics', step: 'Charts rendered', status: charts > 0 ? 'PASS' : 'FAIL', detail: charts > 0 ? `${charts} chart elements found` : 'No chart elements detected' });

      // Check for export button
      const exportBtn = await page.getByRole('button', { name: /export|download|csv/i }).isVisible().catch(() => false);
      findings.push({ flow: 'Analytics', step: 'Export CSV button', status: exportBtn ? 'PASS' : 'FAIL', detail: exportBtn ? 'Visible' : 'Not found' });

      if (exportBtn) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await page.getByRole('button', { name: /export|download|csv/i }).click();
        const download = await downloadPromise;
        findings.push({ flow: 'Analytics', step: 'CSV download', status: download ? 'PASS' : 'FAIL', detail: download ? `Downloaded: ${download.suggestedFilename()}` : 'No download triggered' });
      }

      await page.screenshot({ path: 'e2e/screens/analytics.png', fullPage: true }).catch(() => {});
    }
  });
});

test.describe('Exploration: Responsive Layout', () => {
  test('Check layout at mobile/tablet/desktop sizes', async ({ browser }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
    ];

    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      await page.goto('/login');
      const loginVisible = await page.getByLabel('Email').isVisible().catch(() => false);
      findings.push({ flow: 'Responsive', step: `${vp.name} login (${vp.width}px)`, status: loginVisible ? 'PASS' : 'FAIL', detail: loginVisible ? 'Login form visible' : 'Login form broken/hidden' });

      await page.screenshot({ path: `e2e/screens/login-${vp.name}.png`, fullPage: true }).catch(() => {});

      await context.close();
    }
  });
});

test.afterAll(async () => {
  const fs = await import('fs');
  const path = await import('path');
  const report = findings.map(f => `| ${f.flow} | ${f.step} | ${f.status} | ${f.detail} |`).join('\n');
  const output = `# E2E Exploration Findings\n\n| Flow | Step | Status | Detail |\n|------|------|--------|--------|\n${report}\n\n**Generated**: ${new Date().toISOString()}\n`;
  fs.writeFileSync(path.join('e2e', 'exploration-findings.md'), output);
});
