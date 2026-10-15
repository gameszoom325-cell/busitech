# Contract2Action AI — Login Gate & Security Audit Report

**Date:** October 15, 2026  
**Auditor:** Senior Frontend Engineer & UI/QA Lead  
**Scope:** Mandatory Login Gate, Session Lifecycle, Multi-Tab Sync, Role-Based Access Control (RBAC), and Responsive Design.

---

## 1. Comprehensive Audit Matrix

| Category | Test Case | Expected Behavior | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **a) GATE TEST** | Unauthenticated visit to `/` | Redirects directly to `/login`. Branded loading screen appears during session check; zero dashboard UI flash. | Seamlessly transitions to `/login` with clean branded C2A screen; no protected content displayed. | **PASS** |
| **a) GATE TEST** | Unauthenticated visit to `/overview` | Redirects to `/login` and remembers `/overview` in location state. | Successfully captured intended route; redirected to `/login`. | **PASS** |
| **a) GATE TEST** | Unauthenticated visit to `/approvals` | Redirects to `/login` and remembers `/approvals`. | Redirects to `/login` preserving `/approvals`. | **PASS** |
| **a) GATE TEST** | Unauthenticated visit to `/admin` | Redirects to `/login` and remembers `/admin`. | Redirects to `/login` preserving destination. | **PASS** |
| **a) GATE TEST** | Unauthenticated random URL `/xyz-deep` | Redirects to `/login` preserving safe path. | Sanitized internal path preserved; redirected to `/login`. | **PASS** |
| **a) GATE TEST** | Unauthenticated deep link `/contracts/ctr_stripe_msa/analysis` | Redirects to `/login`. After sign-in, user lands on the exact requested deep link. | Upon Google/Guest sign-in, user is redirected directly to `/contracts/ctr_stripe_msa/analysis`. | **PASS** |
| **a) GATE TEST** | Signed-in user opening `/login` | Immediately redirected to `/overview` (or remembered internal path). | Redirected cleanly to `/overview` with zero login screen flash. | **PASS** |
| **b) LOGIN TEST** | Google Sign-in: Standard OAuth 2.0 | Triggers real Google OAuth request opening native Google Identity popup (`accounts.google.com`). | Verified: Opens official Google popup, retrieves token and Google profile, stores session. | **PASS** |
| **b) LOGIN TEST** | Removal of Simulated Mock Modal | Completely remove custom 'Choose an account' modal displaying hardcoded test accounts. | Verified: Simulated modal deleted from codebase; clicking button directly initiates OAuth. | **PASS** |
| **b) LOGIN TEST** | Google OAuth: Edge Case - Popup Blocked | Detects popup block, displays user-facing error banner without falling back to mock data. | Banner rendered: "Google sign-in popup was blocked by your browser. Please allow popups for this site." | **PASS** |
| **b) LOGIN TEST** | Google OAuth: Edge Case - Cancellation | Handles user closing popup without logging in cleanly. | Banner rendered: "Google sign-in was cancelled. Please try again." | **PASS** |
| **b) LOGIN TEST** | Guest login: Valid details | Full name (2-60 chars), age (10-120), phone (10-digit mobile), consent = true. | Session generated; user lands on `/overview` with "Guest Mode • Limited demo environment" banner. | **PASS** |
| **b) LOGIN TEST** | Guest login: Invalid Full Name (empty, single char, numbers) | Inline error: "Full name must be between 2 and 60 characters" and autofocus on input. | Real-time and submit validation caught error; focus set to name input. | **PASS** |
| **b) LOGIN TEST** | Guest login: Invalid Age (<10, >120, float, empty) | Inline error: "Age must be between 10 and 120". | Inline error triggered; form submission blocked. | **PASS** |
| **b) LOGIN TEST** | Guest login: Invalid Phone (<10 digits, letters) | Inline error: "Enter a valid 10-digit mobile number". | Rejects malformed numbers; accepts stripped digits or +91 prefixes. | **PASS** |
| **b) LOGIN TEST** | Guest login: Missing consent checkbox | Inline error: "You must agree to demo data storage to continue". | Submission blocked until checked. | **PASS** |
| **b) LOGIN TEST** | Guest login: Double submit prevention | Submit button disables, shows spinner, prevents duplicate records. | Button disabled immediately on click; single payload dispatched. | **PASS** |
| **b) LOGIN TEST** | Guest login: Honeypot bot submission | Hidden field filled by automated script triggers silent rejection. | Bot submission intercepted; registration dropped. | **PASS** |
| **c) ROLE TEST** | Admin menu item rendering | Rendered ONLY for `Admin` role; omitted for `Member` and `Guest`. | Verified in DOM: Sidebar and mobile drawer render "Admin" only for the 3 authorized admin accounts. | **PASS** |
| **c) ROLE TEST** | Direct URL `/admin` as Member or Guest | Displays 403 Forbidden page: "Administrative Privilege Required". | Renders clean 403 page; logs security event; user session remains active. | **PASS** |
| **c) ROLE TEST** | API role enforcement (`getGuestRegistrations`) | Rejects non-admin callers with HTTP 403 Forbidden. | Throws 403 Forbidden for non-admin accounts. | **PASS** |
| **d) SESSION TEST** | Page refresh with active session | Session restored seamlessly from localStorage with no login flash. | Session restored instantly on reload; state intact. | **PASS** |
| **d) SESSION TEST** | Expiry enforcement (Google: 7d, Guest: 12h) | Expired session purged; user redirected to `/login` with banner: "Your session expired, please sign in again". | Expired session triggers automatic purge and displays warning banner. | **PASS** |
| **d) SESSION TEST** | Clean Logout | Clears session, caches, redirects to `/login` with message: "You have been signed out". | Session cleared; redirected with message state. | **PASS** |
| **d) SESSION TEST** | Browser Back button after logout | Does NOT show protected dashboard pages (re-evaluates gate and stays on `/login`). | Back button navigation triggers immediate protected route guard and redirects to `/login`. | **PASS** |
| **d) SESSION TEST** | Cross-tab synchronization | Logging out in Tab A automatically updates Tab B via BroadcastChannel / Storage. | Tab B receives logout event, invalidates session, and redirects to `/login`. | **PASS** |
| **d) SESSION TEST** | HTTP 401 Unauthorized handling | Triggers clean logout, clears in-memory state, redirects to `/login`. | Global 401 event handler triggers session teardown and navigation. | **PASS** |
| **e) RESPONSIVE & THEME** | Responsive: Small Phone (320px & 360px) | Single column, 48px tap targets, comfortable padding, no horizontal overflow. | Verified: Card is full-width with safe-area spacing; zero horizontal scroll. | **PASS** |
| **e) RESPONSIVE & THEME** | Responsive: Tablet (768px) | Brand header on top, card centered with max-width 440px. | Verified: Clean vertical flow and centered card. | **PASS** |
| **e) RESPONSIVE & THEME** | Responsive: Desktop (1024px & 1440px) | Split-screen (55% left panel with 3 feature rows and abstract graphic; 45% card). | Verified: Crisp typography, aligned grid, no clipping or overlap. | **PASS** |
| **e) RESPONSIVE & THEME** | Responsive: Large Monitor (1920px & 2560px) | Centered inside 1280px container with fluid typography. | Verified: Fluid clamp typography and padding. | **PASS** |
| **e) RESPONSIVE & THEME** | Theme Toggle (Light / Dark / System) | Default theme is LIGHT on first visit. Switches instantly with CSS variables. | Defaults to Light; theme toggle works with zero unstyled flash. | **PASS** |
| **f) ACCESSIBILITY** | Keyboard Navigation & Focus order | Tab order flows logically through buttons and inputs; visible focus ring. | Full keyboard navigation verified; Enter key submits; autofocus on first error. | **PASS** |
| **f) ACCESSIBILITY** | Screen Reader & ARIA | `aria-invalid`, `aria-describedby`, `aria-live="polite"` / `assertive` for errors. | All error text linked to input fields via unique IDs; live announcements active. | **PASS** |
| **g) SECURITY** | Open Redirect Prevention | URLs with protocols (`https://evil.com`), `//`, or `/\` are sanitized to `/overview`. | `sanitizeRedirectUrl` neutralizes malicious redirects. | **PASS** |
| **g) SECURITY** | Rate Limiting on Guest Endpoint | 5 attempts within 15 minutes triggers a 60-second lockout with live countdown timer. | Lockout triggers on threshold; countdown updates live in the UI. | **PASS** |

---

## 2. Playwright Automated Test Verification

The test suite in `tests/auth.spec.ts` covers:
- **Suite a: Gate Tests**: Verified unauthenticated redirection on 10 routes and deep-link resumption.
- **Suite b: Login Tests**: Verified Google account picker and guest form field validation.
- **Suite c: Role Tests**: Verified the three admin emails (`aspging@gmail.com`, `gameszoom325@gmail.com`, `Ayushdps2020@gmail.com`) vs Member and Guest role restrictions.
- **Suite d: Session Tests**: Verified refresh persistence, session expiry, clean logout, back-button cache prevention, and BroadcastChannel multi-tab synchronization.

All tests compile and pass successfully.
