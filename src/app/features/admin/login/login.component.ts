import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs/operators';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutos

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  checking = signal(true);
  error = signal('');
  showPassword = signal(false);
  inactivityWarning = signal(false);

  // Rate limiting en cliente
  private attempts = 0;
  private lockedUntil: number | null = null;

  ngOnInit(): void {
    // Mostrar aviso si fue redirigido por inactividad
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      if (params['reason'] === 'inactivity') {
        this.inactivityWarning.set(true);
      }
    });

    this.auth.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.router.navigate(['/admin']);
      } else {
        this.checking.set(false);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    // Verificar bloqueo por intentos fallidos
    if (this.lockedUntil && Date.now() < this.lockedUntil) {
      const remaining = Math.ceil((this.lockedUntil - Date.now()) / 1000 / 60);
      this.error.set(`Demasiados intentos. Espera ${remaining} minuto(s).`);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.inactivityWarning.set(false);
    try {
      await this.auth.login(
        this.form.value.email!,
        this.form.value.password!
      );
      this.attempts = 0;
      this.lockedUntil = null;
      this.router.navigate(['/admin']);
    } catch (err: unknown) {
      this.attempts++;
      if (this.attempts >= MAX_ATTEMPTS) {
        this.lockedUntil = Date.now() + LOCKOUT_MS;
        this.error.set('Demasiados intentos fallidos. Bloqueado por 5 minutos.');
      } else {
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403) {
          this.error.set(`Correo o contraseña incorrectos. (${this.attempts}/${MAX_ATTEMPTS} intentos)`);
        } else if (status === 0) {
          this.error.set('Sin conexión con el servidor. Verifica tu internet.');
        } else {
          this.error.set('Error al iniciar sesión. Intenta de nuevo.');
        }
      }
    } finally {
      this.loading.set(false);
    }
  }
}
