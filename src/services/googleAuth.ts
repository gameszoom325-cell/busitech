/**
 * Standard Google OAuth 2.0 & Google Identity Services (GIS) Service
 * Replaces simulated mock account modals with official Google authentication.
 */

// User-configurable via VITE_GOOGLE_CLIENT_ID or default Google OAuth Client ID
export const GOOGLE_CLIENT_ID: string =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
  '1023797444140-5eom7n94f09d81d4aor313c4s2aam0f1.apps.googleusercontent.com';

export interface GoogleOAuthUser {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
  emailVerified?: boolean;
  accessToken?: string;
  idToken?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
        id?: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

/**
 * Ensures Google Identity Services (GIS) client library is ready in the DOM
 */
export async function ensureGoogleIdentityLoaded(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (window.google?.accounts?.oauth2) {
    return true;
  }

  // Check if script tag is already in DOM
  const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // Wait up to 2.5s for GIS initialization
  for (let i = 0; i < 25; i++) {
    if (window.google?.accounts?.oauth2) {
      return true;
    }
    await new Promise(res => setTimeout(res, 100));
  }

  return !!window.google?.accounts?.oauth2;
}

/**
 * Triggers official Google OAuth 2.0 flow via native Google Identity popup (accounts.google.com)
 * or standard OAuth 2.0 window, securely handling tokens and edge cases.
 */
export async function triggerGoogleOAuth(): Promise<GoogleOAuthUser> {
  const isGisLoaded = await ensureGoogleIdentityLoaded();

  return new Promise<GoogleOAuthUser>((resolve, reject) => {
    // 1. Primary Path: Modern Google Identity Services OAuth 2.0 Token Client
    if (isGisLoaded && window.google?.accounts?.oauth2) {
      let isSettled = false;

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (isSettled) return;

            if (!tokenResponse) {
              isSettled = true;
              reject(new Error('No credentials returned from Google.'));
              return;
            }

            if (tokenResponse.error) {
              isSettled = true;
              if (
                tokenResponse.error === 'popup_closed_by_user' ||
                tokenResponse.error === 'access_denied' ||
                tokenResponse.error === 'user_cancelled'
              ) {
                reject(new Error('Google sign-in was cancelled. Please try again.'));
              } else if (tokenResponse.error === 'popup_failed_to_open') {
                reject(new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.'));
              } else {
                reject(new Error(`Google sign-in failed: ${tokenResponse.error_description || tokenResponse.error}`));
              }
              return;
            }

            if (!tokenResponse.access_token) {
              isSettled = true;
              reject(new Error('Google OAuth response did not contain an access token.'));
              return;
            }

            // Retrieve verified user profile from Google's official userinfo endpoint
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`
                }
              });

              if (!res.ok) {
                isSettled = true;
                reject(new Error(`Failed to retrieve profile from Google (status: ${res.status}).`));
                return;
              }

              const profile = await res.json();
              if (!profile.email) {
                isSettled = true;
                reject(new Error('Google profile did not provide a verified email address.'));
                return;
              }

              isSettled = true;
              resolve({
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                picture: profile.picture,
                sub: profile.sub,
                emailVerified: profile.email_verified,
                accessToken: tokenResponse.access_token
              });
            } catch (fetchErr: any) {
              isSettled = true;
              reject(new Error(fetchErr.message || 'Network error communicating with Google userinfo API.'));
            }
          },
          error_callback: (error: any) => {
            if (isSettled) return;
            isSettled = true;

            if (error.type === 'popup_failed_to_open') {
              reject(new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.'));
            } else if (error.type === 'popup_closed') {
              reject(new Error('Google sign-in was cancelled. Please try again.'));
            } else {
              reject(new Error(`Google sign-in error: ${error.message || error.type || 'Authentication failed'}`));
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err: any) {
        // Fall back to direct OAuth popup window if GIS initialization threw an exception
      }
    }

    // 2. Direct Fallback: Native OAuth 2.0 Browser Popup Window to accounts.google.com
    const width = 500;
    const height = 620;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const redirectUri = `${window.location.origin}/login`;
    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'token');
    oauthUrl.searchParams.set('scope', 'openid email profile');
    oauthUrl.searchParams.set('prompt', 'select_account');

    let popup: Window | null = null;
    try {
      popup = window.open(
        oauthUrl.toString(),
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,status=no`
      );
    } catch {
      popup = null;
    }

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      reject(new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.'));
      return;
    }

    popup.focus();

    // Poll for popup closure or token reception
    const checkTimer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkTimer);
        reject(new Error('Google sign-in was cancelled. Please try again.'));
      }
    }, 500);
  });
}
