import { Injectable } from '@angular/core';

/*======================================================
  TIPOS
======================================================*/

export type Direccion =
  | 'arriba'
  | 'abajo'
  | 'izquierda'
  | 'derecha';

export type TipoCelda =
  | 'pared'
  | 'punto'
  | 'poder'
  | 'fruta'
  | 'frutaVillana'
  | 'tunel'
  | 'vacia';

export type TipoFrutaPacMan =
  | 'velocidad'
  | 'escudo'
  | 'doblePuntaje'
  | 'vida';

export type TipoFrutaVillano =
  | 'velocidad'
  | 'fuerza'
  | 'congelar'
  | 'vision';

export interface Posicion {
  x: number;
  y: number;
}

export interface CeldaJuego {
  x: number;
  y: number;
  tipo: TipoCelda;
  efecto?: string;
  consumida?: boolean;
}

export interface PersonajeMotor {
  participanteId: number;
  usuarioId: number | null;

  nombreUsuario: string;
  nombreRol: string;

  esBot: boolean;
  esLocal: boolean;

  x: number;
  y: number;

  direccion: Direccion;
  siguienteDireccion: Direccion;

  puntos: number;
  vidas: number;

  vivo: boolean;

  powerActivo: boolean;
  escudoActivo: boolean;
  doblePuntajeActivo: boolean;
  velocidadExtraActiva: boolean;

  skin: string;
}

export interface MapaJuego {
  id: number;
  nombre: string;
  dificultad: string;

  velocidadPacman: number;
  velocidadFantasma: number;
  velocidadMonstruo: number;

  duracion: number;

  layout: string[];
}

export interface ResultadoConsumo {
  consumio: boolean;

  puntosGanados: number;

  oroGanado: number;

  vidasGanadas: number;

  vidasPerdidas: number;

  powerActivado: boolean;

  frutaPacMan?: TipoFrutaPacMan;

  frutaVillano?: TipoFrutaVillano;

  mensaje: string;
}

