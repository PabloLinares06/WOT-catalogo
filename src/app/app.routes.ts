import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { maintenanceGuard } from './core/guards/maintenance.guard';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

const maintenancePageGuard = () => {
  if (environment.maintenance) return true;
  inject(Router).navigate(['/']);
  return false;
};

export const routes: Routes = [
  {
    path: 'maintenance',
    canActivate: [maintenancePageGuard],
    loadComponent: () =>
      import('./features/maintenance/maintenance.component').then(m => m.MaintenanceComponent)
  },
  {
    // Catálogo público — sin guards de autenticación
    path: '',
    canActivate: [maintenanceGuard],
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'catalog',
    redirectTo: '',
    pathMatch: 'full'
  },
  // TODO: catalog-login eliminado — catálogo es público ahora.
  // El componente CatalogLoginComponent permanece en disco pero no está enrutado.
  {
    path: 'cart',
    canActivate: [maintenanceGuard],
    loadComponent: () =>
      import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'product/:id',
    canActivate: [maintenanceGuard],
    loadComponent: () =>
      import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/products/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/product-form/product-form.component').then(m => m.ProductFormComponent)
  },
  {
    path: 'admin/banners',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/banner-manager/banner-manager.component').then(m => m.BannerManagerComponent)
  },
  {
    path: 'admin/categories',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/category-manager/category-manager.component').then(m => m.CategoryManagerComponent)
  },
  {
    path: 'admin/price-update',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/price-quick-update/price-quick-update.component').then(m => m.PriceQuickUpdateComponent)
  },
  {
    path: 'admin/order',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/product-order/product-order.component').then(m => m.ProductOrderComponent)
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
