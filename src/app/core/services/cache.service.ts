import { Injectable } from '@angular/core';

/**
 * Service to help manage client-side caching and ensure fresh data
 */
@Injectable({ providedIn: 'root' })
export class CacheService {

  /**
   * Clears browser cache programmatically (limited to what's possible)
   */
  public clearBrowserCache(): void {
    // Clear sessionStorage and localStorage
    sessionStorage.clear();
    localStorage.clear();

    // Force reload from server
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  }

  /**
   * Gets a cache-busting timestamp
   */
  public getCacheBustingParam(): string {
    return `_t=${Date.now()}`;
  }

  /**
   * Adds cache-busting parameter to URL
   */
  public addCacheBustingToUrl(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${this.getCacheBustingParam()}`;
  }

  /**
   * Forces a hard refresh of the page
   */
  public forceRefresh(): void {
    location.reload();
  }
}
