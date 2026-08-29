import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { CategoryItem } from '@common/services/api/category/category-api.service';
import { CategoryManager } from '@common/services/managers/category/category';
import { ProductManager } from '@common/services/managers/product/product';
import { ToastManager } from '@common/services/managers/toast/toast.manager';

@Component({
  selector: 'app-admin-product-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-product.html',
  styleUrl: './create-product.scss',
})
export class AdminProductCreateComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  categories$!: Observable<CategoryItem[]>;
  isSaving = false;

  readonly productForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private categoryManager: CategoryManager,
    private productManager: ProductManager,
    private toastManager: ToastManager
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      imagePath: ['', [Validators.maxLength(1000)]],
      categoryId: [null as number | null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.categories$ = this.categoryManager.getCategories();
  }

  submit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const value = this.productForm.value;
    const name = String(value.name ?? '').trim();

    if (!value.categoryId) {
      this.toastManager.error('Please choose a category');
      return;
    }

    if (name.length < 3) {
      this.productForm.controls['name'].markAsTouched();
      this.toastManager.error('Product name must be at least 3 characters.');
      return;
    }

    this.isSaving = true;

    this.productManager.createProduct({
      name,
      description: value.description ?? '',
      price: Number(value.price ?? 0),
      stock: Number(value.stock ?? 0),
      category_id: Number(value.categoryId),
      image_url: this.normalizeImagePath(value.imagePath ?? ''),
    }).pipe(
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: (product) => {
        this.toastManager.success('Product created successfully' + product.name);
        this.productForm.reset({
          name: '',
          description: '',
          price: 0,
          stock: 0,
          imagePath: '',
          categoryId: null,
        });
        this.created.emit();
      },
      error: (error: any) => {
        console.error('Error creating product:', error);
        this.toastManager.error(error?.error?.message || 'Failed to create product');
      },
    });
  }

  cancel(): void {
    this.close.emit();
  }

  trackByCategory(_: number, category: CategoryItem): number {
    return category.id;
  }

  private normalizeImagePath(value: string): string | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (/^(https?:\/\/|\/assets\/)/i.test(trimmed)) {
      return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }

    if (/^assets\//i.test(trimmed)) {
      return `/${trimmed}`;
    }

    if (/^images\//i.test(trimmed)) {
      return `/assets/${trimmed}`;
    }

    const fileName = trimmed.replace(/^\.?\/*/, '');

    return `/assets/images/${fileName}`;
  }
}
