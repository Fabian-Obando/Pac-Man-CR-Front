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
  finalize,
  Subject,
  takeUntil
} from 'rxjs';

import {
  Auth,
  UsuarioSesion
} from '../../services/auth';

import {
  Juego,
  JuegoService,
  JugadorJuego,
  MovimientoJuegoRespuesta
} from '../../services/juego.service';


/* ============================================================
   TIPOS
============================================================ */

type DireccionJuego =
  | 'Arriba'
  | 'Abajo'
  | 'Izquierda'
  | 'Derecha';


type TipoMensaje =
  | 'error'
  | 'exito'
  | 'info';


@Component({
  selector: 'app-juego',
  templateUrl: './juego.page.html',
  styleUrls: ['./juego.page.scss'],
  standalone: false
})
export class JuegoPage
  implements OnInit, OnDestroy {


  /* ============================================================
     SESIÓN
  ============================================================ */

  usuario!: UsuarioSesion;


  /* ============================================================
     PARTIDA
  ============================================================ */

  partidaId = 0;

  salaId = 0;

  juego?: Juego;

  jugadorActual?: JugadorJuego;


  /* ============================================================
     ESTADOS DE CARGA
  ============================================================ */

  cargando = true;

  sincronizando = false;

  moviendo = false;

  finalizando = false;

  saliendo = false;


  /* ============================================================
     MENSAJES
  ============================================================ */

  mensaje = '';

  tipoMensaje: TipoMensaje =
    'info';


  /* ============================================================
     DESTRUCCIÓN DE SUSCRIPCIONES

     Evita acumular cientos de Subscription durante
     una partida de varios minutos.
  ============================================================ */

  private readonly destruir$ =
    new Subject<void>();


  /* ============================================================
     MOVIMIENTO
  ============================================================ */

  direccionActual:
    DireccionJuego | null = null;


  /*
   * Impide mandar un segundo POST /Mover mientras
   * todavía está respondiendo el anterior.
   */
  private peticionMovimientoActiva =
    false;


  /*
   * Se activa cuando el jugador llega a una pared.
   *
   * El personaje queda detenido hasta que el usuario
   * seleccione otra dirección.
   */
  private movimientoBloqueado =
    false;


  /*
   * Timeout del movimiento continuo.
   *
   * No usamos setInterval porque setTimeout permite
   * esperar a que una petición termine antes de mandar otra.
   */
  private temporizadorMovimiento?:
    ReturnType<typeof setTimeout>;


  /* ============================================================
     VELOCIDAD OPTIMIZADA PARA ANDROID

     Antes:
       normal = 155 ms
       rápida = 105 ms

     Eso podía producir demasiadas peticiones HTTP.

     Ahora:
       normal = 230 ms
       rápida = 165 ms

     Sigue sintiéndose continuo, pero reduce bastante
     la carga del A21s y del Backend.
  ============================================================ */

  private readonly VELOCIDAD_NORMAL =
    230;


  private readonly VELOCIDAD_RAPIDA =
    165;


  /* ============================================================
     DIRECCIÓN VISUAL
  ============================================================ */

  private readonly direccionVisualPorParticipante =
    new Map<
      number,
      DireccionJuego
    >();


  private readonly ultimaPosicionPorParticipante =
    new Map<
      number,
      {
        x: number;
        y: number;
      }
    >();


  /* ============================================================
     SINCRONIZACIÓN
  ============================================================ */

  private intervaloSincronizacion?:
    ReturnType<typeof setInterval>;


  /*
   * Antes:
   * 650 ms.
   *
   * Ahora:
   * 1200 ms.
   *
   * IMPORTANTE:
   *
   * Cada POST /Mover ya devuelve el estado completo,
   * entonces mientras el jugador está caminando
   * NO necesitamos bombardear además GET /Estado.
   */
  private readonly INTERVALO_SINCRONIZACION =
    1200;


  /* ============================================================
     RELOJ
  ============================================================ */

  tiempoVisual = 0;


  private intervaloReloj?:
    ReturnType<typeof setInterval>;


  /*
   * El texto del reloj solamente cambia una vez
   * por segundo.
   *
   * No necesitamos actualizar Angular cada 250 ms.
   */
  private readonly INTERVALO_RELOJ =
    1000;


  private ultimaSincronizacionTiempo =
    Date.now();


  /* ============================================================
     FINAL DE PARTIDA
  ============================================================ */

  private resultadoSolicitado =
    false;


  private navegacionFinalRealizada =
    false;


  /* ============================================================
     CONSTRUCTOR
  ============================================================ */

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly auth: Auth,
    private readonly juegoService: JuegoService
  ) {}


  /* ============================================================
     INICIO
  ============================================================ */

  ngOnInit(): void {

    this.cargarDatosIniciales();

  }


  ionViewWillEnter(): void {

    if (
      this.partidaId > 0 &&
      this.usuario &&
      !this.saliendo &&
      !this.navegacionFinalRealizada
    ) {

      this.iniciarSincronizacion();

      this.iniciarRelojVisual();

    }

  }


  ionViewDidLeave(): void {

    this.detenerMovimiento();

    this.detenerSincronizacion();

    this.detenerRelojVisual();

  }


  ngOnDestroy(): void {

    this.detenerMovimiento();

    this.detenerSincronizacion();

    this.detenerRelojVisual();


    /*
     * Cancela cualquier HTTP que todavía esté vivo.
     */
    this.destruir$.next();

    this.destruir$.complete();


    this.direccionVisualPorParticipante.clear();

    this.ultimaPosicionPorParticipante.clear();

  }


  /* ============================================================
     DATOS INICIALES
  ============================================================ */

  private cargarDatosIniciales(): void {

    const sesion =
      this.auth.obtenerSesion();


    if (!sesion) {

      void this.router.navigate(
        ['/login'],
        {
          replaceUrl: true
        }
      );

      return;

    }


    this.usuario =
      sesion;


    /* =========================================================
       PARTIDA ID
    ========================================================= */

    const partidaRecibida =
      this.route.snapshot
        .queryParamMap
        .get(
          'partidaId'
        );


    const partidaConvertida =
      Number(
        partidaRecibida
      );


    if (
      !partidaRecibida ||
      !Number.isInteger(
        partidaConvertida
      ) ||
      partidaConvertida <= 0
    ) {

      this.mostrarMensaje(
        'No se recibió una partida válida.',
        'error'
      );


      setTimeout(
        () => {

          void this.router.navigate(
            ['/salas'],
            {
              replaceUrl: true
            }
          );

        },
        1000
      );


      return;

    }


    this.partidaId =
      partidaConvertida;


    /* =========================================================
       SALA ID
    ========================================================= */

    const salaRecibida =
      this.route.snapshot
        .queryParamMap
        .get(
          'salaId'
        );


    const salaConvertida =
      Number(
        salaRecibida
      );


    if (
      salaRecibida &&
      Number.isInteger(
        salaConvertida
      ) &&
      salaConvertida > 0
    ) {

      this.salaId =
        salaConvertida;

    }


    this.cargarJuegoInicial();

  }


  /* ============================================================
     CARGAR PARTIDA
  ============================================================ */

  private cargarJuegoInicial(): void {

    if (
      this.partidaId <= 0
    ) {

      return;

    }


    this.cargando =
      true;


    this.limpiarMensaje();


    this.juegoService

      .obtenerJuego(
        this.partidaId
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cargando =
              false;

          }
        )

      )

      .subscribe({

        next: estado => {

          this.aplicarEstado(
            estado
          );


          if (
            !estado.partidaFinalizada
          ) {

            this.iniciarSincronizacion();

            this.iniciarRelojVisual();

          }

        },


        error: error => {

          console.error(
            'Error cargando partida:',
            error
          );


          this.mostrarMensaje(

            this.obtenerMensajeError(
              error,
              'No fue posible cargar la partida.'
            ),

            'error'

          );

        }

      });

  }


  /* ============================================================
     APLICAR ESTADO DEL BACK
  ============================================================ */

  private aplicarEstado(
    estado: Juego
  ): void {

    if (!estado) {

      return;

    }


    /*
     * Primero calculamos las direcciones usando
     * posiciones anteriores.
     */
    this.actualizarDireccionesVisuales(
      estado
    );


    /*
     * Después reemplazamos el estado.
     */
    this.juego =
      estado;


    if (
      estado.salaId > 0
    ) {

      this.salaId =
        estado.salaId;

    }


    /*
     * Sincronizamos el reloj visual con la
     * autoridad del Backend.
     */
    this.tiempoVisual =
      Math.max(
        0,
        Number(
          estado.tiempoRestante ?? 0
        )
      );


    this.ultimaSincronizacionTiempo =
      Date.now();


    this.actualizarJugadorActual();


    if (
      estado.partidaFinalizada ||
      this.normalizarTexto(
        estado.estadoPartida
      ) ===
      'finalizada'
    ) {

      this.procesarFinDePartida();

    }

  }


  /* ============================================================
     JUGADOR ACTUAL
  ============================================================ */

  private actualizarJugadorActual(): void {

    if (
      !this.juego?.jugadores ||
      !this.usuario
    ) {

      this.jugadorActual =
        undefined;

      return;

    }


    const usuarioId =
      Number(
        this.usuario.usuarioId
      );


    const encontrado =
      this.juego.jugadores
        .find(
          jugador =>

            !jugador.esBot

            &&

            Number(
              jugador.usuarioId
            )
            ===
            usuarioId
        );


    this.jugadorActual =
      encontrado;

  }


  /* ============================================================
     SINCRONIZACIÓN MULTIJUGADOR
  ============================================================ */

  private iniciarSincronizacion(): void {

    this.detenerSincronizacion();


    if (
      this.partidaId <= 0 ||
      this.navegacionFinalRealizada
    ) {

      return;

    }


    this.intervaloSincronizacion =
      setInterval(
        () => {

          this.sincronizarEstado();

        },
        this.INTERVALO_SINCRONIZACION
      );

  }


  private detenerSincronizacion(): void {

    if (
      this.intervaloSincronizacion
    ) {

      clearInterval(
        this.intervaloSincronizacion
      );


      this.intervaloSincronizacion =
        undefined;

    }

  }


  /* ============================================================
     SINCRONIZAR ESTADO

     OPTIMIZACIÓN PRINCIPAL:

     mientras estamos caminando y los POST /Mover
     están devolviendo estado, no enviamos GET /Estado
     innecesariamente.
  ============================================================ */

  private sincronizarEstado(): void {

    if (
      this.partidaId <= 0 ||
      this.sincronizando ||
      this.finalizando ||
      this.saliendo ||
      this.navegacionFinalRealizada
    ) {

      return;

    }


    /*
     * Si actualmente hay un POST /Mover en vuelo,
     * esperamos.
     */
    if (
      this.peticionMovimientoActiva
    ) {

      return;

    }


    /*
     * Mientras caminamos libremente recibimos
     * estado en cada respuesta del movimiento.
     *
     * No hace falta simultáneamente GET /Estado.
     */
    if (
      this.direccionActual &&
      !this.movimientoBloqueado &&
      this.puedeControlarJugador()
    ) {

      return;

    }


    this.sincronizando =
      true;


    this.juegoService

      .obtenerEstado(
        this.partidaId
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.sincronizando =
              false;

          }
        )

      )

      .subscribe({

        next: estado => {

          this.aplicarEstado(
            estado
          );

        },


        error: error => {

          /*
           * Una pérdida temporal de sincronización
           * NO expulsa al jugador ni detiene la partida.
           */
          console.warn(
            'Sincronización temporalmente no disponible:',
            error
          );

        }

      });

  }


  /* ============================================================
     ACTUALIZACIÓN MANUAL
  ============================================================ */

  actualizar(): void {

    if (
      this.sincronizando ||
      this.cargando ||
      this.peticionMovimientoActiva
    ) {

      return;

    }


    this.sincronizarEstado();

  }


  /* ============================================================
     RELOJ VISUAL
  ============================================================ */

  private iniciarRelojVisual(): void {

    this.detenerRelojVisual();


    this.intervaloReloj =
      setInterval(
        () => {

          if (
            !this.juego ||
            this.juego.partidaFinalizada
          ) {

            return;

          }


          const ahora =
            Date.now();


          const segundosPasados =
            Math.floor(
              (
                ahora -
                this.ultimaSincronizacionTiempo
              )
              /
              1000
            );


          this.tiempoVisual =
            Math.max(
              0,

              Number(
                this.juego.tiempoRestante
              )
              -
              segundosPasados
            );


          /*
           * Solo cuando llega realmente a cero
           * pedimos confirmación al servidor.
           */
          if (
            this.tiempoVisual <= 0 &&
            !this.sincronizando
          ) {

            this.sincronizarEstado();

          }

        },
        this.INTERVALO_RELOJ
      );

  }


  private detenerRelojVisual(): void {

    if (
      this.intervaloReloj
    ) {

      clearInterval(
        this.intervaloReloj
      );


      this.intervaloReloj =
        undefined;

    }

  }


  /* ============================================================
     CAMBIAR DIRECCIÓN

     Una sola pulsación inicia el movimiento continuo.
  ============================================================ */

  cambiarDireccion(
    direccion: DireccionJuego
  ): void {

    if (
      !this.puedeControlarJugador()
    ) {

      return;

    }


    /*
     * Si ya vamos en esa dirección y no estamos
     * bloqueados, no reiniciamos timers.
     *
     * Esto evita spam por mantener apretado
     * físicamente el botón.
     */
    if (
      this.direccionActual === direccion &&
      !this.movimientoBloqueado
    ) {

      return;

    }


    this.direccionActual =
      direccion;


    if (
      this.jugadorActual
    ) {

      this.direccionVisualPorParticipante
        .set(
          this.jugadorActual.participanteId,
          direccion
        );

    }


    this.movimientoBloqueado =
      false;


    this.detenerTemporizadorMovimiento();


    /*
     * Si un request anterior sigue vivo,
     * esperamos a que termine.
     */
    if (
      this.peticionMovimientoActiva ||
      this.sincronizando
    ) {

      this.programarSiguienteMovimiento(
        80
      );

      return;

    }


    this.ejecutarMovimiento();

  }


  /* ============================================================
     MOVIMIENTO CONTINUO
  ============================================================ */

  private ejecutarMovimiento(): void {

    if (
      !this.direccionActual ||
      !this.puedeControlarJugador() ||
      this.movimientoBloqueado ||
      this.finalizando ||
      this.saliendo
    ) {

      return;

    }


    /*
     * Nunca permitimos más de una solicitud
     * de movimiento simultánea.
     */
    if (
      this.peticionMovimientoActiva
    ) {

      this.programarSiguienteMovimiento(
        70
      );

      return;

    }


    /*
     * Si justo hay una sincronización GET en curso,
     * dejamos que termine.
     */
    if (
      this.sincronizando
    ) {

      this.programarSiguienteMovimiento(
        80
      );

      return;

    }


    const jugador =
      this.jugadorActual;


    if (!jugador) {

      return;

    }


    const direccionEnviada =
      this.direccionActual;


    this.peticionMovimientoActiva =
      true;


    this.moviendo =
      true;


    this.juegoService

      .moverJugador(
        this.partidaId,
        jugador.participanteId,
        this.usuario.usuarioId,
        direccionEnviada
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.peticionMovimientoActiva =
              false;


            this.moviendo =
              false;

          }
        )

      )

      .subscribe({

        next: respuesta => {

          this.procesarRespuestaMovimiento(
            respuesta,
            direccionEnviada
          );

        },


        error: error => {

          console.error(
            'Error moviendo jugador:',
            error
          );


          /*
           * No mandamos inmediatamente al usuario
           * fuera de la partida por un fallo de red.
           */
          this.detenerMovimiento();


          this.mostrarMensaje(

            this.obtenerMensajeError(
              error,
              'Se perdió momentáneamente la conexión con la partida.'
            ),

            'error'

          );


          /*
           * Intentamos volver a sincronizar después
           * sin crear una tormenta de peticiones.
           */
          setTimeout(
            () => {

              if (
                !this.saliendo &&
                !this.navegacionFinalRealizada
              ) {

                this.sincronizarEstado();

              }

            },
            900
          );

        }

      });

  }


  /* ============================================================
     RESPUESTA DE MOVIMIENTO
  ============================================================ */

  private procesarRespuestaMovimiento(
    respuesta: MovimientoJuegoRespuesta,
    direccionEnviada: DireccionJuego
  ): void {

    if (
      respuesta.estado
    ) {

      this.aplicarEstado(
        respuesta.estado
      );

    }


    if (
      respuesta.estado
        ?.partidaFinalizada
    ) {

      this.detenerMovimiento();

      return;

    }


    if (
      respuesta.movimientoRealizado
    ) {

      this.movimientoBloqueado =
        false;


      this.programarSiguienteMovimiento();

      return;

    }


    /* =========================================================
       DIFERENCIAR PARED DE RATE LIMIT

       El Back nuevo puede contestar:

       "Movimiento recibido demasiado rápido."

       Eso NO significa que chocamos con una pared.
    ========================================================= */

    const mensajeNormalizado =
      this.normalizarTexto(
        respuesta.mensaje
      );


    const demasiadoRapido =
      mensajeNormalizado.includes(
        'demasiadorapido'
      )
      ||
      mensajeNormalizado.includes(
        'rapido'
      );


    if (
      demasiadoRapido
    ) {

      this.movimientoBloqueado =
        false;


      this.programarSiguienteMovimiento(
        90
      );


      return;

    }


    /*
     * Si el servidor dice que temporalmente
     * no puede moverse, dejamos que el polling
     * vuelva a actualizarlo.
     */
    const temporalmenteBloqueado =
      mensajeNormalizado.includes(
        'nopuedemoverse'
      )
      ||
      mensajeNormalizado.includes(
        'moment'
      );


    if (
      temporalmenteBloqueado
    ) {

      this.movimientoBloqueado =
        true;


      this.sincronizarEstado();

      return;

    }


    /*
     * Si realmente no avanzó en la dirección,
     * asumimos pared.
     */
    if (
      this.direccionActual ===
      direccionEnviada
    ) {

      this.movimientoBloqueado =
        true;

    }

  }


  /* ============================================================
     PROGRAMAR PRÓXIMO MOVIMIENTO
  ============================================================ */

  private programarSiguienteMovimiento(
    retrasoPersonalizado?: number
  ): void {

    this.detenerTemporizadorMovimiento();


    if (
      !this.direccionActual ||
      this.movimientoBloqueado ||
      !this.puedeControlarJugador() ||
      this.finalizando ||
      this.saliendo
    ) {

      return;

    }


    const velocidad =
      retrasoPersonalizado
      ??
      (
        this.jugadorActual
          ?.velocidadExtraActiva
          ? this.VELOCIDAD_RAPIDA
          : this.VELOCIDAD_NORMAL
      );


    this.temporizadorMovimiento =
      setTimeout(
        () => {

          this.ejecutarMovimiento();

        },
        velocidad
      );

  }


  /* ============================================================
     DETENER TIMER MOVIMIENTO
  ============================================================ */

  private detenerTemporizadorMovimiento(): void {

    if (
      this.temporizadorMovimiento
    ) {

      clearTimeout(
        this.temporizadorMovimiento
      );


      this.temporizadorMovimiento =
        undefined;

    }

  }


  /* ============================================================
     DETENER MOVIMIENTO COMPLETO
  ============================================================ */

  private detenerMovimiento(): void {

    this.detenerTemporizadorMovimiento();


    this.direccionActual =
      null;


    this.movimientoBloqueado =
      false;

  }


  /* ============================================================
     ¿PUEDE CONTROLARSE?
  ============================================================ */

  puedeControlarJugador(): boolean {

    if (
      !this.juego ||
      !this.jugadorActual
    ) {

      return false;

    }


    if (
      this.juego.partidaFinalizada
    ) {

      return false;

    }


    if (
      this.jugadorActual.esBot
    ) {

      return false;

    }


    if (
      !this.jugadorActual.vivo
    ) {

      return false;

    }


    if (
      !this.jugadorActual.puedeMoverse
    ) {

      return false;

    }


    if (
      this.jugadorActual.congelado
    ) {

      return false;

    }


    return true;

  }


  /* ============================================================
     TECLADO PC
  ============================================================ */

  @HostListener(
    'window:keydown',
    ['$event']
  )
  manejarTeclado(
    event: KeyboardEvent
  ): void {

    if (
      this.cargando ||
      this.juego?.partidaFinalizada
    ) {

      return;

    }


    /*
     * Windows manda muchos keydown cuando se mantiene
     * una tecla presionada.
     *
     * Como nuestro personaje ya camina automáticamente,
     * ignoramos las repeticiones.
     */
    if (
      event.repeat
    ) {

      event.preventDefault();

      return;

    }


    switch (
      event.key
    ) {

      case 'ArrowUp':
      case 'w':
      case 'W':

        event.preventDefault();

        this.cambiarDireccion(
          'Arriba'
        );

        break;


      case 'ArrowDown':
      case 's':
      case 'S':

        event.preventDefault();

        this.cambiarDireccion(
          'Abajo'
        );

        break;


      case 'ArrowLeft':
      case 'a':
      case 'A':

        event.preventDefault();

        this.cambiarDireccion(
          'Izquierda'
        );

        break;


      case 'ArrowRight':
      case 'd':
      case 'D':

        event.preventDefault();

        this.cambiarDireccion(
          'Derecha'
        );

        break;

    }

  }


  /* ============================================================
     BOTONES CELULAR / PC
  ============================================================ */

  moverArriba(): void {

    this.cambiarDireccion(
      'Arriba'
    );

  }


  moverAbajo(): void {

    this.cambiarDireccion(
      'Abajo'
    );

  }


  moverIzquierda(): void {

    this.cambiarDireccion(
      'Izquierda'
    );

  }


  moverDerecha(): void {

    this.cambiarDireccion(
      'Derecha'
    );

  }

  /* ============================================================
     OPTIMIZACIÓN DEL TABLERO

     Angular consulta muchas veces las funciones utilizadas
     dentro del *ngFor del laberinto.

     Para evitar trabajo repetitivo en Android mantenemos:
     - Set de celdas consumidas.
     - Índice de jugadores por posición.
  ============================================================ */

  private referenciaCeldasConsumidas?:
    string[];


  private celdasConsumidasSet =
    new Set<string>();


  private referenciaJugadores?:
    JugadorJuego[];


  private jugadoresPorCelda =
    new Map<
      string,
      JugadorJuego[]
    >();


  /* ============================================================
     MAPA
  ============================================================ */

  get filasMapa(): string[] {

    return (
      this.juego?.mapa
      ??
      []
    );

  }


  get columnasMapa(): number {

    if (
      !this.juego?.mapa?.length
    ) {

      return 0;

    }


    return Math.max(
      ...this.juego.mapa.map(
        fila =>
          fila.length
      )
    );

  }


  /* ============================================================
     TRACK BY

     Ayuda a Angular a reutilizar elementos del DOM en vez de
     reconstruirlos innecesariamente.
  ============================================================ */

  trackByFila(
    index: number
  ): number {

    return index;

  }


  trackByJugador(
    index: number,
    jugador: JugadorJuego
  ): number {

    void index;

    return jugador.participanteId;

  }


  /* ============================================================
     OBTENER CELDA
  ============================================================ */

  obtenerCelda(
    x: number,
    y: number
  ): string {

    const fila =
      this.juego?.mapa?.[y];


    if (
      !fila ||
      x < 0 ||
      x >= fila.length
    ) {

      return '#';

    }


    return fila[x];

  }


  /* ============================================================
     CACHÉ CELDAS CONSUMIDAS
  ============================================================ */

  private obtenerSetCeldasConsumidas():
    Set<string> {

    const actuales =
      this.juego?.celdasConsumidas
      ??
      [];


    /*
     * El Back devuelve un nuevo array cuando existe
     * una actualización.
     *
     * Solo reconstruimos el Set cuando cambia esa referencia.
     */
    if (
      this.referenciaCeldasConsumidas !==
      actuales
    ) {

      this.referenciaCeldasConsumidas =
        actuales;


      this.celdasConsumidasSet =
        new Set<string>(
          actuales
        );

    }


    return this.celdasConsumidasSet;

  }


  celdaConsumida(
    x: number,
    y: number
  ): boolean {

    const clave =
      `${x}:${y}`;


    return this
      .obtenerSetCeldasConsumidas()
      .has(
        clave
      );

  }


  /* ============================================================
     TIPOS DE CELDA
  ============================================================ */

  esPared(
    x: number,
    y: number
  ): boolean {

    return (
      this.obtenerCelda(
        x,
        y
      ) === '#'
    );

  }


  esPunto(
    x: number,
    y: number
  ): boolean {

    return (

      this.obtenerCelda(
        x,
        y
      ) === '.'

      &&

      !this.celdaConsumida(
        x,
        y
      )

    );

  }


  esPowerPellet(
    x: number,
    y: number
  ): boolean {

    return (

      this.obtenerCelda(
        x,
        y
      ) === 'o'

      &&

      !this.celdaConsumida(
        x,
        y
      )

    );

  }


  esFrutaPacMan(
    x: number,
    y: number
  ): boolean {

    return (

      this.obtenerCelda(
        x,
        y
      ) === 'F'

      &&

      !this.celdaConsumida(
        x,
        y
      )

    );

  }


  esFrutaVillano(
    x: number,
    y: number
  ): boolean {

    return (

      this.obtenerCelda(
        x,
        y
      ) === 'M'

      &&

      !this.celdaConsumida(
        x,
        y
      )

    );

  }


  esTunel(
    x: number,
    y: number
  ): boolean {

    return (
      this.obtenerCelda(
        x,
        y
      ) === 'T'
    );

  }


  /* ============================================================
     ÍNDICE DE JUGADORES POR CELDA
  ============================================================ */

  private obtenerIndiceJugadores():
    Map<string, JugadorJuego[]> {

    const jugadores =
      this.juego?.jugadores
      ??
      [];


    /*
     * Solo reconstruimos el índice cuando el Back entrega
     * un nuevo array de jugadores.
     */
    if (
      this.referenciaJugadores !==
      jugadores
    ) {

      this.referenciaJugadores =
        jugadores;


      const nuevoIndice =
        new Map<
          string,
          JugadorJuego[]
        >();


      for (
        const jugador
        of jugadores
      ) {

        if (
          !jugador.vivo &&
          jugador.segundosReaparicion <= 0
        ) {

          continue;

        }


        const clave =
          `${jugador.posicionX}:${jugador.posicionY}`;


        const existentes =
          nuevoIndice.get(
            clave
          );


        if (
          existentes
        ) {

          existentes.push(
            jugador
          );

        }
        else {

          nuevoIndice.set(
            clave,
            [
              jugador
            ]
          );

        }

      }


      this.jugadoresPorCelda =
        nuevoIndice;

    }


    return this.jugadoresPorCelda;

  }


  /* ============================================================
     JUGADORES EN CELDA
  ============================================================ */

  jugadoresEnCelda(
    x: number,
    y: number
  ): JugadorJuego[] {

    const clave =
      `${x}:${y}`;


    return (
      this
        .obtenerIndiceJugadores()
        .get(
          clave
        )
      ??
      []
    );

  }


  esJugadorActual(
    jugador: JugadorJuego
  ): boolean {

    return (

      Number(
        jugador.usuarioId
      )

      ===

      Number(
        this.usuario.usuarioId
      )

    );

  }


  /* ============================================================
     ROLES
  ============================================================ */

  esPacMan(
    jugador: JugadorJuego
  ): boolean {

    return (

      this.normalizarTexto(
        jugador.equipo
      ) ===
      'pacman'

      ||

      this.normalizarTexto(
        jugador.rol
      ) ===
      'pacman'

    );

  }


  esFantasma(
    jugador: JugadorJuego
  ): boolean {

    return (

      jugador.rolId === 2

      ||

      this.normalizarTexto(
        jugador.rol
      ).includes(
        'fantasma'
      )

    );

  }


  esMonstruo(
    jugador: JugadorJuego
  ): boolean {

    return (

      jugador.rolId === 3

      ||

      this.normalizarTexto(
        jugador.rol
      ).includes(
        'monstruo'
      )

    );

  }


  esVillano(
    jugador: JugadorJuego
  ): boolean {

    return (
      this.normalizarTexto(
        jugador.equipo
      ) ===
      'villanos'
    );

  }


  /* ============================================================
     SKINS

     Se conserva la skin enviada por el Backend.
  ============================================================ */

  obtenerClaseSkin(
    jugador: JugadorJuego
  ): string {

    if (
      jugador.claseSkin &&
      jugador.claseSkin.trim()
    ) {

      return jugador.claseSkin.trim();

    }


    if (
      this.esFantasma(
        jugador
      )
    ) {

      return 'ghost-rojo';

    }


    if (
      this.esMonstruo(
        jugador
      )
    ) {

      return 'monster-demonio';

    }


    return 'pacman-clasico';

  }


  obtenerNombreSkin(
    jugador?: JugadorJuego
  ): string {

    if (!jugador) {

      return 'Predeterminada';

    }


    if (
      jugador.nombreSkin
    ) {

      return jugador.nombreSkin;

    }


    if (
      this.esFantasma(
        jugador
      )
    ) {

      return 'Rojo';

    }


    if (
      this.esMonstruo(
        jugador
      )
    ) {

      return 'Demonio';

    }


    return 'Clásico';

  }


  /* ============================================================
     DIRECCIÓN VISUAL
  ============================================================ */

  private actualizarDireccionesVisuales(
    estado: Juego
  ): void {

    if (
      !estado?.jugadores
    ) {

      return;

    }


    const columnas =
      Math.max(
        0,
        ...(estado.mapa ?? []).map(
          fila =>
            fila.length
        )
      );


    for (
      const jugador
      of estado.jugadores
    ) {

      const id =
        Number(
          jugador.participanteId
        );


      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {

        continue;

      }


      const actual = {

        x:
          Number(
            jugador.posicionX
          ),

        y:
          Number(
            jugador.posicionY
          )

      };


      const anterior =
        this
          .ultimaPosicionPorParticipante
          .get(
            id
          );


      if (
        anterior
      ) {

        const dx =
          actual.x -
          anterior.x;


        const dy =
          actual.y -
          anterior.y;


        let direccionInferida:
          DireccionJuego | null =
          null;


        /* ======================================================
           MOVIMIENTO HORIZONTAL
        ====================================================== */

        if (
          dx !== 0
        ) {

          /*
           * Cruce por túnel:
           *
           * izquierda:
           * 0 -> última columna
           */
          if (
            columnas > 2 &&
            anterior.x === 0 &&
            actual.x ===
              columnas - 1
          ) {

            direccionInferida =
              'Izquierda';

          }

          /*
           * derecha:
           * última columna -> 0
           */
          else if (
            columnas > 2 &&
            anterior.x ===
              columnas - 1 &&
            actual.x === 0
          ) {

            direccionInferida =
              'Derecha';

          }

          else {

            direccionInferida =
              dx > 0
                ? 'Derecha'
                : 'Izquierda';

          }

        }


        /* ======================================================
           MOVIMIENTO VERTICAL
        ====================================================== */

        else if (
          dy !== 0
        ) {

          direccionInferida =
            dy > 0
              ? 'Abajo'
              : 'Arriba';

        }


        if (
          direccionInferida
        ) {

          this
            .direccionVisualPorParticipante
            .set(
              id,
              direccionInferida
            );

        }

      }


      /*
       * Primera aparición.
       */
      if (
        !this
          .direccionVisualPorParticipante
          .has(
            id
          )
      ) {

        const direccionBackend =
          this.normalizarDireccionVisual(
            jugador.direccion
          );


        this
          .direccionVisualPorParticipante
          .set(
            id,
            direccionBackend
          );

      }


      this
        .ultimaPosicionPorParticipante
        .set(
          id,
          actual
        );

    }

  }


  /* ============================================================
     NORMALIZAR DIRECCIÓN DEL BACK
  ============================================================ */

  private normalizarDireccionVisual(
    direccion:
      string |
      null |
      undefined
  ): DireccionJuego {

    const valor =
      this.normalizarTexto(
        direccion
      );


    switch (
      valor
    ) {

      case 'arriba':

        return 'Arriba';


      case 'abajo':

        return 'Abajo';


      case 'izquierda':

        return 'Izquierda';


      case 'derecha':
      default:

        return 'Derecha';

    }

  }


  /* ============================================================
     OBTENER DIRECCIÓN VISUAL
  ============================================================ */

  obtenerDireccionVisual(
    jugador: JugadorJuego
  ): DireccionJuego {

    /*
     * Para nuestro personaje usamos inmediatamente
     * la dirección pulsada.
     */
    if (
      this.esJugadorActual(
        jugador
      ) &&
      this.direccionActual
    ) {

      return this.direccionActual;

    }


    return (

      this
        .direccionVisualPorParticipante
        .get(
          Number(
            jugador.participanteId
          )
        )

      ??

      this.normalizarDireccionVisual(
        jugador.direccion
      )

    );

  }


  /* ============================================================
     CLASE CSS DE DIRECCIÓN
  ============================================================ */

  obtenerClaseDireccion(
    jugador: JugadorJuego
  ): string {

    switch (
      this.obtenerDireccionVisual(
        jugador
      )
    ) {

      case 'Arriba':

        return 'direccion-arriba';


      case 'Abajo':

        return 'direccion-abajo';


      case 'Izquierda':

        return 'direccion-izquierda';


      case 'Derecha':
      default:

        return 'direccion-derecha';

    }

  }


  /*
   * Compatibilidad con HTML anterior.
   *
   * NO rotamos físicamente el sprite completo.
   */
  obtenerRotacion(
    jugador: JugadorJuego
  ): string {

    void jugador;

    return 'none';

  }


  /* ============================================================
     OPACIDAD
  ============================================================ */

  obtenerOpacidadJugador(
    jugador: JugadorJuego
  ): number {

    if (
      jugador.vivo
    ) {

      return 1;

    }


    if (
      jugador.segundosReaparicion > 0
    ) {

      return 0.35;

    }


    return 0;

  }


  /* ============================================================
     VIDAS
  ============================================================ */

  get vidasActuales(): number {

    if (
      !this.jugadorActual
    ) {

      return 0;

    }


    if (
      !this.esPacMan(
        this.jugadorActual
      )
    ) {

      return 1;

    }


    return Math.max(
      0,
      this.jugadorActual.vidas
    );

  }


  /* ============================================================
     PUNTOS
  ============================================================ */

  get puntosActuales(): number {

    return (
      this.jugadorActual?.puntos
      ??
      0
    );

  }


  /* ============================================================
     ORO
  ============================================================ */

  get oroActual(): number {

    return (
      this.jugadorActual?.oroGanado
      ??
      0
    );

  }


  /* ============================================================
     FRUTAS
  ============================================================ */

  get frutasActuales(): number {

    return (
      this.jugadorActual
        ?.frutasConsumidas
      ??
      0
    );

  }


  /* ============================================================
     EQUIPOS
  ============================================================ */

  get puntosEquipoActual(): number {

    if (
      !this.jugadorActual ||
      !this.juego
    ) {

      return 0;

    }


    return this.esPacMan(
      this.jugadorActual
    )
      ? this.juego.puntosPacMan
      : this.juego.puntosVillanos;

  }


  get puntosEquipoRival(): number {

    if (
      !this.jugadorActual ||
      !this.juego
    ) {

      return 0;

    }


    return this.esPacMan(
      this.jugadorActual
    )
      ? this.juego.puntosVillanos
      : this.juego.puntosPacMan;

  }


  get nombreEquipoActual(): string {

    if (
      !this.jugadorActual
    ) {

      return 'PAC-MAN';

    }


    return this.esPacMan(
      this.jugadorActual
    )
      ? 'PAC-MAN'
      : 'VILLANOS';

  }


  get nombreEquipoRival(): string {

    return (
      this.nombreEquipoActual ===
      'PAC-MAN'
    )
      ? 'VILLANOS'
      : 'PAC-MAN';

  }


  /* ============================================================
     MONEDAS
  ============================================================ */

  get monedasRestantes(): number {

    return (
      this.juego
        ?.monedasRestantes
      ??
      0
    );

  }


  /* ============================================================
     PROGRESO
  ============================================================ */

  get progresoMapa(): number {

    const iniciales =
      this.juego
        ?.monedasIniciales
      ??
      0;


    const restantes =
      this.juego
        ?.monedasRestantes
      ??
      0;


    if (
      iniciales <= 0
    ) {

      return 0;

    }


    const consumidas =
      iniciales -
      restantes;


    return Math.min(
      100,

      Math.max(
        0,

        Math.round(
          (
            consumidas /
            iniciales
          )
          *
          100
        )
      )
    );

  }


  /* ============================================================
     RELOJ
  ============================================================ */

  get tiempoFormateado(): string {

    const total =
      Math.max(
        0,

        Math.floor(
          this.tiempoVisual
        )
      );


    const minutos =
      Math.floor(
        total /
        60
      );


    const segundos =
      total %
      60;


    return (
      `${minutos}:` +
      `${segundos
        .toString()
        .padStart(
          2,
          '0'
        )}`
    );

  }


  /* ============================================================
     NOMBRE MAPA
  ============================================================ */

  get nombreMapa(): string {

    return (
      this.juego?.nombreMapa
      ||
      (
        this.juego?.mapaId
          ? `Laberinto ${this.juego.mapaId}`
          : 'Laberinto'
      )
    );

  }


  /* ============================================================
     DIFICULTAD
  ============================================================ */

  get nombreDificultad(): string {

    return (
      this.juego?.nombreDificultad
      ||
      'Normal'
    );

  }


  /* ============================================================
     OBJETIVO DEL JUGADOR
  ============================================================ */

  get objetivoJugador(): string {

    if (
      !this.jugadorActual
    ) {

      return '';

    }


    if (
      this.esPacMan(
        this.jugadorActual
      )
    ) {

      return (
        'Comé todos los puntos del laberinto y sobreviví a los villanos.'
      );

    }


    if (
      this.esFantasma(
        this.jugadorActual
      )
    ) {

      return (
        'Perseguí a los Pac-Man y evitá que limpien el laberinto.'
      );

    }


    return (
      'Cazá a los Pac-Man y utiliza las frutas especiales para dominar el mapa.'
    );

  }


  /* ============================================================
     PODERES ACTIVOS
  ============================================================ */

  get poderesActivos(): string[] {

    const jugador =
      this.jugadorActual;


    if (!jugador) {

      return [];

    }


    const poderes:
      string[] = [];


    if (
      jugador.powerActivo
    ) {

      poderes.push(
        `⚡ Power ${jugador.segundosPower}s`
      );

    }


    if (
      jugador.escudoActivo
    ) {

      poderes.push(
        `🛡️ Escudo ${jugador.segundosEscudo}s`
      );

    }


    if (
      jugador.doblePuntajeActivo
    ) {

      poderes.push(
        `✖2 Puntos ${jugador.segundosDoblePuntaje}s`
      );

    }


    if (
      jugador.velocidadExtraActiva
    ) {

      poderes.push(
        `💨 Velocidad ${jugador.segundosVelocidad}s`
      );

    }


    if (
      jugador.fuerzaActiva
    ) {

      poderes.push(
        `💥 Fuerza ${jugador.segundosFuerza}s`
      );

    }


    if (
      jugador.visionActiva
    ) {

      poderes.push(
        `👁️ Visión ${jugador.segundosVision}s`
      );

    }


    if (
      jugador.congelado
    ) {

      poderes.push(
        `❄️ Congelado ${jugador.segundosCongelado}s`
      );

    }


    return poderes;

  }


  /* ============================================================
     REAPARECIENDO
  ============================================================ */

  get estaReapareciendo(): boolean {

    return Boolean(

      this.jugadorActual

      &&

      !this.jugadorActual.vivo

      &&

      this.jugadorActual.vidas > 0

      &&

      this.jugadorActual
        .segundosReaparicion > 0

    );

  }


  /* ============================================================
     FINALIZAR PARTIDA
  ============================================================ */

  private procesarFinDePartida(): void {

    this.detenerMovimiento();

    this.detenerSincronizacion();

    this.detenerRelojVisual();


    if (
      this.resultadoSolicitado
    ) {

      return;

    }


    this.resultadoSolicitado =
      true;


    this.guardarResultadoFinal();

  }


  private guardarResultadoFinal(): void {

    if (
      this.finalizando ||
      this.partidaId <= 0
    ) {

      return;

    }


    this.finalizando =
      true;


    this.juegoService

      .finalizarPartida(
        this.partidaId
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.finalizando =
              false;

          }
        )

      )

      .subscribe({

        next: respuesta => {

          if (
            respuesta.estado
          ) {

            this.juego =
              respuesta.estado;


            this.actualizarJugadorActual();

          }


          this.mostrarMensaje(

            respuesta.mensaje ||
            'Partida finalizada.',

            'exito'

          );

        },


        error: error => {

          console.error(
            'Error guardando resultado final:',
            error
          );


          this.resultadoSolicitado =
            false;


          this.mostrarMensaje(

            this.obtenerMensajeError(
              error,
              'La partida terminó, pero no fue posible guardar el resultado.'
            ),

            'error'

          );

        }

      });

  }


  /* ============================================================
     ¿GANÓ EL JUGADOR?
  ============================================================ */

  get jugadorGano(): boolean {

    if (
      !this.juego ||
      !this.jugadorActual ||
      !this.juego.partidaFinalizada
    ) {

      return false;

    }


    return (

      this.normalizarTexto(
        this.juego.equipoGanador
      )

      ===

      this.normalizarTexto(
        this.jugadorActual.equipo
      )

    );

  }


  /* ============================================================
     MENSAJE FINAL
  ============================================================ */

  get mensajeFinal(): string {

    if (
      !this.juego
    ) {

      return '';

    }


    if (
      this.juego.mensajeFinal
    ) {

      return this.juego.mensajeFinal;

    }


    return this.jugadorGano
      ? '¡Tu equipo ganó la partida!'
      : 'La partida terminó.';

  }


  /* ============================================================
     NAVEGACIÓN
  ============================================================ */

  volverMenu(): void {

    if (
      this.saliendo
    ) {

      return;

    }


    this.saliendo =
      true;


    this.detenerMovimiento();

    this.detenerSincronizacion();

    this.detenerRelojVisual();


    void this.router.navigate(
      ['/menu'],
      {
        replaceUrl: true
      }
    );

  }


  verRanking(): void {

    this.detenerMovimiento();

    this.detenerSincronizacion();

    this.detenerRelojVisual();


    void this.router.navigate(
      ['/ranking'],
      {
        replaceUrl: true
      }
    );

  }


  /* ============================================================
     ABANDONAR
  ============================================================ */

  abandonarPartida(): void {

    if (
      this.juego?.partidaFinalizada
    ) {

      this.volverMenu();

      return;

    }


    const confirmar =
      window.confirm(
        '¿Seguro que deseas abandonar la partida?'
      );


    if (
      !confirmar
    ) {

      return;

    }


    this.volverMenu();

  }


  /* ============================================================
     PANELES
  ============================================================ */

  mostrarJugadores =
    false;


  alternarJugadores(): void {

    this.mostrarJugadores =
      !this.mostrarJugadores;

  }


  mostrarAyuda =
    false;


  alternarAyuda(): void {

    this.mostrarAyuda =
      !this.mostrarAyuda;

  }


  cerrarPaneles(): void {

    this.mostrarJugadores =
      false;


    this.mostrarAyuda =
      false;

  }


  /* ============================================================
     MENSAJES
  ============================================================ */

  private mostrarMensaje(
    texto: string,
    tipo: TipoMensaje
  ): void {

    this.mensaje =
      texto;


    this.tipoMensaje =
      tipo;

  }


  private limpiarMensaje(): void {

    this.mensaje =
      '';


    this.tipoMensaje =
      'info';

  }


  /* ============================================================
     NORMALIZAR TEXTO
  ============================================================ */

  private normalizarTexto(
    texto:
      string |
      null |
      undefined
  ): string {

    return (
      texto ??
      ''
    )
      .trim()
      .toLowerCase()
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[\s_-]/g,
        ''
      );

  }


  /* ============================================================
     MENSAJE ERROR
  ============================================================ */

  private obtenerMensajeError(
    error: any,
    predeterminado: string
  ): string {

    if (
      typeof error?.error ===
      'string'
    ) {

      return error.error;

    }


    if (
      typeof error?.error?.message ===
      'string'
    ) {

      return error.error.message;

    }


    if (
      typeof error?.error?.mensaje ===
      'string'
    ) {

      return error.error.mensaje;

    }


    if (
      typeof error?.message ===
      'string'
    ) {

      return error.message;

    }


    return predeterminado;

  }

}