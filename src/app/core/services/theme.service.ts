// src/app/core/services/theme.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key = 'theme';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  init() {
    if (isPlatformBrowser(this.platformId)) {
      this.apply(this.get());
    }
  }

  get(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light'; // Default for SSR
    }

    try {
      const saved = localStorage.getItem(this.key) as Theme | null;
      return saved ?? 'light';
    } catch {
      return 'light';
    }
  }

  set(theme: Theme) {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip on server
    }

    try {
      localStorage.setItem(this.key, theme);
      this.apply(theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  private apply(theme: Theme) {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip on server
    }

    try {
      const el = document.documentElement; // <html>
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const applyMode = () => {
        const prefersDark = media.matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        el.classList.toggle('dark', isDark);
      };
      applyMode();

      // If system preference selected, listen for changes (debounced by animation frame implicitly)
      if (theme === 'system') {
        const listener = () => applyMode();
        // Remove old listener first (optional: store reference)
        media.addEventListener?.('change', listener);
        // Store a reference on element dataset so we can clean up if apply called again with different theme
        (el as any)._systemThemeListener && media.removeEventListener?.('change', (el as any)._systemThemeListener);
        (el as any)._systemThemeListener = listener;
      } else {
        // Remove system listener if any
        const existing = (el as any)._systemThemeListener;
        if (existing) {
          media.removeEventListener?.('change', existing);
          delete (el as any)._systemThemeListener;
        }
      }
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }
}
