import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { Auth } from '../../services/auth';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false
})
export class RegistroPage {

  nombreUsuario = '';
  correo = '';
  password = '';
  confirmarPassword = '';

  mostrarPassword = false;
  mostrarConfirmar = false;

  cargando = false;
  mensajeError = '';

  constructor(
    private router: Router,
    private authService: Auth
  ) {}

  crearCuenta(): void {
    this.mensajeError = '';

    if (
      !this.nombreUsuario.trim() ||
      !this.correo.trim() ||
      !this.password ||
      !this.confirmarPassword
    ) {
      this.mensajeError = 'Complete todos los campos.';
      return;
    }

    if (this.password !== this.confirmarPassword) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.password.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;

    this.authService.registro({
      nombreUsuario: this.nombreUsuario.trim(),
      correo: this.correo.trim(),
      contrasena: this.password,
      fotoPerfil: null
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

  volverLogin(): void {
    this.router.navigate(['/login']);
  }

  private obtenerMensajeError(error: any): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    return 'No se pudo crear la cuenta.';
  }
}