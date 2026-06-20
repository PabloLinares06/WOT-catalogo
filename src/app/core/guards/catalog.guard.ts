import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CatalogAuthService } from '../services/catalog-auth.service';

/**
 * Protege las rutas públicas del catálogo (/, /product/:id, /cart).
 * Si el usuario no tiene una sesión de catálogo válida, lo redirige a /catalog-login.
 * No consume ninguna operación Firebase — toda la lógica es local.
 */
export const catalogGuard: CanActivateFn = (route, state) => {
  const catalogAuth = inject(CatalogAuthService);
  const router = inject(Router);

  if (catalogAuth.isAuthenticated()) return true;

  router.navigate(['/catalog-login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
