import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ADMIN_API_KEY } from '../../../config/tokens/api.tokens';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-6">Admin Settings</h2>
      
      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-4">Current Configuration</h3>
        <div class="bg-gray-50 p-4 rounded">
          <p><strong>Admin API Key:</strong> 
            {{ currentApiKey() ? (currentApiKey().substring(0, 10) + '...') : 'Not configured' }}
          </p>
          <p><strong>Status:</strong> 
            <span class="{{currentApiKey() ? 'text-green-600' : 'text-red-600'}}">
              {{ currentApiKey() ? 'Configured' : 'Not configured' }}
            </span>
          </p>
        </div>
      </div>

      <div class="mb-6">
        <h3 class="text-lg font-semibold mb-4">Instructions</h3>
        <div class="bg-blue-50 p-4 rounded text-sm">
          <p class="mb-2">To configure admin access:</p>
          <ol class="list-decimal list-inside space-y-1">
            <li>Get your admin API key from your NestJS backend</li>
            <li>Update <code>src/environments/environment.ts</code></li>
            <li>Set <code>adminApiKey: 'your-key-here'</code></li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>

      @if (!currentApiKey()) {
        <div class="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p class="text-yellow-800">⚠️ Admin API key is not configured. Admin features will not work.</p>
        </div>
      }
    </div>
  `
})
export class AdminSettingsComponent {
  private adminApiKey = inject(ADMIN_API_KEY);

  currentApiKey = signal(this.adminApiKey);
}
