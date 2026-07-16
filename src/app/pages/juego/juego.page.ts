import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Auth,
  UsuarioSesion
} from '../../services/auth';

import {
  Juego,
  JugadorJuego,
  JuegoService
} from '../../services/juego.service';

import {
  CeldaJuego,
  Direccion,
  GameEngineService,
  MapaJuego,
  PersonajeMotor,
  Posicion,
  TipoFrutaPacMan,
  TipoFrutaVillano
} from '../../services/game-engine.service';

/*======================================================
  TIPOS DE LA PÁGINA
======================================================*/

type VistaJuego =
  | 'cargando'
  | 'jugando'
  | 'victoria'
  | 'derrota'
  | 'error';

type EquipoJuego =
  | 'pacman'
  | 'villanos'
  | '';

/*======================================================
  PERSONAJE UTILIZADO POR LA PÁGINA
======================================================*/

interface PersonajeJuego {

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

  fuerzaActiva: boolean;

  congelado: boolean;

  skin: string;

}

/*======================================================
  COMPONENTE
======================================================*/

@Component({
  selector: 'app-juego',
  templateUrl: './juego.page.html',
  styleUrls: ['./juego.page.scss'],
  standalone: false
})
export class JuegoPage implements OnInit, OnDestroy {

  /*====================================================
    SESIÓN
  ====================================================*/

  usuario!: UsuarioSesion;

  nombreJugador = '';

  oro = 0;

  skinJugador = 'clasica';

  /*====================================================
    NAVEGACIÓN
  ====================================================*/

  salaId = 0;

  partidaId = 0;

  /*====================================================
    BACKEND
  ====================================================*/

  juego?: Juego;

  jugadoresServidor: JugadorJuego[] = [];

  /*====================================================
    PANTALLA
  ====================================================*/

  vista: VistaJuego = 'cargando';

  cargando = true;

  sincronizando = false;

  enviandoMovimiento = false;

  finalizando = false;

  mensaje = '';

  mensajeFinal = '';

  equipoGanador: EquipoJuego = '';

  /*====================================================
    DATOS DEL JUGADOR
  ====================================================*/

  rolJugador = '';

  equipoJugador: EquipoJuego = '';

  puntaje = 0;

  vidas = 3;

  oroGanado = 0;

  powerActivo = false;

  mostrarInfo = false;

  /*====================================================
    PARTIDA
  ====================================================*/

  mapaActual = 1;

  tiempo = 180;

  movimientoActivo = false;

  /*====================================================
    TABLERO Y PERSONAJES
  ====================================================*/

  celdas: CeldaJuego[] = [];

  personajes: PersonajeJuego[] = [];

  personajeLocal?: PersonajeJuego;

  /*====================================================
    MOVIMIENTO ESTILO PAC-MAN
  ====================================================*/

  direccionActual: Direccion = 'derecha';

  siguienteDireccion: Direccion = 'derecha';

  direccionPendiente: Direccion = 'derecha';

  /*====================================================
    CONTROL TÁCTIL
  ====================================================*/

  inicioToqueX = 0;

  inicioToqueY = 0;

  finToqueX = 0;

  finToqueY = 0;

  private readonly distanciaMinimaDeslizamiento = 35;

  /*====================================================
    INTERVALOS
  ====================================================*/

  intervaloMovimiento?: ReturnType<typeof setInterval>;

  intervaloSincronizacion?: ReturnType<typeof setInterval>;

  intervaloTiempo?: ReturnType<typeof setInterval>;

  intervaloBots?: ReturnType<typeof setInterval>;

  /*====================================================
    CONFIGURACIÓN
  ====================================================*/

  private readonly tiempoSincronizacion = 250;

  private readonly ROL_PACMAN = 'pacman';

  private readonly ROL_FANTASMA = 'fantasma';

  private readonly ROL_MONSTRUO = 'monstruo';

