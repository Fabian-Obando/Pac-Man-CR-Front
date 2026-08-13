import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  finalize,
  Subscription
} from 'rxjs';

import {
  Auth,
  UsuarioSesion
} from '../../services/auth';

import {
  JugadorLobby,
  Lobby,
  LobbyService
} from '../../services/lobby.service';


/* =========================================================
   OPCIÓN DE MAPA
========================================================= */

interface MapaLobbyOpcion {

  id: number;

  nombre: string;

  corto: string;

  icono: string;

  descripcion: string;

}


/* =========================================================
   COMPONENTE
========================================================= */

@Component({

  selector: 'app-lobby',

  templateUrl: './lobby.page.html',

  styleUrls: ['./lobby.page.scss'],

  standalone: false

})
export class LobbyPage
  implements OnInit, OnDestroy {


  /* =========================================================
     USUARIO
  ========================================================= */

  usuario!: UsuarioSesion;


  /* =========================================================
     LOBBY
  ========================================================= */

  lobby?: Lobby;

  salaId = 0;


  /* =========================================================
     ESTADO DE PANTALLA
  ========================================================= */

  cargando = true;

  procesando = false;

  navegandoAJuego = false;


  /* =========================================================
     MENSAJES
  ========================================================= */

  mensaje = '';

  tipoMensaje:
    'error' |
    'exito' |
    'info' = 'info';


  /* =========================================================
     ACTUALIZACIÓN AUTOMÁTICA

     Todos los dispositivos consultan el Lobby cada segundo.
     Así reciben:
     - jugadores
     - roles
     - mapa
     - estados
     - inicio de partida
  ========================================================= */

  private intervalo?:
    ReturnType<typeof setInterval>;

  private readonly TIEMPO_ACTUALIZACION =
    1000;


  /* =========================================================
     SUSCRIPCIONES
  ========================================================= */

  private readonly suscripciones =
    new Subscription();


  /* =========================================================
     ROLES
  ========================================================= */

  readonly ROL_PACMAN =
    1;

  readonly ROL_FANTASMA =
    2;

  readonly ROL_MONSTRUO =
    3;


  /* =========================================================
     LÍMITES DE ROLES
  ========================================================= */

  readonly MAX_PACMAN =
    2;

  readonly MAX_FANTASMA =
    1;

  readonly MAX_MONSTRUO =
    1;


  /* =========================================================
     CINCO LABERINTOS
  ========================================================= */

  readonly MAPAS_DISPONIBLES:
    readonly MapaLobbyOpcion[] = [

    {
      id: 1,
      nombre: 'Laberinto Clásico',
      corto: 'CLÁSICO',
      icono: '🟡',
      descripcion: 'Estilo tradicional y simétrico.'
    },

    {
      id: 2,
      nombre: 'Torres Verticales',
      corto: 'TORRES',
      icono: '🏙️',
      descripcion: 'Pasillos verticales y cambios de carril.'
    },

    {
      id: 3,
      nombre: 'Anillos Neón',
      corto: 'ANILLOS',
      icono: '💫',
      descripcion: 'Anillos interiores para persecuciones.'
    },

    {
      id: 4,
      nombre: 'Cuatro Arenas',
      corto: 'ARENAS',
      icono: '⚔️',
      descripcion: 'Cuatro zonas conectadas por el centro.'
    },

    {
      id: 5,
      nombre: 'Zigzag Final',
      corto: 'ZIGZAG',
      icono: '⚡',
      descripcion: 'Corredores rápidos e impredecibles.'
    }

  ];


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(

    private readonly router: Router,

    private readonly route: ActivatedRoute,

    private readonly auth: Auth,

    private readonly lobbyService: LobbyService

  ) {}


  /* =========================================================
     INIT
  ========================================================= */

  ngOnInit(): void {

    this.cargarSesionYSala();

  }


  /* =========================================================
     IONIC:
     VOLVER A ENTRAR
  ========================================================= */

  ionViewWillEnter(): void {

    if (
      this.salaId > 0 &&
      this.usuario &&
      !this.navegandoAJuego
    ) {

      this.cargarLobby();

      this.iniciarActualizacion();

    }

  }


  /* =========================================================
     IONIC:
     SALIR DE LA VISTA
  ========================================================= */

  ionViewDidLeave(): void {

    this.detenerActualizacion();

  }


  /* =========================================================
     DESTRUIR
  ========================================================= */

  ngOnDestroy(): void {

    this.detenerActualizacion();

    this.suscripciones.unsubscribe();

  }


  /* =========================================================
     SESIÓN + SALA
  ========================================================= */

  private cargarSesionYSala(): void {

    const sesion =
      this.auth.obtenerSesion();


    if (!sesion) {

      this.liberarFoco();

      void this.router.navigate(
        ['/login']
      );

      return;

    }


    this.usuario =
      sesion;


    const idRecibido =
      this.route.snapshot
        .queryParamMap
        .get('salaId');


    const idConvertido =
      Number(
        idRecibido
      );


    if (
      !idRecibido ||
      !Number.isInteger(
        idConvertido
      ) ||
      idConvertido <= 0
    ) {

      this.liberarFoco();

      void this.router.navigate(
        ['/salas']
      );

      return;

    }


    this.salaId =
      idConvertido;


    this.cargarLobby();

    this.iniciarActualizacion();

  }


  /* =========================================================
     POLLING
  ========================================================= */

  private iniciarActualizacion(): void {

    this.detenerActualizacion();


    this.intervalo =
      setInterval(
        () => {

          if (
            this.navegandoAJuego ||
            this.procesando ||
            this.salaId <= 0
          ) {

            return;

          }


          this.cargarLobby(
            false
          );

        },

        this.TIEMPO_ACTUALIZACION
      );

  }


  /* =========================================================
     DETENER POLLING
  ========================================================= */

  private detenerActualizacion(): void {

    if (!this.intervalo) {

      return;

    }


    clearInterval(
      this.intervalo
    );


    this.intervalo =
      undefined;

  }


  /* =========================================================
     OBTENER LOBBY
  ========================================================= */

  cargarLobby(
    mostrarCarga: boolean = true
  ): void {

    if (
      this.salaId <= 0 ||
      this.navegandoAJuego
    ) {

      return;

    }


    if (mostrarCarga) {

      this.cargando =
        true;

    }


    const suscripcion =
      this.lobbyService

        .obtenerLobby(
          this.salaId
        )

        .pipe(

          finalize(
            () => {

              this.cargando =
                false;

            }
          )

        )

        .subscribe({

          next: respuesta => {

            this.procesarLobby(
              respuesta
            );

          },


          error: error => {

            console.error(
              'Error cargando Lobby:',
              error
            );


            if (
              error?.status === 404
            ) {

              this.detenerActualizacion();


              this.mostrarMensaje(
                'La sala ya no está disponible.',
                'error'
              );


              setTimeout(
                () => {

                  this.liberarFoco();

                  void this.router.navigate(
                    ['/salas']
                  );

                },
                900
              );


              return;

            }


            this.mostrarMensaje(

              this.obtenerMensajeError(
                error,
                'No fue posible actualizar el Lobby.'
              ),

              'error'

            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =========================================================
     PROCESAR RESPUESTA
  ========================================================= */

  private procesarLobby(
    respuesta: Lobby
  ): void {

    if (
      this.navegandoAJuego
    ) {

      return;

    }


    this.lobby =
      respuesta;


    const estadoSala =
      this.normalizarTexto(
        respuesta.estadoSala
      );


    const estadoPartida =
      this.normalizarTexto(
        respuesta.estadoPartida
      );


    /* =======================================================
       SALA CERRADA
    ======================================================== */

    if (
      estadoSala === 'cerrada' ||
      estadoPartida === 'cancelada'
    ) {

      this.detenerActualizacion();


      this.mostrarMensaje(
        'La sala fue cerrada por su creador.',
        'error'
      );


      setTimeout(
        () => {

          this.liberarFoco();

          void this.router.navigate(
            ['/salas']
          );

        },
        900
      );


      return;

    }


    /* =======================================================
       PARTIDA INICIADA
    ======================================================== */

    const partidaIniciada =

      estadoPartida === 'jugando'

      ||

      estadoPartida === 'encurso'

      ||

      estadoPartida === 'iniciada'

      ||

      estadoSala === 'jugando';


    if (!partidaIniciada) {

      return;

    }


    const partidaId =
      Number(
        respuesta.partidaId
      );


    if (
      Number.isInteger(
        partidaId
      ) &&
      partidaId > 0
    ) {

      this.irAJuego(
        partidaId
      );

      return;

    }


    this.mostrarMensaje(
      'La partida inició, pero el servidor no devolvió PartidaId.',
      'error'
    );

  }


  /* =========================================================
     ACTUALIZAR MANUAL
  ========================================================= */

  actualizarLobby(): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    this.cargarLobby();

  }


  /* =========================================================
     CREADOR
  ========================================================= */

  obtenerCreador():
    JugadorLobby | undefined {

    return this.lobby
      ?.jugadores
      ?.find(
        jugador =>
          jugador.esCreador
      );

  }


  /* =========================================================
     INVITAR AMIGO
  ========================================================= */

  invitarAmigo(): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    if (!this.esCreador()) {

      this.mostrarMensaje(
        'Solo el creador puede invitar jugadores.',
        'error'
      );

      return;

    }


    if (this.salaCompleta()) {

      this.mostrarMensaje(
        'La sala ya está completa.',
        'info'
      );

      return;

    }


    this.liberarFoco();


    void this.router.navigate(
      ['/amigos'],
      {
        queryParams: {

          salaId:
            this.salaId,

          codigoSala:
            this.lobby?.codigoSala

        }
      }
    );

  }


  /* =========================================================
     AGREGAR BOT
  ========================================================= */

  agregarBot(): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    if (!this.esCreador()) {

      this.mostrarMensaje(
        'Solo el creador puede agregar bots.',
        'error'
      );

      return;

    }


    if (this.salaCompleta()) {

      this.mostrarMensaje(
        'La sala ya tiene cuatro participantes.',
        'info'
      );

      return;

    }


    this.procesando =
      true;


    this.limpiarMensaje();


    const suscripcion =
      this.lobbyService

        .agregarBot(
          this.salaId,
          {

            usuarioCreadorId:
              this.usuario.usuarioId,

            rolId:
              0

          }
        )

        .pipe(

          finalize(
            () => {

              this.procesando =
                false;

            }
          )

        )

        .subscribe({

          next: respuesta => {

            this.procesarLobby(
              respuesta
            );


            this.mostrarMensaje(
              'Bot agregado correctamente.',
              'exito'
            );

          },


          error: error => {

            console.error(
              'Error agregando bot:',
              error
            );


            this.mostrarMensaje(

              this.obtenerMensajeError(
                error,
                'No fue posible agregar el bot.'
              ),

              'error'

            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =========================================================
     CAMBIAR ROL
  ========================================================= */

  cambiarRol(
    rolId: number
  ): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    const jugadorActual =
      this.miJugador();


    if (!jugadorActual) {

      this.mostrarMensaje(
        'No apareces como participante del Lobby.',
        'error'
      );

      return;

    }


    if (
      jugadorActual.rolId ===
      rolId
    ) {

      return;

    }


    if (
      !this.rolDisponibleParaUsuario(
        rolId
      )
    ) {

      this.mostrarMensaje(
        this.obtenerMensajeRolLleno(
          rolId
        ),
        'error'
      );

      return;

    }


    this.procesando =
      true;


    this.limpiarMensaje();


    const suscripcion =
      this.lobbyService

        .cambiarRol(
          this.salaId,
          {

            usuarioId:
              this.usuario.usuarioId,

            rolId:
              rolId

          }
        )

        .pipe(

          finalize(
            () => {

              this.procesando =
                false;

            }
          )

        )

        .subscribe({

          next: respuesta => {

            this.procesarLobby(
              respuesta
            );


            this.mostrarMensaje(

              `Personaje cambiado a ${this.obtenerNombreRol(rolId)}.`,

              'exito'

            );

          },


          error: error => {

            console.error(
              'Error cambiando rol:',
              error
            );


            this.mostrarMensaje(

              this.obtenerMensajeError(
                error,
                'No fue posible cambiar el personaje.'
              ),

              'error'

            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =========================================================
     LISTO / NO LISTO
  ========================================================= */

  alternarListo(): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    const jugadorActual =
      this.miJugador();


    if (!jugadorActual) {

      this.mostrarMensaje(
        'No apareces como participante del Lobby.',
        'error'
      );

      return;

    }


    const nuevoEstado =
      this.estaListo()
        ? 'Seleccionando'
        : 'Listo';


    this.procesando =
      true;


    this.limpiarMensaje();


    const suscripcion =
      this.lobbyService

        .cambiarEstado(
          this.salaId,
          {

            usuarioId:
              this.usuario.usuarioId,

            estadoJugador:
              nuevoEstado

          }
        )

        .pipe(

          finalize(
            () => {

              this.procesando =
                false;

            }
          )

        )

        .subscribe({

          next: respuesta => {

            this.procesarLobby(
              respuesta
            );


            if (
              nuevoEstado === 'Listo'
            ) {

              this.mostrarMensaje(
                'Estás listo para comenzar.',
                'exito'
              );

            }

            else {

              this.mostrarMensaje(
                'Puedes volver a cambiar tu personaje.',
                'info'
              );

            }

          },


          error: error => {

            console.error(
              'Error cambiando estado:',
              error
            );


            this.mostrarMensaje(

              this.obtenerMensajeError(
                error,
                'No fue posible cambiar tu estado.'
              ),

              'error'

            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =========================================================
     CAMBIAR MAPA

     NUEVO.
  ========================================================= */

  cambiarMapa(
    mapaId: number
  ): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    if (!this.esCreador()) {

      this.mostrarMensaje(
        'Solo el creador puede cambiar el laberinto.',
        'error'
      );

      return;

    }


    if (
      !Number.isInteger(
        mapaId
      ) ||
      mapaId < 1 ||
      mapaId > 5
    ) {

      this.mostrarMensaje(
        'El laberinto seleccionado no es válido.',
        'error'
      );

      return;

    }


    if (
      this.mapaSeleccionado(
        mapaId
      )
    ) {

      return;

    }


    this.procesando =
      true;


    this.limpiarMensaje();


    const suscripcion =
      this.lobbyService

        .cambiarMapa(
          this.salaId,
          {

            usuarioCreadorId:
              this.usuario.usuarioId,

            mapaId:
              mapaId

          }
        )

        .pipe(

          finalize(
            () => {

              this.procesando =
                false;

            }
          )

        )

        .subscribe({

          next: () => {

            /*
             * Actualizamos inmediatamente para que el creador
             * vea el nuevo mapa sin esperar al siguiente polling.
             */
            if (this.lobby) {

              this.lobby.mapaId =
                mapaId;

            }


            const mapa =
              this.MAPAS_DISPONIBLES
                .find(
                  item =>
                    item.id === mapaId
                );


            this.mostrarMensaje(

              `Laberinto cambiado a ${mapa?.nombre ?? 'Mapa ' + mapaId}.`,

              'exito'

            );


            this.cargarLobby(
              false
            );

          },


          error: error => {

            console.error(
              'Error cambiando mapa:',
              error
            );


            this.mostrarMensaje(

              this.obtenerMensajeError(
                error,
                'No fue posible cambiar el laberinto.'
              ),

              'error'

            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =========================================================
     MAPA SELECCIONADO
  ========================================================= */

  mapaSeleccionado(
    mapaId: number
  ): boolean {

    return (

      Number(
        this.lobby?.mapaId
      )

      ===

      mapaId

    );

  }


  /* =========================================================
     NOMBRE VISUAL DEL MAPA
  ========================================================= */

  obtenerNombreMapaActual(): string {

    const mapaId =
      Number(
        this.lobby?.mapaId
      );


    const encontrado =
      this.MAPAS_DISPONIBLES
        .find(
          mapa =>
            mapa.id === mapaId
        );


    return (

      encontrado?.nombre

      ??

      this.lobby?.nombreMapa

      ??

      'Sin seleccionar'

    );

  }


  /* =========================================================
     INICIAR PARTIDA
  ========================================================= */

  iniciarPartida(): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    if (!this.esCreador()) {

      this.mostrarMensaje(
        'Solo el creador puede iniciar la partida.',
        'error'
      );

      return;

    }


    if (!this.salaCompleta()) {

      this.mostrarMensaje(
        'Se necesitan cuatro participantes.',
        'error'
      );

      return;

    }


    if (!this.distribucionRolesCorrecta()) {

      this.mostrarMensaje(
        'La partida necesita exactamente 2 Pac-Man, 1 Fantasma y 1 Monstruo.',
        'error'
      );

      return;

    }


    if (!this.todosListos()) {

      this.mostrarMensaje(
        'Todos los participantes deben estar listos.',
        'error'
      );

      return;

    }


    if (
      !this.lobby?.mapaId ||
      this.lobby.mapaId < 1 ||
      this.lobby.mapaId > 5
    ) {

      this.mostrarMensaje(
        'Selecciona un laberinto antes de iniciar.',
        'error'
      );

      return;

    }


    this.procesando =
      true;


    this.limpiarMensaje();


    const suscripcion =
      this.lobbyService

        .iniciarPartida(
          this.salaId,
          {

            usuarioCreadorId:
              this.usuario.usuarioId

          }
        )

        .pipe(

          finalize(
            () => {

              this.procesando =
                false;

            }
          )

        )

        .subscribe({

          next: respuesta => {

            this.procesarLobby(
              respuesta
            );


            if (
              this.navegandoAJuego
            ) {

              return;

            }


            const partidaId =
              Number(
                respuesta.partidaId
              );


            if (
              Number.isInteger(
                partidaId
              ) &&
              partidaId > 0
            ) {

              this.irAJuego(
                partidaId
              );

              return;

            }


            this.mostrarMensaje(
              'La partida inició, pero no se recibió un PartidaId válido.',
              'error'
            );

          },


          error: error => {

            console.error(
              'Error iniciando partida:',
              error
            );


            this.mostrarMensaje(

              this.obtenerMensajeError(
                error,
                'No fue posible iniciar la partida.'
              ),

              'error'

            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =========================================================
     IR AL JUEGO
  ========================================================= */

  private irAJuego(
    partidaId: number
  ): void {

    if (
      this.navegandoAJuego
    ) {

      return;

    }


    if (
      !Number.isInteger(
        partidaId
      ) ||
      partidaId <= 0
    ) {

      this.mostrarMensaje(
        'No se recibió un identificador válido para la partida.',
        'error'
      );

      return;

    }


    this.navegandoAJuego =
      true;


    this.detenerActualizacion();


    /*
     * Esto también ayuda con el warning:
     * "Blocked aria-hidden because descendant retained focus".
     */
    this.liberarFoco();


    void this.router.navigate(
      ['/juego'],
      {

        queryParams: {

          salaId:
            this.salaId,

          partidaId:
            partidaId

        },

        replaceUrl:
          true

      }
    );

  }


  /* =========================================================
     CERRAR SALA
  ========================================================= */

  cerrarSala(): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    if (!this.esCreador()) {

      this.mostrarMensaje(
        'Solo el creador puede cerrar la sala.',
        'error'
      );

      return;

    }


    const confirmar =
      window.confirm(
        '¿Deseas cerrar esta sala? Todos los participantes saldrán del Lobby.'
      );


    if (!confirmar) {

      return;

    }


    this.ejecutarSalida();

  }


  /* =========================================================
     SALIR
  ========================================================= */

  salir(): void {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return;

    }


    if (this.esCreador()) {

      this.cerrarSala();

      return;

    }


    this.ejecutarSalida();

  }


  volver(): void {

    this.salir();

  }


  /* =========================================================
     EJECUTAR SALIDA
  ========================================================= */

  private ejecutarSalida(): void {

    this.procesando =
      true;


    this.limpiarMensaje();


    const suscripcion =
      this.lobbyService

        .salirLobby(
          this.salaId,
          this.usuario.usuarioId
        )

        .pipe(

          finalize(
            () => {

              this.procesando =
                false;

            }
          )

        )

        .subscribe({

          next: () => {

            this.detenerActualizacion();

            this.liberarFoco();


            void this.router.navigate(
              ['/salas'],
              {
                replaceUrl:
                  true
              }
            );

          },


          error: error => {

            console.error(
              'Error saliendo del Lobby:',
              error
            );


            if (
              error?.status === 404
            ) {

              this.detenerActualizacion();

              this.liberarFoco();


              void this.router.navigate(
                ['/salas'],
                {
                  replaceUrl:
                    true
                }
              );


              return;

            }


            this.mostrarMensaje(

              this.obtenerMensajeError(
                error,
                'No fue posible salir del Lobby.'
              ),

              'error'

            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =========================================================
     MI JUGADOR
  ========================================================= */

  miJugador():
    JugadorLobby | undefined {

    if (
      !this.lobby?.jugadores
    ) {

      return undefined;

    }


    return this.lobby.jugadores
      .find(
        jugador =>

          !jugador.esBot

          &&

          Number(
            jugador.usuarioId
          )
          ===
          Number(
            this.usuario.usuarioId
          )
      );

  }


  /* =========================================================
     ES CREADOR
  ========================================================= */

  esCreador(): boolean {

    return Boolean(

      this.lobby

      &&

      this.usuario

      &&

      Number(
        this.lobby.jugadorCreadorId
      )
      ===
      Number(
        this.usuario.usuarioId
      )

    );

  }


  /* =========================================================
     ESTÁ LISTO
  ========================================================= */

  estaListo(): boolean {

    return (

      this.normalizarTexto(
        this.miJugador()
          ?.estadoJugador
      )

      ===

      'listo'

    );

  }


  /* =========================================================
     TODOS LISTOS
  ========================================================= */

  todosListos(): boolean {

    if (!this.lobby) {

      return false;

    }


    if (
      this.totalJugadores() !==
      this.lobby.maxJugadores
    ) {

      return false;

    }


    return this.lobby.jugadores
      .every(
        jugador =>

          jugador.esBot

          ||

          this.normalizarTexto(
            jugador.estadoJugador
          ) === 'listo'
      );

  }


  /* =========================================================
     TOTAL
  ========================================================= */

  totalJugadores(): number {

    return (

      this.lobby
        ?.jugadores
        ?.length

      ??

      0

    );

  }


  /* =========================================================
     SALA COMPLETA
  ========================================================= */

  salaCompleta(): boolean {

    return (

      this.totalJugadores()

      >=

      (
        this.lobby
          ?.maxJugadores

        ??

        4
      )

    );

  }


  /* =========================================================
     CONTAR ROL
  ========================================================= */

  contarRol(
    rolId: number
  ): number {

    return (

      this.lobby
        ?.jugadores
        ?.filter(
          jugador =>
            jugador.rolId === rolId
        )
        .length

      ??

      0

    );

  }


  /* =========================================================
     ROL DISPONIBLE
  ========================================================= */

  rolDisponible(
    rolId: number
  ): boolean {

    switch (rolId) {

      case this.ROL_PACMAN:

        return (
          this.contarRol(
            rolId
          )
          <
          this.MAX_PACMAN
        );


      case this.ROL_FANTASMA:

        return (
          this.contarRol(
            rolId
          )
          <
          this.MAX_FANTASMA
        );


      case this.ROL_MONSTRUO:

        return (
          this.contarRol(
            rolId
          )
          <
          this.MAX_MONSTRUO
        );


      default:

        return false;

    }

  }


  /* =========================================================
     DISPONIBLE PARA USUARIO
  ========================================================= */

  rolDisponibleParaUsuario(
    rolId: number
  ): boolean {

    if (
      this.procesando ||
      this.navegandoAJuego
    ) {

      return false;

    }


    if (
      this.miJugador()?.rolId ===
      rolId
    ) {

      return true;

    }


    return this.rolDisponible(
      rolId
    );

  }


  /* =========================================================
     DISTRIBUCIÓN
  ========================================================= */

  distribucionRolesCorrecta():
    boolean {

    return (

      this.contarRol(
        this.ROL_PACMAN
      )
      ===
      2

      &&

      this.contarRol(
        this.ROL_FANTASMA
      )
      ===
      1

      &&

      this.contarRol(
        this.ROL_MONSTRUO
      )
      ===
      1

    );

  }


  /* =========================================================
     PUEDE INICIAR
  ========================================================= */

  puedeIniciar(): boolean {

    return Boolean(

      this.esCreador()

      &&

      !this.procesando

      &&

      !this.navegandoAJuego

      &&

      this.salaCompleta()

      &&

      this.distribucionRolesCorrecta()

      &&

      this.todosListos()

      &&

      Number(this.lobby?.mapaId) >= 1

      &&

      Number(this.lobby?.mapaId) <= 5

    );

  }


  /* =========================================================
     ROLES VISUALES
  ========================================================= */

  esRolPacMan(
    jugador: JugadorLobby
  ): boolean {

    return (

      jugador.rolId ===
      this.ROL_PACMAN

      ||

      this.normalizarTexto(
        jugador.nombreRol
      ) === 'pacman'

    );

  }


  esRolFantasma(
    jugador: JugadorLobby
  ): boolean {

    return (

      jugador.rolId ===
      this.ROL_FANTASMA

      ||

      this.normalizarTexto(
        jugador.nombreRol
      ) === 'fantasma'

    );

  }


  esRolMonstruo(
    jugador: JugadorLobby
  ): boolean {

    return (

      jugador.rolId ===
      this.ROL_MONSTRUO

      ||

      this.normalizarTexto(
        jugador.nombreRol
      ) === 'monstruo'

    );

  }


  obtenerClaseRol(
    jugador: JugadorLobby
  ): string {

    if (
      this.esRolFantasma(
        jugador
      )
    ) {

      return 'fantasma';

    }


    if (
      this.esRolMonstruo(
        jugador
      )
    ) {

      return 'monstruo';

    }


    return 'pacman';

  }


  /* =========================================================
     NOMBRE ROL
  ========================================================= */

  private obtenerNombreRol(
    rolId: number
  ): string {

    switch (rolId) {

      case this.ROL_PACMAN:

        return 'Pac-Man';


      case this.ROL_FANTASMA:

        return 'Fantasma';


      case this.ROL_MONSTRUO:

        return 'Monstruo';


      default:

        return 'Personaje';

    }

  }


  /* =========================================================
     MENSAJE ROL LLENO
  ========================================================= */

  private obtenerMensajeRolLleno(
    rolId: number
  ): string {

    switch (rolId) {

      case this.ROL_PACMAN:

        return 'Ya hay dos Pac-Man en la partida.';


      case this.ROL_FANTASMA:

        return 'El rol Fantasma ya está ocupado.';


      case this.ROL_MONSTRUO:

        return 'El rol Monstruo ya está ocupado.';


      default:

        return 'Ese personaje ya no está disponible.';

    }

  }


  /* =========================================================
     NORMALIZAR TEXTO
  ========================================================= */

  private normalizarTexto(
    valor:
      string |
      null |
      undefined
  ): string {

    return (

      valor

      ??

      ''

    )
      .trim()
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


  /* =========================================================
     MENSAJE
  ========================================================= */

  private mostrarMensaje(

    mensaje: string,

    tipo:
      'error' |
      'exito' |
      'info'

  ): void {

    this.mensaje =
      mensaje;

    this.tipoMensaje =
      tipo;

  }


  /* =========================================================
     LIMPIAR MENSAJE
  ========================================================= */

  private limpiarMensaje(): void {

    this.mensaje =
      '';

    this.tipoMensaje =
      'info';

  }


  /* =========================================================
     LIBERAR FOCO

     Ayuda a evitar el warning de aria-hidden de Ionic cuando
     una página desaparece mientras un botón conserva focus.
  ========================================================= */

  private liberarFoco(): void {

    const elemento =
      document.activeElement;


    if (
      elemento instanceof HTMLElement
    ) {

      elemento.blur();

    }

  }


  /* =========================================================
     ERROR BACK
  ========================================================= */

  private obtenerMensajeError(

    error: any,

    mensajePredeterminado:
      string

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


    return mensajePredeterminado;

  }

}