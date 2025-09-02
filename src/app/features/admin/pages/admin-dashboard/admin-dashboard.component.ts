import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideShoppingCart,
  lucidePackage,
  lucideUsers,
  lucideTrendingUp,
  lucideCalendar,
  lucideEye
} from '@ng-icons/lucide';

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  total: number;
  status: 'SAVED' | 'DECLARED_PAID' | 'UNDER_REVIEW' | 'CONFIRMED' | 'REJECTED';
  createdAt: Date;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgIconComponent
  ],
  providers: [
    provideIcons({
      lucideShoppingCart,
      lucidePackage,
      lucideUsers,
      lucideTrendingUp,
      lucideCalendar,
      lucideEye
    })
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  // Dashboard stats signals
  private stats = signal<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });

  // Recent orders signal
  private recentOrders = signal<RecentOrder[]>([]);

  // Loading states
  isLoading = signal(false);

  // Computed properties for display
  displayStats = computed(() => this.stats());
  displayRecentOrders = computed(() => this.recentOrders().slice(0, 5));

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);

    // Simulate API call - replace with actual admin API service calls
    setTimeout(() => {
      this.stats.set({
        totalOrders: 127,
        totalProducts: 45,
        totalCustomers: 89,
        totalRevenue: 25430.50
      });

      this.recentOrders.set([
        {
          id: '1',
          orderCode: 'ORD-001',
          customerName: 'John Doe',
          total: 450.00,
          status: 'DECLARED_PAID',
          createdAt: new Date()
        },
        {
          id: '2',
          orderCode: 'ORD-002',
          customerName: 'Jane Smith',
          total: 320.50,
          status: 'CONFIRMED',
          createdAt: new Date()
        },
        {
          id: '3',
          orderCode: 'ORD-003',
          customerName: 'Mike Johnson',
          total: 675.25,
          status: 'UNDER_REVIEW',
          createdAt: new Date()
        }
      ]);

      this.isLoading.set(false);
    }, 1000);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'DECLARED_PAID':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  }
}