  /*====================================================
    CONSTRUCTOR
  ====================================================*/

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private juegoService: JuegoService,
    private gameEngine: GameEngineService
  ) {}

  /*====================================================
    INICIAR COMPONENTE
  ====================================================*/

  ngOnInit(): void {

    const sesion =
      this.auth.obtenerSesion();

    if (!sesion) {

      this.router.navigate(['/login']);

      return;

    }

    this.usuario = sesion;

    this.nombreJugador =
      sesion.nombreUsuario;

    this.oro =
      sesion.oroActual;

    this.skinJugador =
      localStorage.getItem(
        'skinSeleccionada'
      ) ??
      localStorage.getItem(
        'skinJugador'
      ) ??
      'clasica';

    const partidaRecibida =
      Number(
        this.route.snapshot
          .queryParamMap
          .get('partidaId')
      );

    const salaRecibida =
      Number(
        this.route.snapshot
          .queryParamMap
          .get('salaId')
      );

    if (
      !Number.isInteger(partidaRecibida) ||
      partidaRecibida <= 0 ||
      !Number.isInteger(salaRecibida) ||
      salaRecibida <= 0
    ) {

      this.mensaje =
        'No se recibió correctamente la información de la partida.';

      this.vista = 'error';

      this.cargando = false;

      return;

    }

    this.partidaId =
      partidaRecibida;

    this.salaId =
      salaRecibida;

    this.cargarPartida();

  }

  /*====================================================
    DESTRUIR COMPONENTE
  ====================================================*/

  ngOnDestroy(): void {

    this.detenerTodosLosIntervalos();

  }

  /*====================================================
    CARGAR PARTIDA DESDE EL BACKEND
  ====================================================*/

  cargarPartida(): void {

    this.cargando = true;
    this.vista = 'cargando';
    this.mensaje = '';

    this.juegoService
      .obtenerJuego(this.partidaId)
      .subscribe({

        next: (respuesta: Juego) => {

          this.aplicarEstadoServidor(
            respuesta,
            true
          );

          if (!this.personajeLocal) {

            this.cargando = false;
            this.vista = 'error';

            this.mensaje =
              'Tu usuario no aparece como participante de esta partida.';

            return;

          }

          this.prepararMapa();

          this.cargando = false;
          this.vista = 'jugando';

          this.iniciarMovimientoContinuo();
          this.iniciarSincronizacion();
          this.iniciarTemporizador();
          this.iniciarBots();

        },

        error: (error: unknown) => {

          console.error(
            'Error al cargar la partida:',
            error
          );

          this.cargando = false;
          this.vista = 'error';

          this.mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar la partida.'
            );

        }

      });

  }


  /*====================================================
    APLICAR ESTADO RECIBIDO DEL SERVIDOR
  ====================================================*/

  private aplicarEstadoServidor(
    respuesta: Juego,
    cargaInicial: boolean = false
  ): void {

    this.juego = respuesta;

    this.jugadoresServidor =
      respuesta.jugadores ?? [];

    const personajesAnteriores =
      new Map<number, PersonajeJuego>();

    for (const personaje of this.personajes) {

      personajesAnteriores.set(
        personaje.participanteId,
        personaje
      );

    }

    this.personajes =
      this.jugadoresServidor.map(
        (jugador: JugadorJuego) => {

          const anterior =
            personajesAnteriores.get(
              jugador.participanteId
            );

          const esLocal =
            jugador.usuarioId ===
            this.usuario.usuarioId;

          return {

            participanteId:
              jugador.participanteId,

            usuarioId:
              jugador.usuarioId,

            nombreUsuario:
              jugador.nombreUsuario,

            nombreRol:
              jugador.nombreRol,

            esBot:
              jugador.esBot,

            esLocal,

            x:
              esLocal &&
              !cargaInicial &&
              this.personajeLocal
                ? this.personajeLocal.x
                : jugador.posicionX,

            y:
              esLocal &&
              !cargaInicial &&
              this.personajeLocal
                ? this.personajeLocal.y
                : jugador.posicionY,

            direccion:
              anterior?.direccion ??
              'derecha',

            siguienteDireccion:
              anterior?.siguienteDireccion ??
              'derecha',

            puntos:
              jugador.puntos,

            vidas:
              anterior?.vidas ??
              3,

            vivo:
              jugador.vivo,

            powerActivo:
              anterior?.powerActivo ??
              false,

            escudoActivo:
              anterior?.escudoActivo ??
              false,

            doblePuntajeActivo:
              anterior?.doblePuntajeActivo ??
              false,

            velocidadExtraActiva:
              anterior?.velocidadExtraActiva ??
              false,

            fuerzaActiva:
              anterior?.fuerzaActiva ??
              false,

            congelado:
              anterior?.congelado ??
              false,

            skin:
              esLocal
                ? this.skinJugador
                : anterior?.skin ??
                  'clasica'

          };

        }
      );

    this.personajeLocal =
      this.personajes.find(
        personaje =>
          personaje.esLocal
      );

    if (this.personajeLocal) {

      this.nombreJugador =
        this.personajeLocal.nombreUsuario;

      this.rolJugador =
        this.personajeLocal.nombreRol;

      this.puntaje =
        this.personajeLocal.puntos;

      this.vidas =
        this.personajeLocal.vidas;

      this.powerActivo =
        this.personajeLocal.powerActivo;

      this.direccionActual =
        this.personajeLocal.direccion;

      this.siguienteDireccion =
        this.personajeLocal
          .siguienteDireccion;

      this.direccionPendiente =
        this.personajeLocal
          .siguienteDireccion;

      this.equipoJugador =
        this.esRolPacMan(
          this.personajeLocal.nombreRol
        )
          ? 'pacman'
          : 'villanos';

    }

    if (!cargaInicial) {

      this.actualizarPersonajesRemotos(
        this.jugadoresServidor
      );

    }

    if (
      respuesta.partidaFinalizada ||
      respuesta.estadoPartida === 'Finalizada'
    ) {

      this.detenerTodosLosIntervalos();

      this.resolverFinalDesdeServidor();

    }

  }


  /*====================================================
    NORMALIZAR NOMBRE DEL ROL
  ====================================================*/

  private normalizarRol(
    rol: string | null | undefined
  ): string {

    return (rol ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[\s_-]/g,
        ''
      );

  }

  /*====================================================
    VALIDACIONES DE ROLES
  ====================================================*/

  esRolPacMan(
    rol: string | null | undefined
  ): boolean {

    return (
      this.normalizarRol(rol) ===
      this.ROL_PACMAN
    );

  }

  esRolFantasma(
    rol: string | null | undefined
  ): boolean {

    return (
      this.normalizarRol(rol) ===
      this.ROL_FANTASMA
    );

  }

  esRolMonstruo(
    rol: string | null | undefined
  ): boolean {

    return (
      this.normalizarRol(rol) ===
      this.ROL_MONSTRUO
    );

  }

  esPacManLocal(): boolean {

    return this.esRolPacMan(
      this.rolJugador
    );

  }

  esFantasmaLocal(): boolean {

    return this.esRolFantasma(
      this.rolJugador
    );

  }

  esMonstruoLocal(): boolean {

    return this.esRolMonstruo(
      this.rolJugador
    );

  }

  esVillanoLocal(): boolean {

    return (
      this.esFantasmaLocal() ||
      this.esMonstruoLocal()
    );

  }

  /*====================================================
    MAPA SELECCIONADO
  ====================================================*/

  get mapaSeleccionado(): MapaJuego {

    return this.gameEngine.obtenerMapa(
      this.mapaActual
    );

  }

  /*====================================================
    FORMATO DEL TIEMPO
  ====================================================*/

  get tiempoTexto(): string {

    const minutos =
      Math.floor(this.tiempo / 60);

    const segundos =
      this.tiempo % 60;

    return (
      `${minutos}:` +
      `${segundos < 10 ? '0' : ''}` +
      `${segundos}`
    );

  }

  /*====================================================
    PREPARAR MAPA
  ====================================================*/

  private prepararMapa(): void {

    if (
      this.mapaActual < 1 ||
      this.mapaActual > 5
    ) {

      this.mapaActual = 1;

    }

    this.celdas =
      this.gameEngine.crearTablero(
        this.mapaActual
      );

    this.tiempo =
      this.mapaSeleccionado.duracion;

    this.powerActivo = false;

    this.direccionActual =
      'derecha';

    this.siguienteDireccion =
      'derecha';

    this.direccionPendiente =
      'derecha';

    this.asignarPosicionesIniciales();

  }

  /*====================================================
    ASIGNAR POSICIONES INICIALES
  ====================================================*/

  private asignarPosicionesIniciales(): void {

    const posiciones =
      this.gameEngine
        .obtenerPosicionesIniciales(
          this.mapaActual
        );

    let indicePacMan = 0;
    let indiceVillano = 0;

    this.personajes =
      this.personajes.map(
        personaje => {

          const posicion =
            this.esRolPacMan(
              personaje.nombreRol
            )
              ? (
                  posiciones.pacman[
                    indicePacMan++
                  ] ??
                  posiciones.pacman[0]
                )
              : (
                  posiciones.villanos[
                    indiceVillano++
                  ] ??
                  posiciones.villanos[0]
                );

          return {

            ...personaje,

            x:
              posicion.x,

            y:
              posicion.y,

            direccion:
              'derecha',

            siguienteDireccion:
              'derecha'

          };

        }
      );

    this.personajeLocal =
      this.personajes.find(
        personaje =>
          personaje.esLocal
      );

    if (!this.personajeLocal) {

      return;

    }

    this.direccionActual =
      this.personajeLocal.direccion;

    this.siguienteDireccion =
      this.personajeLocal
        .siguienteDireccion;

    this.direccionPendiente =
      this.personajeLocal
        .siguienteDireccion;

    this.enviarMovimientoServidor();

  }

  /*====================================================
    CONTROLES DE TECLADO
  ====================================================*/

  @HostListener(
    'window:keydown',
    ['$event']
  )
  manejarTeclado(
    event: KeyboardEvent
  ): void {

    const tecla =
      event.key.toLowerCase();

    const direcciones:
      Record<string, Direccion> = {

      arrowup:
        'arriba',

      w:
        'arriba',

      arrowdown:
        'abajo',

      s:
        'abajo',

      arrowleft:
        'izquierda',

      a:
        'izquierda',

      arrowright:
        'derecha',

      d:
        'derecha'

    };

    const direccion =
      direcciones[tecla];

    if (!direccion) {

      return;

    }

    event.preventDefault();

    this.cambiarDireccion(
      direccion
    );

  }

  /*====================================================
    INICIAR DESLIZAMIENTO TÁCTIL
  ====================================================*/

  iniciarDeslizamiento(
    event: TouchEvent
  ): void {

    const toque =
      event.changedTouches[0];

    if (!toque) {

      return;

    }

    this.inicioToqueX =
      toque.clientX;

    this.inicioToqueY =
      toque.clientY;

  }

  /*====================================================
    FINALIZAR DESLIZAMIENTO TÁCTIL
  ====================================================*/

  finalizarDeslizamiento(
    event: TouchEvent
  ): void {

    const toque =
      event.changedTouches[0];

    if (!toque) {

      return;

    }

    this.finToqueX =
      toque.clientX;

    this.finToqueY =
      toque.clientY;

    const diferenciaX =
      this.finToqueX -
      this.inicioToqueX;

    const diferenciaY =
      this.finToqueY -
      this.inicioToqueY;

    const distanciaHorizontal =
      Math.abs(diferenciaX);

    const distanciaVertical =
      Math.abs(diferenciaY);

    if (
      distanciaHorizontal <
        this.distanciaMinimaDeslizamiento &&
      distanciaVertical <
        this.distanciaMinimaDeslizamiento
    ) {

      return;

    }

    if (
      distanciaHorizontal >
      distanciaVertical
    ) {

      this.cambiarDireccion(
        diferenciaX > 0
          ? 'derecha'
          : 'izquierda'
      );

      return;

    }

    this.cambiarDireccion(
      diferenciaY > 0
        ? 'abajo'
        : 'arriba'
    );

  }

  /*====================================================
    CAMBIAR DIRECCIÓN
  ====================================================*/

  cambiarDireccion(
    direccion: Direccion
  ): void {

    if (
      this.vista !== 'jugando' ||
      !this.personajeLocal ||
      this.finalizando ||
      !this.personajeLocal.vivo
    ) {

      return;

    }

    this.direccionPendiente =
      direccion;

    this.siguienteDireccion =
      direccion;

    this.personajeLocal
      .siguienteDireccion =
      direccion;

  }

  /*====================================================
    INICIAR SINCRONIZACIÓN CON BACKEND
  ====================================================*/

  private iniciarSincronizacion(): void {

    if (
      this.intervaloSincronizacion
    ) {

      clearInterval(
        this.intervaloSincronizacion
      );

    }

    this.intervaloSincronizacion =
      setInterval(
        () => {

          this.incronizarPartida();

        },
        this.tiempoSincronizacion
      );

  }

  /*====================================================
    SINCRONIZAR PARTIDA
  ====================================================*/

  private soyControladorBots(): boolean {

  const humanos =
    this.personajes
      .filter(
        personaje =>
          !personaje.esBot &&
          personaje.usuarioId !== null
      )
      .sort(
        (a, b) =>
          Number(a.usuarioId) -
          Number(b.usuarioId)
      );

  return (
    humanos.length > 0 &&
    humanos[0].usuarioId ===
    this.usuario.usuarioId
  );

}
  
  incronizarPartida(): void {

    if (
      this.sincronizando ||
      this.finalizando ||
      this.vista !== 'jugando'
    ) {

      return;

    }

    this.sincronizando = true;

    this.juegoService
      .obtenerEstado(
        this.partidaId
      )
      .subscribe({

        next: (respuesta: Juego) => {

          this.aplicarEstadoServidor(
            respuesta,
            false
          );

          this.sincronizando = false;

        },

        error: (error: unknown) => {

          console.error(
            'Error al sincronizar la partida:',
            error
          );

          this.sincronizando = false;

        }

      });

  }

  /*====================================================
    ACTUALIZAR PERSONAJES REMOTOS
  ====================================================*/

  private actualizarPersonajesRemotos(
    jugadores: JugadorJuego[]
  ): void {

    for (
      const jugadorServidor
      of jugadores
    ) {

      if (
        jugadorServidor.usuarioId ===
        this.usuario.usuarioId
      ) {

        continue;

      }

      const personaje =
        this.personajes.find(
          actual =>
            actual.participanteId ===
            jugadorServidor.participanteId
        );

      if (!personaje) {

        continue;

      }

      personaje.x =
        jugadorServidor.posicionX;

      personaje.y =
        jugadorServidor.posicionY;

      personaje.puntos =
        jugadorServidor.puntos;

      personaje.vivo =
        jugadorServidor.vivo;

    }

  }

  /*====================================================
    ENVIAR POSICIÓN AL BACKEND
  ====================================================*/

  private enviarMovimientoServidor(): void {

    if (
      !this.personajeLocal ||
      this.enviandoMovimiento ||
      this.finalizando ||
      !this.partidaId
    ) {

      return;

    }

    this.enviandoMovimiento = true;

    this.juegoService
      .actualizarEstado(
        this.partidaId,
        {

          usuarioId:
            this.usuario.usuarioId,

          posicionX:
            this.personajeLocal.x,

          posicionY:
            this.personajeLocal.y,

          direccion:
            this.personajeLocal.direccion

        }
      )
      .subscribe({

        next: (respuesta: Juego) => {

          this.aplicarEstadoServidor(
            respuesta,
            false
          );

          this.enviandoMovimiento =
            false;

        },

        error: (error: unknown) => {

          console.error(
            'Error al enviar movimiento:',
            error
          );

          this.enviandoMovimiento =
            false;

        }

      });

  }
