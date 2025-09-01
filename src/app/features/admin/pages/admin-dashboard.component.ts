import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-100">
      <!-- Admin Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Quick Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900">Products</h3>
            <p class="text-3xl font-bold text-blue-600 mt-2">-</p>
            <p class="text-sm text-gray-500">Total products</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900">Orders</h3>
            <p class="text-3xl font-bold text-green-600 mt-2">-</p>
            <p class="text-sm text-gray-500">Pending orders</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900">Categories</h3>
            <p class="text-3xl font-bold text-purple-600 mt-2">-</p>
            <p class="text-sm text-gray-500">Active categories</p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900">Revenue</h3>
            <p class="text-3xl font-bold text-orange-600 mt-2">-</p>
            <p class="text-sm text-gray-500">This month</p>
          </div>
        </div>

        <!-- Navigation Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a routerLink="/admin/products" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Products</h3>
            <p class="text-gray-600">Manage your product catalog, variants, and inventory</p>
            <span class="inline-block mt-4 text-blue-600 hover:text-blue-800">Manage Products →</span>
          </a>

          <a routerLink="/admin/categories" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
            <p class="text-gray-600">Organize products into categories</p>
            <span class="inline-block mt-4 text-blue-600 hover:text-blue-800">Manage Categories →</span>
          </a>

          <a routerLink="/admin/orders" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Orders</h3>
            <p class="text-gray-600">Review and process customer orders</p>
            <span class="inline-block mt-4 text-blue-600 hover:text-blue-800">Manage Orders →</span>
          </a>

          <a routerLink="/admin/option-groups" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Option Groups</h3>
            <p class="text-gray-600">Configure product options like size, color</p>
            <span class="inline-block mt-4 text-blue-600 hover:text-blue-800">Manage Options →</span>
          </a>

          <a routerLink="/admin/delivery-zones" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Delivery Zones</h3>
            <p class="text-gray-600">Set up delivery areas and fees</p>
            <span class="inline-block mt-4 text-blue-600 hover:text-blue-800">Manage Delivery →</span>
          </a>

          <a routerLink="/admin/config" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Configuration</h3>
            <p class="text-gray-600">App settings and bank details</p>
            <span class="inline-block mt-4 text-blue-600 hover:text-blue-800">Configure →</span>
          </a>
        </div>

        <router-outlet />
      </div>
    </div>
  `
})
export class AdminDashboardComponent { }
