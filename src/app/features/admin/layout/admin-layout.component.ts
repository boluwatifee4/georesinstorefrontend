import { Component, signal, inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AdminHeaderComponent } from '../../../core/ui/admin/admin-header/admin-header.component';
import { AdminSidebarComponent } from '../../../core/ui/admin/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AdminHeaderComponent,
    AdminSidebarComponent
  ],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Admin Sidebar -->
      <app-admin-sidebar
        [mobileOpen]="isSidebarOpen()"
        (menuItemClicked)="onMenuItemClicked()"
      />

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Admin Header -->
        <div class="flex-shrink-0">
          <app-admin-header
            (sidebarToggle)="onSidebarToggle($event)"
          />
        </div>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto px-3 md:px-10 py-3">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile Sidebar Overlay -->
      @if (isSidebarOpen() && isMobile()) {
        <div
          class="fixed inset-0 bg-black/50 z-30 lg:hidden"
          (click)="closeSidebar()"
        ></div>
      }
    </div>
  `,
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);

  // Sidebar state
  private _isSidebarOpen = signal(false);
  private _isMobile = signal(false);

  // Public signals
  isSidebarOpen = this._isSidebarOpen.asReadonly();
  isMobile = this._isMobile.asReadonly();

  private resizeListener?: () => void;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobile();
      this.setupResizeListener();

      // Set initial sidebar state based on screen size
      if (window.innerWidth >= 1024) {
        this._isSidebarOpen.set(true);
      }
    }
  }

  ngOnDestroy() {
    if (this.resizeListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private setupResizeListener() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.resizeListener = () => {
      this.checkMobile();

      // Auto-close sidebar on mobile, auto-open on desktop
      if (window.innerWidth >= 1024) {
        this._isSidebarOpen.set(true);
      } else {
        this._isSidebarOpen.set(false);
      }
    };

    window.addEventListener('resize', this.resizeListener);
  }

  private checkMobile() {
    if (isPlatformBrowser(this.platformId)) {
      this._isMobile.set(window.innerWidth < 1024);
    }
  }

  toggleSidebar() {
    this._isSidebarOpen.update(open => !open);
  }

  onSidebarToggle(isOpen: boolean) {
    this._isSidebarOpen.set(isOpen);
  }

  closeSidebar() {
    this._isSidebarOpen.set(false);
  }

  onMenuItemClicked() {
    // Close sidebar on mobile when a menu item is clicked
    if (this.isMobile()) {
      this.closeSidebar();
    }
  }
}
