import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideArrowLeft,
  lucidePlus,
  lucideTrash2,
  lucideSave,
  lucideLoader,
  lucideTriangleAlert
} from '@ng-icons/lucide';

import { AdminOptionGroupsStore } from '../../../state/admin-option-groups.store';
import { OptionGroup, Option } from '../../../../../types/api.types';
import { CreateOptionGroupRequest, AddOptionRequest } from '../../../../../api/admin/option-groups/option-groups.service';

@Component({
  selector: 'app-option-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({
    lucideArrowLeft,
    lucidePlus,
    lucideTrash2,
    lucideSave,
    lucideLoader,
    lucideTriangleAlert
  })],
  templateUrl: './option-group-form.component.html',
  styleUrl: './option-group-form.component.css'
})
export class OptionGroupFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly optionGroupsStore = inject(AdminOptionGroupsStore);

  // Component state
  optionGroupId = signal<number | null>(null);
  isEditMode = computed(() => this.optionGroupId() !== null);
  isLoading = signal(false);

  // Store signals
  readonly loading = this.optionGroupsStore.loading;
  readonly error = this.optionGroupsStore.error;
  readonly currentOptionGroup = this.optionGroupsStore.currentOptionGroup;
  readonly currentOptions = this.optionGroupsStore.currentOptions;

  // Forms
  optionGroupForm: FormGroup;
  optionForm: FormGroup;

  constructor() {
    // Initialize option group form
    this.optionGroupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });

    // Initialize option form for adding new options
    this.optionForm = this.fb.group({
      value: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    // Get option group ID from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      const groupId = Number(id);
      this.optionGroupId.set(groupId);
      this.loadOptionGroup(groupId);
      this.loadOptions(groupId);
    }
  }

  loadOptionGroup(id: number) {
    this.optionGroupsStore.loadOptionGroup(id);

    // Use effect to watch for changes in currentOptionGroup
    // Note: In a real app, you might want to use effect() from @angular/core
    // For now, we'll check the current value after loading
    setTimeout(() => {
      const optionGroup = this.currentOptionGroup();
      if (optionGroup) {
        this.optionGroupForm.patchValue({
          name: optionGroup.name
        });
      }
    }, 100);
  }

  loadOptions(groupId: number) {
    this.optionGroupsStore.loadOptions(groupId);
  }

  onSave() {
    if (this.optionGroupForm.invalid) {
      this.optionGroupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData: CreateOptionGroupRequest = {
      name: this.optionGroupForm.get('name')?.value.trim()
    };

    if (this.isEditMode()) {
      // TODO: Implement update logic when API supports it
      toast.error('Update functionality not yet implemented');
      this.isLoading.set(false);
    } else {
      // Create new option group
      this.optionGroupsStore.createOptionGroup(formData).subscribe({
        next: (result) => {
          this.isLoading.set(false);
          if (result) {
            toast.success(`Option group "${result.name}" created successfully`);
            this.router.navigate(['/admin/option-groups', result.id]);
          } else {
            toast.error('Failed to create option group');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Failed to create option group:', error);
          toast.error(`Failed to create option group: ${error.message || 'Unknown error'}`);
        }
      });
    }
  }

  onAddOption() {
    if (this.optionForm.invalid || !this.optionGroupId()) {
      this.optionForm.markAllAsTouched();
      return;
    }

    const groupId = this.optionGroupId()!;
    const optionData: AddOptionRequest = {
      value: this.optionForm.get('value')?.value.trim()
    };

    this.optionGroupsStore.addOption(groupId, optionData).subscribe({
      next: (result) => {
        if (result) {
          toast.success(`Option "${result.value}" added successfully`);
          this.optionForm.reset();
          this.loadOptions(groupId); // Reload options
        } else {
          toast.error('Failed to add option');
        }
      },
      error: (error) => {
        console.error('Failed to add option:', error);
        toast.error(`Failed to add option: ${error.message || 'Unknown error'}`);
      }
    });
  }

  onDeleteOption(option: Option) {
    if (!window.confirm(`Are you sure you want to delete option "${option.value}"?`)) {
      return;
    }

    this.optionGroupsStore.deleteOption(option.id).subscribe({
      next: (result) => {
        if (result !== null) {
          toast.success(`Option "${option.value}" deleted successfully`);
          if (this.optionGroupId()) {
            this.loadOptions(this.optionGroupId()!); // Reload options
          }
        } else {
          toast.error(`Failed to delete option "${option.value}"`);
        }
      },
      error: (error) => {
        console.error('Failed to delete option:', error);
        toast.error(`Failed to delete option: ${error.message || 'Unknown error'}`);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/option-groups']);
  }

  // Helper methods for form validation
  getFieldError(fieldName: string, formGroup: FormGroup = this.optionGroupForm): string | null {
    const field = formGroup.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Option group name',
      value: 'Option value'
    };
    return labels[fieldName] || fieldName;
  }
}
