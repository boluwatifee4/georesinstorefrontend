import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Lightweight helper to check browser context (works in inject()-able functions). */
export function isBrowser(): boolean {
  try {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId);
  } catch {
    // Fallback: safest assumption in SSR build stages is false
    return false;
  }
}
