import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideArrowLeft,
  lucidePlus,
  lucideTrash2,
  lucideSave,
  lucideLoader,
  lucideTriangleAlert,
  lucidePencil,
} from '@ng-icons/lucide';

import { AdminOptionGroupsStore } from '../../../state/admin-option-groups.store';
import { OptionGroup, Option } from '../../../../../types/api.types';
import {
  CreateOptionGroupRequest,
  AddOptionRequest,
} from '../../../../../api/admin/option-groups/option-groups.service';

@Component({
  selector: 'app-option-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucidePlus,
      lucideTrash2,
      lucideSave,
      lucideLoader,
      lucideTriangleAlert,
      lucidePencil,
    }),
  ],
  templateUrl: './option-group-form.component.html',
  styleUrl: './option-group-form.component.css',
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
  editingOptionId = signal<number | null>(null); // Track which option is being edited

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
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
    });

    // Initialize option form for adding/editing options
    this.optionForm = this.fb.group({
      value: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(50),
        ],
      ],
      priceModifier: [0, [Validators.required, Validators.min(0)]],
      compareAtPrice: [null, [Validators.min(0)]],
      inventory: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
    });

    // Effect to watch for currentOptionGroup changes and update form
    effect(() => {
      const optionGroup = this.currentOptionGroup();
      if (optionGroup && this.isEditMode()) {
        this.optionGroupForm.patchValue({
          name: optionGroup.name,
        });
      }
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
    // The effect in the constructor will automatically update the form
    // when currentOptionGroup signal changes
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
      name: this.optionGroupForm.get('name')?.value.trim(),
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
          toast.error(
            `Failed to create option group: ${error.message || 'Unknown error'}`
          );
        },
      });
    }
  }

  onSaveOption() {
    if (this.optionForm.invalid || !this.optionGroupId()) {
      this.optionForm.markAllAsTouched();
      return;
    }

    if (this.editingOptionId()) {
      this.updateOption();
    } else {
      this.addOption();
    }
  }

  private addOption() {
    const groupId = this.optionGroupId()!;
    const optionData: AddOptionRequest = {
      value: this.optionForm.get('value')?.value.trim(),
      priceModifier: this.optionForm.get('priceModifier')?.value,
      compareAtPrice: this.optionForm.get('compareAtPrice')?.value || undefined,
      inventory: this.optionForm.get('inventory')?.value,
      isActive: this.optionForm.get('isActive')?.value,
    };

    this.optionGroupsStore.addOption(groupId, optionData).subscribe({
      next: (result) => {
        if (result) {
          toast.success(`Option "${result.value}" added successfully`);
          this.resetOptionForm();
          this.loadOptions(groupId); // Reload options
        } else {
          toast.error('Failed to add option');
        }
      },
      error: (error) => {
        console.error('Failed to add option:', error);
        toast.error(
          `Failed to add option: ${error.message || 'Unknown error'}`
        );
      },
    });
  }

  private updateOption() {
    const groupId = this.optionGroupId()!;
    const optionId = this.editingOptionId()!;
    const optionData: AddOptionRequest = {
      // Using AddOptionRequest as structure is same for update here
      value: this.optionForm.get('value')?.value.trim(),
      priceModifier: this.optionForm.get('priceModifier')?.value,
      compareAtPrice: this.optionForm.get('compareAtPrice')?.value || undefined,
      inventory: this.optionForm.get('inventory')?.value,
      isActive: this.optionForm.get('isActive')?.value,
    };

    this.optionGroupsStore.updateOption(optionId, optionData).subscribe({
      next: (result) => {
        if (result) {
          toast.success(`Option "${result.value}" updated successfully`);
          this.resetOptionForm();
          this.loadOptions(groupId); // Reload options
        } else {
          toast.error('Failed to update option');
        }
      },
      error: (error) => {
        console.error('Failed to update option:', error);
        toast.error(
          `Failed to update option: ${error.message || 'Unknown error'}`
        );
      },
    });
  }

  onEditOption(option: Option) {
    this.editingOptionId.set(option.id);
    this.optionForm.patchValue({
      value: option.value,
      priceModifier: option.priceModifier,
      compareAtPrice: option.compareAtPrice || null,
      inventory: option.inventory,
      isActive: option.isActive,
    });
    // Scroll to form
    const formElement = document.getElementById('optionFormCard');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onCancelEditOption() {
    this.resetOptionForm();
  }

  private resetOptionForm() {
    this.editingOptionId.set(null);
    this.optionForm.reset({
      value: '',
      priceModifier: 0,
      compareAtPrice: null,
      inventory: 0,
      isActive: true,
    });
  }

  onDeleteOption(option: Option) {
    if (
      !window.confirm(
        `Are you sure you want to delete option "${option.value}"?`
      )
    ) {
      return;
    }

    this.optionGroupsStore.deleteOption(option.id).subscribe({
      next: (result) => {
        toast.success(`Option "${option.value}" deleted successfully`);
        if (this.optionGroupId()) {
          this.loadOptions(this.optionGroupId()!); // Reload options
        }
        this.resetOptionForm(); // Reset form in case the deleted option was being edited
      },
      error: (error) => {
        console.error('Failed to delete option:', error);
        toast.error(
          `Failed to delete option: ${error.message || 'Unknown error'}`
        );
      },
    });
  }

  onCancel() {
    this.router.navigate(['/admin/option-groups']);
  }

  // Helper methods for form validation
  getFieldError(
    fieldName: string,
    formGroup: FormGroup = this.optionGroupForm
  ): string | null {
    const field = formGroup.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      if (field.errors['maxlength'])
        return `${this.getFieldLabel(fieldName)} must not exceed ${
          field.errors['maxlength'].requiredLength
        } characters`;
      if (field.errors['min'])
        return `${this.getFieldLabel(
          fieldName
        )} must be greater than or equal to ${field.errors['min'].min}`;
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Option group name',
      value: 'Option value',
      priceModifier: 'Price modifier',
      compareAtPrice: 'Compare at price',
      inventory: 'Inventory',
      isActive: 'Active status',
    };
    return labels[fieldName] || fieldName;
  }
}
