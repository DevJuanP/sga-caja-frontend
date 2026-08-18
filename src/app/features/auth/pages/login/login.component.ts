import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ApiError } from '../../../../core/auth/error.interceptor';
import { ThemeService } from '../../../../core/theme/theme.service';
import { UserRole } from '../../../../interfaces/auth.interface';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly theme = this.themeService.theme;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  toggleTheme(): void {
    this.themeService.toggle();
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials = this.form.getRawValue();
    this.loading.set(true);
    this.auth
      .login(credentials)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.router.navigate([this.landingRouteFor(response.user.roleName)]),
        error: (error: ApiError) => this.errorMessage.set(error.message),
      });
  }

  /**
   * Aterrizaje tras autenticar (RF-01: "se abre recibos"). El operador de caja llega
   * directo a Cobranza, donde se procesan pagos y se emiten recibos; el administrador
   * no tiene acceso a esa pantalla (roleGuard), así que aterriza en sus catálogos.
   */
  private landingRouteFor(role: UserRole): string {
    return role === 'CashierOperator' ? '/payments' : '/masters/members';
  }
}
