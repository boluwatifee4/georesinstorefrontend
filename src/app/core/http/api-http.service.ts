import { inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ADMIN_API_BASE_URL, BASE_API_URL } from '../../config/tokens/api.tokens';

export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  context?: HttpContext;
}

/**
 * HTTP wrapper that automatically uses the correct base URL for public vs admin calls.
 * Uses HttpClient with transfer cache for SSR compatibility.
 */
@Injectable({ providedIn: 'root' })
export class ApiHttpService {
  private readonly http = inject(HttpClient);
  private readonly baseApiUrl = this.safeInject(BASE_API_URL, 'https://georesinstore-api.onrender.com');
  private readonly adminApiUrl = this.safeInject(ADMIN_API_BASE_URL, this.baseApiUrl);

  private safeInject<T>(token: any, fallback: T): T {
    try {
      return inject(token) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * GET request for public endpoints
   */
  public get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    // Add cache-busting timestamp for GET requests to ensure fresh data
    const cacheBustingOptions = this.addCacheBusting(options);
    return this.http.get<T>(this.buildUrl(endpoint, false), this.buildHttpOptions(cacheBustingOptions));
  }

  /**
   * POST request for public endpoints
   */
  public post<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint, false), body, this.buildHttpOptions(options));
  }

  /**
   * PATCH request for public endpoints
   */
  public patch<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint, false), body, this.buildHttpOptions(options));
  }

  /**
   * DELETE request for public endpoints
   */
  public delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint, false), this.buildHttpOptions(options));
  }

  /**
   * GET request for admin endpoints (auto-adds auth header via interceptor)
   */
  public adminGet<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    // Do NOT add cache-busting params for admin endpoints - some admin APIs do not expect unknown query params
    return this.http.get<T>(this.buildUrl(endpoint, true), this.buildHttpOptions(options));
  }

  /**
   * POST request for admin endpoints (auto-adds auth header via interceptor)
   */
  public adminPost<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint, true), body, this.buildHttpOptions(options));
  }

  /**
   * PATCH request for admin endpoints (auto-adds auth header via interceptor)
   */
  public adminPatch<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint, true), body, this.buildHttpOptions(options));
  }

  /**
   * DELETE request for admin endpoints (auto-adds auth header via interceptor)
   */
  public adminDelete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint, true), this.buildHttpOptions(options));
  }

  private buildUrl(endpoint: string, isAdmin: boolean): string {
    const baseUrl = isAdmin ? this.adminApiUrl : this.baseApiUrl;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
  }

  private buildHttpOptions(options?: ApiRequestOptions): {
    params?: HttpParams;
    headers?: Record<string, string>;
    context?: HttpContext;
  } {
    const httpOptions: {
      params?: HttpParams;
      headers?: Record<string, string>;
      context?: HttpContext;
    } = {};

    if (options?.params) {
      let params = new HttpParams();
      Object.entries(options.params).forEach(([key, value]) => {
        params = params.set(key, String(value));
      });
      httpOptions.params = params;
    }

    if (options?.headers) {
      httpOptions.headers = options.headers;
    }

    if (options?.context) {
      httpOptions.context = options.context;
    }

    return httpOptions;
  }

  /**
   * Adds cache-busting timestamp to GET requests to prevent stale data
   */
  private addCacheBusting(options?: ApiRequestOptions): ApiRequestOptions {
    const cacheBustingParam = { _t: Date.now().toString() };

    if (!options) {
      return { params: cacheBustingParam };
    }

    return {
      ...options,
      params: {
        ...options.params,
        ...cacheBustingParam
      }
    };
  }
}
