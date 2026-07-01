import { Component } from '@angular/core';
import { Router } from '@angular/router';

type CategoriaSkin = 'Pac-Man' | 'Fantasma' | 'Monstruo';
type RarezaSkin = 'Común' | 'Rara' | 'Épica' | 'Legendaria' | 'Mítica';

interface Skin {
  id: number;
  nombre: string;
  categoria: CategoriaSkin;
  rareza: RarezaSkin;
  precio: number;
  descripcion: string;
  estilo: string;
  comprada: boolean;
  equipada: boolean;
}

@Component({
  selector: 'app-skins',
  templateUrl: './skins.page.html',
  styleUrls: ['./skins.page.scss'],
  standalone: false
})
export class SkinsPage {
  oro = 15420;
  categoriaActual: CategoriaSkin = 'Pac-Man';
  rarezaActual: 'Todas' | RarezaSkin = 'Todas';
  skinSeleccionada?: Skin;

  skins: Skin[] = [
    { id: 1, nombre: 'Clásico', categoria: 'Pac-Man', rareza: 'Común', precio: 0, descripcion: 'Pac-Man clásico del laberinto.', estilo: 'pacman classic', comprada: true, equipada: true },
    { id: 2, nombre: 'Hielo', categoria: 'Pac-Man', rareza: 'Rara', precio: 650, descripcion: 'Pac-Man con energía congelada.', estilo: 'pacman ice', comprada: false, equipada: false },
    { id: 3, nombre: 'Lava', categoria: 'Pac-Man', rareza: 'Épica', precio: 1600, descripcion: 'Pac-Man con fuego volcánico.', estilo: 'pacman lava', comprada: false, equipada: false },
    { id: 4, nombre: 'Rey Dorado', categoria: 'Pac-Man', rareza: 'Legendaria', precio: 4300, descripcion: 'Pac-Man con corona dorada.', estilo: 'pacman king', comprada: false, equipada: false },
    { id: 5, nombre: 'Galaxia', categoria: 'Pac-Man', rareza: 'Mítica', precio: 9000, descripcion: 'Pac-Man cósmico con estrellas.', estilo: 'pacman galaxy', comprada: false, equipada: false },

    { id: 6, nombre: 'Rojo', categoria: 'Fantasma', rareza: 'Común', precio: 0, descripcion: 'Fantasma rojo estilo arcade.', estilo: 'ghost red', comprada: true, equipada: true },
    { id: 7, nombre: 'Hielo', categoria: 'Fantasma', rareza: 'Rara', precio: 750, descripcion: 'Fantasma congelado.', estilo: 'ghost ice', comprada: false, equipada: false },
    { id: 8, nombre: 'Sombra', categoria: 'Fantasma', rareza: 'Épica', precio: 1700, descripcion: 'Fantasma oscuro del laberinto.', estilo: 'ghost shadow', comprada: false, equipada: false },
    { id: 9, nombre: 'Plasma', categoria: 'Fantasma', rareza: 'Legendaria', precio: 5200, descripcion: 'Fantasma con electricidad azul.', estilo: 'ghost plasma', comprada: false, equipada: false },
    { id: 10, nombre: 'Cósmico', categoria: 'Fantasma', rareza: 'Mítica', precio: 9200, descripcion: 'Fantasma nacido en el espacio.', estilo: 'ghost cosmic', comprada: false, equipada: false },

    { id: 11, nombre: 'Demonio', categoria: 'Monstruo', rareza: 'Común', precio: 900, descripcion: 'Villano rojo con cuernos.', estilo: 'monster demon', comprada: false, equipada: false },
    { id: 12, nombre: 'Oni', categoria: 'Monstruo', rareza: 'Rara', precio: 1500, descripcion: 'Jefe morado del laberinto.', estilo: 'monster oni', comprada: false, equipada: false },
    { id: 13, nombre: 'Cyborg', categoria: 'Monstruo', rareza: 'Épica', precio: 2700, descripcion: 'Monstruo mecánico futurista.', estilo: 'monster cyborg', comprada: false, equipada: false },
    { id: 14, nombre: 'Dragón', categoria: 'Monstruo', rareza: 'Legendaria', precio: 5600, descripcion: 'Bestia de fuego legendaria.', estilo: 'monster dragon', comprada: false, equipada: false },
    { id: 15, nombre: 'Hydra', categoria: 'Monstruo', rareza: 'Mítica', precio: 9800, descripcion: 'El monstruo supremo de Pac-Man CR.', estilo: 'monster hydra', comprada: false, equipada: false }
  ];

  constructor(private router: Router) {}

  get skinsFiltradas(): Skin[] {
    return this.skins.filter(s =>
      s.categoria === this.categoriaActual &&
      (this.rarezaActual === 'Todas' || s.rareza === this.rarezaActual)
    );
  }

  cambiarCategoria(categoria: CategoriaSkin) {
    this.categoriaActual = categoria;
    this.rarezaActual = 'Todas';
    this.skinSeleccionada = undefined;
  }

  cambiarRareza(rareza: 'Todas' | RarezaSkin) {
    this.rarezaActual = rareza;
  }

  seleccionarSkin(skin: Skin) {
    this.skinSeleccionada = skin;
  }

  comprarSkin() {
    if (!this.skinSeleccionada || this.skinSeleccionada.comprada) return;

    if (this.oro < this.skinSeleccionada.precio) {
      alert('No tienes suficiente oro.');
      return;
    }

    this.oro -= this.skinSeleccionada.precio;
    this.skinSeleccionada.comprada = true;
  }

  equiparSkin() {
    if (!this.skinSeleccionada || !this.skinSeleccionada.comprada) return;

    this.skins
      .filter(s => s.categoria === this.skinSeleccionada?.categoria)
      .forEach(s => s.equipada = false);

    this.skinSeleccionada.equipada = true;
    localStorage.setItem(`skin-${this.skinSeleccionada.categoria}`, this.skinSeleccionada.estilo);
  }

  volverMenu() {
    this.router.navigate(['/menu']);
  }
}