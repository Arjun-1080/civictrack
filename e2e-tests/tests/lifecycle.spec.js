/**
 * Full Issue Lifecycle — CivicTrack E2E
 *
 * Tests run in strict serial order. Each step advances the issue through the
 * complete status workflow: Submitted → Resolved.
 *
 * Bad-path checks are embedded at the natural point in the lifecycle
 * where each error can occur (before the corresponding happy path succeeds).
 *
 * Prerequisites:
 *   - Backend running on http://localhost:8000
 *   - Frontend running on http://localhost:5173
 *   - global-setup.js has registered auditor1@example.com and worker1@example.com
 */

const { test, expect } = require('@playwright/test');

// ─── Shared state across serial tests ─────────────────────────────────────────
const RUN    = Date.now();
const ISSUE_TITLE = `Pothole Test ${RUN}`;

const CITIZEN = { name: 'E2E Citizen', email: `citizen.${RUN}@test.com`, password: 'demo1234' };
const AUDITOR = { email: 'auditor1@example.com', password: 'mallikarjun' };
const WORKER  = { email: 'worker1@example.com',  password: 'mallikarjun' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function loginAs(page, { email, password }) {
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

async function expectToast(page, text) {
  await expect(
    page.locator('[data-testid="toast"]').filter({ hasText: text })
  ).toBeVisible({ timeout: 8_000 });
}

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe.serial('Full Issue Lifecycle', () => {

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  test('Step 1 [happy] Citizen registers and submits a civic issue', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Aarav Singh').fill(CITIZEN.name);
    await page.getByPlaceholder('you@example.com').fill(CITIZEN.email);
    await page.getByPlaceholder('••••••••').fill(CITIZEN.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Fill the issue form
    await page.getByPlaceholder('e.g. Deep pothole near bus stop').fill(ISSUE_TITLE);
    await page.getByPlaceholder('e.g. Ranchi, Main Road').fill('MG Road, Ranchi');
    await page.getByPlaceholder('e.g. Near Central Park').fill('Near Bus Stop 14');
    await page.getByPlaceholder('Describe the issue and its severity…').fill(
      'A deep pothole (approx. 30cm) is causing vehicle damage. Needs urgent repair.'
    );
    await page.getByRole('button', { name: 'Submit Issue' }).click();

    // Success: toast fires and issue appears in the sidebar
    await expectToast(page, 'submitted successfully');
    await expect(
      page.locator('[data-testid="my-issue-item"]').filter({ hasText: ISSUE_TITLE })
    ).toBeVisible();
  });

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  test('Step 2 [happy] Issue appears on the public board', async ({ page }) => {
    await page.goto('/board');
    await expect(
      page.locator('[data-testid="issue-card"]').filter({ hasText: ISSUE_TITLE })
    ).toBeVisible();
  });

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  test('Step 3 [bad] Auditor tries to close a submitted issue without giving a reason', async ({ page }) => {
    await loginAs(page, AUDITOR);

    const row = page.locator('[data-testid="auditor-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Close' }).click();

    // Modal opens — click Confirm WITHOUT entering a note
    await expect(page.locator('[data-testid="modal-confirm-btn"]')).toBeVisible();
    await page.locator('[data-testid="modal-confirm-btn"]').click();

    // Validation fires: error toast, modal stays open
    await expectToast(page, 'note is required');
    await expect(page.locator('[data-testid="modal-confirm-btn"]')).toBeVisible();

    // Dismiss modal — issue must NOT have changed status
    await page.keyboard.press('Escape');
    await expect(row.getByText('Submitted')).toBeVisible();
  });

  // ── Step 4 ──────────────────────────────────────────────────────────────────
  test('Step 4 [happy] Auditor validates the issue', async ({ page }) => {
    await loginAs(page, AUDITOR);

    const row = page.locator('[data-testid="auditor-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Mark Valid' }).click();

    await expect(page.locator('[data-testid="modal-confirm-btn"]')).toBeVisible();
    await page.getByRole('textbox').fill('Confirmed on field visit — issue is legitimate.');
    await page.locator('[data-testid="modal-confirm-btn"]').click();

    await expectToast(page, 'valid');
  });

  // ── Step 5 ──────────────────────────────────────────────────────────────────
  test('Step 5 [happy] Auditor assigns the issue to a worker', async ({ page }) => {
    await loginAs(page, AUDITOR);

    // After validation the issue shows "Under Review" with a worker dropdown
    const row = page.locator('[data-testid="auditor-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await expect(row.getByRole('combobox')).toBeVisible({ timeout: 8_000 });

    // Pick the first available worker
    await row.getByRole('combobox').selectOption({ index: 1 });
    await row.getByRole('button', { name: 'Assign' }).click();

    await expectToast(page, 'assigned');
  });

  // ── Step 6 ──────────────────────────────────────────────────────────────────
  test('Step 6 [bad] Worker tries to submit an empty proposal', async ({ page }) => {
    await loginAs(page, WORKER);

    const row = page.locator('[data-testid="worker-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Submit Proposal' }).click();

    // Inline form is now visible — submit without filling anything
    // At this point the outer button says "Cancel"; only one "Submit Proposal" exists
    await page.getByRole('button', { name: 'Submit Proposal' }).click();

    await expectToast(page, 'required');
  });

  // ── Step 7 ──────────────────────────────────────────────────────────────────
  test('Step 7 [happy] Worker submits a valid proposal', async ({ page }) => {
    await loginAs(page, WORKER);

    const row = page.locator('[data-testid="worker-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Submit Proposal' }).click();

    await page.getByPlaceholder('e.g. 7').fill('5');
    await page.getByPlaceholder('e.g. 5000').fill('8000');
    await page.getByPlaceholder('Describe your resolution approach…').fill(
      'Will resurface the pothole with bitumen mix in 5 days. Requires a crew of 3.'
    );
    await page.getByRole('button', { name: 'Submit Proposal' }).click();

    await expectToast(page, 'Proposal submitted');
  });

  // ── Step 8 ──────────────────────────────────────────────────────────────────
  test('Step 8 [bad] Auditor tries to reject proposal without giving feedback', async ({ page }) => {
    await loginAs(page, AUDITOR);

    const row = page.locator('[data-testid="auditor-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Reject' }).click();

    // Confirm without a note
    await page.locator('[data-testid="modal-confirm-btn"]').click();

    await expectToast(page, 'note is required');
    await expect(page.locator('[data-testid="modal-confirm-btn"]')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  // ── Step 9 ──────────────────────────────────────────────────────────────────
  test('Step 9 [happy] Auditor approves the proposal', async ({ page }) => {
    await loginAs(page, AUDITOR);

    const row = page.locator('[data-testid="auditor-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Approve' }).click();

    await page.getByRole('textbox').fill('Budget and timeline accepted.');
    await page.locator('[data-testid="modal-confirm-btn"]').click();

    await expectToast(page, 'approved');
  });

  // ── Step 10 ─────────────────────────────────────────────────────────────────
  test('Step 10 [happy] Worker updates the status to Completed', async ({ page }) => {
    await loginAs(page, WORKER);

    const row = page.locator('[data-testid="worker-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Update Status' }).click();

    await page.getByRole('combobox').selectOption('Completed');
    await page.getByPlaceholder('Any field observations…').fill('Pothole filled and road surface levelled.');
    await page.getByRole('button', { name: 'Save Update' }).click();

    await expectToast(page, 'Completed');
  });

  // ── Step 11 ─────────────────────────────────────────────────────────────────
  test('Step 11 [bad] Auditor tries to request rework without explaining what is wrong', async ({ page }) => {
    await loginAs(page, AUDITOR);

    const row = page.locator('[data-testid="auditor-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Needs Rework' }).click();

    // Confirm without note
    await page.locator('[data-testid="modal-confirm-btn"]').click();

    await expectToast(page, 'note is required');
    await page.keyboard.press('Escape');
  });

  // ── Step 12 ─────────────────────────────────────────────────────────────────
  test('Step 12 [happy] Auditor marks the issue as Resolved', async ({ page }) => {
    await loginAs(page, AUDITOR);

    const row = page.locator('[data-testid="auditor-issue-row"]').filter({ hasText: ISSUE_TITLE });
    await row.getByRole('button', { name: 'Resolve' }).click();

    await page.getByRole('textbox').fill('Site inspected. Road is safe. Issue fully resolved.');
    await page.locator('[data-testid="modal-confirm-btn"]').click();

    await expectToast(page, 'resolved');
  });

  // ── Step 13 ─────────────────────────────────────────────────────────────────
  test('Step 13 [happy] Resolved issue appears on public board', async ({ page }) => {
    await page.goto('/board');

    const card = page.locator('[data-testid="issue-card"]').filter({ hasText: ISSUE_TITLE });
    await expect(card).toBeVisible();
    await expect(card.getByText('Resolved')).toBeVisible();
  });

  // ── Step 14 ─────────────────────────────────────────────────────────────────
  test('Step 14 [happy] Issue detail page shows full progress timeline', async ({ page }) => {
    await loginAs(page, CITIZEN);

    // Navigate from the board
    await page.goto('/board');
    await page.locator('[data-testid="issue-card"]').filter({ hasText: ISSUE_TITLE }).click();
    await expect(page).toHaveURL(/\/issues\//);

    // Key lifecycle stages written by the backend during this test run
    await expect(page.getByText('Issue Submitted')).toBeVisible();
    await expect(page.getByText('Issue Validated')).toBeVisible();
    await expect(page.getByText('Assigned to Worker')).toBeVisible();
    await expect(page.getByText('Proposal Approved')).toBeVisible();
    await expect(page.getByText('Final Resolution')).toBeVisible();
    await expect(page.getByText('Progress Timeline')).toBeVisible();

    // Resolved status badge at the top of the detail card
    await expect(page.getByText('Resolved').first()).toBeVisible();
  });

});
