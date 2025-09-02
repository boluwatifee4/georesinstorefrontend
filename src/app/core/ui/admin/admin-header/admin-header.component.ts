import { Component, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBell, lucideSettings, lucideUser, lucideSun, lucideMoon, lucideMonitor,
  lucideLogOut, lucideMenu, lucideX, lucideChevronDown, lucideCheck
} from '@ng-icons/lucide';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconComponent],
  providers: [provideIcons({
    lucideBell, lucideSettings, lucideUser, lucideSun, lucideMoon, lucideMonitor,
    lucideLogOut, lucideMenu, lucideX, lucideChevronDown, lucideCheck
  })],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent {
  private themeService = inject(ThemeService);

  // Output events for parent component
  sidebarToggle = output<boolean>();

  // Reactive state using signals
  currentTheme = signal(this.themeService.get());
  isUserMenuOpen = signal(false);
  isThemeMenuOpen = signal(false);
  showNotifications = signal(false);
  isSidebarOpen = signal(false);

  // Theme options
  themeOptions = [
    { value: 'light', label: 'Light', icon: 'lucideSun' },
    { value: 'dark', label: 'Dark', icon: 'lucideMoon' },
    { value: 'system', label: 'System', icon: 'lucideMonitor' }
  ] as const;

  // Mock notifications (replace with actual notification service)
  notifications = signal([
    {
      id: '1',
      title: 'New Order',
      message: 'Order #1001 has been placed',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: '2',
      title: 'Low Stock Alert',
      message: 'Epoxy Resin 500ml is running low',
      time: '1 hour ago',
      unread: true
    },
    {
      id: '3',
      title: 'Payment Received',
      message: 'Payment confirmed for Order #1000',
      time: '3 hours ago',
      unread: false
    }
  ]);

  // Get unread notification count
  get unreadCount() {
    return this.notifications().filter(n => n.unread).length;
  }

  toggleSidebar() {
    this.isSidebarOpen.update(open => !open);
    this.sidebarToggle.emit(this.isSidebarOpen());
    this.closeMenus();
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update(open => !open);
    // Close other menus when user menu opens
    if (this.isUserMenuOpen()) {
      this.isThemeMenuOpen.set(false);
      this.showNotifications.set(false);
    }
  }

  toggleThemeMenu() {
    this.isThemeMenuOpen.update(open => !open);
    // Close other menus when theme menu opens
    if (this.isThemeMenuOpen()) {
      this.isUserMenuOpen.set(false);
      this.showNotifications.set(false);
    }
  }

  toggleNotifications() {
    this.showNotifications.update(show => !show);
    // Close other menus when notifications open
    if (this.showNotifications()) {
      this.isUserMenuOpen.set(false);
      this.isThemeMenuOpen.set(false);
    }
  }

  selectTheme(theme: 'light' | 'dark' | 'system') {
    this.themeService.set(theme);
    this.currentTheme.set(theme);
    this.isThemeMenuOpen.set(false);
  }

  markNotificationRead(id: string) {
    this.notifications.update(notifications =>
      notifications.map(notif =>
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  }

  logout() {
    // Implement logout logic here
    console.log('Logging out...');
    // For example: this.authService.logout();
    // then navigate to login page
  }

  closeMenus() {
    this.isUserMenuOpen.set(false);
    this.isThemeMenuOpen.set(false);
    this.showNotifications.set(false);
  }
}
