import { expect, test } from '@playwright/test';

test('home exposes the portfolio structure and seven projects', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle(/권혁호/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('설명 가능한 구조');
	await expect(page.locator('.project-card')).toHaveCount(7);
	await expect(page.getByRole('link', { name: /항공 검색 모듈/ })).toBeVisible();
});

test('project detail includes decisions, code, and disclosure', async ({ page }) => {
	await page.goto('/projects/flight-search/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('항공 검색');
	await expect(page.locator('pre')).toHaveCount(2);
	await expect(page.getByText('운영 소스 원문이 아닙니다.')).toBeVisible();
});
