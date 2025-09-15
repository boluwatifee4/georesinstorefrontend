import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { lucideSave, lucideSettings, lucideMessageCircle, lucideFileText, lucideLoader } from '@ng-icons/lucide';
import { AdminAppConfigStore } from '../../../state/admin-app-config.store';
import { AppConfig } from '../../../../../types/api.types';

@Component({
  selector: 'app-app-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideSave,
      lucideSettings,
      lucideMessageCircle,
      lucideFileText,
      lucideLoader
    })
  ],
  templateUrl: './app-config.component.html',
  styleUrl: './app-config.component.css'
})
export class AppConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appConfigStore = inject(AdminAppConfigStore);

  // signals from store
  readonly loading = this.appConfigStore.loading;
  readonly error = this.appConfigStore.error;
  readonly appConfig = this.appConfigStore.config;

  // Form strictly matching API contract
  form: FormGroup = this.fb.group({
    bankName: ['', [Validators.required, Validators.minLength(2)]],
    accountNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    accountName: ['', [Validators.required, Validators.minLength(2)]],
    whatsappLink: ['', [Validators.required, Validators.pattern(/^https:\/\/(wa\.me|api\.whatsapp\.com)/)]],
    checkoutNote: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.fetchConfig();
  }

  private fetchConfig(): void {
    this.appConfigStore.loadConfig().subscribe({
      next: (config: AppConfig | null) => {
        if (config) {
          this.form.patchValue({
            bankName: config.bankName || '',
            accountNumber: config.accountNumber || '',
            accountName: (config as any).accountName || '',
            whatsappLink: config.whatsappLink || '',
            checkoutNote: config.checkoutNote || ''
          });
        }
      },
      error: () => {
        toast.error('Failed to load configuration');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      toast.error('Please fix validation errors');
      return;
    }

    const payload = this.form.value; // already matches UpdateConfigRequest shape

    this.appConfigStore.updateConfig(payload).subscribe({
      next: (updated) => {
        if (updated) {
          toast.success('Configuration updated');
        }
      },
      error: (err) => {
        console.error(err);
        toast.error('Update failed');
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const ctrl = this.form.get(fieldName);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return null;

    if (ctrl.errors['required']) return `${this.label(fieldName)} is required`;
    if (ctrl.errors['minlength']) return `${this.label(fieldName)} must be at least ${ctrl.errors['minlength'].requiredLength} characters`;
    if (ctrl.errors['maxlength']) return `${this.label(fieldName)} must not exceed ${ctrl.errors['maxlength'].requiredLength} characters`;
    if (ctrl.errors['pattern']) {
      if (fieldName === 'accountNumber') return 'Account number must be exactly 10 digits';
      if (fieldName === 'whatsappLink') return 'Enter a valid WhatsApp link starting with https://wa.me or https://api.whatsapp.com';
      return 'Invalid format';
    }
    return null;
  }

  private label(name: string): string {
    const map: Record<string, string> = {
      bankName: 'Bank Name',
      accountNumber: 'Account Number',
      accountName: 'Account Name',
      whatsappLink: 'WhatsApp Link',
      checkoutNote: 'Checkout Note'
    };
    return map[name] || name;
  }
}
