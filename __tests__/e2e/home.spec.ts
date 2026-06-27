import { test, expect } from '@playwright/test'

test('home page loads and shows title', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('山海图鉴')
})

test('navigation to creatures page works', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/creatures"]')
  await expect(page).toHaveURL(/\/creatures/)
  await expect(page.locator('h1')).toContainText('异兽图鉴')
})

test('navigation to stories page works', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/stories"]')
  await expect(page).toHaveURL(/\/stories/)
  await expect(page.locator('h1')).toContainText('神话故事')
})

test('filter pills are visible on creatures page', async ({ page }) => {
  await page.goto('/creatures')
  await expect(page.locator('button:has-text("全部")')).toBeVisible()
})

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin/login')
  await expect(page.locator('h1')).toContainText('管理员登录')
})
