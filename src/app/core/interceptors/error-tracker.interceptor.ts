import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AssistantService } from '@foisit/angular-wrapper';

// State to track failures (resets on success or threshold)
let failureCount = 0;
const FAILURE_THRESHOLD = 2;
const TRACKED_URLS = ['/cart', '/checkout'];

export const errorTrackerInterceptor: HttpInterceptorFn = (req, next) => {
  const assistant = inject(AssistantService);

  // Check if URL is one we care about
  const isTracked = TRACKED_URLS.some((url) => req.url.includes(url));

  if (!isTracked) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error) => {
      failureCount++;

      if (failureCount >= FAILURE_THRESHOLD) {
        // Reset counter
        failureCount = 0;

        // Trigger Assistant
        // We use a small timeout to let the UI settle
        setTimeout(async () => {
          try {
            // 1. Open Assistant
            assistant.toggle();

            // 2. Wait for animation/render
            setTimeout(() => {
              // 3. Find input by placeholder (configured in app.config.ts)
              const input = document.querySelector(
                'input[placeholder="Hi! I\'m GEO AI. How can I help you today?"]'
              ) as HTMLInputElement;

              if (input) {
                // 4. Inject value
                input.value = 'the error you are facing so someone can help';

                // 5. Dispatch events to simulate user typing and entering
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));

                input.dispatchEvent(
                  new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    bubbles: true,
                  })
                );
              }
            }, 500); // 500ms delay for slide-in animation
          } catch (e) {
            console.error('Failed to trigger assistant error flow', e);
          }
        }, 1000);
      }

      return throwError(() => error);
    })
  );
};
