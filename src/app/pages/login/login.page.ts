import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {

  correo = '';
  password = '';
  mostrarPassword = false;
  cargando = false;
  mensajeError = '';

  constructor(
    private router: Router,
    private authService: Auth
  ) {}

  login(): void {
    this.mensajeError = '';

    if (!this.correo.trim() || !this.password.trim()) {
      this.mensajeError = 'Debe completar el correo y la contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login({
      correo: this.correo.trim(),
      contrasena: this.password
    })
    .pipe(
      finalize(() => {
        this.cargando = false;
      })
    )
    .subscribe({
      next: usuario => {
        this.authService.guardarSesion(usuario);
        this.router.navigate(['/menu']);
      },
      error: error => {
        this.mensajeError = this.obtenerMensajeError(error);
      }
    });
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return 'No se pudo iniciar sesión.';
  }
}