/*======================================================
  SERVICE
======================================================*/

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {

  /*====================================================
    MAPAS
  ====================================================*/

  readonly mapas: MapaJuego[] = [

    /*==================================================
      MAPA 1 - FÁCIL
    ==================================================*/

    {
      id: 1,
      nombre: 'Laberinto Clásico',
      dificultad: 'Fácil',

      velocidadPacman: 180,
      velocidadFantasma: 230,
      velocidadMonstruo: 250,

      duracion: 180,

      layout: [
        '###########################',
        '#o.........#.#.........o..#',
        '#.###.####.#.#.####.###...#',
        '#.....#.............#.....#',
        '###.#.#.###.#.###.#.#.#####',
        '#...#.....#.#.#.....#.....#',
        '#.#####.#.#.#.#.#.#####.#.#',
        'T.......#...F...#.........T',
        '#.#####.#.#####.#.#####.#.#',
        '#.....#.#...M...#.#.....#.#',
        '#####.#.###.#.###.#.###.#.#',
        '#.....#.....#.....#.....#.#',
        '#.###.#####.#.#####.###.#.#',
        '#o.......................o#',
        '###########################'
      ]
    },

    /*==================================================
      MAPA 2 - NORMAL
    ==================================================*/

    {
      id: 2,
      nombre: 'Cruces de Neón',
      dificultad: 'Normal',

      velocidadPacman: 165,
      velocidadFantasma: 210,
      velocidadMonstruo: 225,

      duracion: 175,

      layout: [
        '###########################',
        '#o....#.......#.......#..o#',
        '#.###.#.#####.#.#####.#.###',
        '#.....#...#.......#...#...#',
        '###.#####.#.#####.#.#####.#',
        '#.........#...#...#.......#',
        '#.#####.#####.#.#####.###.#',
        'T.....#....F.M....#.......T',
        '#.###.#.#########.#.#####.#',
        '#...#.#.....#.....#.#.....#',
        '###.#.#####.#.#####.#.###.#',
        '#...#.......#.......#.....#',
        '#.#####.###.#.###.#####.#.#',
        '#o.......................o#',
        '###########################'
      ]
    },

    /*==================================================
      MAPA 3 - MEDIO
    ==================================================*/

    {
      id: 3,
      nombre: 'Túneles Profundos',
      dificultad: 'Media',

      velocidadPacman: 150,
      velocidadFantasma: 190,
      velocidadMonstruo: 205,

      duracion: 165,

      layout: [
        '#############################',
        '#o.....#.........#.......o..#',
        '#.###.#.#######.#.#####.###.#',
        '#...#.#.....#...#.....#.....#',
        '###.#.#####.#.#######.#.###.#',
        '#...#.....#.#.....#...#...#.#',
        '#.#######.#.#####.#.#####.#.#',
        'T.......#....F.M....#.......T',
        '#.#####.#.#########.#.#####.#',
        '#.....#.#.....#.....#.#.....#',
        '#.###.#.#####.#.#####.#.###.#',
        '#.#...#.......#.......#...#.#',
        '#.#.#######.#.#.#.#######.#.#',
        '#o..........#...#..........o#',
        '#############################'
      ]
    },

    /*==================================================
      MAPA 4 - DIFÍCIL
    ==================================================*/

    {
      id: 4,
      nombre: 'Encierro Volcánico',
      dificultad: 'Difícil',

      velocidadPacman: 140,
      velocidadFantasma: 170,
      velocidadMonstruo: 180,

      duracion: 155,

      layout: [
        '###############################',
        '#o.....#.....#.....#.....#...o#',
        '#.###.#.###.#.###.#.###.#.###.#',
        '#...#.#...#.#.....#...#.#.....#',
        '###.#.###.#.#######.#.#.###.#.#',
        '#...#.....#...#.....#.....#.#.#',
        '#.#######.###.#.###.#######.#.#',
        'T.......#....F.M....#.........T',
        '#.#####.#.#########.#.#######.#',
        '#.....#.#.....#.....#.#.......#',
        '#####.#.#####.#.#####.#.#####.#',
        '#.....#.......#.......#.....#.#',
        '#.#########.#.#.#.#########.#.#',
        '#o..........#...#............o#',
        '###############################'
      ]
    },

    /*==================================================
      MAPA 5 - EXTREMO
    ==================================================*/

    {
      id: 5,
      nombre: 'Laberinto Final',
      dificultad: 'Extrema',

      velocidadPacman: 130,
      velocidadFantasma: 150,
      velocidadMonstruo: 160,

      duracion: 145,

      layout: [
        '#################################',
        '#o....#.....#.......#.....#....o#',
        '#.###.#.###.#.#####.#.###.#.###.#',
        '#...#.#...#.#.....#.#...#.#.....#',
        '###.#.###.#.#####.#.###.#.#####.#',
        '#...#.....#...#...#.....#.....#.#',
        '#.#######.###.#.###.#######.#.#.#',
        'T...........F.M.................T',
        '#.#####.###########.#####.#####.#',
        '#.....#.....#...#.....#.......#.#',
        '#####.#####.#.#.#.#####.#####.#.#',
        '#.....#.....#.#.#.....#.....#...#',
        '#.#####.#####.#.#####.#####.###.#',
        '#o............#...............o#',
        '#################################'
      ]
    }
  ];

  /*====================================================
    OBTENER MAPA
  ====================================================*/

  obtenerMapa(
    mapaId: number
  ): MapaJuego {

    return (
      this.mapas.find(
        mapa => mapa.id === mapaId
      ) ?? this.mapas[0]
    );

  }

  /*====================================================
    CREAR TABLERO
  ====================================================*/

  crearTablero(
    mapaId: number
  ): CeldaJuego[] {

    const mapa =
      this.obtenerMapa(mapaId);

    const celdas: CeldaJuego[] = [];

    mapa.layout.forEach(
      (fila, y) => {

        fila
          .split('')
          .forEach(
            (caracter, x) => {

              celdas.push({
                x,
                y,
                tipo:
                  this.convertirCaracter(
                    caracter
                  ),
                consumida: false
              });

            }
          );

      }
    );

    return celdas;

  }

  /*====================================================
    CONVERTIR CARACTER
  ====================================================*/

  private convertirCaracter(
    caracter: string
  ): TipoCelda {

    switch (caracter) {

      case '#':
        return 'pared';

      case '.':
        return 'punto';

      case 'o':
        return 'poder';

      case 'f':
      case 'F':
        return 'fruta';

      case 'v':
      case 'M':
        return 'frutaVillana';

      case 'T':
        return 'tunel';

      default:
        return 'vacia';

    }

  }

  /*====================================================
    OBTENER CELDA
  ====================================================*/

  obtenerCelda(
    celdas: CeldaJuego[],
    x: number,
    y: number
  ): CeldaJuego | undefined {

    return celdas.find(
      celda =>
        celda.x === x &&
        celda.y === y
    );

  }

  /*====================================================
    CALCULAR MOVIMIENTO
  ====================================================*/

  calcularSiguientePosicion(
    posicion: Posicion,
    direccion: Direccion
  ): Posicion {

    switch (direccion) {

      case 'arriba':

        return {
          x: posicion.x,
          y: posicion.y - 1
        };

      case 'abajo':

        return {
          x: posicion.x,
          y: posicion.y + 1
        };

      case 'izquierda':

        return {
          x: posicion.x - 1,
          y: posicion.y
        };

      case 'derecha':
      default:

        return {
          x: posicion.x + 1,
          y: posicion.y
        };

    }

  }

  /*====================================================
    VALIDAR MOVIMIENTO
  ====================================================*/

  puedeMover(
    celdas: CeldaJuego[],
    posicion: Posicion,
    direccion: Direccion
  ): boolean {

    const destino =
      this.calcularSiguientePosicion(
        posicion,
        direccion
      );

    const celda =
      this.obtenerCelda(
        celdas,
        destino.x,
        destino.y
      );

    /*
     * Si no existe la celda, podría tratarse
     * de un túnel lateral.
     */
    if (!celda) {

      return this.esSalidaTunel(
        celdas,
        posicion,
        direccion
      );

    }

    return celda.tipo !== 'pared';

  }

  /*====================================================
    MOVIMIENTO CONTINUO
  ====================================================*/

  moverPersonaje(
    personaje: PersonajeMotor,
    celdas: CeldaJuego[]
  ): PersonajeMotor {

    let direccionUsada =
      personaje.direccion;

    /*
     * Primero intenta utilizar la dirección
     * pendiente marcada por el jugador.
     */
    if (
      this.puedeMover(
        celdas,
        {
          x: personaje.x,
          y: personaje.y
        },
        personaje.siguienteDireccion
      )
    ) {

      direccionUsada =
        personaje.siguienteDireccion;

    }

    /*
     * Si tampoco puede seguir hacia adelante,
     * queda detenido frente a la pared.
     */
    if (
      !this.puedeMover(
        celdas,
        {
          x: personaje.x,
          y: personaje.y
        },
        direccionUsada
      )
    ) {

      return {
        ...personaje,
        direccion: direccionUsada
      };

    }

    let nuevaPosicion =
      this.calcularSiguientePosicion(
        {
          x: personaje.x,
          y: personaje.y
        },
        direccionUsada
      );

    nuevaPosicion =
      this.aplicarTunel(
        celdas,
        nuevaPosicion,
        direccionUsada
      );

    return {
      ...personaje,

      x: nuevaPosicion.x,

      y: nuevaPosicion.y,

      direccion: direccionUsada
    };

  }

  /*====================================================
    IDENTIFICAR SALIDA DE TÚNEL
  ====================================================*/

  private esSalidaTunel(
    celdas: CeldaJuego[],
    posicion: Posicion,
    direccion: Direccion
  ): boolean {

    if (
      direccion !== 'izquierda' &&
      direccion !== 'derecha'
    ) {

      return false;

    }

    const fila =
      celdas.filter(
        celda => celda.y === posicion.y
      );

    if (fila.length === 0) {

      return false;

    }

    const minimoX =
      Math.min(
        ...fila.map(
          celda => celda.x
        )
      );

    const maximoX =
      Math.max(
        ...fila.map(
          celda => celda.x
        )
      );

    return (
      (
        direccion === 'izquierda' &&
        posicion.x <= minimoX
      ) ||
      (
        direccion === 'derecha' &&
        posicion.x >= maximoX
      )
    );

  }

  /*====================================================
    APLICAR TÚNEL
  ====================================================*/

  aplicarTunel(
    celdas: CeldaJuego[],
    posicion: Posicion,
    direccion: Direccion
  ): Posicion {

    if (
      direccion !== 'izquierda' &&
      direccion !== 'derecha'
    ) {

      return posicion;

    }

    const fila =
      celdas.filter(
        celda => celda.y === posicion.y
      );

    if (fila.length === 0) {

      return posicion;

    }

    const minimoX =
      Math.min(
        ...fila.map(
          celda => celda.x
        )
      );

    const maximoX =
      Math.max(
        ...fila.map(
          celda => celda.x
        )
      );

    if (posicion.x < minimoX) {

      return {
        x: maximoX - 1,
        y: posicion.y
      };

    }

    if (posicion.x > maximoX) {

      return {
        x: minimoX + 1,
        y: posicion.y
      };

    }

    return posicion;

  }

  /*====================================================
    POSICIONES INICIALES
  ====================================================*/

  obtenerPosicionesIniciales(
    mapaId: number
  ): {

    pacman: Posicion[];

    villanos: Posicion[];

  } {

    const mapa =
      this.obtenerMapa(mapaId);

    const ancho =
      mapa.layout[0].length;

    const alto =
      mapa.layout.length;

    return {

      pacman: [

        {
          x: 1,
          y: 1
        },

        {
          x: ancho - 2,
          y: alto - 2
        }

      ],

      villanos: [

        {
          x: Math.floor(ancho / 2) - 1,
          y: Math.floor(alto / 2)
        },

        {
          x: Math.floor(ancho / 2) + 1,
          y: Math.floor(alto / 2)
        }

      ]

    };

  }

  /*====================================================
    CONSUMIR CELDA
  ====================================================*/

  consumirCelda(
    celda: CeldaJuego,
    esPacMan: boolean,
    doblePuntajeActivo: boolean
  ): ResultadoConsumo {

    const resultado: ResultadoConsumo = {

      consumio: false,

      puntosGanados: 0,

      oroGanado: 0,

      vidasGanadas: 0,

      vidasPerdidas: 0,

      powerActivado: false,

      mensaje: ''

    };

    if (
      celda.consumida ||
      celda.tipo === 'pared' ||
      celda.tipo === 'vacia'
    ) {

      return resultado;

    }

    /*==================================================
      PUNTO
    ==================================================*/

    if (
      celda.tipo === 'punto' &&
      esPacMan
    ) {

      resultado.consumio = true;

      resultado.puntosGanados =
        doblePuntajeActivo
          ? 20
          : 10;

      resultado.mensaje =
        `+${resultado.puntosGanados}`;

    }

    /*==================================================
      POWER PELLET
    ==================================================*/

    if (
      celda.tipo === 'poder' &&
      esPacMan
    ) {

      resultado.consumio = true;

      resultado.puntosGanados =
        doblePuntajeActivo
          ? 100
          : 50;

      resultado.powerActivado = true;

      resultado.mensaje = 'POWER';

    }

    /*==================================================
      FRUTA DE PAC-MAN
    ==================================================*/

    if (
      celda.tipo === 'fruta' &&
      esPacMan
    ) {

      resultado.consumio = true;

      resultado.puntosGanados =
        doblePuntajeActivo
          ? 300
          : 150;

      resultado.oroGanado = 25;

      resultado.frutaPacMan =
        this.obtenerFrutaPacManAleatoria();

      resultado.mensaje =
        this.obtenerMensajeFrutaPacMan(
          resultado.frutaPacMan
        );

    }

    /*==================================================
      FRUTA DE VILLANO
    ==================================================*/

    if (
      celda.tipo === 'frutaVillana' &&
      !esPacMan
    ) {

      resultado.consumio = true;

      resultado.puntosGanados = 150;

      resultado.frutaVillano =
        this.obtenerFrutaVillanoAleatoria();

      resultado.mensaje =
        this.obtenerMensajeFrutaVillano(
          resultado.frutaVillano
        );

    }

    if (resultado.consumio) {

      celda.consumida = true;

      celda.tipo = 'vacia';

      celda.efecto =
        resultado.mensaje;

    }

    return resultado;

  }

  /*====================================================
    FRUTA PAC-MAN ALEATORIA
  ====================================================*/

  private obtenerFrutaPacManAleatoria():
    TipoFrutaPacMan {

    const frutas: TipoFrutaPacMan[] = [

      'velocidad',

      'escudo',

      'doblePuntaje',

      'vida'

    ];

    return frutas[
      Math.floor(
        Math.random() *
        frutas.length
      )
    ];

  }

  /*====================================================
    FRUTA VILLANO ALEATORIA
  ====================================================*/

  private obtenerFrutaVillanoAleatoria():
    TipoFrutaVillano {

    const frutas: TipoFrutaVillano[] = [

      'velocidad',

      'fuerza',

      'congelar',

      'vision'

    ];

    return frutas[
      Math.floor(
        Math.random() *
        frutas.length
      )
    ];

  }

  /*====================================================
    MENSAJE FRUTA PAC-MAN
  ====================================================*/

  private obtenerMensajeFrutaPacMan(
    fruta: TipoFrutaPacMan
  ): string {

    switch (fruta) {

      case 'velocidad':
        return '⚡ Velocidad';

      case 'escudo':
        return '🛡️ Escudo';

      case 'doblePuntaje':
        return '✨ Puntos x2';

      case 'vida':
        return '❤️ Vida extra';

    }

  }

  /*====================================================
    MENSAJE FRUTA VILLANO
  ====================================================*/

  private obtenerMensajeFrutaVillano(
    fruta: TipoFrutaVillano
  ): string {

    switch (fruta) {

      case 'velocidad':
        return '⚡ Velocidad oscura';

      case 'fuerza':
        return '💥 Fuerza';

      case 'congelar':
        return '❄️ Congelar';

      case 'vision':
        return '👁️ Visión';

    }

  }

  /*====================================================
    PUNTOS RESTANTES
  ====================================================*/

  contarPuntosRestantes(
    celdas: CeldaJuego[]
  ): number {

    return celdas.filter(
      celda =>
        celda.tipo === 'punto' ||
        celda.tipo === 'poder'
    ).length;

  }

  /*====================================================
    DISTANCIA ENTRE PERSONAJES
  ====================================================*/

  distancia(
    origen: Posicion,
    destino: Posicion
  ): number {

    return (
      Math.abs(
        origen.x -
        destino.x
      ) +
      Math.abs(
        origen.y -
        destino.y
      )
    );

  }

  /*====================================================
    DIRECCIÓN CONTRARIA
  ====================================================*/

  direccionContraria(
    direccion: Direccion
  ): Direccion {

    switch (direccion) {

      case 'arriba':
        return 'abajo';

      case 'abajo':
        return 'arriba';

      case 'izquierda':
        return 'derecha';

      case 'derecha':
      default:
        return 'izquierda';

    }

  }

  /*====================================================
    DIRECCIONES DISPONIBLES
  ====================================================*/

  obtenerDireccionesDisponibles(
    personaje: PersonajeMotor,
    celdas: CeldaJuego[],
    permitirReversa: boolean = false
  ): Direccion[] {

    const direcciones: Direccion[] = [

      'arriba',

      'abajo',

      'izquierda',

      'derecha'

    ];

    return direcciones.filter(
      direccion => {

        if (
          !permitirReversa &&
          direccion ===
            this.direccionContraria(
              personaje.direccion
            )
        ) {

          return false;

        }

        return this.puedeMover(

          celdas,

          {
            x: personaje.x,
            y: personaje.y
          },

          direccion

        );

      }
    );

  }

  /*====================================================
    IA: ELEGIR DIRECCIÓN
  ====================================================*/

  elegirDireccionBot(
    personaje: PersonajeMotor,
    objetivo: Posicion,
    celdas: CeldaJuego[],
    agresividad: number
  ): Direccion {

    let opciones =
      this.obtenerDireccionesDisponibles(
        personaje,
        celdas
      );

    if (opciones.length === 0) {

      opciones =
        this.obtenerDireccionesDisponibles(
          personaje,
          celdas,
          true
        );

    }

    if (opciones.length === 0) {

      return personaje.direccion;

    }

    const opcionesOrdenadas =
      [...opciones].sort(
        (direccionA, direccionB) => {

          const posicionA =
            this.calcularSiguientePosicion(
              {
                x: personaje.x,
                y: personaje.y
              },
              direccionA
            );

          const posicionB =
            this.calcularSiguientePosicion(
              {
                x: personaje.x,
                y: personaje.y
              },
              direccionB
            );

          return (
            this.distancia(
              posicionA,
              objetivo
            ) -
            this.distancia(
              posicionB,
              objetivo
            )
          );

        }
      );

    if (
      Math.random() <= agresividad
    ) {

      return opcionesOrdenadas[0];

    }

    return opciones[
      Math.floor(
        Math.random() *
        opciones.length
      )
    ];

  }

}