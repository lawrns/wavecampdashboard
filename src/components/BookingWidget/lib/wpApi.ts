/* WordPress-aware API helper for the booking widget
 * Reads endpoint/key from window.heiwaWidgetConfig (localized by the WP plugin)
 * Falls back to environment vars in non-WP contexts (e.g., local dev standalone)
 */

export type WPWidgetSettings = {
  apiEndpoint?: string; // e.g. http://localhost:3005/api
  apiKey?: string;
};

type HeiwaWidgetGlobal = {
  settings?: WPWidgetSettings;
};

function safeWindow(): any {
  try {
    return typeof window !== 'undefined' ? window : undefined;
  } catch {
    return undefined;
  }
}

export function getWpSettings(): WPWidgetSettings {
  const w = safeWindow();
  const cfg: HeiwaWidgetGlobal | undefined = w?.heiwaWidgetConfig;
  const fromWP: WPWidgetSettings = cfg?.settings || {};
  return {
    apiEndpoint:
      fromWP.apiEndpoint || process.env.NEXT_PUBLIC_WORDPRESS_API_BASE || '/api',
    apiKey:
      fromWP.apiKey || process.env.NEXT_PUBLIC_WORDPRESS_API_KEY || 'heiwa_wp_test_key_2024_secure_deployment',
  };
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export async function wpFetch(inputPath: string, init: RequestInit = {}): Promise<Response> {
  const { apiEndpoint, apiKey } = getWpSettings();
  const url = joinUrl(apiEndpoint || '/api', inputPath);

  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!headers.has('X-Heiwa-API-Key')) headers.set('X-Heiwa-API-Key', apiKey || '');

  const controller = (init as any).signal ? undefined : new AbortController();
  const signal = (init as any).signal || controller?.signal;
  const timeout = setTimeout(() => controller?.abort(), 15000);

  try {
    const res = await fetch(url, { ...init, headers, signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export function getApiBase(): string {
  return getWpSettings().apiEndpoint || '/api';
}

export function getApiKey(): string {
  return getWpSettings().apiKey || '';
}

