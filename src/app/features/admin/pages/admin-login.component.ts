import { Component, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminApiKeyService } from '../../../core/services/admin-api-key.service';
import { AdminApiKeyModalComponent } from '../../../shared/components/admin-api-key-modal.component';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, AdminApiKeyModalComponent],
  template: `
    <div class="admin-login-container">
      <div class="background-overlay"></div>

      <div class="content">
        <div class="header">
          <h1>Admin Access</h1>
          <p>Enter your API key to access admin features</p>
        </div>

        @if (showModal()) {
          <app-admin-api-key-modal
            (closed)="onModalClose()">
          </app-admin-api-key-modal>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-login-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }

    .background-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
    }

    .content {
      position: relative;
      z-index: 1000;
      text-align: center;
      color: white;
    }

    .header h1 {
      font-size: 3rem;
      margin: 0 0 1rem 0;
      font-weight: 300;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  `]
})
export class AdminLoginComponent implements OnInit {
  private readonly adminApiKeyService = inject(AdminApiKeyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  showModal = signal(true);

  ngOnInit(): void {
    // If apiKey provided via query param, set it and clean URL
    if (isPlatformBrowser(this.platformId)) {
      const qpKey = this.route.snapshot.queryParamMap.get('apiKey');
      if (qpKey && qpKey.trim()) {
        this.adminApiKeyService.setApiKey(qpKey.trim());
        // Replace URL to remove apiKey param without reloading
        this.router.navigate([], { queryParams: { apiKey: null }, queryParamsHandling: 'merge', replaceUrl: true });
        // Proceed to redirect
        this.showModal.set(false);
        this.redirectToIntendedRoute();
        return;
      }
    }

    // If user already has a valid API key, redirect them
    if (this.adminApiKeyService.isApiKeyValid()) {
      this.redirectToIntendedRoute();
    }
  }

  onModalClose(): void {
    // console.log('Modal closed, checking API key validity...');
    // console.log('API key:', this.adminApiKeyService.getApiKey());
    // console.log('Is valid:', this.adminApiKeyService.isApiKeyValid());

    // Check if API key was set successfully
    if (this.adminApiKeyService.isApiKeyValid()) {
      // console.log('API key is valid, hiding modal and redirecting...');
      this.showModal.set(false);
      this.redirectToIntendedRoute();
    } else {
      // console.log('API key is not valid, redirecting to store...');
      // If no valid API key, redirect to store
      this.router.navigate(['/store']);
    }
  }

  private redirectToIntendedRoute(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.router.navigate(['/admin']);
      return;
    }

    const intendedRoute = sessionStorage.getItem('admin-intended-route');
    sessionStorage.removeItem('admin-intended-route');

    if (intendedRoute && intendedRoute.startsWith('/admin')) {
      this.router.navigate([intendedRoute]);
    } else {
      this.router.navigate(['/admin']);
    }
  }
}
