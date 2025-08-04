import { test, expect } from '@playwright/test';

test.describe('Course API', () => {
  test('requires semesters parameter', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/api/courses`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Semester codes are required');
  });

  test('returns courses array for valid semester', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/api/courses?semesters=202401`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.courses)).toBe(true);
  });
});
