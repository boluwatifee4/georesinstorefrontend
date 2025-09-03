import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideSave,
  lucideSettings,
  lucideMail,
  lucideCreditCard,
  lucideTruck,
  lucidePercent
} from '@ng-icons/lucide';

import { AdminAppConfigStore } from '../../../state/admin-app-config.store';

@Component({
  selector: 'app-app-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({
    lucideSave,
    lucideSettings,
    lucideMail,
    lucideCreditCard,
    lucideTruck,
    lucidePercent
  })],
  templateUrl: './app-config.component.html',
  styleUrl: './app-config.component.css'
})
export class AppConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appConfigStore = inject(AdminAppConfigStore);

  readonly loading = this.appConfigStore.loading;
  readonly error = this.appConfigStore.error;
  readonly appConfig = this.appConfigStore.config;

  form: FormGroup = this.fb.group({
    // General Settings
    siteName: ['', [Validators.required, Validators.minLength(2)]],
    siteDescription: ['', [Validators.maxLength(500)]],
    contactEmail: ['', [Validators.required, Validators.email]],
    contactPhone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],

    // Business Settings
    businessHours: this.fb.group({
      monday: ['09:00-17:00'],
      tuesday: ['09:00-17:00'],
      wednesday: ['09:00-17:00'],
      thursday: ['09:00-17:00'],
      friday: ['09:00-17:00'],
      saturday: ['10:00-16:00'],
      sunday: ['Closed']
    }),

    // Payment Settings
    paymentMethods: this.fb.array([
      this.fb.group({
        name: ['Card Payment'],
        provider: ['stripe'],
        isActive: [true],
        config: this.fb.group({
          publicKey: [''],
          secretKey: ['']
        })
      })
    ]),

    // Shipping Settings
    freeShippingThreshold: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    defaultShippingFee: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],

    // Tax Settings
    taxRate: ['', [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(/^\d+(\.\d{2})?$/)]],
    taxIncluded: [false],

    // Notification Settings
    emailNotifications: [true],
    smsNotifications: [false],
    orderConfirmations: [true],
    shippingUpdates: [true],

    // Maintenance
    maintenanceMode: [false],
    maintenanceMessage: ['']
  });

  ngOnInit(): void {
    this.loadAppConfig();
  }

  private loadAppConfig(): void {
    this.appConfigStore.loadConfig().subscribe({
      next: (config: any) => {
        if (config) {
          this.form.patchValue({
            siteName: config.siteName,
            siteDescription: config.siteDescription,
            contactEmail: config.contactEmail,
            contactPhone: config.contactPhone,
            freeShippingThreshold: config.freeShippingThreshold,
            defaultShippingFee: config.defaultShippingFee,
            taxRate: config.taxRate,
            taxIncluded: config.taxIncluded,
            emailNotifications: config.emailNotifications,
            smsNotifications: config.smsNotifications,
            orderConfirmations: config.orderConfirmations,
            shippingUpdates: config.shippingUpdates,
            maintenanceMode: config.maintenanceMode,
            maintenanceMessage: config.maintenanceMessage
          });

          // Handle business hours if they exist
          if (config.businessHours) {
            this.form.get('businessHours')?.patchValue(config.businessHours);
          }
        }
      },
      error: (error: any) => {
        toast.error('Failed to load app configuration');
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;

      this.appConfigStore.updateConfig(formValue).subscribe({
        next: () => {
          toast.success('App configuration updated successfully');
        },
        error: (error: any) => {
          toast.error('Failed to update app configuration');
        }
      });
    } else {
      this.markFormGroupTouched();
      toast.error('Please fill in all required fields correctly');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markNestedFormGroupTouched(control);
      }
    });
  }

  private markNestedFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markNestedFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['maxlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at most ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['pattern']) {
        return `Please enter a valid ${fieldName}`;
      }
      if (control.errors['min']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at most ${control.errors['max'].max}`;
      }
    }
    return '';
  }

  formatPrice(value: string): string {
    return `₦${parseFloat(value || '0').toLocaleString()}`;
  }

  formatPercentage(value: string): string {
    return `${parseFloat(value || '0').toFixed(2)}%`;
  }
}
