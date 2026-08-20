import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: undefined });
    } catch {
      // The browser may not expose navigator.share at all.
    }
  });
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('guides a group from the introduction to a selected idea', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Build a small idea/i })).toBeVisible();
  await expect(page.getByText(/with an AI Development tool: GitHub Copilot/i)).toBeVisible();
  await expect(page.getByAltText('National Bank of Belgium')).toBeVisible();
  await expect(page.locator('.site-header')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.stepper')).toHaveCSS('background-color', 'rgb(0, 45, 90)');
  await expect(page.locator('.brand-logo')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('body')).toHaveCSS('font-family', /Barlow/);
  await expect(page.getByRole('link', { name: /Display QR \+ instructions/i })).toHaveAttribute('href', '#qr-code');
  await expect(page.getByRole('link', { name: 'Source Code' })).toHaveAttribute('href', 'https://github.com/NationalBankBelgium/ai-dev-workshop-2026-09');

  await page.getByRole('button', { name: /Choose an app idea/ }).click();
  await expect(page.getByRole('heading', { name: /Find a spark/i })).toBeVisible();
  await expect(page.locator('.collection-count strong')).toHaveText('200');
  await expect(page.locator('.collection-count span')).toHaveText('app ideas');
  await expect(page.locator('.prompt-preview')).toHaveCount(0);

  const selectedTitle = await page.locator('.proposed-idea h2').textContent();
  expect(selectedTitle).toBeTruthy();
  const selectedUrl = new URL(page.url());
  expect(selectedUrl.searchParams.get('idea')).toMatch(/^\d{3}$/);
  await page.getByRole('button', { name: /Share this idea/ }).click();
  await expect(page.getByRole('status')).toContainText(/Idea link (copied to the clipboard|shared)/);
  await page.getByRole('button', { name: /Use this idea/ }).click();
  await expect(page.getByRole('heading', { name: selectedTitle ?? '' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Start with a clear prompt/i })).toBeVisible();
  await expect(page.locator('.feature-card')).toHaveCount(4);
  await expect(page.locator('.angle-row')).toHaveCount(10);
});

test('opens a shared idea link directly on step two', async ({ page }) => {
  await page.getByRole('button', { name: /Choose an app idea/ }).click();
  const sharedTitle = await page.locator('.proposed-idea h2').textContent();
  const sharedUrl = page.url();

  await page.evaluate(() => window.localStorage.clear());
  await page.goto(sharedUrl);

  await expect(page.getByRole('heading', { name: /Find a spark/i })).toBeVisible();
  await expect(page.locator('.proposed-idea h2')).toHaveText(sharedTitle ?? '');
  await expect(page.locator('.prompt-preview')).toHaveCount(0);
  await expect(page).toHaveURL(/\?idea=\d{3}$/);
});

