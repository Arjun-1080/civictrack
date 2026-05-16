/**
 * Standalone Error / Bad-Path Tests — CivicTrack E2E
 *
 * These tests are self-contained (no shared state between them).
 * They cover authentication errors, registration errors, and form validation.
 * Each test sets up whatever state it needs inside itself.
 *
 * Prerequisites:
 *   - Backend running on http://localhost:8000
 *   - Frontend running on http://localhost:5173
 *   - global-setup.js has registered auditor1@example.com
 */

const { test, expect } = require('@playwright/test');

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function loginAs(page, { email, password }) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function registerAndLogin(page, { name, email, password }) {
  await page.goto('/register');
  await page.getByPlaceholder('Aarav Singh').fill(name);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

async function expectToast(page, text) {
  await expect(
    page.locator('[data-testid="toast"]').filter({ hasText: text })
  ).toBeVisible({ timeout: 8_000 });
}

// ─── 1. Authentication — Login errors ─────────────────────────────────────────
test.describe('Login — Bad Paths', () => {

  test('Wrong password shows inline error message', async ({ page }) => {
    await loginAs(page, { email: 'auditor1@example.com', password: 'definitelywrong' });

    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('Non-existent email shows inline error message', async ({ page }) => {
    await loginAs(page, { email: 'ghost.user.nobody@fake.com', password: 'somepassword' });

    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('Empty email field is blocked by browser validation before API call', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('••••••••').fill('somepassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // required attribute on email input — page stays on /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible();
  });

  test('Empty password field is blocked by browser validation', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('auditor1@example.com');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible();
  });

});

// ─── 2. Authentication — Registration errors ──────────────────────────────────
test.describe('Registration — Bad Paths', () => {

  test('Duplicate email shows inline error message', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Aarav Singh').fill('Duplicate Person');
    await page.getByPlaceholder('you@example.com').fill('auditor1@example.com'); // already registered
    await page.getByPlaceholder('••••••••').fill('demo1234');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('Short password (< 6 chars) is blocked by browser validation', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Aarav Singh').fill('Test User');
    await page.getByPlaceholder('you@example.com').fill(`short.${Date.now()}@test.com`);
    await page.getByPlaceholder('••••••••').fill('abc'); // minLength=6
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible();
  });

  test('Empty name field is blocked by browser validation', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(`noname.${Date.now()}@test.com`);
    await page.getByPlaceholder('••••••••').fill('demo1234');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/register/);
  });

});

// ─── 3. Issue Submission — Form validation ────────────────────────────────────
test.describe('Issue Submission — Bad Paths', () => {
  // Register a fresh citizen before each test in this group
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, {
      name: 'Form Test Citizen',
      email: `formtest.${Date.now()}@test.com`,
      password: 'demo1234',
    });
  });

  test('Submitting with an empty title is blocked by browser validation', async ({ page }) => {
    // Fill every field except title
    await page.getByPlaceholder('e.g. Ranchi, Main Road').fill('Test Area');
    await page.getByPlaceholder('Describe the issue and its severity…').fill('Some description');
    await page.getByRole('button', { name: 'Submit Issue' }).click();

    // required attribute fires — no toast, no navigation
    await expect(page.locator('[data-testid="toast"]')).not.toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Submitting with an empty area is blocked by browser validation', async ({ page }) => {
    await page.getByPlaceholder('e.g. Deep pothole near bus stop').fill('Missing Area Issue');
    await page.getByPlaceholder('Describe the issue and its severity…').fill('Some description');
    await page.getByRole('button', { name: 'Submit Issue' }).click();

    await expect(page.locator('[data-testid="toast"]')).not.toBeVisible();
  });

  test('Submitting with an empty description is blocked by browser validation', async ({ page }) => {
    await page.getByPlaceholder('e.g. Deep pothole near bus stop').fill('No Description Issue');
    await page.getByPlaceholder('e.g. Ranchi, Main Road').fill('Some Area');
    await page.getByRole('button', { name: 'Submit Issue' }).click();

    await expect(page.locator('[data-testid="toast"]')).not.toBeVisible();
  });

  test('Attaching a photo larger than 5 MB shows an error toast', async ({ page }) => {
    await page.getByPlaceholder('e.g. Deep pothole near bus stop').fill('Photo Size Test');
    await page.getByPlaceholder('e.g. Ranchi, Main Road').fill('Test Area');
    await page.getByPlaceholder('Describe the issue and its severity…').fill('Testing large photo rejection');

    // Create a 6 MB buffer and attach it as a file
    const sixMB = Buffer.alloc(6 * 1024 * 1024, 0xff);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Attach Photo' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'big-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: sixMB,
    });

    await expectToast(page, '5 MB');
    // Photo should NOT be marked as attached
    await expect(page.getByText('Photo attached')).not.toBeVisible();
  });

});

// ─── 4. Public Board — Filter and search edge cases ───────────────────────────
test.describe('Public Board — Filter / Search', () => {

  test('Searching for a term with no matches shows the empty state', async ({ page }) => {
    await page.goto('/board');
    await page.getByPlaceholder('Search by title or area…').fill('zzz_this_will_never_match_zzz');
    await expect(page.getByText('No issues found')).toBeVisible();
  });

  test('Applying a category filter then clearing it restores all results', async ({ page }) => {
    await page.goto('/board');

    // Count cards before filtering
    const allCards = page.locator('[data-testid="issue-card"]');
    const totalBefore = await allCards.count();

    // Apply a very specific filter that likely has 0 matches
    await page.getByRole('button', { name: 'Tree Fall' }).click();
    const afterFilter = await allCards.count();
    // After filtering, count is ≤ total
    expect(afterFilter).toBeLessThanOrEqual(totalBefore);

    // Clear filters and count should go back to total
    const clearBtn = page.getByRole('button', { name: 'Clear', exact: true });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(allCards).toHaveCount(totalBefore);
    }
  });

  test('Unauthenticated user can browse the board without logging in', async ({ page }) => {
    // No login — just go straight to /board
    await page.goto('/board');
    await expect(page.getByText('Public Issues Board')).toBeVisible();
    // Navbar shows Sign in / Get started, not a user name
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

});

// ─── 5. Navigation — Auth guards ─────────────────────────────────────────────
test.describe('Navigation — Unauthenticated Access', () => {

  test('Dashboard page without login still renders (citizens see a prompt to log in)', async ({ page }) => {
    await page.goto('/dashboard');
    // The Dashboard renders a message rather than crashing
    await expect(page.getByText('Please sign in')).toBeVisible();
  });

});
