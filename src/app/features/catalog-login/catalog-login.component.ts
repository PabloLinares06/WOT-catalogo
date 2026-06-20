import {
  Component, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogAuthService } from '../../core/services/catalog-auth.service';

@Component({
  selector: 'app-catalog-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './catalog-login.component.html'
})
export class CatalogLoginComponent {
  private catalogAuth = inject(CatalogAuthService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);

  password    = signal('');
  showPass    = signal(false);
  error       = signal('');
  loading     = signal(false);
  shakeError  = signal(false);

  onSubmit(): void {
    if (this.loading()) return;
    const pwd = this.password().trim();
    if (!pwd) {
      this.triggerError('Ingresa la contraseña de acceso.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Pequeño delay visual para feedback de carga
    setTimeout(() => {
      const ok = this.catalogAuth.login(pwd);
      this.loading.set(false);

      if (ok) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      } else {
        this.password.set('');
        this.triggerError('Contraseña incorrecta. Verifica e intenta de nuevo.');
      }
    }, 400);
  }

  private triggerError(msg: string): void {
    this.error.set(msg);
    this.shakeError.set(false);
    // Forzar re-trigger de la animación
    setTimeout(() => this.shakeError.set(true), 10);
    setTimeout(() => this.shakeError.set(false), 600);
  }
}
