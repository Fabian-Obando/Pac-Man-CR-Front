import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

type CellType = 'wall' | 'pellet' | 'power' | 'fruit' | 'villainFruit' | 'empty';
type Direccion = 'derecha' | 'izquierda' | 'arriba' | 'abajo';

interface Cell {
  x: number;
  y: number;
  type: CellType;
  efecto?: string;
}

interface Ghost {
  x: number;
  y: number;
  color: string;
  tipo: 'fantasma' | 'monstruo';
  direccion: Direccion;
}

interface GameMap {
  id: number;
  nombre: string;
  dificultad: string;
  bots: number;
  velocidadPacman: number;
  velocidadBots: number;
  layout: string[];
}

@Component({
  selector: 'app-juego',
  templateUrl: './juego.page.html',
  styleUrls: ['./juego.page.scss'],
  standalone: false
})
export class JuegoPage implements OnDestroy {

vista: 'seleccion' | 'juego' | 'victoria' | 'derrota' = 'seleccion';

  rolJugador = localStorage.getItem('rolSeleccionado') || 'Pac-Man';

  puntaje = 0;
  oro = 1500;
  vidas = 3;
  tiempo = 180;
  mostrarInfo = false;
  powerActivo = false;
  mensajeFinal = '';
  oroGanado = 0;

  mapaActual = 1;
  direccionActual: Direccion = 'derecha';
  siguienteDireccion: Direccion = 'derecha';

  pacmanInicio = { x: 1, y: 1 };
  casaBots = { x: 10, y: 5 };
  pacman = { x: 1, y: 1 };

  celdas: Cell[] = [];
  fantasmas: Ghost[] = [];

  pacmanLoop: any;
  botsLoop: any;
  timerLoop: any;

