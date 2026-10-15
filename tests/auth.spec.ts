import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

/**
 * Helper to mock Google OAuth 2.0 Identity Services response in Playwright
 */
async function mockGoogleIdentity(page: Page, email: string, name?: string) {
  await page.addInitScript(({ mockEmail, mockName }) => {
    (window as any).google = {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => ({
            requestAccessToken: () => {
              // Intercept fetch for Google userinfo
              const origFetch = window.fetch;
              window.fetch = (async (url: any, opts: any) => {
                if (typeof url === 'string' && url.includes('googleapis.com/oauth2/v3/userinfo')) {
                  return new Response(
                    JSON.stringify({
                      email: mockEmail,
                      name: mockName || mockEmail.split('@')[0],
                      picture: 'https://lh3.googleusercontent.com/a/default-avatar',
                      sub: '10928392103912',
                      email_verified: true
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                  );
                }
                return origFetch(url, opts);
              }) as any;

              // Immediately notify callback with access token
              setTimeout(() => {
                config.callback({ access_token: 'valid_google_oauth_token_123' });
              }, 30);
            }
          })
        }
      }
    };
  }, { mockEmail: email, mockName: name });
}

/**
 * Helper to mock Google OAuth popup block in Playwright
 */
async function mockGoogleOAuthPopupBlocked(page: Page) {
  await page.addInitScript(() => {
    (window as any).google = {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => ({
            requestAccessToken: () => {
              setTimeout(() => {
                if (config.error_callback) {
                  config.error_callback({ type: 'popup_failed_to_open' });
                } else {
                  config.callback({ error: 'popup_failed_to_open' });
                }
              }, 30);
            }
          })
        }
      }
    };
  });
}

/**
 * Helper to mock Google OAuth user cancellation in Playwright
 */
async function mockGoogleOAuthCancelled(page: Page) {
  await page.addInitScript(() => {
    (window as any).google = {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => ({
            requestAccessToken: () => {
              setTimeout(() => {
                if (config.error_callback) {
                  config.error_callback({ type: 'popup_closed' });
                } else {
                  config.callback({ error: 'popup_closed_by_user' });
                }
              }, 30);
            }
          })
        }
      }
    };
  });
}

