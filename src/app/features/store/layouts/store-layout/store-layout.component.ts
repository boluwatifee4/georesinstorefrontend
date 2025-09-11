import { ChangeDetectionStrategy, Component, OnInit, inject, signal, DestroyRef, effect, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, throttleTime, map, filter as rxFilter } from 'rxjs/operators';
import { fromEvent, animationFrameScheduler, EMPTY } from 'rxjs';
import { CartStore } from '../../state/cart.store';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './store-layout.component.html',
  styleUrls: ['./store-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartStore = inject(CartStore);

  // UI State
  readonly scrolled = signal(false);
  readonly search = new FormControl('');

  // Cart state
  readonly cartItemCount = this.cartStore.itemCount;

  // Theme
  readonly theme = signal<'light' | 'dark' | 'system'>('light');
  readonly showThemeMenu = signal(false);
  private readonly themeService = inject(ThemeService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.setupScrollDetection();
    this.setupSearchHandling();
    this.syncSearchFromUrl();
    this.cartStore.initializeCart();
    this.setupClickOutside();
    // Initialize theme
    const current = this.themeService.get();
    this.theme.set(current);
    this.themeService.init();
  }

  private setupClickOutside(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    fromEvent(document, 'click')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.showThemeMenu()) {
          this.closeThemeMenu();
        }
      });
  } private setupScrollDetection(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip scroll detection on server
    }

    fromEvent(window, 'scroll', { passive: true })
      .pipe(
        throttleTime(16, animationFrameScheduler), // ~60fps
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.scrolled.set(window.scrollY > 50);
      });
  }

  private setupSearchHandling(): void {
    this.search.valueChanges
      .pipe(
        map(v => (v || '').toString().trim()),
        debounceTime(600), // slower to strongly limit requests
        distinctUntilChanged(),
        // Allow empty (to clear) or 2+ chars to search
        rxFilter(v => v.length === 0 || v.length >= 2),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(q => {
        const navigatingTo = '/store/products';
        const onProducts = this.router.url.startsWith(navigatingTo);

        if (q.length > 0) {
          this.router.navigate([navigatingTo], {
            queryParams: { q, page: 1 }, // reset page when new search
            queryParamsHandling: 'merge'
          });
        } else if (onProducts) {
          this.router.navigate([navigatingTo], {
            queryParams: { q: null, page: 1 },
            queryParamsHandling: 'merge'
          });
        }
      });
  }

  private syncSearchFromUrl(): void {
    // Initial sync
    const initialTree = this.router.parseUrl(this.router.url);
    const initialQ = (initialTree.queryParams && initialTree.queryParams['q']) || '';
    if (initialQ !== this.search.value) {
      this.search.setValue(initialQ, { emitEvent: false });
    }

    this.router.events
      .pipe(
        rxFilter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e: any) => {
        const tree = this.router.parseUrl(e.urlAfterRedirects || e.url || '');
        const q = (tree.queryParams && tree.queryParams['q']) || '';
        if (q !== (this.search.value || '')) {
          this.search.setValue(q, { emitEvent: false });
        }
      });
  }

  // Navigation methods
  goToHome(): void {
    this.router.navigate(['/store']);
  }

  goToProducts(): void {
    this.router.navigate(['/store/products']);
  }

  goToCart(): void {
    this.router.navigate(['/store/cart']);
  }

  // Theme controls
  toggleThemeMenu(): void {
    this.showThemeMenu.update(show => !show);
  }

  closeThemeMenu(): void {
    this.showThemeMenu.set(false);
  }

  setTheme(t: 'light' | 'dark' | 'system') {
    this.theme.set(t);
    this.themeService.set(t);
    this.closeThemeMenu();
  }

  getThemeIcon(): string {
    // Deprecated: UI now uses SVGs directly in template based on theme()
    return '';
  }

  getThemeLabel(): string {
    const t = this.theme();
    switch (t) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Light';
    }
  }

  onLogoClick(event: Event) {
    event.preventDefault();
    // Clear search state & param to ensure unfiltered home
    if (this.search.value) {
      this.search.setValue('', { emitEvent: false });
    }
    this.router.navigate(['/store'], { queryParams: {} });
  }
}
