import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seleccion-rol',
  templateUrl: './seleccion-rol.page.html',
  styleUrls: ['./seleccion-rol.page.scss'],
  standalone: false
})
export class SeleccionRolPage {

  rolSeleccionado = '';

  roles = [
    {
      nombre: 'Pac-Man',
      descripcion: 'Corre, come puntos y escapa de los enemigos.',
      icono: '🟡',
      clase: 'pacman',
      cupos: '2/2'
    },
    {
      nombre: 'Fantasma',
      descripcion: 'Persigue a Pac-Man y bloquea su camino.',
      icono: '👻',
      clase: 'fantasma',
      cupos: '1/1'
    },
    {
      nombre: 'Monstruo',
      descripcion: 'Villano especial con poderes únicos.',
      icono: '😈',
      clase: 'monstruo',
      cupos: '1/1'
    }
  ];

  constructor(private router: Router) {}

  seleccionarRol(rol: string) {
    this.rolSeleccionado = rol;
  }

  confirmar() {
    if (!this.rolSeleccionado) {
      alert('Selecciona un personaje antes de continuar.');
      return;
    }

    localStorage.setItem('rolSeleccionado', this.rolSeleccionado);
    this.router.navigate(['/lobby']);
  }

  volver() {
    this.router.navigate(['/lobby']);
  }
}