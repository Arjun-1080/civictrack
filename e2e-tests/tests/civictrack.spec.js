const { test, expect } = require('@playwright/test');

/**
 * CivicTrack End-to-End UI Automation Test Flows
 * 
 * These tests describe the ideal workflows and edge cases of the CivicTrack application.
 * They are designed to document how the app is intended to be used across different roles.
 */

test.describe('Citizen Workflows', () => {
  
  test('Scenario 1: Citizen successfully registers, logs in, and reports a new civic issue', async ({ page }) => {
    // 1. Navigate to the application
    await page.goto('http://localhost:5173/');
    
    // 2. Citizen registers a new account
    await page.click('text=Register');
    await page.fill('input[placeholder="Full Name"]', 'John Doe');
    await page.fill('input[type="email"]', 'johndoe@example.com');
    await page.fill('input[type="password"]', 'securepassword123');
    await page.click('button:has-text("Sign Up")');

    // 3. Citizen is redirected to Dashboard and sees the Submit Issue Form
    await expect(page.locator('text=Report a New Issue')).toBeVisible();

    // 4. Citizen fills out the issue details
    await page.fill('input[placeholder="Short title for the issue"]', 'Massive Pothole on Main St');
    await page.selectOption('select', { label: 'Roads & Infrastructure' });
    await page.fill('input[placeholder="e.g., Koramangala, Block 3"]', 'Main St, Downtown');
    await page.fill('textarea', 'There is a huge pothole causing traffic slowdowns and potential accidents.');
    
    // 5. Citizen uploads an evidence photo
    // Assuming there is a file input for image upload
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/pothole.jpg');

    // 6. Submit the issue
    await page.click('button:has-text("Submit Issue")');

    // 7. Verify the issue appears in "My Submitted Issues"
    await expect(page.locator('text=Massive Pothole on Main St')).toBeVisible();
    await expect(page.locator('text=Submitted')).toBeVisible();
  });

  test('Scenario 2: Citizen views the public board to check issue status', async ({ page }) => {
    await page.goto('http://localhost:5173/board');
    
    // Check if the issue is listed on the public board
    await expect(page.locator('text=Massive Pothole on Main St')).toBeVisible();
    
    // Click the issue to view the detailed timeline
    await page.click('text=Massive Pothole on Main St');
    
    // Verify timeline shows the initial submission
    await expect(page.locator('text=Issue Reported')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible(); // Reporter name
  });
});


test.describe('Auditor Workflows', () => {

  test('Scenario 3: Auditor validates a reported issue and assigns a worker', async ({ page }) => {
    // 1. Auditor logs in
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'auditor1@example.com');
    await page.fill('input[type="password"]', 'auditorpass');
    await page.click('button:has-text("Sign In")');

    // 2. Auditor lands on Dashboard and sees the Auditor Queue at the top
    await expect(page.locator('text=All Issues (Auditor Queue)')).toBeVisible();

    // 3. Auditor finds the newly submitted issue
    const issueCard = page.locator('.border', { hasText: 'Massive Pothole on Main St' });
    
    // 4. Auditor clicks "View Issue Details & Evidence" to inspect
    await issueCard.locator('text=View Issue Details').click();
    await expect(page.locator('img')).toBeVisible(); // Check evidence
    await page.goBack();

    // 5. Auditor marks the issue as Valid
    await page.locator('.border', { hasText: 'Massive Pothole on Main St' }).locator('button:has-text("Mark Valid")').click();
    
    // 6. Auditor provides a reason for validation
    page.on('dialog', dialog => dialog.accept('Issue is legitimate and requires immediate attention.'));

    // 7. Issue status changes to "Under Review" and dropdown appears
    await expect(page.locator('.border', { hasText: 'Massive Pothole on Main St' }).locator('text=Under Review')).toBeVisible();
    
    // 8. Auditor selects a worker from the dropdown and clicks Assign
    await page.locator('.border', { hasText: 'Massive Pothole on Main St' }).locator('select').selectOption({ label: 'Worker One (WRK-001)' });
    await page.locator('.border', { hasText: 'Massive Pothole on Main St' }).locator('button:has-text("Assign")').click();
  });

  test('Scenario 4: Auditor closes an invalid issue', async ({ page }) => {
    // Assuming Auditor is logged in
    await page.goto('http://localhost:5173/dashboard');

    const issueCard = page.locator('.border', { hasText: 'Fake Issue' });
    await issueCard.locator('button:has-text("Close Issue")').click();
    
    // Auditor MUST provide a reason
    page.on('dialog', dialog => dialog.accept('This is a duplicate report.'));

    // Issue status changes to Invalid / Closed
    await expect(issueCard.locator('text=Invalid / Closed')).toBeVisible();
  });
});


