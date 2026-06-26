import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product } from '../../../core/models/product.model';
import { take } from 'rxjs/operators';
import { PRODUCT_CATEGORIES } from '../../../core/constants/categories';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  categories = signal<Array<{ id: string; name: string }>>([]);

  isEditMode = signal(false);
  productId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal('');

  // Imagen principal
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  // Imágenes adicionales (URLs y Archivos locales)
  extraImages = signal<string[]>([]); // URLs existentes o añadidas manualmente
  selectedExtraFiles = signal<(File | null)[]>([]); // Archivos locales seleccionados
  newImageUrl = signal('');
  previewIndex = signal(0);

  showNewCategoryInput = signal(false);
  newCategoryName = signal('');
  savingCategory = signal(false);

  showManageCategories = signal(false);
  customCategories = signal<Array<{id: string, name: string}>>([]);
  deletingCategoryId = signal<string | null>(null);

  form = this.fb.group({
    reference: ['', [Validators.required, Validators.maxLength(10)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    category: ['', Validators.required],
    imageUrl: [''],
    isActive: [true],
    hasObservation: [true],
    stock: [null as number | null]
  });

  ngOnInit(): void {
    this.categoryService.getAllCategoriesWithOrder().pipe(take(1)).subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.warn('Error cargando categorías:', err)
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.productId.set(id);
      this.loading.set(true);
      this.productService.getProductById(id).pipe(take(1)).subscribe(product => {
        if (product) {
          this.form.patchValue({
            ...product as any,
            category: product.categoryId || '',
            hasObservation: product.hasObservation ?? true,
            stock: product.stock ?? null
          });
          this.imagePreview.set(product.imageUrl || null);
          if (product.images && product.images.length > 0) {
            this.extraImages.set(product.images);
            this.selectedExtraFiles.set(new Array(product.images.length).fill(null));
          }
        }
        this.loading.set(false);
      });
    }
  }

  get allPreviews(): string[] {
    const main = this.imagePreview();
    const extrasUrls = this.extraImages();
    // En un caso real avanzado podríamos mezclar previsualizaciones locales de 'selectedExtraFiles',
    // pero para simplificar, el carrusel mostrará la principal + las URLs confirmadas/existentes.
    return main ? [main, ...extrasUrls] : extrasUrls;
  }

  // --- IMAGEN PRINCIPAL ---
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    console.log('[DEBUG] Evento onFileSelected disparado', event);
    if (file && file.type.startsWith('image/')) {
      console.log('[DEBUG] Archivo válido seleccionado:', file.name);
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
        this.form.patchValue({ imageUrl: '' });
      };
      reader.readAsDataURL(file);
    } else {
        console.warn('[DEBUG] Archivo inválido o ninguno seleccionado:', file);
    }
  }

  onImageUrlChange(url: string): void {
    if (url.trim()) {
      this.selectedFile.set(null);
      this.imagePreview.set(url.trim());
      this.previewIndex.set(0);
    } else {
      this.imagePreview.set(null);
    }
  }

  // --- IMÁGENES ADICIONALES ---

  /** Añade un nuevo hueco para seleccionar un archivo extra */
  addExtraImageSlot(): void {
    this.selectedExtraFiles.update(files => [...files, null]);
    // Añadimos un string vacío al array de URLs para mantener la paridad de índices
    this.extraImages.update(urls => [...urls, '']);
  }

  /** Maneja la selección de un archivo en un hueco específico */
  onExtraFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    console.log(`[DEBUG] Evento onExtraFileSelected disparado para index ${index}`, event);
    if (file && file.type.startsWith('image/')) {
      console.log(`[DEBUG] Archivo extra válido seleccionado [${index}]:`, file.name);
      this.selectedExtraFiles.update(files => {
        const newFiles = [...files];
        newFiles[index] = file;
        return newFiles;
      });

      // Crear preview temporal
      const reader = new FileReader();
      reader.onload = () => {
        this.extraImages.update(urls => {
          const newUrls = [...urls];
          newUrls[index] = reader.result as string; // Usamos el array de URLs para mostrar la preview local
          return newUrls;
        });
      };
      reader.readAsDataURL(file);
    } else {
        console.warn(`[DEBUG] Archivo extra inválido o ninguno seleccionado [${index}]:`, file);
    }
  }

  /** Elimina un hueco de imagen extra */
  removeExtraImageSlot(index: number): void {
    this.selectedExtraFiles.update(files => files.filter((_, i) => i !== index));
    this.extraImages.update(urls => urls.filter((_, i) => i !== index));

    if (this.previewIndex() >= this.allPreviews.length) {
      this.previewIndex.set(Math.max(0, this.allPreviews.length - 1));
    }
  }

  // --- OTRAS FUNCIONES ---

  toggleNewCategoryInput(): void {
    this.showNewCategoryInput.update((v) => !v);
    if (!this.showNewCategoryInput()) this.newCategoryName.set('');
    if (this.showNewCategoryInput()) this.showManageCategories.set(false);
  }

  toggleManageCategories(): void {
    this.showManageCategories.update((v) => !v);
    if (this.showManageCategories()) {
      this.showNewCategoryInput.set(false);
      this.loadCustomCategories();
    }
  }

  loadCustomCategories(): void {
    this.categoryService.getCustomCategories().pipe(take(1)).subscribe({
      next: (cats) => this.customCategories.set(cats),
      error: (err) => console.error('Error:', err)
    });
  }

  async addNewCategory(): Promise<void> {
    const name = this.newCategoryName().trim();
    if (!name) return;
    this.savingCategory.set(true);
    try {
      await this.categoryService.addCategory(name);
      this.categoryService.getAllCategoriesWithOrder().pipe(take(1)).subscribe((cats) => {
        this.categories.set(cats);
        const newCat = cats.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (newCat) {
          this.form.patchValue({ category: newCat.id });
        }
        this.showNewCategoryInput.set(false);
        this.newCategoryName.set('');
        this.savingCategory.set(false);
      });
    } catch (err: any) {
      alert(`Error al crear la categoría.\n\nDetalle: ${err?.message || err}`);
      this.savingCategory.set(false);
    }
  }

  async deleteCategory(id: string, name: string): Promise<void> {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    this.deletingCategoryId.set(id);
    try {
      await this.categoryService.deleteCategory(id);
      this.categoryService.getAllCategoriesWithOrder().pipe(take(1)).subscribe((cats) => this.categories.set(cats));
      this.loadCustomCategories();
    } catch (err) {
      alert('Error al eliminar.');
    } finally {
      this.deletingCategoryId.set(null);
    }
  }

  // --- SUBMIT ---

  async onSubmit(): Promise<void> {
    console.log('[DEBUG] Iniciando onSubmit');
    if (this.form.invalid) {
      console.warn('[DEBUG] Formulario inválido. Deteniendo onSubmit.', this.form.errors);
      return;
    }

    const reference = this.form.value.reference!.trim();
    let finalMainImageUrl = this.form.value.imageUrl?.trim() || '';

    if (!this.selectedFile() && !finalMainImageUrl) {
      this.error.set('La imagen principal (portada) es obligatoria.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      console.log(`[DEBUG] Referencia: ${reference}, URL Principal Inicial: ${finalMainImageUrl}`);
      console.log(`[DEBUG] selectedFile:`, this.selectedFile());
      console.log(`[DEBUG] selectedExtraFiles:`, this.selectedExtraFiles());

      // 1. Subir imagen principal si hay archivo local
      if (this.selectedFile()) {
        try {
          console.log('[DEBUG] Intentando subir imagen principal...');
          finalMainImageUrl = await this.productService.uploadProductImage(this.selectedFile()!, reference);
          console.log('[DEBUG] Imagen principal subida con éxito. URL:', finalMainImageUrl);
        } catch (uploadErr) {
          console.error('[DEBUG] Error subiendo imagen principal:', uploadErr);
          throw new Error('No se pudo subir la imagen principal.');
        }
      }

      // 2. Subir imágenes extra si hay archivos locales
      const finalExtraImagesUrls: string[] = [];
      const currentExtraUrls = this.extraImages();
      const extraFiles = this.selectedExtraFiles();

      console.log('[DEBUG] Procesando imágenes extra...');
      for (let i = 0; i < extraFiles.length; i++) {
        const file = extraFiles[i];
        if (file) {
          console.log(`[DEBUG] Intentando subir imagen extra ${i}...`);
          try {
             const uploadedUrl = await this.productService.uploadProductImage(file, reference, true, i + 2);
             console.log(`[DEBUG] Imagen extra ${i} subida con éxito. URL:`, uploadedUrl);
             finalExtraImagesUrls.push(uploadedUrl);
          } catch(extraUploadErr) {
             console.error(`[DEBUG] Error subiendo imagen extra ${i}:`, extraUploadErr);
             throw new Error(`No se pudo subir la imagen adicional ${i+1}.`);
          }
        } else if (currentExtraUrls[i] && !currentExtraUrls[i].startsWith('data:image')) {
          console.log(`[DEBUG] Manteniendo URL extra existente para ${i}:`, currentExtraUrls[i]);
          finalExtraImagesUrls.push(currentExtraUrls[i]);
        }
      }



      // 3. Preparar datos finales
      console.log('[DEBUG] Preparando datos finales...');
      const stock = this.form.value.stock;
      const stockValue = (stock !== null && stock !== undefined && String(stock).trim() !== '') ? Number(stock) : null;

      const productData: any = {
        reference: reference,
        name: this.form.value.name!,
        description: this.form.value.description || '',
        price: Number(this.form.value.price),
        categoryId: this.form.value.category!,
        isActive: this.form.value.isActive ?? true,
        hasObservation: this.form.value.hasObservation ?? false,
        imageUrl: finalMainImageUrl,
        ...(stockValue !== null ? { stock: stockValue } : {}),
        ...(finalExtraImagesUrls.length > 0 ? { images: finalExtraImagesUrls } : {})
      };

      console.log('[DEBUG] Datos a guardar:', productData);

      // 4. Guardar en el backend
      if (this.isEditMode() && this.productId()) {
        console.log('[DEBUG] Actualizando producto existente...');
        const updateData: Record<string, unknown> = { ...productData };
        if (stockValue === null) updateData['stock'] = null;
        if (finalExtraImagesUrls.length === 0) updateData['images'] = [];
        await this.productService.updateProduct(this.productId()!, updateData);
      } else {
        console.log('[DEBUG] Creando nuevo producto...');
        await this.productService.addProduct(productData);
      }

      console.log('[DEBUG] Producto guardado exitosamente. Navegando a admin...');
      this.router.navigate(['/admin']);

    } catch (err: any) {
      console.error('[DEBUG] Error general en onSubmit:', err);
      this.error.set(err.message || 'Error al guardar.');
    } finally {
      console.log('[DEBUG] Finalizando onSubmit (finally block).');
      this.saving.set(false);
    }
  }


}
