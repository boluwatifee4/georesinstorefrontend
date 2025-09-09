# Scroll Management

This project includes automatic scroll-to-top functionality when navigating between routes, plus a comprehensive ScrollService for custom scroll behavior.

## Automatic Scroll-to-Top

**Router Configuration:**

- Configured in `app.config.ts` with `withInMemoryScrolling()`
- `scrollPositionRestoration: 'top'` - Always scroll to top on route changes
- `anchorScrolling: 'enabled'` - Support for anchor links (e.g., `#section`)

**ScrollService:**

- Automatically listens to route changes and scrolls to top
- Initialized in `app.component.ts`
- Works across all route changes

## Manual Scroll Control

### Using ScrollService in Components

```typescript
import { ScrollService } from "@core/services/scroll.service";

export class MyComponent {
  private scrollService = inject(ScrollService);

  // Scroll to top
  scrollToTop() {
    this.scrollService.scrollToTop();
  }

  // Scroll to element
  scrollToSection() {
    this.scrollService.scrollToElement("my-section");
  }

  // Scroll to position
  scrollToPosition() {
    this.scrollService.scrollToPosition(500);
  }

  // Get current scroll position
  getCurrentPosition() {
    const position = this.scrollService.getScrollPosition();
    console.log(`Scrolled to: ${position.top}px`);
  }

  // Check if scrolled past threshold
  checkScroll() {
    const hasScrolled = this.scrollService.hasScrolledPast(100);
    console.log("Has scrolled past 100px:", hasScrolled);
  }
}
```

### Scroll Behaviors

- `'smooth'` - Smooth scrolling animation (default)
- `'instant'` - Immediate scroll without animation
- `'auto'` - Browser default behavior

### Common Use Cases

1. **Back to Top Button:**

```typescript
onBackToTop() {
  this.scrollService.scrollToTop('smooth');
}
```

2. **Navigate to Section:**

```typescript
onGoToSection(sectionId: string) {
  this.scrollService.scrollToElement(sectionId);
}
```

3. **Form Submission Scroll:**

```typescript
onFormSubmit() {
  // Submit form logic...
  this.scrollService.scrollToTop('instant');
}
```

## Browser Compatibility

- Uses `window.scrollTo()` with behavior options
- Falls back gracefully on older browsers
- SSR-safe with platform checks

## Notes

- All scroll methods are SSR-safe and include platform checks
- The service automatically handles route changes
- Individual components can override scroll behavior as needed
- Scroll detection is already implemented in layout components for header styling
