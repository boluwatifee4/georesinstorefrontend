import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideSearch,
  lucidePlus,
  lucidePencil,
  lucideTrash2,
  lucideEye,
  lucideLoader,
  lucideSettings,
  lucideTriangleAlert,
  lucideSquare,
  lucideEllipsisVertical
} from '@ng-icons/lucide';
import { AdminOptionGroupsStore } from '../../../state/admin-option-groups.store';
import { OptionGroup } from '../../../../../types/api.types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-option-groups-list',
  imports: [CommonModule, NgIcon, FormsModule],
  providers: [provideIcons({
    lucideSearch,
    lucidePlus,
    lucidePencil,
    lucideTrash2,
    lucideEye,
    lucideLoader,
    lucideSettings,
    lucideTriangleAlert,
    lucideSquare,
    lucideEllipsisVertical
  })],
  templateUrl: './option-groups-list.component.html',
  styleUrl: './option-groups-list.component.css'
})
export class OptionGroupsListComponent implements OnInit {
  private readonly optionGroupsStore = inject(AdminOptionGroupsStore);
  private readonly router = inject(Router);

  // Component state
  searchQuery = '';
  showDeleteModal = false;
  optionGroupToDelete: OptionGroup | null = null;

  // Store signals
  readonly optionGroups = this.optionGroupsStore.optionGroups;
  readonly loading = this.optionGroupsStore.loading;
  readonly error = this.optionGroupsStore.error;
  readonly pagination = this.optionGroupsStore.pagination;

  // Computed filtered option groups
  get filteredOptionGroups() {
    const query = this.searchQuery.toLowerCase().trim();
    const groups = this.optionGroups();

    if (!query) return groups;

    return groups.filter(group =>
      group.name.toLowerCase().includes(query)
    );
  }

  ngOnInit() {
    this.loadOptionGroups();
  }

  loadOptionGroups() {
    this.optionGroupsStore.loadOptionGroups();
  }

  onSearchChange() {
    // Search is reactive through the getter, no action needed
  }

  onCreateOptionGroup() {
    this.router.navigate(['/admin/option-groups/new']);
  }

  onEditOptionGroup(optionGroup: OptionGroup) {
    this.router.navigate(['/admin/option-groups', optionGroup.id, 'edit']);
  }

  onViewOptionGroup(optionGroup: OptionGroup) {
    this.router.navigate(['/admin/option-groups', optionGroup.id]);
  }

  onManageOptions(optionGroup: OptionGroup) {
    this.router.navigate(['/admin/option-groups', optionGroup.id, 'options']);
  }

  onDeleteOptionGroup(optionGroup: OptionGroup) {
    this.optionGroupToDelete = optionGroup;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.optionGroupToDelete) return;

    const groupName = this.optionGroupToDelete.name;

    this.optionGroupsStore.deleteOptionGroup(this.optionGroupToDelete.id).subscribe({
      next: (result) => {
        if (result !== null) {
          // Success - reload option groups
          this.loadOptionGroups();
          this.closeDeleteModal();
          toast.success(`Option group "${groupName}" deleted successfully`);
        } else {
          // Failed but no error thrown
          toast.error(`Failed to delete option group "${groupName}"`);
          this.closeDeleteModal();
        }
      },
      error: (error) => {
        console.error('Failed to delete option group:', error);
        toast.error(`Failed to delete option group "${groupName}": ${error.message || 'Unknown error'}`);
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.optionGroupToDelete = null;
  }
}
