import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-store-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">GeoResin Store</h1>

      <!-- Welcome Message -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-blue-800 mb-2">Welcome to GeoResin Store!</h2>
        <p class="text-blue-700">
          This is the store homepage. The backend API integration is ready - just connect to your NestJS API to load real categories and products.
        </p>
      </div>

      <!-- Demo Categories -->
      <nav class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Categories (Demo)</h2>
        <div class="flex flex-wrap gap-4">
          <div class="px-4 py-2 bg-blue-100 rounded-lg text-blue-800">
            Epoxy Resins
          </div>
          <div class="px-4 py-2 bg-blue-100 rounded-lg text-blue-800">
            Hardeners
          </div>
          <div class="px-4 py-2 bg-blue-100 rounded-lg text-blue-800">
            Tools & Equipment
          </div>
          <div class="px-4 py-2 bg-blue-100 rounded-lg text-blue-800">
            Accessories
          </div>
        </div>
      </nav>

      <!-- Demo Products -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Featured Products (Demo)</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of demoProducts; track product.id) {
            <div class="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div class="p-4">
                <h3 class="font-semibold text-lg mb-2">{{ product.title }}</h3>
                <p class="text-gray-600 text-sm mb-4">{{ product.description }}</p>
                <div class="text-green-600 font-bold mb-4">{{ product.price }}</div>
                <button class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Quick Links -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center p-6 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Browse All Products</h3>
          <p class="text-gray-600 mb-4">Explore our complete catalog</p>
          <a routerLink="/store/products" class="text-blue-600 hover:text-blue-800">View All →</a>
        </div>

        <div class="text-center p-6 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Your Cart</h3>
          <p class="text-gray-600 mb-4">Review your items</p>
          <a routerLink="/store/cart" class="text-blue-600 hover:text-blue-800">View Cart →</a>
        </div>

        <div class="text-center p-6 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-2">Track Order</h3>
          <p class="text-gray-600 mb-4">Check your order status</p>
          <a routerLink="/store/orders" class="text-blue-600 hover:text-blue-800">Track Order →</a>
        </div>
      </section>

      <router-outlet />
    </div>
  `
})
export class StoreHomeComponent {
  protected readonly demoProducts = [
    {
      id: 1,
      title: 'Clear Epoxy Resin 500ml',
      description: 'High-quality clear epoxy resin perfect for casting and coating applications.',
      price: '$29.99'
    },
    {
      id: 2,
      title: 'Fast Hardener 250ml',
      description: 'Quick-setting hardener for accelerated curing times.',
      price: '$15.99'
    },
    {
      id: 3,
      title: 'Mixing Cups Set',
      description: 'Professional graduated mixing cups for precise measurements.',
      price: '$12.99'
    },
    {
      id: 4,
      title: 'Pigment Set - Primary Colors',
      description: 'Concentrated pigments for coloring epoxy resins.',
      price: '$24.99'
    }
  ];
}
