import { Component } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  crearCuenta() {
    if (!this.nombreUsuario || !this.correo || !this.password || !this.confirmarPassword) {
      alert('Complete todos los campos.');
      return;
    }

    if (this.password !== this.confirmarPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    alert('Cuenta creada correctamente.');
    this.router.navigate(['/login']);
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}