test.describe('Worker Workflows', () => {

  test('Scenario 5: Worker submits a proposal for an assigned issue', async ({ page }) => {
    // 1. Worker logs in
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'worker1@example.com');
    await page.fill('input[type="password"]', 'workerpass');
    await page.click('button:has-text("Sign In")');

    // 2. Worker sees their assigned queue
    await expect(page.locator('text=Assigned Tasks (Worker Queue)')).toBeVisible();

    // 3. Worker finds the assigned issue
    const issueCard = page.locator('.border', { hasText: 'Massive Pothole on Main St' });
    await expect(issueCard.locator('text=Assigned')).toBeVisible();

    // 4. Worker clicks Submit Proposal
    await issueCard.locator('button:has-text("Submit Proposal")').click();

    // 5. Worker fills out the multi-step prompts (Mocking prompt dialogs)
    page.on('dialog', async dialog => {
      if (dialog.message().includes('description')) await dialog.accept('Will fill pothole with asphalt.');
      if (dialog.message().includes('days')) await dialog.accept('2');
      if (dialog.message().includes('budget')) await dialog.accept('5000');
    });

    // 6. Status changes to Proposal Submitted
    await expect(issueCard.locator('text=Proposal Submitted')).toBeVisible();
  });

  test('Scenario 6: Worker updates issue status to Completed', async ({ page }) => {
    // Assuming proposal was approved by Auditor in the meantime
    await page.goto('http://localhost:5173/dashboard');
    
    const issueCard = page.locator('.border', { hasText: 'Massive Pothole on Main St' });
    
    // Worker clicks Update Status
    await issueCard.locator('button:has-text("Update Status")').click();
    
    page.on('dialog', async dialog => {
      if (dialog.message().includes('status')) await dialog.accept('Completed');
      if (dialog.message().includes('notes')) await dialog.accept('Pothole filled and road smoothed.');
    });

    await expect(issueCard.locator('text=Completed')).toBeVisible();
  });
});


test.describe('Auditor Final Review & Resolution', () => {

  test('Scenario 7: Auditor reviews a completed issue and marks it as Needs Rework', async ({ page }) => {
    // Logged in as Auditor
    await page.goto('http://localhost:5173/dashboard');
    const issueCard = page.locator('.border', { hasText: 'Massive Pothole on Main St' });
    
    // Auditor clicks Needs Rework
    await issueCard.locator('button:has-text("Needs Rework")').click();
    page.on('dialog', dialog => dialog.accept('The asphalt is uneven. Please fix it.'));

    await expect(issueCard.locator('text=Needs Rework')).toBeVisible();
  });

  test('Scenario 8: Auditor resolves the issue completely', async ({ page }) => {
    // Assuming Worker fixed it and set status back to Completed
    await page.goto('http://localhost:5173/dashboard');
    const issueCard = page.locator('.border', { hasText: 'Massive Pothole on Main St' });
    
    // Auditor clicks Resolve Issue
    await issueCard.locator('button:has-text("Resolve Issue")').click();
    page.on('dialog', dialog => dialog.accept('Looks good. Road is safe now.'));

    // Status is Resolved
    await expect(issueCard.locator('text=Resolved')).toBeVisible();
  });
});