/*====================================================
    OBTENER VELOCIDAD BASE
  ====================================================*/

  private obtenerVelocidadLocal(): number {

    if (this.esPacManLocal()) {

      return this.mapaSeleccionado
        .velocidadPacman;

    }

    if (this.esRolMonstruo(this.rolJugador)) {

      return this.mapaSeleccionado
        .velocidadMonstruo;

    }

    return this.mapaSeleccionado
      .velocidadFantasma;

  }

  /*====================================================
    VELOCIDAD CON EFECTOS
  ====================================================*/

  private obtenerVelocidadConEfectos(): number {

    let velocidad =
      this.obtenerVelocidadLocal();

    if (
      this.personajeLocal?.velocidadExtraActiva
    ) {

      velocidad = Math.max(
        70,
        Math.floor(velocidad * 0.65)
      );

    }

    if (
      this.personajeLocal?.congelado
    ) {

      velocidad *= 3;

    }

    return velocidad;

  }

  /*====================================================
    INICIAR MOVIMIENTO
  ====================================================*/

  private iniciarMovimientoContinuo(): void {

    if (this.intervaloMovimiento) {

      clearInterval(
        this.intervaloMovimiento
      );

    }

    this.movimientoActivo = true;

    this.intervaloMovimiento =
      setInterval(
        () => {

          if (
            this.vista !== 'jugando' ||
            this.finalizando ||
            !this.movimientoActivo
          ) {

            return;

          }

          this.avanzarPersonajeLocal();

        },
        this.obtenerVelocidadConEfectos()
      );

  }

  /*====================================================
    REINICIAR VELOCIDAD
  ====================================================*/

  private reiniciarMovimientoPorVelocidad(): void {

    if (!this.movimientoActivo) {

      return;

    }

    this.iniciarMovimientoContinuo();

  }

  /*====================================================
    AVANZAR PERSONAJE
  ====================================================*/

  private avanzarPersonajeLocal(): void {

    if (
      !this.personajeLocal ||
      !this.personajeLocal.vivo ||
      this.personajeLocal.congelado
    ) {

      return;

    }

    this.personajeLocal.siguienteDireccion =
      this.direccionPendiente;

    const personajeMotor: PersonajeMotor = {

      participanteId:
        this.personajeLocal.participanteId,

      usuarioId:
        this.personajeLocal.usuarioId,

      nombreUsuario:
        this.personajeLocal.nombreUsuario,

      nombreRol:
        this.personajeLocal.nombreRol,

      esBot:
        this.personajeLocal.esBot,

      esLocal:
        this.personajeLocal.esLocal,

      x:
        this.personajeLocal.x,

      y:
        this.personajeLocal.y,

      direccion:
        this.personajeLocal.direccion,

      siguienteDireccion:
        this.personajeLocal.siguienteDireccion,

      puntos:
        this.personajeLocal.puntos,

      vidas:
        this.personajeLocal.vidas,

      vivo:
        this.personajeLocal.vivo,

      powerActivo:
        this.personajeLocal.powerActivo,

      escudoActivo:
        this.personajeLocal.escudoActivo,

      doblePuntajeActivo:
        this.personajeLocal.doblePuntajeActivo,

      velocidadExtraActiva:
        this.personajeLocal.velocidadExtraActiva,

      skin:
        this.personajeLocal.skin

    };

    const resultado =
      this.gameEngine.moverPersonaje(
        personajeMotor,
        this.celdas
      );

    const seMovio =
      resultado.x !== this.personajeLocal.x ||
      resultado.y !== this.personajeLocal.y;

    this.personajeLocal.x =
      resultado.x;

    this.personajeLocal.y =
      resultado.y;

    this.personajeLocal.direccion =
      resultado.direccion;

    this.personajeLocal.siguienteDireccion =
      resultado.siguienteDireccion;

    this.direccionActual =
      resultado.direccion;

    this.siguienteDireccion =
      resultado.siguienteDireccion;

    if (!seMovio) {

      return;

    }

    this.consumirCeldaLocal();

    this.verificarColisiones();

    this.enviarMovimientoServidor();

  }



    /*====================================================
    CONSUMIR CELDA
  ====================================================*/

  private consumirCeldaLocal(): void {

    if (
      !this.personajeLocal ||
      !this.personajeLocal.vivo
    ) {

      return;

    }

    const celda =
      this.gameEngine.obtenerCelda(

        this.celdas,

        this.personajeLocal.x,

        this.personajeLocal.y

      );

    if (!celda) {

      return;

    }

    const resultado =
      this.gameEngine.consumirCelda(

        celda,

        this.esPacManLocal(),

        this.personajeLocal
          .doblePuntajeActivo

      );

    if (!resultado.consumio) {

      return;

    }

    this.personajeLocal.puntos +=
      resultado.puntosGanados;

    this.puntaje =
      this.personajeLocal.puntos;

    this.oro +=
      resultado.oroGanado;

    this.oroGanado +=
      resultado.oroGanado;

    this.personajeLocal.vidas +=
      resultado.vidasGanadas;

    this.personajeLocal.vidas -=
      resultado.vidasPerdidas;

    this.vidas =
      this.personajeLocal.vidas;

    celda.efecto =
      resultado.mensaje;

    setTimeout(() => {

      celda.efecto = '';

    }, 700);

    if (
      resultado.powerActivado
    ) {

      this.activarPowerPacMan();

    }

    if (
      resultado.frutaPacMan
    ) {

      this.aplicarFrutaPacMan(

        resultado.frutaPacMan

      );

    }

    if (
      resultado.frutaVillano
    ) {

      this.aplicarFrutaVillano(

        resultado.frutaVillano

      );

    }

    this.actualizarMonedasRestantes();

    this.verificarVictoriaPorPuntos();

  }


  /*====================================================
    POWER PELLET
  ====================================================*/

  private activarPowerPacMan(): void {

    if (
      !this.personajeLocal ||
      !this.esPacManLocal()
    ) {

      return;

    }

    this.personajeLocal.powerActivo =
      true;

    this.powerActivo = true;

    setTimeout(() => {

      if (!this.personajeLocal) {

        return;

      }

      this.personajeLocal.powerActivo =
        false;

      this.powerActivo = false;

    }, 8000);

  }

  /*====================================================
    FRUTAS PACMAN
  ====================================================*/

  private aplicarFrutaPacMan(
    fruta: TipoFrutaPacMan
  ): void {

    if (
      !this.personajeLocal
    ) {

      return;

    }

    switch (fruta) {

      case 'velocidad':

        this.personajeLocal
          .velocidadExtraActiva =
          true;

        this.reiniciarMovimientoPorVelocidad();

        setTimeout(() => {

          if (!this.personajeLocal) {

            return;

          }

          this.personajeLocal
            .velocidadExtraActiva =
            false;

          this.reiniciarMovimientoPorVelocidad();

        }, 7000);

        break;

      case 'escudo':

        this.personajeLocal
          .escudoActivo =
          true;

        setTimeout(() => {

          if (!this.personajeLocal) {

            return;

          }

          this.personajeLocal
            .escudoActivo =
            false;

        }, 8000);

        break;

      case 'doblePuntaje':

        this.personajeLocal
          .doblePuntajeActivo =
          true;

        setTimeout(() => {

          if (!this.personajeLocal) {

            return;

          }

          this.personajeLocal
            .doblePuntajeActivo =
            false;

        }, 10000);

        break;

      case 'vida':

        this.personajeLocal.vidas++;

        this.vidas =
          this.personajeLocal.vidas;

        break;

    }
    

  }
  /*====================================================
    FRUTAS DE LOS VILLANOS
  ====================================================*/

  private aplicarFrutaVillano(
    fruta: TipoFrutaVillano
  ): void {

    if (
      !this.personajeLocal ||
      !this.esVillanoLocal()
    ) {

      return;

    }

    switch (fruta) {

      case 'velocidad':

        this.personajeLocal
          .velocidadExtraActiva = true;

        this.reiniciarMovimientoPorVelocidad();

        setTimeout(() => {

          if (!this.personajeLocal) {

            return;

          }

          this.personajeLocal
            .velocidadExtraActiva = false;

          this.reiniciarMovimientoPorVelocidad();

        }, 7000);

        break;

      case 'fuerza':

        this.personajeLocal
          .fuerzaActiva = true;

        setTimeout(() => {

          if (!this.personajeLocal) {

            return;

          }

          this.personajeLocal
            .fuerzaActiva = false;

        }, 8000);

        break;

      case 'congelar':

        this.congelarPacMan();

        break;

      case 'vision':

        this.mostrarInfo = true;

        setTimeout(() => {

          this.mostrarInfo = false;

        }, 8000);

        break;

    }

  }

  /*====================================================
    CONGELAR PACMAN
  ====================================================*/

  private congelarPacMan(): void {

    const pacmans =
      this.personajes.filter(

        personaje =>

          personaje.vivo &&
          this.esRolPacMan(
            personaje.nombreRol
          )

      );

    for (const pacman of pacmans) {

      pacman.congelado = true;

    }

    setTimeout(() => {

      for (const pacman of pacmans) {

        pacman.congelado = false;

      }

    }, 3000);

  }

  /*====================================================
    ACTUALIZAR PUNTOS RESTANTES
  ====================================================*/

  private actualizarMonedasRestantes(): void {

    if (!this.juego) {

      return;

    }

    this.juego.monedasRestantes =
      this.gameEngine
        .contarPuntosRestantes(
          this.celdas
        );

  }

  /*====================================================
    VICTORIA POR PUNTOS
  ====================================================*/

  private verificarVictoriaPorPuntos(): void {

    const restantes =
      this.gameEngine
        .contarPuntosRestantes(
          this.celdas
        );

    if (restantes > 0) {

      return;

    }

    this.finalizarPartidaLocal(

      'pacman',

      'Los Pac-Man consumieron todos los puntos.'

    );

  }
 

  /*====================================================
    COLISIONES
  ====================================================*/

  private verificarColisiones(): void {

    if (!this.personajeLocal) {

      return;

    }

    const enemigos =
      this.personajes.filter(

        personaje =>

          personaje.vivo &&
          personaje.participanteId !==
            this.personajeLocal!.participanteId &&
          this.esRolPacMan(
            personaje.nombreRol
          ) !==
          this.esRolPacMan(
            this.personajeLocal!.nombreRol
          )

      );

    for (const enemigo of enemigos) {

      if (

        enemigo.x !==
          this.personajeLocal.x ||

        enemigo.y !==
          this.personajeLocal.y

      ) {

        continue;

      }

      /*
       * Pac-Man con POWER
       */

      if (

        this.personajeLocal.powerActivo &&
        this.esPacManLocal()

      ) {

        enemigo.vivo = false;

        continue;

      }

      /*
       * Escudo
       */

      if (

        this.personajeLocal
          .escudoActivo

      ) {

        this.personajeLocal
          .escudoActivo = false;

        continue;

      }

      /*
       * Fuerza del villano
       */

      const dano =
        enemigo.fuerzaActiva
          ? 2
          : 1;

      this.personajeLocal.vidas -=
        dano;

      this.vidas =
        this.personajeLocal.vidas;

      if (

        this.personajeLocal.vidas <= 0

      ) {

        this.personajeLocal.vivo =
          false;

        this.finalizarPartidaLocal(

          'villanos',

          'Los villanos eliminaron a Pac-Man.'

        );

      }

    }

  }
  /*====================================================
    TEMPORIZADOR
  ====================================================*/

  private iniciarTemporizador(): void {

    if (this.intervaloTiempo) {

      clearInterval(
        this.intervaloTiempo
      );

    }

    this.intervaloTiempo =
      setInterval(() => {

        if (
          this.vista !== 'jugando' ||
          this.finalizando
        ) {

          return;

        }

        this.tiempo--;

        if (this.tiempo <= 0) {

          this.finalizarPartidaLocal(

            'villanos',

            'Se terminó el tiempo.'

          );

        }

      }, 1000);

  }

  /*====================================================
    INICIAR IA DE BOTS
  ====================================================*/

  private iniciarBots(): void {

    if (!this.soyControladorBots()) {

      return;

    }

    if (this.intervaloBots) {

      clearInterval(
        this.intervaloBots
      );

    }

    this.intervaloBots =
      setInterval(() => {

        if (
          this.vista !== 'jugando' ||
          this.finalizando
        ) {

          return;

        }

        this.moverBots();

      }, Math.min(

        this.mapaSeleccionado
          .velocidadFantasma,

        this.mapaSeleccionado
          .velocidadMonstruo

      ));

  }
    moverBots() {
        throw new Error('Method not implemented.');
    }


  /*====================================================
    FINALIZAR PARTIDA
  ====================================================*/

  private finalizarPartidaLocal(
    ganador: EquipoJuego,
    mensaje: string
  ): void {

    if (this.finalizando) {

      return;

    }

    this.finalizando = true;

    this.detenerTodosLosIntervalos();

    this.equipoGanador =
      ganador;

    this.mensajeFinal =
      mensaje;

    this.vista =
      ganador === this.equipoJugador
        ? 'victoria'
        : 'derrota';

  }

  /*====================================================
    FINAL RECIBIDO DEL SERVIDOR
  ====================================================*/

  private resolverFinalDesdeServidor(): void {

    if (!this.juego) {

      return;

    }

    this.finalizarPartidaLocal(

      this.juego.ganador === 'PacMan'
        ? 'pacman'
        : 'villanos',

      this.juego.mensajeFinal ??
      'La partida terminó.'

    );

  }

  /*====================================================
    MENSAJE DE ERROR
  ====================================================*/

  private obtenerMensajeError(
    error: any,
    defecto: string
  ): string {

    if (
      error?.error?.mensaje
    ) {

      return error.error.mensaje;

    }

    if (
      error?.error?.Message
    ) {

      return error.error.Message;

    }

    if (
      error?.message
    ) {

      return error.message;

    }

    return defecto;

  }

  /*====================================================
    CLASE CSS CELDA
  ====================================================*/

  claseCelda(
    celda: CeldaJuego
  ): string {

    return `celda-${celda.tipo}`;

  }

  /*====================================================
    CONTENIDO CELDA
  ====================================================*/

  contenidoCelda(
    celda: CeldaJuego
  ): string {

    switch (celda.tipo) {

      case 'poder':
        return '●';

      case 'fruta':
        return '🍒';

      case 'frutaVillana':
        return '🫐';

      default:
        return '';

    }

  }

  /*====================================================
    PUNTOS RESTANTES
  ====================================================*/

  puntosRestantes(): number {

    return this.gameEngine
      .contarPuntosRestantes(
        this.celdas
      );

  }

  /*====================================================
    DETENER INTERVALOS
  ====================================================*/

  private detenerTodosLosIntervalos(): void {

    this.movimientoActivo = false;

    if (this.intervaloMovimiento) {

      clearInterval(
        this.intervaloMovimiento
      );

      this.intervaloMovimiento =
        undefined;

    }

    if (this.intervaloSincronizacion) {

      clearInterval(
        this.intervaloSincronizacion
      );

      this.intervaloSincronizacion =
        undefined;

    }

    if (this.intervaloTiempo) {

      clearInterval(
        this.intervaloTiempo
      );

      this.intervaloTiempo =
        undefined;

    }

    if (this.intervaloBots) {

      clearInterval(
        this.intervaloBots
      );

      this.intervaloBots =
        undefined;

    }

  }

}
