# Cache Disabling Implementation

This document outlines the changes made to disable caching and ensure users always receive the latest data.

## Changes Made

### 1. Server-Side Changes (`src/server.ts`)

- **API Route Cache Headers**: Added middleware to disable caching for all `/api/*` routes
- **SSR Response Headers**: Added no-cache headers to Angular SSR rendered pages
- **Static File Headers**: Updated static file serving to add no-cache headers for HTML files

```typescript
// Middleware to disable caching for all API routes
app.use("/api/*", (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Last-Modified", new Date().toUTCString());
  next();
});
```

### 2. HTTP Interceptor (`src/app/core/interceptors/no-cache.interceptor.ts`)

- **New Interceptor**: Created `noCacheInterceptor` that adds no-cache headers to ALL HTTP requests
- **Prevents Browser Caching**: Ensures browsers don't cache API responses

### 3. Application Configuration (`src/app/app.config.ts`)

- **HTTP Transfer Cache Disabled**: Completely removed HTTP transfer cache to prevent SSR caching
- **No-Cache Interceptor**: Added the new interceptor to the HTTP client configuration

### 4. API HTTP Service (`src/app/core/http/api-http.service.ts`)

- **Cache-Busting Parameters**: Added timestamp-based cache busting to GET requests
- **Fresh Data Guarantee**: Both public and admin endpoints now include `_t={timestamp}` parameter

### 5. Cache Management Service (`src/app/core/services/cache.service.ts`)

- **New Utility Service**: Created `CacheService` for programmatic cache management
- **Browser Cache Clearing**: Methods to clear localStorage, sessionStorage, and service workers
- **Force Refresh**: Utility methods for cache busting

## How It Works

1. **Server Level**: All API routes and dynamic content receive no-cache headers
2. **HTTP Client Level**: All outgoing requests include no-cache headers and timestamp parameters
3. **Browser Level**: Multiple layers prevent browser caching of API responses
4. **CDN/Proxy Level**: Headers ensure intermediary caches don't store responses

## Cache-Busting Strategies

### Timestamp Parameters

```typescript
// Automatically added to GET requests
const url = "/api/products?_t=1698765432123";
```

### HTTP Headers

```typescript
'Cache-Control': 'no-cache, no-store, must-revalidate'
'Pragma': 'no-cache'
'Expires': '0'
```

### Service Usage

```typescript
// Inject the cache service
constructor(private cacheService: CacheService) {}

// Clear all browser cache
this.cacheService.clearBrowserCache();

// Force page refresh
this.cacheService.forceRefresh();
```

## Testing Cache Disabling

1. **Network Tab**: Check browser dev tools - should see `_t=` parameters on requests
2. **Response Headers**: Verify no-cache headers are present
3. **Data Updates**: Changes on server should immediately reflect in client
4. **Hard Refresh**: Ctrl+F5 should show same data as normal refresh

## Important Notes

- **Performance Impact**: Disabling cache may increase server load and response times
- **Mobile Data**: Users on limited data plans will use more bandwidth
- **CDN Considerations**: If using a CDN, configure it to respect cache-control headers
- **Monitoring**: Monitor server performance after deployment

## Rollback Plan

If caching needs to be re-enabled:

1. Remove `noCacheInterceptor` from app.config.ts
2. Remove cache-busting parameters from ApiHttpService
3. Re-enable HTTP transfer cache in app.config.ts
4. Remove no-cache middleware from server.ts

Foisit AI Assistant Implementation Plan
Goal
Integrate @foisit/angular-wrapper to provide WhatsApp-style conversational interface for checkout, product discovery, and customer support, targeting tech-challenged resin artists.

Selected Commands (5 Total)
✅ 1. Conversational Checkout
User says: "I want to order" or "Checkout"
Flow: Name → Phone → Location → Confirm → Order placed
Impact: Replaces 7-field form with 3-message chat

✅ 2. Product Search with Auto-Routing
User says: "Do you have UV resin?" or "Show me epoxy"
Flow: Search products → If found, route to detail page
Impact: Natural product discovery (no manual search bar needed)

✅ 3. Product Request
User says: "I need deep pour resin" (not in stock)
Flow: Collect phone + request details → Send to Telegram
Impact: Replaces product request form

✅ 4. Order Tracking
User says: "Track my order ABC123"
Flow: Lookup order → Show status
Impact: Self-service order status (reduces support calls)