test('filters the idea collection by topic', async ({ page }) => {
  await page.getByRole('button', { name: /Choose an app idea/ }).click();
  await expect(page.getByRole('button', { name: /All ideas/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /Food & drink/ }).click();
  await expect(page.getByRole('button', { name: /Food & drink/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.idea-result')).not.toHaveCount(0);
  await expect(page.locator('.idea-result strong', { hasText: 'Mocktail Mixer' })).toHaveCount(1);
  await expect(page.locator('.idea-result strong', { hasText: 'Decision Spinner' })).toHaveCount(0);

  await page.getByRole('button', { name: /All ideas/ }).click();
  await expect(page.getByRole('button', { name: /All ideas/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.idea-result strong', { hasText: 'Decision Spinner' })).toHaveCount(1);
});

test('opens a scan-ready QR display view', async ({ page }) => {
  await page.getByRole('link', { name: /Display QR \+ instructions/i }).click();

  await expect(page).toHaveURL(/#qr-code$/);
  await expect(page.getByRole('heading', { name: /Scan to start/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /QR code linking/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Recommended approach/i })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(9);
  await expect(page.getByText(/Open the folder you've created with Visual Studio Code/i)).toBeVisible();
  await expect(page.getByText(/Refresh the page after each round to check the results/i)).toBeVisible();
  await expect(page.getByText('https://nationalbankbelgium.github.io/ai-dev-workshop-2026-09/')).toBeVisible();
  const qrBox = await page.locator('.qr-card').boundingBox();
  const urlBox = await page.locator('.qr-side .qr-url-block').boundingBox();
  expect(qrBox).not.toBeNull();
  expect(urlBox).not.toBeNull();
  if (qrBox && urlBox) {
    expect(urlBox.y).toBeGreaterThan(qrBox.y + qrBox.height);
  }
  await expect(page.locator('.header-back')).toHaveText(/Back to workshop/i);

  await page.getByRole('button', { name: /Reset workshop/i }).click();
  await expect(page).not.toHaveURL(/#qr-code$/);
  await expect(page.getByRole('heading', { name: /Build a small idea/i })).toBeVisible();
});

test('rotates prompts in place, copies feedback, and restores state after reload', async ({ page }) => {
  await page.getByRole('button', { name: /Choose an app idea/ }).click();
  await page.getByRole('button', { name: /Use this idea/ }).click();

  const firstFeature = await page.locator('.feature-card p').allTextContents();
  await page.getByRole('button', { name: /Show different ideas/ }).click();
  const secondFeature = await page.locator('.feature-card p').allTextContents();
  expect(secondFeature).not.toEqual(firstFeature);

  const firstAngles = await page.locator('.angle-row h3').allTextContents();
  await expect(page.locator('.featured-angle')).toHaveCount(0);
  await page.getByRole('button', { name: /Shuffle options/ }).click();
  const secondAngles = await page.locator('.angle-row h3').allTextContents();
  expect(secondAngles).toHaveLength(10);
  expect(secondAngles).not.toEqual(firstAngles);
  await expect(page.locator('.featured-angle')).toHaveCount(0);
  await page.getByRole('button', { name: /Copy starter prompt/ }).click();
  await expect(page.getByRole('button', { name: /Copied/ })).toBeVisible();

  const selectedTitle = await page.locator('.selected-app-header h1').textContent();
  const anglesBeforeReload = await page.locator('.angle-row h3').allTextContents();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Start with a clear prompt/i })).toBeVisible();
  await expect(page.locator('.selected-app-header h1')).toHaveText(selectedTitle ?? '');
  await expect(page.locator('.feature-card')).toHaveCount(4);
  await expect.poll(() => page.locator('.angle-row h3').allTextContents()).not.toEqual(anglesBeforeReload);
});

test('starts a fresh random idea when choosing or changing the idea', async ({ page }) => {
  await page.getByRole('button', { name: /Choose an app idea/ }).click();
  const firstTitle = await page.locator('.proposed-idea h2').textContent();
  expect(firstTitle).toBeTruthy();

  await page.getByRole('button', { name: /Use this idea/ }).click();
  await page.getByRole('button', { name: /Show different ideas/ }).click();
  await page.getByRole('button', { name: /Change idea/ }).click();

  await expect(page.getByRole('heading', { name: /Find a spark/i })).toBeVisible();
  const secondTitle = await page.locator('.proposed-idea h2').textContent();
  expect(secondTitle).toBeTruthy();
  expect(secondTitle).not.toBe(firstTitle);

  const persistedState = await page.evaluate(() => {
    const rawState = window.localStorage.getItem('do-all-learning:workshop-state:v1');
    return rawState ? JSON.parse(rawState) as { step: string; selectedIdeaId: string | null; secondActOffset: number } : null;
  });
  expect(persistedState).toMatchObject({
    step: 'choose',
    secondActOffset: 0,
  });
  expect(persistedState?.selectedIdeaId).toBeTruthy();

  await page.getByRole('button', { name: /Use this idea/ }).click();
  await page.getByRole('button', { name: /Choose an app/ }).click();
  await expect(page.getByRole('heading', { name: /Find a spark/i })).toBeVisible();
  const thirdTitle = await page.locator('.proposed-idea h2').textContent();
  expect(thirdTitle).toBeTruthy();
  expect(thirdTitle).not.toBe(secondTitle);
});

test('reset clears the session and returns to the first step', async ({ page }) => {
  await page.getByRole('button', { name: /Choose an app idea/ }).click();
  await page.getByRole('button', { name: /Use this idea/ }).click();
  let dialogSeen = false;
  page.on('dialog', async (dialog) => {
    dialogSeen = true;
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: /Reset workshop/ }).click();

  expect(dialogSeen).toBe(false);
  await expect(page.getByRole('heading', { name: /Build a small idea/i })).toBeVisible();
  await expect(page.locator('.step-link.is-current')).toHaveText(/Start here/);
  expect(await page.evaluate(() => window.localStorage.length)).toBe(0);
});

test('search and mobile layout remain usable', async ({ page }) => {
  await page.getByRole('button', { name: /Choose an app idea/ }).click();
  await page.getByRole('searchbox', { name: /Search app ideas/ }).fill('music');
  await expect(page.locator('.idea-result')).toHaveCount(3);

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('.header-topline')).toHaveCSS('flex-direction', 'column');
  await expect(page.locator('.header-actions')).toHaveCSS('display', 'grid');
  await expect(page.locator('.action-text-compact').first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});
