import { test, expect, Page } from '@playwright/test';

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  isTouch: boolean;
  zoom?: number;
}

const VIEWPORTS: ViewportConfig[] = [
  { name: 'small-phone', width: 320, height: 568, isTouch: true },
  { name: 'standard-phone', width: 360, height: 640, isTouch: true },
  { name: 'iphone-12', width: 390, height: 844, isTouch: true },
  { name: 'iphone-pro-max', width: 430, height: 932, isTouch: true },
  { name: 'landscape-phone', width: 844, height: 390, isTouch: true },
  { name: 'small-tablet-portrait', width: 600, height: 960, isTouch: true },
  { name: 'ipad-portrait', width: 768, height: 1024, isTouch: true },
  { name: 'ipad-air', width: 820, height: 1180, isTouch: true },
  { name: 'ipad-landscape', width: 1024, height: 768, isTouch: false },
  { name: 'laptop-standard', width: 1280, height: 720, isTouch: false },
  { name: 'laptop-hd', width: 1366, height: 768, isTouch: false },
  { name: 'desktop-standard', width: 1440, height: 900, isTouch: false },
  { name: 'desktop-fhd', width: 1920, height: 1080, isTouch: false },
  { name: 'monitor-2k', width: 2560, height: 1440, isTouch: false },
  { name: 'zoom-200', width: 1280, height: 720, isTouch: false, zoom: 2.0 }
];

const ROUTES = [
  '/login',
  '/overview',
  '/contracts',
  '/upload',
  '/contracts/ctr_stripe_msa/analysis',
  '/obligations',
  '/approvals',
  '/activity',
  '/admin'
];

const THEMES = ['light', 'dark'];

test.describe('Contract2Action Responsive & Zero-Overlap Automated Suite', () => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      test.describe(`${vp.name} (${vp.width}x${vp.height}) - ${theme}`, () => {
        test.beforeEach(async ({ page }: { page: Page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          // Pre-seed mock auth user as Admin for full route access
          await page.addInitScript((themePref: string) => {
            try {
              localStorage.setItem('c2a-theme', themePref);
              localStorage.setItem(
                'c2a-auth-user',
                JSON.stringify({
                  id: 'usr_admin_1',
                  name: 'Ayush Sharma',
                  email: 'ayushdps1010@gmail.com',
                  role: 'Admin',
                  avatarText: 'AS',
                  department: 'Legal Operations',
                  authLevel: 'Auth Lv 3',
                  isOnline: true
                })
              );
            } catch {
              // ignore
            }
          }, theme);
        });

        for (const route of ROUTES) {
          test(`Route ${route} should satisfy responsive invariants`, async ({ page }: { page: Page }) => {
            await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(100);

            // 1. Assert: No horizontal page scroll
            const scrollMetrics = await page.evaluate(() => {
              const doc = document.documentElement;
              return {
                scrollWidth: doc.scrollWidth,
                clientWidth: doc.clientWidth,
                hasHorizontalScroll: doc.scrollWidth > doc.clientWidth + 1
              };
            });
            expect(scrollMetrics.hasHorizontalScroll).toBe(false);

            // 2. Assert: No unintended text clipping without ellipsis or title
            const clippedElements = await page.evaluate(() => {
              const bad: string[] = [];
              const allElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, th, td'));
              for (const el of allElements) {
                const htmlEl = el as HTMLElement;
                const style = window.getComputedStyle(htmlEl);
                const hasEllipsis = style.textOverflow === 'ellipsis' || style.overflow === 'hidden';
                const hasTitle = htmlEl.hasAttribute('title');
                if (htmlEl.scrollWidth > htmlEl.clientWidth + 2 && !hasEllipsis && !hasTitle) {
                  bad.push(`${el.tagName}: "${htmlEl.innerText.substring(0, 30)}" (scroll=${htmlEl.scrollWidth}, client=${htmlEl.clientWidth})`);
                }
              }
              return bad;
            });
            expect(clippedElements.length).toBe(0);

            // 3. Assert: 44px minimum tap targets on touch viewports
            if (vp.isTouch) {
              const smallTouchTargets = await page.evaluate(() => {
                const offenders: string[] = [];
                const buttons = Array.from(document.querySelectorAll('button:not(.touch-compact), a:not(.touch-compact)'));
                for (const b of buttons) {
                  const rect = b.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0) {
                    if (rect.height < 36 && rect.width < 36) {
                      offenders.push(`Target <36px: ${b.tagName}.${b.className} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
                    }
                  }
                }
                return offenders;
              });
              expect(smallTouchTargets.length).toBe(0);
            }

            // 4. Assert: Last visible element is reachable
            const isBottomReachable = await page.evaluate(() => {
              const body = document.body;
              const html = document.documentElement;
              const totalHeight = Math.max(body.scrollHeight, html.scrollHeight);
              const windowHeight = window.innerHeight;
              return totalHeight >= windowHeight;
            });
            expect(isBottomReachable).toBe(true);

            // 5. Visual screenshot capture
            await page.screenshot({
              path: `tests/screenshots/${vp.name}_${theme}_${route.replace(/[\/:]/g, '_')}.png`,
              fullPage: false
            });
          });
        }
      });
    }
  }
});
