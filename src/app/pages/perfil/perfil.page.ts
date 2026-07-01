import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Skin {
  id: number;
  nombre: string;
  categoria: 'Pac-Man' | 'Fantasma' | 'Monstruo';
  rareza: string;
  precio: number;
  estilo: string;
  efecto: string;
  descripcion: string;
  comprada: boolean;
  equipada: boolean;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage {

  constructor(private router: Router) { }

  oro = 15420;

  categoriaActual: 'Pac-Man' | 'Fantasma' | 'Monstruo' = 'Pac-Man';

  rarezaActual = 'Todas';

  skinSeleccionada?: Skin;

  skins: Skin[] = [
    {
      id: 1,
      nombre: 'Clasico',
      categoria: 'Pac-Man',
      rareza: 'ComÃºn',
      precio: 0,
      estilo: 'pacman-classic',
      efecto: 'Estilo original',
      descripcion: 'El Pac-Man original para comenzar la partida.',
      comprada: true,
      equipada: true
    },
    {
      id: 2,
      nombre: 'Hielo',
      categoria: 'Pac-Man',
      rareza: 'Rara',
      precio: 600,
      estilo: 'pacman-ice',
      efecto: 'Brillo frio',
      descripcion: 'Un Pac-Man congelado con energia azul.',
      comprada: false,
      equipada: false
    },
    {
      id: 3,
      nombre: 'Neon',
      categoria: 'Pac-Man',
      rareza: 'Ã‰pica',
      precio: 1800,
      estilo: 'pacman-neon',
      efecto: 'Rastro neon',
      descripcion: 'Ilumina el laberinto con un resplandor verde.',
      comprada: false,
      equipada: false
    },
    {
      id: 4,
      nombre: 'Rey',
      categoria: 'Pac-Man',
      rareza: 'Legendaria',
      precio: 4200,
      estilo: 'pacman-king',
      efecto: 'Corona dorada',
      descripcion: 'Una skin dorada para dominar el mapa.',
      comprada: false,
      equipada: false
    },
    {
      id: 5,
      nombre: 'Galaxia',
      categoria: 'Pac-Man',
      rareza: 'MÃ­tica',
      precio: 9000,
      estilo: 'pacman-galaxy',
      efecto: 'Aura espacial',
      descripcion: 'La skin mas exclusiva del universo Pac-Man.',
      comprada: false,
      equipada: false
    },
    {
      id: 6,
      nombre: 'Fantasma Clasico',
      categoria: 'Fantasma',
      rareza: 'ComÃºn',
      precio: 0,
      estilo: 'ghost-classic',
      efecto: 'Sombra clasica',
      descripcion: 'El fantasma tradicional del laberinto.',
      comprada: true,
      equipada: true
    },
    {
      id: 7,
      nombre: 'Infernal',
      categoria: 'Fantasma',
      rareza: 'Ã‰pica',
      precio: 2200,
      estilo: 'ghost-fire',
      efecto: 'Llamas',
      descripcion: 'Un fantasma que arde durante la persecucion.',
      comprada: false,
      equipada: false
    },
    {
      id: 8,
      nombre: 'Robot',
      categoria: 'Fantasma',
      rareza: 'Legendaria',
      precio: 5200,
      estilo: 'ghost-robot',
      efecto: 'Circuitos',
      descripcion: 'Tecnologia futurista para cazar jugadores.',
      comprada: false,
      equipada: false
    },
    {
      id: 9,
      nombre: 'Oni',
      categoria: 'Monstruo',
      rareza: 'Ã‰pica',
      precio: 2600,
      estilo: 'monster-oni',
      efecto: 'Furia roja',
      descripcion: 'Un monstruo inspirado en leyendas antiguas.',
      comprada: false,
      equipada: false
    },
    {
      id: 10,
      nombre: 'Hydra',
      categoria: 'Monstruo',
      rareza: 'MÃ­tica',
      precio: 9500,
      estilo: 'monster-hydra',
      efecto: 'Poder multiple',
      descripcion: 'El monstruo definitivo para partidas intensas.',
      comprada: false,
      equipada: false
    }
  ];

  jugador = {
    nombre: 'Fabián',
    nivel: 18,
    xp: 1850,
    xpMax: 2500,
    oro: 15420,

    victorias: 182,
    derrotas: 41,

    partidas: 223,

    rolFavorito: 'Pac-Man',

    mapaFavorito: 'Laberinto Maestro',

    pais: 'Costa Rica',

    estado: 'En línea',

    titulo: 'Cazador de Fantasmas',

    porcentaje: 74
  };

  logros = [

    {
      nombre: 'Primer Paso',
      icono:'🏆',
      descripcion:'Completa tu primera partida.'
    },

    {
      nombre:'Come Fantasmas',
      icono:'👻',
      descripcion:'Derrota 50 fantasmas.'
    },

    {
      nombre:'Millonario',
      icono:'🪙',
      descripcion:'Obtén 10 000 monedas.'
    },

    {
      nombre:'Veterano',
      icono:'⭐',
      descripcion:'Juega más de 200 partidas.'
    },

    {
      nombre:'Maestro del Laberinto',
      icono:'🧩',
      descripcion:'Completa todos los mapas.'
    }

  ];

  estadisticas = [

    {
      titulo:'Pac-Man',
      porcentaje:87
    },

    {
      titulo:'Fantasma',
      porcentaje:61
    },

    {
      titulo:'Monstruo',
      porcentaje:42
    }

  ];

  get skinsFiltradas() {
    return this.skins.filter((skin) => {
      const mismaCategoria = skin.categoria === this.categoriaActual;
      const mismaRareza = this.rarezaActual === 'Todas' || skin.rareza === this.rarezaActual;

      return mismaCategoria && mismaRareza;
    });
  }

  volverMenu() {
    this.router.navigate(['/menu']);
  }

  cambiarCategoria(categoria: 'Pac-Man' | 'Fantasma' | 'Monstruo') {
    this.categoriaActual = categoria;
    this.skinSeleccionada = this.skinsFiltradas[0];
  }

  cambiarRareza(rareza: string) {
    this.rarezaActual = rareza;
    this.skinSeleccionada = this.skinsFiltradas[0];
  }

  seleccionarSkin(skin: Skin) {
    this.skinSeleccionada = skin;
  }

  comprarSkin() {
    if (!this.skinSeleccionada || this.skinSeleccionada.comprada) {
      return;
    }

    if (this.oro < this.skinSeleccionada.precio) {
      return;
    }

    this.oro -= this.skinSeleccionada.precio;
    this.skinSeleccionada.comprada = true;
  }

  equiparSkin() {
    if (!this.skinSeleccionada || !this.skinSeleccionada.comprada) {
      return;
    }

    this.skins
      .filter((skin) => skin.categoria === this.skinSeleccionada?.categoria)
      .forEach((skin) => {
        skin.equipada = false;
      });

    this.skinSeleccionada.equipada = true;
  }
}
