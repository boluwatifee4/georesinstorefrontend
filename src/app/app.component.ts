import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'grs-frontend';
  private themeService = inject(ThemeService);

  constructor() {
    try {
      this.themeService.init();
    } catch (error) {
      console.warn('Failed to initialize theme service:', error);
    }
  }
}
