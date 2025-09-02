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
      return 'system'; // Default for SSR
    }

    try {
      const saved = localStorage.getItem(this.key) as Theme | null;
      return saved ?? 'system';
    } catch {
      return 'system';
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
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
      el.classList.toggle('dark', isDark);
    } catch (error) {
      console.warn('Failed to apply theme:', error);
    }
  }
}
