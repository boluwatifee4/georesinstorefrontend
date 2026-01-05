import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
  effect,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import {
  CommonModule,
  NgOptimizedImage,
  isPlatformBrowser,
} from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  throttleTime,
  map,
  filter as rxFilter,
} from 'rxjs/operators';
import { fromEvent, animationFrameScheduler, EMPTY } from 'rxjs';
import { CartStore } from '../../state/cart.store';
import { ThemeService } from '../../../../core/services/theme.service';
import { AssistantService } from '@foisit/angular-wrapper';
import { ProductsStore } from '../../state/products.store';
import { PublicProductsService } from '../../../../api/public/products/products.service';
import { PublicOrdersService } from '../../../../api/public/orders/orders.service';
import { PublicNotificationsService } from '../../../../api/public/notifications/notifications.service';

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './store-layout.component.html',
  styleUrls: ['./store-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartStore = inject(CartStore);
  private readonly assistant = inject(AssistantService);
  private readonly productsStore = inject(ProductsStore);
  private readonly productsService = inject(PublicProductsService);
  private readonly ordersService = inject(PublicOrdersService);
  private readonly notificationsService = inject(PublicNotificationsService);

  // UI State
  readonly scrolled = signal(false);
  readonly search = new FormControl('');

  // Cart state
  readonly cartItemCount = this.cartStore.itemCount;

  // Theme
  readonly theme = signal<'light' | 'dark' | 'system'>('light');
  readonly showThemeMenu = signal(false);
  private readonly themeService = inject(ThemeService);

  // GEO AI Banner
  readonly showGeoAIBanner = signal(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
    // Register Foisit commands
    this.registerFoisitCommands();
    // Check if GEO AI banner should show
    this.checkGeoAIBanner();
    // Setup double-tap gesture
    this.setupDoubleTap();
  }

  private checkGeoAIBanner(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const dismissed = localStorage.getItem('geoai-banner-dismissed');
    if (!dismissed) {
      // Show banner after 3 seconds
      setTimeout(() => {
        this.showGeoAIBanner.set(true);
      }, 3000);
    }
  }

  dismissGeoAIBanner(): void {
    this.showGeoAIBanner.set(false);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('geoai-banner-dismissed', 'true');
    }
  }

  setupDoubleTap(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let lastTap = 0;
    fromEvent(document, 'touchend')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
          this.openGeoAI();
        }
        lastTap = currentTime;
      });
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
  }
  private setupScrollDetection(): void {
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
        map((v) => (v || '').toString().trim()),
        debounceTime(600), // slower to strongly limit requests
        distinctUntilChanged(),
        // Allow empty (to clear) or 2+ chars to search
        rxFilter((v) => v.length === 0 || v.length >= 2),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((q) => {
        const navigatingTo = '/store/products';
        const onProducts = this.router.url.startsWith(navigatingTo);

        if (q.length > 0) {
          this.router.navigate([navigatingTo], {
            queryParams: { q, page: 1 }, // reset page when new search
            queryParamsHandling: 'merge',
          });
        } else if (onProducts) {
          this.router.navigate([navigatingTo], {
            queryParams: { q: null, page: 1 },
            queryParamsHandling: 'merge',
          });
        }
      });
  }

  private syncSearchFromUrl(): void {
    // Initial sync
    const initialTree = this.router.parseUrl(this.router.url);
    const initialQ =
      (initialTree.queryParams && initialTree.queryParams['q']) || '';
    if (initialQ !== this.search.value) {
      this.search.setValue(initialQ, { emitEvent: false });
    }

    this.router.events
      .pipe(
        rxFilter((e) => e instanceof NavigationEnd),
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
    this.showThemeMenu.update((show) => !show);
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
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
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

  openGeoAI(): void {
    this.assistant.toggle();
  }

  // Foisit AI Assistant Commands
  private registerFoisitCommands(): void {
    // Command 2: Product Search with Auto-Routing (Refined)
    this.assistant.addCommand({
      command: 'search product',
      // Fixed: Removed duplicate phrases in description
      description:
        'Search for products. Triggers: do you have, i need, i need to buy/order/get/purchase, show me, find {product name}',
      parameters: [{ name: 'query', type: 'string', required: true }],
      action: async (params: any) => {
        try {
          // LOGIC FIX: Handle empty queries strictly
          if (!params.query || params.query.trim().length < 2) {
            return {
              type: 'error',
              message: 'Could you please say the product name again clearly?',
            };
          }

          const results = await this.productsService
            .getProducts({ q: params.query, limit: 5 })
            .toPromise();

          const productList = results?.data || [];

          // 1. No Results: Upsell the Request Feature
          if (productList.length === 0) {
            return {
              type: 'confirm', // Changed to confirm to make it clickable
              message: `Sorry, we don't have "${params.query}" in stock right now.\n\nWould you like to place a special request for it?`,
              options: [
                {
                  label: `Yes, Request "${params.query}"`,
                  value: `request ${params.query}`,
                },
                { label: 'No, search again', value: 'search product' },
              ],
            };
          }

          // 2. Exact Match: Auto-Navigate
          if (productList.length === 1) {
            const product = productList[0];
            // Provide a delay so user sees "Found it!" before switching context
            setTimeout(() => {
              this.assistant.toggle();
              this.router.navigate(['/store/products', product.slug]);
            }, 1500);
            return `Found it! Opening ${product.title} (₦${product.basePrice})...`;
          }

          // 3. Multiple Results: Interactive List
          const list = productList
            .slice(0, 5)
            .map((p: any) => `• ${p.title} (₦${p.basePrice})`)
            .join('\n');

          return {
            type: 'confirm',
            message: `Found ${productList.length} products matching "${params.query}":\n\n${list}\n\nSelect a product to see full details:`,
            options: productList.map((p: any) => ({
              label: p.title,
              value: p.title, // Assuming you have a command to open via slug, or the assistant handles selection
              // Alternatively, if the assistant just echoes the value back into the mic:
              // value: p.title
            })),
          };
        } catch (error) {
          return {
            type: 'error',
            message:
              'I had trouble searching. Please check your connection and try again.',
          };
        }
      },
    });

    // Command 3: Product Request (Rich & Interactive)
    this.assistant.addCommand({
      command: 'request product',
      description: 'Request a product not in stock.',
      parameters: [
        { name: 'productName', type: 'string', required: true },
        { name: 'phone', type: 'string', required: true },
        { name: 'details', type: 'string', required: false },
      ],
      action: async (params: {
        productName: string;
        phone: string;
        details?: string;
      }) => {
        try {
          const message = [
            '🛍️ New Product Request',
            `Product: ${params.productName}`,
            `Phone: ${params.phone}`,
            `Details: ${params.details || 'N/A'}`,
            `Time: ${new Date().toLocaleString()}`,
          ].join('\n');

          await this.notificationsService.sendTelegram(message).toPromise();

          return {
            type: 'confirm',
            message:
              `✅ Request received!\n\n` +
              `We will text ${params.phone} about "${params.productName}" within 24 hours.`,
            options: [
              { label: 'Continue Shopping', value: 'search product' },
              { label: 'Track an Order', value: 'track order' },
            ],
          };
        } catch {
          return {
            type: 'error',
            message:
              "I couldn't send the request. Please try contacting support directly.",
          };
        }
      },
    });

    // Command 4: Order Tracking (Rich & Visual)
    this.assistant.addCommand({
      command: 'track order',
      description: 'Check order status. Prompts for code if missing.',
      parameters: [{ name: 'orderCode', type: 'string', required: true }],
      action: async (params: { orderCode: string }) => {
        try {
          const order = await this.ordersService
            .lookupOrder(params.orderCode)
            .toPromise();

          if (!order) {
            return {
              type: 'confirm', // needed for pills
              message: `I couldn't find an order with code "${params.orderCode}".`,
              options: [
                { label: 'Try Again', value: 'track order' },
                { label: 'Contact Support', value: 'customer support' },
              ],
            };
          }

          const statusIcon =
            order.status === 'CONFIRMED'
              ? '✅'
              : order.status === 'REJECTED'
              ? '❌'
              : '⏳';

          return {
            type: 'confirm',
            message:
              `${statusIcon} Order ${params.orderCode}\n\n` +
              `• Status: ${order.status.toUpperCase()}\n` +
              `• Total: ₦${order.total}\n` +
              `• Delivery: ${order.locationLabel || 'Standard'}\n` +
              `• Updated: ${new Date(order.updatedAt).toLocaleDateString()}`,
            options: [
              { label: 'View Full Details', value: `open order ${order.id}` },
              {
                label: 'Report Issue',
                value: `customer support issue with order ${params.orderCode}`,
              },
            ],
          };
        } catch (error) {
          return {
            type: 'error',
            message: 'Tracking service is temporarily unavailable.',
          };
        }
      },
    });

    // Command 5: Smart Customer Support (Knowledge Base + Escalation)
    this.assistant.addCommand({
      command: 'customer support',
      description: 'AI Knowledge base with seamless human handoff',
      parameters: [
        { name: 'question', type: 'string', required: true },
        { name: 'whatsapp', type: 'string', required: true },
      ],
      action: async (params: { question: string; whatsapp: string }) => {
        // 1. Defined Knowledge Base
        const kb: Record<string, string> = {
          shipping:
            '🚚 Shipping:\nWe deliver nationwide! ₦1,000 outside Ogbomoso, FREE within Ogbomoso.',
          payment:
            '💳 Payment:\nWe accept bank transfer. Please place your order first to receive account details.',
          return:
            '🔄 Returns:\nReturns are accepted within 7 days if the product is unopened.',
          'delivery time':
            '⏰ Time:\nDelivery takes 2-5 business days depending on your location.',
          wholesale:
            '🏢 Wholesale:\nFor bulk orders, please use the "Request Product" feature or contact WhatsApp.',
        };

        // 2. Search KB
        const question = params.question.toLowerCase();
        let answer: string | null = null;

        for (const [key, val] of Object.entries(kb)) {
          if (question.includes(key)) answer = val;
        }

        // 3. If Answer Found: Return it, but offer escalation in case it wasn't enough
        if (answer) {
          return {
            type: 'confirm',
            message: answer,
            options: [
              { label: 'Thanks, that helped', value: 'close' },
              {
                label: 'Still need help? (Talk to human)',
                value: `escalate ${params.question}`,
              },
            ],
          };
        }

        // 4. If No Answer: create escalation ticket (whatsapp is guaranteed present)
        try {
          const message = [
            '🆘 Support Ticket',
            '----------------',
            `❓ Question: ${params.question}`,
            `📱 WhatsApp: ${params.whatsapp}`,
            `⏰ Time: ${new Date().toLocaleString()}`,
          ].join('\n');

          await this.notificationsService.sendTelegram(message).toPromise();

          return `✅ Ticket Created!\n\nOur support team will message you at ${params.whatsapp} within 2 hours.`;
        } catch (error) {
          return {
            type: 'error',
            message:
              'Could not connect to support system. Please try again later.',
          };
        }
      },
    });
  }

  private isOgbomoso(location: string): boolean {
    return location.toLowerCase().includes('ogbomoso');
  }
}
