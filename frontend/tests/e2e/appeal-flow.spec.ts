import { test, expect } from '@playwright/test';

test.describe('AppealForge End-to-End Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Page load & shell headers (Header, Stage indicator, API status badge, Upload Card)', async ({ page }) => {
    // Check Header branding
    await expect(page.getByRole('link', { name: /AppealForge — Home/i })).toBeVisible();
    await expect(page.getByText('Clinical Insurance Appeals AI')).toBeVisible();

    // Check Stage indicator steps
    const progressNav = page.getByRole('navigation', { name: 'Progress' });
    await expect(progressNav).toBeVisible();
    await expect(progressNav.getByText('Upload Documents')).toBeVisible();
    await expect(progressNav.getByText('AI Synthesis & Extraction')).toBeVisible();
    await expect(progressNav.getByText('Review & Audit')).toBeVisible();

    // Verify step 1 is marked as active
    const activeStep = progressNav.locator('[aria-current="step"]');
    await expect(activeStep).toBeVisible();
    await expect(activeStep).toContainText('Upload Documents');

    // Check Upload Card headers and descriptions
    await expect(page.getByRole('heading', { name: 'Insurance Denial Upload' })).toBeVisible();
    await expect(page.getByText('CMS Evidence Pipeline')).toBeVisible();
    await expect(page.getByText('Drag and drop your denial letter PDF here')).toBeVisible();

    // Generate button should be disabled initially when no file is attached
    const generateBtn = page.getByRole('button', { name: /Generate Appeal Letter/i });
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toBeDisabled();
  });

  test('2. Upload flow (fill patient name, insurer, attach denial file, click generate)', async ({ page }) => {
    // Open Optional Context disclosure
    const optionalContextSummary = page.getByText(/Clinical Chart & Patient Context \(Optional\)/i);
    await expect(optionalContextSummary).toBeVisible();
    await optionalContextSummary.click();

    // Fill patient name and insurer name
    const patientNameInput = page.getByPlaceholder('e.g. Jane Doe');
    const insurerInput = page.getByPlaceholder('e.g. Aetna / UnitedHealthcare');
    const notesInput = page.getByPlaceholder(/Patient failed conservative physical therapy/i);

    await patientNameInput.fill('Sarah Jenkins');
    await insurerInput.fill('Blue Cross Blue Shield');
    await notesInput.fill('Patient failed 6 weeks of conservative therapy.');

    // Upload denial letter PDF
    const denialFileInput = page.locator('input[type="file"][accept*="pdf"]').first();
    await denialFileInput.setInputFiles({
      name: 'denial_letter.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock PDF Content'),
    });

    // Verification of attached file card
    await expect(page.getByText('denial_letter.pdf')).toBeVisible();
    await expect(page.getByText('Ready for analysis')).toBeVisible();

    // Generate button should now be enabled
    const generateBtn = page.getByRole('button', { name: /Generate Appeal Letter/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // Should transition to processing state or review state
    await expect(page.getByRole('heading', { name: 'Synthesizing Appeal Dossier' })).toBeVisible({ timeout: 5000 });
  });

  test('3. Stepper processing transition & review stage (letter display, audit flags, CPT/ICD tabs, copy text feedback)', async ({ page }) => {
    // Fill denial file
    const denialFileInput = page.locator('input[type="file"][accept*="pdf"]').first();
    await denialFileInput.setInputFiles({
      name: 'denial_letter.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 Mock PDF Content'),
    });

    // Click generate
    await page.getByRole('button', { name: /Generate Appeal Letter/i }).click();

    // Stepper processing steps should be visible during processing
    await expect(page.getByRole('heading', { name: 'Synthesizing Appeal Dossier' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Parsing Denial Letter', { exact: true })).toBeVisible();

    // Wait for transition to review stage
    await expect(page.getByRole('heading', { name: 'Appeal Review & Audit' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Appeal Letter Draft' })).toBeVisible();

    // Step indicator should show step 3 completed / active
    const progressNav = page.getByRole('navigation', { name: 'Progress' });
    const activeStep = progressNav.locator('[aria-current="step"]');
    await expect(activeStep).toContainText('Review & Audit');

    // Verify Letter Action Buttons (Edit text, Copy letter, Download, Print)
    const copyButton = page.getByRole('button', { name: /Copy letter/i });
    await expect(copyButton).toBeVisible();
    const editTextButton = page.getByRole('button', { name: /Edit text/i });
    await expect(editTextButton).toBeVisible();
    await expect(page.getByRole('button', { name: /Download \(\.txt\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Print \/ PDF/i })).toBeVisible();

    // Test Edit Mode toggling
    const editOrPreviewBtn = page.getByRole('button', { name: /(Edit text|Preview with highlights)/i });
    await editOrPreviewBtn.click();
    const textarea = page.getByRole('textbox', { name: 'Edit appeal letter text' });
    await expect(textarea).toBeVisible();
    await expect(page.getByRole('button', { name: /Preview with highlights/i })).toBeVisible();
    await editOrPreviewBtn.click(); // Switch back to preview
    await expect(textarea).not.toBeVisible();

    // Verify Audit Flags / Notices in Review View
    await expect(page.getByText('Clinical Fact-Check Notices')).toBeVisible();
    await expect(page.getByText('MEDIUM').first()).toBeVisible();
    await expect(page.getByText('which has failed to resolve following six weeks of supervised physical therapy', { exact: true })).toBeVisible();

    // Extracted Codes Panel - Check Tabs (CPT, ICD-10, Citations)
    await expect(page.getByRole('heading', { name: 'Clinical Evidence & Classification' })).toBeVisible();
    const cptTab = page.getByRole('tab', { name: /CPT Procedures/i });
    const icdTab = page.getByRole('tab', { name: /ICD-10 Diagnoses/i });
    const citTab = page.getByRole('tab', { name: /CMS Citations/i });

    await expect(cptTab).toBeVisible();
    await expect(icdTab).toBeVisible();
    await expect(citTab).toBeVisible();

    // CPT list content
    await expect(page.getByText('CPT Verified').first()).toBeVisible();

    // Switch to ICD-10 tab
    await icdTab.click();
    await expect(page.getByText('ICD-10 Verified').first()).toBeVisible();

    // Switch to Citations tab
    await citTab.click({ force: true });
    await expect(page.getByText('CMS Guideline').first()).toBeVisible();
    await expect(page.getByText('CMS NCD 220.4')).toBeVisible();

    // Test Copy button clipboard interaction
    await copyButton.click();
    await expect(page.getByRole('button', { name: /Copied!/i })).toBeVisible();

    // Test "New Appeal" reset button in header or footer
    const newAppealBtn = page.getByRole('button', { name: 'New Appeal', exact: true });
    await expect(newAppealBtn).toBeVisible();
    await newAppealBtn.click();

    // Should return to idle stage
    await expect(page.getByRole('heading', { name: 'Insurance Denial Upload' })).toBeVisible();
  });

  test('4. Accessibility & Responsive layout checks (Desktop vs Mobile)', async ({ page }) => {
    // Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByRole('heading', { name: 'Insurance Denial Upload' })).toBeVisible();
    const progressNavDesktop = page.getByRole('navigation', { name: 'Progress' });
    await expect(progressNavDesktop).toBeVisible();

    // Check keyboard focusability on file upload dropzone
    const dropzone = page.locator('#denial-file-zone');
    await expect(dropzone).toHaveAttribute('tabindex', '0');
    await expect(dropzone).toHaveAttribute('role', 'button');

    // Mobile Viewport (375x667 - iPhone SE / standard mobile)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: 'Insurance Denial Upload' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate Appeal Letter/i })).toBeVisible();
  });
});
