import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { isBrowser } from '../utils/platform.util';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  constructor() {
    if (isBrowser()) {
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => this.scrollToTop());
    }
  }

  /**
   * Scroll to the top of the page smoothly
   */
  scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
    if (isBrowser()) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior
      });
    }
  }

  /**
   * Scroll to a specific element by ID
   */
  scrollToElement(elementId: string, behavior: ScrollBehavior = 'smooth'): void {
    if (isBrowser()) {
      const element = document.getElementById(elementId);
      element?.scrollIntoView({
        behavior,
        block: 'start',
        inline: 'nearest'
      });
    }
  }

  /**
   * Scroll to a specific position
   */
  scrollToPosition(top: number, left: number = 0, behavior: ScrollBehavior = 'smooth'): void {
    if (isBrowser()) {
      window.scrollTo({
        top,
        left,
        behavior
      });
    }
  }

  /**
   * Get current scroll position
   */
  getScrollPosition(): { top: number; left: number } {
    if (isBrowser()) {
      return {
        top: window.pageYOffset || document.documentElement.scrollTop,
        left: window.pageXOffset || document.documentElement.scrollLeft
      };
    }
    return { top: 0, left: 0 };
  }

  /**
   * Check if user has scrolled past a certain threshold
   */
  hasScrolledPast(threshold: number): boolean {
    return isBrowser() ? window.pageYOffset > threshold : false;
  }
}
