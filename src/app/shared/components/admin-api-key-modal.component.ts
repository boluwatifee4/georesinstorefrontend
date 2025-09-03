import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiKeyService } from '../../core/services/admin-api-key.service';

@Component({
  selector: 'app-admin-api-key-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Admin API Key Required</h2>
          <button
            class="close-btn"
            (click)="onClose()"
            type="button"
            aria-label="Close modal">
            ✕
          </button>
        </div>

        <div class="modal-body">
          <p>Enter your admin API key to access admin features.</p>
          <p class="expiry-info">The key will be stored securely and expire after 30 minutes.</p>

          <form (submit)="onSubmit($event)" class="api-key-form">
            <div class="form-group">
              <label for="apiKey">API Key:</label>
              <input
                type="password"
                id="apiKey"
                [value]="apiKey()"
                (input)="onApiKeyChange($event)"
                name="apiKey"
                class="form-control"
                placeholder="Enter your admin API key"
                [class.error]="showError()"
                required
                autocomplete="off">
              @if (showError()) {
                <div class="error-message">{{ errorMessage() }}</div>
              }
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="onClose()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="!apiKey().trim() || isSubmitting()">
                @if (isSubmitting()) {
                  <span class="loading-spinner"></span>
                  Setting...
                } @else {
                  Set API Key
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    .modal-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease;
    }

    .modal-header {
      display: flex;
      justify-content: between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
      flex: 1;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #666;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #f5f5f5;
      color: #333;
    }

    .modal-body {
      padding: 2rem;
    }

    .modal-body p {
      margin: 0 0 1rem 0;
      color: #666;
      line-height: 1.5;
    }

    .expiry-info {
      font-size: 0.9rem;
      color: #888;
    }

    .api-key-form {
      margin-top: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #4CAF50;
    }

    .form-control.error {
      border-color: #f44336;
    }

    .error-message {
      color: #f44336;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .btn-primary {
      background: #4CAF50;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #45a049;
    }

    .loading-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    input {
      color: #000000 !important;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class AdminApiKeyModalComponent {
  private readonly adminApiKeyService = inject(AdminApiKeyService);

  // Output events
  closed = output<void>();

  apiKey = signal('');
  isSubmitting = signal(false);
  errorMessage = signal('');

  showError = computed(() => this.errorMessage().length > 0);

  onApiKeyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.apiKey.set(target.value);
    // Clear error when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  onSubmit(event?: Event): void {
    // Prevent native form submission & page reload
    event?.preventDefault();
    event?.stopPropagation();
    const key = this.apiKey().trim();
    console.log('Submitting API key:', key);

    if (!key) {
      this.errorMessage.set('API key is required');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // Simulate a small delay to show loading state
    setTimeout(() => {
      console.log('Setting API key in service...');
      this.adminApiKeyService.setApiKey(key);
      console.log('API key set, checking validity:', this.adminApiKeyService.isApiKeyValid());
      this.isSubmitting.set(false);
      this.onClose();
    }, 300);
  }

  onClose(): void {
    // Emit close event to parent component
    this.closed.emit();
  }

  onBackdropClick(event: Event): void {
    // Close modal when clicking backdrop
    this.onClose();
  }
}