  mapas: GameMap[] = [
    {
      id: 1,
      nombre: 'Clásico',
      dificultad: 'Fácil',
      bots: 1,
      velocidadPacman: 160,
      velocidadBots: 550,
      layout: [
        '#####################',
        '#.........#.........#',
        '#.###.###.#.###.###.#',
        '#o#.....#...#.....#o#',
        '#.###.#.#####.#.###.#',
        '#.....#...f...#.....#',
        '###.#.###.#.###.#.###',
        '#...#.....#.....#...#',
        '#.#####.#####.#####.#',
        '#.................v.#',
        '#####################'
      ]
    },
    {
      id: 2,
      nombre: 'Cruces',
      dificultad: 'Fácil',
      bots: 2,
      velocidadPacman: 150,
      velocidadBots: 470,
      layout: [
        '#####################',
        '#o......#...#......o#',
        '#.#######.#.#######.#',
        '#.......#.#.#.......#',
        '###.###.#.#.#.###.###',
        '#...#...f...v...#...#',
        '#.###.#######.###.#.#',
        '#.....#.....#.....#.#',
        '#.###.#.###.#.###.#.#',
        '#.....#.....#.......#',
        '#####################'
      ]
    },
    {
      id: 3,
      nombre: 'Túneles',
      dificultad: 'Medio',
      bots: 3,
      velocidadPacman: 140,
      velocidadBots: 390,
      layout: [
        '#######################',
        '#o....#.......#....f.o#',
        '#.###.#.#####.#.###.#.#',
        '#...#.#...#...#.#...#.#',
        '###.#.###.#.###.#.###.#',
        '#...#.....v.....#.....#',
        '#.#####.#####.#####.#.#',
        '#.......#...#.......#.#',
        '#.###.#.#.#.#.#.###.#.#',
        '#...#.#...#...#.#...#.#',
        '#.###.#########.###.#.#',
        '#.....f.......v.....o.#',
        '#######################'
      ]
    },
    {
      id: 4,
      nombre: 'Encierro',
      dificultad: 'Difícil',
      bots: 4,
      velocidadPacman: 130,
      velocidadBots: 310,
      layout: [
        '#########################',
        '#o....#.....#.....#....o#',
        '#.###.#.###.#.###.#.###.#',
        '#...#.#...#...#...#.#...#',
        '###.#.###.#####.###.#.###',
        '#...#.....#...#.....#...#',
        '#.#####.#.#v#.#.#.#####.#',
        '#.......#.....#.......f.#',
        '#.#####.#######.#####.#.#',
        '#...#.....f.v.....#...#.#',
        '###.#.###.#####.###.#.###',
        '#...#.#...#...#...#.#...#',
        '#.###.#.###.#.###.#.###.#',
        '#o....#.....#.....#....o#',
        '#########################'
      ]
    },
    {
      id: 5,
      nombre: 'Final',
      dificultad: 'Extremo',
      bots: 6,
      velocidadPacman: 120,
      velocidadBots: 240,
      layout: [
        '###########################',
        '#o....#.....#...#.....#..o#',
        '#.###.#.###.#.#.#.###.#.###',
        '#...#.#...#...#...#...#...#',
        '###.#.###.#######.###.#.###',
        '#...#.....#.....#.....#...#',
        '#.#####.#.#.###.#.#.#####.#',
        '#.......#...v.v...#.......#',
        '#.#####.###.#.#.###.#####.#',
        '#...f.....#.#.#.#.....f...#',
        '###.#.###.#.#.#.#.###.#.###',
        '#...#.#...#...#...#.#...#.#',
        '#.###.#.###########.#.###.#',
        '#o....#.....v.....#....o..#',
        '###########################'
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnDestroy(): void {
    this.detenerLoops();
  }

  get mapaSeleccionado(): GameMap {
    return this.mapas.find(m => m.id === this.mapaActual) || this.mapas[0];
  }

  get tiempoTexto(): string {
    const min = Math.floor(this.tiempo / 60);
    const sec = this.tiempo % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  seleccionarMapa(id: number) {
    this.mapaActual = id;
  }

  iniciarMapa() {
    this.vista = 'juego';
    this.cargarMapa(this.mapaActual);
    this.iniciarLoops();
  }

  volverSeleccion() {
    this.detenerLoops();
    this.vista = 'seleccion';
    this.mostrarInfo = false;
  }

  cargarMapa(id: number) {
    this.detenerLoops();

    this.mapaActual = id;
    this.puntaje = 0;
    this.vidas = 3;
    this.tiempo = 180;
    this.powerActivo = false;
    this.direccionActual = 'derecha';
    this.siguienteDireccion = 'derecha';
    this.pacman = { ...this.pacmanInicio };
    this.celdas = [];

    this.mapaSeleccionado.layout.forEach((fila, y) => {
      fila.split('').forEach((char, x) => {
        this.celdas.push({ x, y, type: this.convertirCelda(char) });
      });
    });

    this.casaBots = {
      x: Math.floor(this.mapaSeleccionado.layout[0].length / 2),
      y: Math.floor(this.mapaSeleccionado.layout.length / 2)
    };

    this.crearBots(this.mapaSeleccionado.bots);
  }

  iniciarLoops() {
    this.detenerLoops();

    this.pacmanLoop = setInterval(() => {
      this.avanzarPacman();
    }, this.mapaSeleccionado.velocidadPacman);

    this.botsLoop = setInterval(() => {
      this.moverBots();
      this.verificarChoque();
    }, this.mapaSeleccionado.velocidadBots);

    this.timerLoop = setInterval(() => {
      this.tiempo--;

      if (this.tiempo <= 0) {
        this.perderPartida('Se acabó el tiempo.');
      }
    }, 1000);
  }

  detenerLoops() {
    clearInterval(this.pacmanLoop);
    clearInterval(this.botsLoop);
    clearInterval(this.timerLoop);
  }

  convertirCelda(char: string): CellType {
    if (char === '#') return 'wall';
    if (char === '.') return 'pellet';
    if (char === 'o') return 'power';
    if (char === 'f') return 'fruit';
    if (char === 'v') return 'villainFruit';
    return 'empty';
  }

  crearBots(cantidad: number) {
    const colores = ['red', 'cyan', 'pink', 'orange', 'purple', 'white'];

    this.fantasmas = [];

    for (let i = 0; i < cantidad; i++) {
      this.fantasmas.push({
        x: this.casaBots.x + (i % 3) - 1,
        y: this.casaBots.y + Math.floor(i / 3),
        color: colores[i],
        tipo: i === cantidad - 1 && cantidad >= 4 ? 'monstruo' : 'fantasma',
        direccion: 'derecha'
      });
    }
  }

  mover(direccion: Direccion) {
    this.siguienteDireccion = direccion;
  }

  avanzarPacman() {
    if (this.puedeMover(this.siguienteDireccion)) {
      this.direccionActual = this.siguienteDireccion;
    }

    if (!this.puedeMover(this.direccionActual)) {
      return;
    }

    const nuevaPos = this.obtenerNuevaPosicion(
      this.pacman.x,
      this.pacman.y,
      this.direccionActual
    );

    this.pacman = nuevaPos;

    const celda = this.obtenerCelda(nuevaPos.x, nuevaPos.y);

    if (celda) {
      this.comerCelda(celda);
    }

    this.verificarChoque();
    this.verificarVictoria();
  }

  puedeMover(direccion: Direccion): boolean {
    const pos = this.obtenerNuevaPosicion(this.pacman.x, this.pacman.y, direccion);
    const celda = this.obtenerCelda(pos.x, pos.y);
    return !!celda && celda.type !== 'wall';
  }

  obtenerNuevaPosicion(x: number, y: number, direccion: Direccion) {
    if (direccion === 'arriba') return { x, y: y - 1 };
    if (direccion === 'abajo') return { x, y: y + 1 };
    if (direccion === 'izquierda') return { x: x - 1, y };
    return { x: x + 1, y };
  }

  obtenerCelda(x: number, y: number): Cell | undefined {
    return this.celdas.find(c => c.x === x && c.y === y);
  }

  comerCelda(celda: Cell) {
    if (celda.type === 'pellet') {
      this.puntaje += 10;
      celda.efecto = '+10';
      celda.type = 'empty';
    }

    if (celda.type === 'power') {
      this.puntaje += 50;
      this.powerActivo = true;
      celda.efecto = 'POWER';
      celda.type = 'empty';

      setTimeout(() => {
        this.powerActivo = false;
      }, 7000);
    }

    if (celda.type === 'fruit') {
      this.puntaje += 100;
      this.oro += 25;
      celda.efecto = '+100';
      celda.type = 'empty';
    }

    if (celda.type === 'villainFruit') {
      this.vidas--;
      celda.efecto = '-1';
      celda.type = 'empty';

      if (this.vidas <= 0) {
        this.perderPartida('Pac-Man cayó en una fruta villana.');
      }
    }

    if (celda.efecto) {
      setTimeout(() => celda.efecto = '', 450);
    }
  }

  moverBots() {
    const posicionesOcupadas: string[] = [];

    this.fantasmas = this.fantasmas.map((bot, index) => {
      const opciones = [
        { x: bot.x + 1, y: bot.y },
        { x: bot.x - 1, y: bot.y },
        { x: bot.x, y: bot.y + 1 },
        { x: bot.x, y: bot.y - 1 }
      ];

      let libres = opciones.filter(pos => {
        const celda = this.obtenerCelda(pos.x, pos.y);
        const ocupada = posicionesOcupadas.includes(`${pos.x}-${pos.y}`);
        return celda && celda.type !== 'wall' && !ocupada;
      });

      if (libres.length === 0) {
        return bot;
      }

      const objetivo = this.obtenerObjetivoBot(bot, index);

      libres.sort((a, b) => {
        const distA = Math.abs(a.x - objetivo.x) + Math.abs(a.y - objetivo.y);
        const distB = Math.abs(b.x - objetivo.x) + Math.abs(b.y - objetivo.y);
        return distA - distB;
      });

      const agresividad = bot.tipo === 'monstruo'
        ? 0.95
        : this.mapaActual >= 4
          ? 0.82
          : this.mapaActual === 3
            ? 0.70
            : 0.55;

      const destino = Math.random() < agresividad
        ? libres[0]
        : libres[Math.floor(Math.random() * libres.length)];

      const direccion: Direccion =
        destino.x > bot.x ? 'derecha' :
        destino.x < bot.x ? 'izquierda' :
        destino.y > bot.y ? 'abajo' :
        'arriba';

      posicionesOcupadas.push(`${destino.x}-${destino.y}`);

      return {
        ...bot,
        x: destino.x,
        y: destino.y,
        direccion
      };
    });
  }

  obtenerObjetivoBot(bot: Ghost, index: number) {
    if (bot.tipo === 'monstruo') {
      return this.pacman;
    }

    if (bot.color === 'red') {
      return this.pacman;
    }

    if (bot.color === 'pink') {
      return this.obtenerNuevaPosicion(
        this.pacman.x,
        this.pacman.y,
        this.direccionActual
      );
    }

    if (bot.color === 'cyan') {
      return {
        x: Math.max(1, this.pacman.x - 3),
        y: this.pacman.y
      };
    }

    if (bot.color === 'orange') {
      const esquinas = [
        { x: 1, y: 1 },
        { x: this.mapaSeleccionado.layout[0].length - 2, y: 1 },
        { x: 1, y: this.mapaSeleccionado.layout.length - 2 },
        {
          x: this.mapaSeleccionado.layout[0].length - 2,
          y: this.mapaSeleccionado.layout.length - 2
        }
      ];

      return esquinas[index % esquinas.length];
    }

    return {
      x: this.casaBots.x,
      y: this.casaBots.y
    };
  }

  verificarChoque() {
    const bot = this.fantasmas.find(f => f.x === this.pacman.x && f.y === this.pacman.y);

    if (!bot) return;

    if (this.powerActivo && bot.tipo === 'fantasma') {
      this.puntaje += 200;
      bot.x = this.casaBots.x;
      bot.y = this.casaBots.y;
      bot.direccion = 'derecha';
      return;
    }

    const daño = bot.tipo === 'monstruo' ? 2 : 1;
    this.vidas -= daño;

    if (this.vidas <= 0) {
      this.perderPartida(
        bot.tipo === 'monstruo'
          ? 'El monstruo atrapó a Pac-Man.'
          : 'Un fantasma atrapó a Pac-Man.'
      );
      return;
    }

    this.reiniciarPosiciones();
  }

  reiniciarPosiciones() {
    this.pacman = { ...this.pacmanInicio };
    this.direccionActual = 'derecha';
    this.siguienteDireccion = 'derecha';
    this.crearBots(this.mapaSeleccionado.bots);
  }

  verificarVictoria() {
    const quedanBolitas = this.celdas.some(
      c => c.type === 'pellet' || c.type === 'power'
    );

    if (!quedanBolitas) {
      this.ganarPartida();
    }
  }

ganarPartida() {
  this.detenerLoops();

  this.oroGanado = 100 + (this.mapaActual * 50);
  this.oro += this.oroGanado;
  this.mensajeFinal = `Mapa ${this.mapaActual} completado`;

  this.vista = 'victoria';
}

perderPartida(mensaje: string) {
  this.detenerLoops();

  this.mensajeFinal = mensaje;
  this.vista = 'derrota';
}
reintentar() {
  this.cargarMapa(this.mapaActual);
  this.vista = 'juego';
  this.iniciarLoops();
}
siguienteMapa() {
  if (this.mapaActual < 5) {
    this.mapaActual++;
    this.iniciarMapa();
  } else {
    this.vista = 'seleccion';
  }
}
  claseDireccionPacman(): string {
    return `dir-${this.direccionActual}`;
  }

  salir() {
    this.detenerLoops();
    this.router.navigate(['/lobby']);
  }
}
