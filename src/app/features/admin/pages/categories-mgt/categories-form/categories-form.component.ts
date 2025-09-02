import { Component, inject, OnInit, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideArrowLeft,
  lucideSave,
  lucideLoader,
  lucideX
} from '@ng-icons/lucide';
import { AdminCategoriesStore } from '../../../state/admin-categories.store';
import { Category } from '../../../../../types/api.types';
import { CreateCategoryDto, UpdateCategoryDto } from '../../../../../api/dtos/api.dtos';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories-form',
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({
    lucideArrowLeft,
    lucideSave,
    lucideLoader,
    lucideX
  })],
  templateUrl: './categories-form.component.html',
  styleUrl: './categories-form.component.css'
})
export class CategoriesFormComponent implements OnInit {
  private readonly categoriesStore = inject(AdminCategoriesStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  categoryForm!: FormGroup;
  isEditing = false;
  categoryId: number | null = null;
  isSubmitting = false;

  // Store signals
  readonly loading = this.categoriesStore.loading;
  readonly error = this.categoriesStore.error;
  readonly currentCategory = this.categoriesStore.currentCategory;

  constructor() {
    // React to current category changes
    effect(() => {
      const category = this.currentCategory();
      if (category && this.categoryForm) {
        this.categoryForm.patchValue({
          name: category.name,
          slug: category.slug,
          active: category.active
        });
      }
    });
  }

  ngOnInit() {
    this.initForm();
    this.checkIfEditing();
  }

  private initForm() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      active: [true]
    });

    // Auto-generate slug from name
    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.isEditing) {
        const slug = this.generateSlug(name);
        this.categoryForm.get('slug')?.setValue(slug, { emitEvent: false });
      }
    });
  }

  private checkIfEditing() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.categoryId = parseInt(id, 10);
      this.loadCategory();
    }
  }

  private loadCategory() {
    if (!this.categoryId) return;
    this.categoriesStore.loadCategory(this.categoryId);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  onSubmit() {
    if (this.categoryForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const formData = this.categoryForm.value;
    //  remove slug
    delete formData.slug;
    const categoryName = formData.name;
    const operation = this.isEditing
      ? this.categoriesStore.updateCategory(this.categoryId!, formData as UpdateCategoryDto)
      : this.categoriesStore.createCategory(formData as CreateCategoryDto);

    operation.subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (result) {
          // Success - navigate back to list and show success toast
          const action = this.isEditing ? 'updated' : 'created';
          toast.success(`Category "${categoryName}" ${action} successfully`);
          this.router.navigate(['/admin/categories']);
        } else {
          // Failed but no error thrown
          const action = this.isEditing ? 'update' : 'create';
          toast.error(`Failed to ${action} category "${categoryName}"`);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        const action = this.isEditing ? 'update' : 'create';
        console.error(`Failed to ${action} category:`, error);
        toast.error(`Failed to ${action} category "${categoryName}": ${error.message || 'Unknown error'}`);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/admin/categories']);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.categoryForm.get(fieldName);
    if (field?.invalid && field?.touched) {
      const errors = field.errors;
      if (errors?.['required']) return `${fieldName} is required`;
      if (errors?.['minlength']) return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
      if (errors?.['pattern']) return `${fieldName} must contain only lowercase letters, numbers, and hyphens`;
    }
    return null;
  }
}
