import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const maintenanceGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  if (!environment.maintenance) return true;

  // Permitir siempre acceso al panel admin
  const url = route.url.map(s => s.path).join('/');
  if (url.startsWith('admin')) return true;

  router.navigate(['/maintenance']);
  return false;
};