✅ 5. Customer Support with Escalation
User says: "How do I use resin?" or "My order is wrong"
Flow: Answer from knowledge base → If can't answer, collect WhatsApp → Escalate to support
Impact: 24/7 basic support + smart escalation

Implementation Details
Command 1: Conversational Checkout
{
command: 'checkout',
description: 'Complete your order by chatting with me',
collectRequiredViaForm: false,
allowAiParamExtraction: true,
parameters: [
{ name: 'name', type: 'string', required: true },
{ name: 'phone', type: 'string', required: true },
{ name: 'location', type: 'string', required: true }
],
action: async (params) => {
// Validate cart not empty
if (this.cartStore.itemCount() === 0) {
return {
type: 'error',
message: 'Your cart is empty. Add products first!'
};
}
// Auto-fill checkout form
this.checkoutForm.patchValue({
buyerName: params.name,
phone: params.phone,
locationLabel: params.location,
withinOgbomoso: this.isOgbomoso(params.location),
whatsapp: params.phone
});

    this.acknowledgeDelivery.set(true);

    // Calculate total
    const deliveryFee = this.isOgbomoso(params.location) ? 0 : 1000;
    const total = this.cartStore.subtotal() + deliveryFee;

    // Navigate to checkout page (don't auto-submit, let user review)
    this.router.navigate(['/store/checkout']);

    return `✅ Ready to checkout!\n\nTotal: ₦${total.toLocaleString()}\nDelivery: ${params.location} (₦${deliveryFee})\n\nReview your order and click "Declare Payment" to complete.`;

}
}
Integration Points:

CheckoutComponent.checkoutForm
CartStore.subtotal()
Router navigation
Command 2: Product Search with Auto-Routing
{
command: 'search product',
description: 'Search for products and navigate to details',
parameters: [
{ name: 'query', type: 'string', required: true }
],
action: async (params) => {
// Search products using existing service
const results = await this.productsService.getProducts({
q: params.query,
limit: 5
}).toPromise();

    if (!results || results.length === 0) {
      return {
        type: 'error',
        message: `Sorry, we don't have "${params.query}" in stock right now. Would you like to request it? Just say "request ${params.query}"`
      };
    }

    // If single result, auto-navigate
    if (results.length === 1) {
      const product = results[0];
      this.router.navigate(['/store/products', product.slug]);
      return `Yes! We have ${product.title} (₦${product.basePrice}). Opening product page...`;
    }

    // Multiple results - show list
    const list = results.map((p, i) =>
      `${i + 1}. ${p.title} - ₦${p.basePrice}`
    ).join('\n');

    return `Found ${results.length} products:\n\n${list}\n\nSay the product name to view details.`;

}
}
Integration Points:

PublicProductsService.getProducts()
Router navigation to product detail
Command 3: Product Request
{
command: 'request product',
description: 'Request a product not currently in stock',
parameters: [
{ name: 'productName', type: 'string', required: true },
{ name: 'phone', type: 'string', required: true },
{ name: 'details', type: 'string', required: false }
],
action: async (params) => {
// Send to Telegram
const message = [
'🛍️ Product Request',
'',
`• Product: ${params.productName}`,
`• Phone: ${params.phone}`,
`• Details: ${params.details || 'None provided'}`,
`• Time: ${new Date().toLocaleString()}`,
'',
'Action: Contact customer about product availability.'
].join('\n');

    await this.notificationsService.sendTelegram(message).toPromise();

    return `✅ Request submitted!\n\nWe'll contact you at ${params.phone} about "${params.productName}" availability within 24 hours.`;

}
}
Integration Points:

PublicNotificationsService.sendTelegram()
Command 4: Order Tracking
{
command: 'track order',
description: 'Check your order status using order code',
parameters: [
{ name: 'orderCode', type: 'string', required: true }
],
action: async (params) => {
try {
const order = await this.ordersService.lookupOrder(params.orderCode).toPromise();

      if (!order) {
        return {
          type: 'error',
          message: `Order "${params.orderCode}" not found. Please check the code and try again.`
        };
      }

      return `📦 Order ${params.orderCode}\n\nStatus: ${order.status}\nTotal: ₦${order.total}\nDelivery: ${order.locationLabel || 'Not specified'}\n\nNeed help? Say "support" to contact us.`;
    } catch (error) {
      return {
        type: 'error',
        message: 'Unable to track order. Please contact support with your order code.'
      };
    }

}
}
Integration Points:

PublicOrdersService.lookupOrder()
Command 5: Customer Support with Escalation
{
command: 'customer support',
description: 'Get help from our knowledge base or escalate to human support',
parameters: [
{ name: 'question', type: 'string', required: true },
{ name: 'whatsapp', type: 'string', required: false }
],
action: async (params) => {
// Knowledge base (simple keyword matching)
const kb = {
'shipping': 'We deliver nationwide! ₦1,000 outside Ogbomoso, FREE within Ogbomoso.',
'payment': 'We accept bank transfer. Order first, then we send payment details.',
'return': 'Returns accepted within 7 days if product is unopened.',
'delivery time': 'Delivery takes 2-5 business days depending on location.',
'how to use': 'Each product has usage instructions. Check the product description or YouTube tutorials.',
'wholesale': 'For bulk orders, contact us via WhatsApp for special pricing.'
};

    // Check if question matches knowledge base
    const question = params.question.toLowerCase();
    for (const [key, answer] of Object.entries(kb)) {
      if (question.includes(key)) {
        return `${answer}\n\nNeed more help? Say "escalate" with your WhatsApp number.`;
      }
    }

    // Can't answer - escalate
    if (!params.whatsapp) {
      return {
        type: 'form',
        message: 'I don\'t have an answer for that. Let me connect you with our team. What\'s your WhatsApp number?',
        fields: [
          { name: 'whatsapp', type: 'string', required: true }
        ]
      };
    }

    // Send escalation to Telegram
    const message = [
      '🆘 Support Escalation',
      '',
      `• Question: ${params.question}`,
      `• WhatsApp: ${params.whatsapp}`,
      `• Time: ${new Date().toLocaleString()}`,
      '',
      'Action: Contact customer via WhatsApp.'
    ].join('\n');

    await this.notificationsService.sendTelegram(message).toPromise();

    return `✅ Support ticket created!\n\nOur team will contact you on WhatsApp (${params.whatsapp}) within 2 hours.`;

}
}
Integration Points:

PublicNotificationsService.sendTelegram()
Knowledge base (can be expanded to database later)
Configuration
AssistantModule Setup
// app.config.ts
importProvidersFrom(
AssistantModule.forRoot({
introMessage: 'Hi! I\'m your Geo Resin Store assistant. How can I help you today?',
enableSmartIntent: true,
inputPlaceholder: 'Type your message...',
floatingButton: {
visible: true,
tooltip: 'Chat with us',
position: { bottom: '30px', right: '30px' }
},
commands: [
// Commands will be registered dynamically in StoreLayoutComponent
]
})
)
Dynamic Command Registration
// store-layout.component.ts
export class StoreLayoutComponent implements OnInit {
private readonly assistant = inject(AssistantService);

ngOnInit() {
this.registerCommands();
}

private registerCommands() {
// Register all 5 commands here
this.assistant.addCommand({ /_ checkout command _/ });
this.assistant.addCommand({ /_ search command _/ });
this.assistant.addCommand({ /_ request command _/ });
this.assistant.addCommand({ /_ track command _/ });
this.assistant.addCommand({ /_ support command _/ });
}
}
Verification Plan
Manual Testing
Checkout Flow

Add items to cart
Say "checkout"
Verify conversational flow
Confirm order placement
Product Search

Say "do you have UV resin"
Verify auto-navigation to product
Test with non-existent product
Product Request

Say "request deep pour resin"
Verify Telegram notification received
Check message format
Order Tracking

Place test order
Say "track order [CODE]"
Verify order details displayed
Customer Support

Ask "how much is shipping"
Verify knowledge base response
Ask unknown question
Verify WhatsApp escalation
Browser Testing
Test on mobile (primary user device)
Test voice input when available
Test with pidgin/broken English inputs
Timeline
Day 1-2: Install @foisit/angular-wrapper + basic setup
Day 3-4: Implement Commands 1-3 (checkout, search, request)
Day 5: Implement Commands 4-5 (tracking, support)
Day 6: Testing + refinement
Day 7: Deploy to production
Success Metrics
Metric Target
Checkout completion rate 70%+
Support escalations <10/day
Product search usage 30%+ of sessions
User satisfaction 4.5+/5
