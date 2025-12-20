import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { ThemeService } from './core/services/theme.service';
import { ScrollService } from './core/services/scroll.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'grs-frontend';
  private themeService = inject(ThemeService);
  private scrollService = inject(ScrollService); // Initialize scroll service

  constructor() {
    try {
      this.themeService.init();
      // ScrollService will automatically handle scroll-to-top on route changes
    } catch (error) {
      console.warn('Failed to initialize services:', error);
    }
  }
}
