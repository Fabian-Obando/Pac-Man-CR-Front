import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage {

  nombre = "Fabián";

  nivel = 1;

  monedas = 1500;

  esAdministrador = true;

  administrador = true;

  constructor(private router: Router) {}

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
    this.router.navigate(['/admin']);
  }

}