test.describe('Contract2Action Auth Gate & Standard Google OAuth 2.0 Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // =========================================================================
  // a) GATE TEST: Unauthenticated access redirected to /login with zero leaks
  // =========================================================================
  test.describe('a) Gate Tests: Strict Redirect to /login with zero flash', () => {
    const protectedRoutes = [
      '/',
      '/overview',
      '/approvals',
      '/contracts',
      '/upload',
      '/obligations',
      '/activity',
      '/admin',
      '/contracts/ctr_stripe_msa/analysis',
      '/non-existent-deep-link'
    ];

    for (const route of protectedRoutes) {
      test(`Unauthenticated request to ${route} redirects to /login`, async ({ page }) => {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForURL('**/login**');

        expect(page.url()).toContain('/login');
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
        await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();

        // Verify protected application shell elements NEVER leaked
        await expect(page.locator('text=Platform / Console')).toHaveCount(0);
        await expect(page.locator('text=Attention Required')).toHaveCount(0);
        await expect(page.locator('text=Command Palette (⌘K)')).toHaveCount(0);
      });
    }

    test('Deep link is preserved and redirected after successful Google OAuth', async ({ page }) => {
      await mockGoogleIdentity(page, 'aspging@gmail.com', 'Ashwin Singh');
      await page.goto(`${BASE_URL}/approvals`);
      await page.waitForURL('**/login**');

      // Click Continue with Google
      await page.getByRole('button', { name: /Continue with Google/i }).click();

      // Confirms redirected to requested deep link /approvals
      await page.waitForURL('**/approvals**', { timeout: 6000 });
      expect(page.url()).toContain('/approvals');
      await expect(page.getByRole('heading', { name: 'Pending Approvals' })).toBeVisible();
    });
  });

  // =========================================================================
  // b) GOOGLE OAUTH 2.0 & REMOVAL OF CUSTOM MOCK MODAL
  // =========================================================================
  test.describe('b) Google OAuth 2.0 Flow: Native Popup & Mock Removal', () => {
    test('Mock "Choose an account" modal is completely removed from DOM', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      // Verify the simulated modal elements are not present
      await expect(page.locator('text=Authorized Governance Admins')).toHaveCount(0);
      await expect(page.locator('text=Standard Member Accounts')).toHaveCount(0);
      await expect(page.locator('text=Or enter any Google address')).toHaveCount(0);
      await expect(page.locator('text=Test Edge Cases')).toHaveCount(0);
    });

    test('Handles Google OAuth popup blocked gracefully with clear error message', async ({ page }) => {
      await mockGoogleOAuthPopupBlocked(page);
      await page.goto(`${BASE_URL}/login`);

      await page.getByRole('button', { name: /Continue with Google/i }).click();

      // Verify error banner without fallback to mock accounts
      await expect(page.getByText(/Google sign-in popup was blocked by your browser/i)).toBeVisible();
      await expect(page.locator('text=Authorized Governance Admins')).toHaveCount(0);
    });

    test('Handles Google OAuth user cancellation gracefully', async ({ page }) => {
      await mockGoogleOAuthCancelled(page);
      await page.goto(`${BASE_URL}/login`);

      await page.getByRole('button', { name: /Continue with Google/i }).click();

      // Verify cancellation notice
      await expect(page.getByText(/Google sign-in was cancelled/i)).toBeVisible();
      await expect(page.locator('text=Authorized Governance Admins')).toHaveCount(0);
    });

    test('Guest login with valid inputs creates session successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      await page.getByRole('button', { name: /Continue as Guest/i }).click();

      await page.locator('#guest-full-name').fill('Sarah Jenkins');
      await page.locator('#guest-age').fill('29');
      await page.locator('#guest-phone').fill('9876543210');
      await page.locator('input[type="checkbox"]').check();

      await page.getByRole('button', { name: /Enter as Guest/i }).click();

      await page.waitForURL('**/overview**');
      await expect(page.getByText('Guest Mode • Limited demo environment')).toBeVisible();
      await expect(page.getByText('Sarah Jenkins')).toBeVisible();
    });
  });

  // =========================================================================
  // c) ROLE TESTS: Admin vs Member vs Guest Access Control
  // =========================================================================
  test.describe('c) Role Tests: Verified Google OAuth Admin vs Member & Guest', () => {
    const adminEmails = [
      { name: 'Ashwin Singh', email: 'aspging@gmail.com' },
      { name: 'Gaurav Kumar', email: 'gameszoom325@gmail.com' },
      { name: 'Ayush Sharma', email: 'Ayushdps2020@gmail.com' }
    ];

    for (const admin of adminEmails) {
      test(`Admin user ${admin.email} has Admin role and access to /admin`, async ({ page }) => {
        await mockGoogleIdentity(page, admin.email, admin.name);
        await page.goto(`${BASE_URL}/login`);
        await page.getByRole('button', { name: /Continue with Google/i }).click();

        await page.waitForURL('**/overview**');

        // Confirm Admin navigation item is present in sidebar
        await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();

        // Direct navigation to /admin works
        await page.goto(`${BASE_URL}/admin`);
        await expect(page.getByText('Admin & Governance')).toBeVisible();
      });
    }

    test('Standard Member user cannot access /admin (shows 403 Forbidden)', async ({ page }) => {
      await mockGoogleIdentity(page, 'alex.chen@acmecorp.com', 'Alex Chen');
      await page.goto(`${BASE_URL}/login`);
      await page.getByRole('button', { name: /Continue with Google/i }).click();

      await page.waitForURL('**/overview**');

      // Admin link must NOT be rendered in sidebar
      await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);

      // Direct navigation to /admin must show 403 Forbidden page
      await page.goto(`${BASE_URL}/admin`);
      await expect(page.getByText(/ERROR 403: ACCESS RESTRICTED/i)).toBeVisible();
      await expect(page.getByText(/Administrative Privilege Required/i)).toBeVisible();
    });

    test('Guest user cannot access /admin (shows 403 Forbidden)', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.getByRole('button', { name: /Continue as Guest/i }).click();
      await page.locator('#guest-full-name').fill('Guest Reviewer');
      await page.locator('#guest-age').fill('25');
      await page.locator('#guest-phone').fill('9876543210');
      await page.locator('input[type="checkbox"]').check();
      await page.getByRole('button', { name: /Enter as Guest/i }).click();

      await page.waitForURL('**/overview**');
      await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);

      await page.goto(`${BASE_URL}/admin`);
      await expect(page.getByText(/ERROR 403: ACCESS RESTRICTED/i)).toBeVisible();
    });
  });

  // =========================================================================
  // d) SESSION TESTS: Persistence, Expiry, Logout, and Cross-Tab Sync
  // =========================================================================
  test.describe('d) Session Tests: Persistence, Expiry, Logout & Back-Button Cache', () => {
    test('Browser refresh retains active session without flashing login', async ({ page }) => {
      await mockGoogleIdentity(page, 'aspging@gmail.com', 'Ashwin Singh');
      await page.goto(`${BASE_URL}/login`);
      await page.getByRole('button', { name: /Continue with Google/i }).click();
      await page.waitForURL('**/overview**');

      // Reload page
      await page.reload();
      await page.waitForURL('**/overview**');
      await expect(page.getByRole('heading', { name: 'Recent Contracts' })).toBeVisible();
    });

    test('Sign out clears session, returns to /login with "You have been signed out"', async ({ page }) => {
      await mockGoogleIdentity(page, 'aspging@gmail.com', 'Ashwin Singh');
      await page.goto(`${BASE_URL}/login`);
      await page.getByRole('button', { name: /Continue with Google/i }).click();
      await page.waitForURL('**/overview**');

      // Open user menu and click Sign Out
      await page.getByLabel('User profile menu').click();
      await page.getByRole('button', { name: /Sign Out/i }).click();

      await page.waitForURL('**/login**');
      await expect(page.getByText('You have been signed out')).toBeVisible();

      // Clicking Back button must NOT show protected overview page
      await page.goBack();
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/login');
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    });

    test('Expired session automatically redirects to /login with expiration notice', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.evaluate(() => {
        const expiredSession = {
          user: {
            id: 'usr_test_expired',
            name: 'Test Expired',
            email: 'test@example.com',
            role: 'Member'
          },
          loginType: 'google',
          createdAt: Date.now() - 1000000000,
          expiresAt: Date.now() - 5000,
          token: 'expired_jwt'
        };
        localStorage.setItem('c2a-auth-session', JSON.stringify(expiredSession));
      });

      await page.goto(`${BASE_URL}/overview`);
      await page.waitForURL('**/login**');
      await expect(page.getByText('Your session expired, please sign in again')).toBeVisible();
    });

    test('Cross-tab synchronization: Logout in Tab A logs out Tab B', async ({ context }) => {
      const pageA = await context.newPage();
      const pageB = await context.newPage();

      await mockGoogleIdentity(pageA, 'aspging@gmail.com', 'Ashwin Singh');
      await pageA.goto(`${BASE_URL}/login`);
      await pageA.getByRole('button', { name: /Continue with Google/i }).click();
      await pageA.waitForURL('**/overview**');

      await pageB.goto(`${BASE_URL}/approvals`);
      await pageB.waitForURL('**/approvals**');
      await expect(pageB.getByRole('heading', { name: 'Pending Approvals' })).toBeVisible();

      // Log out on Tab A
      await pageA.getByLabel('User profile menu').click();
      await pageA.getByRole('button', { name: /Sign Out/i }).click();
      await pageA.waitForURL('**/login**');

      await pageB.waitForTimeout(500);
      await pageB.reload();
      await pageB.waitForURL('**/login**');
      await expect(pageB.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

      await pageA.close();
      await pageB.close();
    });
  });
});
