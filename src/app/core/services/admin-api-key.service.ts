import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AdminApiKeyData {
  key: string;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiKeyService {
  private readonly STORAGE_KEY = 'changeme-dev-key';
  private readonly EXPIRY_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly platformId = inject(PLATFORM_ID);

  private apiKeySignal = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
      this.startExpiryCheck();
    }
  }

  /**
   * Get the current API key
   */
  getApiKey(): string | null {
    return this.apiKeySignal();
  }

  /**
   * Set a new API key with expiry
   */
  setApiKey(key: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const expiresAt = Date.now() + this.EXPIRY_DURATION;
    const data: AdminApiKeyData = { key, expiresAt };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    this.apiKeySignal.set(key);
  }

  /**
   * Clear the API key
   */
  clearApiKey(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.apiKeySignal.set(null);
  }

  /**
   * Check if API key exists and is valid
   */
  isApiKeyValid(): boolean {
    const key = this.getApiKey();
    return key !== null && key.trim() !== '';
  }

  /**
   * Get API key signal for reactive updates
   */
  getApiKeySignal() {
    return this.apiKeySignal.asReadonly();
  }

  /**
   * Load API key from storage and check expiry
   */
  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.apiKeySignal.set(null);
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        this.apiKeySignal.set(null);
        return;
      }

      const data: AdminApiKeyData = JSON.parse(stored);

      // Check if expired
      if (Date.now() > data.expiresAt) {
        this.clearApiKey();
        return;
      }

      this.apiKeySignal.set(data.key);
    } catch (error) {
      console.error('Failed to load admin API key from storage:', error);
      this.clearApiKey();
    }
  }

  /**
   * Start periodic expiry check
   */
  private startExpiryCheck(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setInterval(() => {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      try {
        const data: AdminApiKeyData = JSON.parse(stored);
        if (Date.now() > data.expiresAt) {
          this.clearApiKey();
        }
      } catch (error) {
        console.error('Error checking API key expiry:', error);
        this.clearApiKey();
      }
    }, 60000); // Check every minute
  }

  /**
   * Get remaining time until expiry in minutes
   */
  getRemainingTime(): number {
    if (!isPlatformBrowser(this.platformId)) {
      return 0;
    }

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return 0;

    try {
      const data: AdminApiKeyData = JSON.parse(stored);
      const remaining = data.expiresAt - Date.now();
      return Math.max(0, Math.ceil(remaining / 60000)); // Convert to minutes
    } catch {
      return 0;
    }
  }
}
