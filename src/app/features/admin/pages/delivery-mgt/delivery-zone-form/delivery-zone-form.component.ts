import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideSave,
  lucideX,
  lucideMapPin
} from '@ng-icons/lucide';

import { AdminDeliveryZonesStore } from '../../../state/admin-delivery-zones.store';
import { DeliveryZone } from '../../../../../types/api.types';

@Component({
  selector: 'app-delivery-zone-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({
    lucideSave,
    lucideX,
    lucideMapPin
  })],
  templateUrl: './delivery-zone-form.component.html',
  styleUrl: './delivery-zone-form.component.css'
})
export class DeliveryZoneFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly deliveryZonesStore = inject(AdminDeliveryZonesStore);

  readonly loading = this.deliveryZonesStore.loading;
  readonly error = this.deliveryZonesStore.error;
  readonly currentDeliveryZone = this.deliveryZonesStore.currentDeliveryZone;

  isEditMode = false;
  deliveryZoneId: number | null = null;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    matcher: ['CITY', [Validators.required]],
    value: ['', [Validators.required]],
    fee: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    priority: [1, [Validators.required, Validators.min(1)]],
    isActive: [true]
  });

  matcherOptions = [
    { value: 'CITY', label: 'City' },
    { value: 'STATE', label: 'State' },
    { value: 'CUSTOM', label: 'Custom' }
  ];

  ngOnInit(): void {
    this.checkEditMode();
  }

  private checkEditMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.deliveryZoneId = +id;
      this.loadDeliveryZone(this.deliveryZoneId);
    }
  }

  private loadDeliveryZone(id: number): void {
    this.deliveryZonesStore.loadDeliveryZone(id).subscribe({
      next: (deliveryZone) => {
        this.form.patchValue({
          name: deliveryZone.name,
          matcher: deliveryZone.matcher,
          value: deliveryZone.value,
          fee: deliveryZone.fee,
          priority: deliveryZone.priority,
          isActive: deliveryZone.isActive
        });
      },
      error: (error) => {
        toast.error('Failed to load delivery zone');
        this.router.navigate(['/admin/delivery-zones']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formValue = this.form.value;

      if (this.isEditMode && this.deliveryZoneId) {
        this.deliveryZonesStore.updateDeliveryZone(this.deliveryZoneId, formValue).subscribe({
          next: () => {
            toast.success('Delivery zone updated successfully');
            this.router.navigate(['/admin/delivery-zones']);
          },
          error: (error) => {
            toast.error('Failed to update delivery zone');
          }
        });
      } else {
        this.deliveryZonesStore.createDeliveryZone(formValue).subscribe({
          next: () => {
            toast.success('Delivery zone created successfully');
            this.router.navigate(['/admin/delivery-zones']);
          },
          error: (error) => {
            toast.error('Failed to create delivery zone');
          }
        });
      }
    } else {
      this.markFormGroupTouched();
      toast.error('Please fill in all required fields correctly');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/delivery-zones']);
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (control.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['pattern']) {
        return `Please enter a valid ${fieldName}`;
      }
      if (control.errors['min']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${control.errors['min'].min}`;
      }
    }
    return '';
  }
}
