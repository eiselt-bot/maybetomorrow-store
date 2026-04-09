/**
 * Smoke tests — non-destructive, read-only HTTP checks that the
 * critical user-facing paths render.
 *
 * Runs against the live PM2 instance on port 3003. Because shop
 * subdomains go through nginx, we fake the subdomain via the Host
 * header on the raw request (playwright request API).
 *
 * If any test here fails, the production deployment is broken.
 */

import { test, expect } from '@playwright/test';

test.describe('public smoke', () => {
  test('landing page returns 200 and mentions the platform', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/MaybeTomorrow/i);
  });

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checks.find((c: { name: string }) => c.name === 'db').ok).toBe(true);
    expect(body.checks.find((c: { name: string }) => c.name === 'uploads').ok).toBe(true);
  });

  test('shop home page via path route renders products', async ({ page }) => {
    const res = await page.goto('/shop/kanga-dreams');
    expect(res?.status()).toBe(200);
    // EarthyArtisan / OceanCalm etc. all render an h2 hero + a product grid
    const headings = await page.locator('h2').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    // At least the shop name should be somewhere on the page
    await expect(page.locator('body')).toContainText(/Kanga|Dreams/i);
  });

  test('product detail page renders Add to cart', async ({ page }) => {
    await page.goto('/shop/kanga-dreams/product/16');
    await expect(page.getByRole('button', { name: /Add to cart/i })).toBeVisible();
  });

  test('cart page renders (empty state)', async ({ page }) => {
    const res = await page.goto('/shop/kanga-dreams/cart');
    expect(res?.status()).toBe(200);
    // Cart is hydrated client-side from localStorage — in a fresh
    // browser context it's empty
    await expect(page.locator('body')).toContainText(/cart|checkout|loading/i);
  });

  test('admin login page renders phone + password inputs', async ({ page }) => {
    const res = await page.goto('/admin/login');
    expect(res?.status()).toBe(200);
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|submit|log in/i })).toBeVisible();
  });

  test('admin dashboard redirects unauthenticated users to login', async ({ page }) => {
    const res = await page.goto('/admin');
    // NextAuth sends a 307 → /admin/login, playwright follows, so the
    // final URL contains /admin/login
    expect(page.url()).toContain('/admin/login');
  });

  test('security headers present on every response', async ({ request }) => {
    const res = await request.get('/');
    const headers = res.headers();
    expect(headers['strict-transport-security']).toMatch(/max-age/);
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['content-security-policy']).toMatch(/default-src/);
  });

  test('mockup-preview route is admin-guarded', async ({ page }) => {
    const res = await page.goto('/mockup-preview/1');
    // Without a session we should get redirected to login
    expect(page.url()).toContain('/admin/login');
  });
});
