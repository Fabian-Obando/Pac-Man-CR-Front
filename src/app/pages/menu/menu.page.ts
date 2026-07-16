import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, UsuarioSesion } from '../../services/auth';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage implements OnInit {

  usuario!: UsuarioSesion;

  nombre = '';

  nivel = 1;

  monedas = 0;

  correo = '';

  fotoPerfil = '';

  esAdministrador = false;

  administrador = false;

  xpActual = 0;

  xpMaxima = 500;

  constructor(
    private router: Router,
    private auth: Auth
  ) { }

  ngOnInit(): void {

    const sesion = this.auth.obtenerSesion();

    if (!sesion) {

      this.router.navigate(['/login']);

      return;

    }

    this.usuario = sesion;

    this.nombre = sesion.nombreUsuario;

    this.nivel = sesion.nivel;

    this.monedas = sesion.oroActual;

    this.correo = sesion.correo;

    this.fotoPerfil = sesion.fotoPerfil ?? '';

    // XP temporal (después vendrá de la BD)
    this.xpActual = this.nivel * 180;

    this.xpMaxima = this.nivel * 500;

    // Por ahora ningún usuario es administrador.
    // Después se conectará a la BD.
    this.esAdministrador = false;
    this.administrador = false;

  }

  jugar() {
    this.router.navigate(['/salas']);
  }

  amigos() {
    this.router.navigate(['/amigos']);
  }

  ranking() {
    this.router.navigate(['/ranking']);
  }

  skins() {
    this.router.navigate(['/skins']);
  }

  configuracion() {
    this.router.navigate(['/configuracion']);
  }

  admin() {

    if (!this.esAdministrador) {
      return;
    }

    this.router.navigate(['/admin']);

  }

  cerrarSesion() {

    this.auth.cerrarSesion();

    this.router.navigate(['/login']);

  }

}