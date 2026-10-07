import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const file of ['index.html', 'beliefs.html', 'news.html', 'endorsements.html']) {
  test(`${file}: loading, links, accessibility, and menu`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Third-party embeds are not part of the local regression test.
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('/' + file);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.keyboard.press('Tab');
    await expect(page.getByText('Skip to main content')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();

    const references = await page.locator('a[href], script[src], link[href], img[src]').evaluateAll(elements => elements.map(e => e.href || e.src));
    for (const reference of references) {
      const url = new URL(reference);
      if (url.origin !== 'http://127.0.0.1:4173') continue;
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      expect(existsSync(resolve('.' + pathname)), pathname).toBe(true);
      if (url.hash && url.pathname.endsWith(file)) {
        expect(await page.evaluate(id => !!document.getElementById(id), decodeURIComponent(url.hash.slice(1))), reference).toBe(true);
      }
    }
    if (testInfo.project.name === 'mobile') {
      const menu = page.locator('#navbarTarget');
      const button = page.getByRole('button', { name: 'Toggle navigation' });
      await button.click();
      await expect(menu).toHaveClass(/show/);
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await menu.locator('a').first().focus();
      await page.keyboard.press('Escape');
      await expect(menu).toHaveClass(/^(?:navbar-collapse collapse|collapse navbar-collapse)$/);
      await expect(button).toBeFocused();
      await button.click();
      await expect(menu).toHaveClass(/show/);
      await button.click();
      await expect(menu).toHaveClass(/^(?:navbar-collapse collapse|collapse navbar-collapse)$/);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    expect(errors).toEqual([]);
    await page.locator('main').evaluate(element => element.blur());
    await page.screenshot({ path: testInfo.outputPath(file + '.png'), fullPage: true });
  });
}

test('mailing-list link', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.getByRole('link', { name: 'Join the BNHCA mailing list' })).toHaveAttribute('href', 'https://eepurl.com/glGi61');
});

 test('homepage anchor navigation closes menu and clears fixed header', async ({ page }, testInfo) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Home', exact: true, includeHidden: true })).toHaveAttribute('aria-current', 'page');
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(page.locator('#navbarTarget')).toHaveClass(/show/);
  }
  await page.getByRole('link', { name: 'Join Us', exact: true }).click();
  await expect(page).toHaveURL(/index\.html#join$/);
  if (testInfo.project.name === 'mobile') await expect(page.locator('#navbarTarget')).toHaveClass(/^(?:navbar-collapse collapse|collapse navbar-collapse)$/);
  await expect(page.getByRole('link', { name: 'Join the BNHCA mailing list' })).toBeInViewport();
  expect(await page.evaluate(() => document.querySelector('#join').getBoundingClientRect().top >= document.querySelector('#mainNav').getBoundingClientRect().bottom)).toBe(true);
});

for (const source of ['index.html', 'beliefs.html', 'news.html', 'endorsements.html']) {
  test(`Endorsements navigation from ${source}`, async ({ page }) => {
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('/' + source);
    const toggle = page.getByRole('button', { name: 'Toggle navigation' });
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(page.locator('#navbarTarget')).toHaveClass(/show/);
    }
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Endorsements', exact: true }).click();
    await expect(page).toHaveURL(/\/endorsements\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('2026');
    await expect(page.getByRole('link', { name: 'Endorsements', exact: true, includeHidden: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('footer')).toContainText('2026');
  });
}

async function holdArchive(page) {
  let pending;
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'us20.campaign-archive.com') { pending = route; return; }
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
  await page.goto('/news.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.newsletter-loading')).toBeVisible();
  await expect.poll(() => Boolean(pending)).toBe(true);
  return pending;
}

test('newsletter loading state clears after archive frame loads', async ({ page }, testInfo) => {
  const pending = await holdArchive(page);
  await expect(page.getByRole('status')).toContainText('Loading the newsletter archive');
  await expect(page.getByRole('link', { name: 'open the newsletter archive in a new tab' })).toBeVisible();
  await expect(page.locator('script[src*="twitter"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'BNHCA on Twitter' })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('newsletter-loading.png'), fullPage: true });
  await pending.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Archive fixture</title><body><h1>Newsletters</h1></body></html>' });
  await expect(page.locator('.newsletter-loading')).toBeHidden();
  await expect(page.locator('#newsletter-archive iframe')).toBeVisible();
});

test('slow newsletter frame preserves a visible fallback', async ({ page }) => {
  await page.clock.install();
  const pending = await holdArchive(page);
  await page.clock.fastForward(12001);
  await expect(page.getByRole('status')).toContainText('taking longer to load');
  await expect(page.getByRole('link', { name: 'open the newsletter archive in a new tab' })).toBeVisible();
  await pending.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Archive</title><p>Newsletters</p>' });
  await expect(page.locator('.newsletter-loading')).toBeHidden();
});
