import { Component, signal, computed, inject, PLATFORM_ID, input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucidePackage,
  lucideFolderOpen,
  lucideShoppingCart,
  lucideTruck,
  lucideUsers,
  lucideSettings,
  lucideActivity,
  lucideTag,
  lucideGrid3x3,
  lucideChevronDown,
  lucideChevronRight
} from '@ng-icons/lucide';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  badge?: number;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucidePackage,
      lucideFolderOpen,
      lucideShoppingCart,
      lucideTruck,
      lucideUsers,
      lucideSettings,
      lucideActivity,
      lucideTag,
      lucideGrid3x3,
      lucideChevronDown,
      lucideChevronRight
    })
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);

  // Input for mobile state from parent
  mobileOpen = input<boolean>(false);

  // Component state
  isCollapsed = signal(false);
  expandedItems = signal<string[]>([]);

  // Mobile responsive signals
  isMobileOpen = computed(() => this.mobileOpen());
  isMobile = signal(false);

  // Navigation structure based on your API and components
  navigationItems = signal<NavItem[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'lucideLayoutDashboard',
      route: '/admin'
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: 'lucidePackage',
      children: [
        {
          id: 'products',
          label: 'Products',
          icon: 'lucidePackage',
          route: '/admin/products'
        },
        {
          id: 'categories',
          label: 'Categories',
          icon: 'lucideFolderOpen',
          route: '/admin/categories'
        },
        {
          id: 'option-groups',
          label: 'Option Groups',
          icon: 'lucideTag',
          route: '/admin/option-groups'
        },
        {
          id: 'variants',
          label: 'Product Variants',
          icon: 'lucideGrid3x3',
          route: '/admin/variants'
        }
      ]
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: 'lucideShoppingCart',
      route: '/admin/orders',
      badge: 5 // Example: pending orders count
    },
    {
      id: 'delivery',
      label: 'Delivery',
      icon: 'lucideTruck',
      children: [
        {
          id: 'delivery-zones',
          label: 'Delivery Zones',
          icon: 'lucideTruck',
          route: '/admin/delivery-zones'
        }
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: 'lucideUsers',
      route: '/admin/customers'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'lucideActivity',
      children: [
        {
          id: 'sales',
          label: 'Sales Report',
          icon: 'lucideActivity',
          route: '/admin/reports/sales'
        },
        {
          id: 'inventory',
          label: 'Inventory Report',
          icon: 'lucidePackage',
          route: '/admin/reports/inventory'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'lucideSettings',
      children: [
        {
          id: 'app-config',
          label: 'App Configuration',
          icon: 'lucideSettings',
          route: '/admin/config'
        },
        {
          id: 'admin-settings',
          label: 'Admin Settings',
          icon: 'lucideSettings',
          route: '/admin/settings'
        }
      ]
    }
  ]);

  // Computed values
  visibleItems = computed(() => {
    const items = this.navigationItems();
    const expanded = this.expandedItems();

    return items.map(item => ({
      ...item,
      isExpanded: expanded.includes(item.id)
    }));
  });

  toggleSidebar() {
    this.isCollapsed.update(collapsed => !collapsed);
  }

  toggleGroup(itemId: string) {
    this.expandedItems.update(expanded => {
      const isExpanded = expanded.includes(itemId);
      if (isExpanded) {
        return expanded.filter(id => id !== itemId);
      } else {
        return [...expanded, itemId];
      }
    });
  }

  closeMobileSidebar() {
    // This will be handled by parent component
    // Emit event or use output if needed
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if mobile on init
      this.checkMobile();
      // Listen for window resize
      window.addEventListener('resize', () => this.checkMobile());
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', () => this.checkMobile());
    }
  }

  private checkMobile() {
    this.isMobile.set(window.innerWidth < 1024); // lg breakpoint
  }

  isActiveRoute(route: string): boolean {
    // You can inject Router and check current route
    // For now, simple check (you can enhance this)
    return false; // placeholder
  }

  hasActiveChild(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some(child =>
      child.route ? this.isActiveRoute(child.route) : false
    );
  }
}
