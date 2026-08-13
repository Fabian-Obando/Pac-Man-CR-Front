import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  Subscription,
  finalize
} from 'rxjs';

import {
  Auth
} from '../../services/auth';

import {
  Sala,
  SalasService
} from '../../services/salas.service';

import {
  InicializarLobby,
  LobbyService
} from '../../services/lobby.service';


@Component({
  selector: 'app-salas',
  templateUrl: './salas.page.html',
  styleUrls: ['./salas.page.scss'],
  standalone: false
})
export class SalasPage
  implements OnInit, OnDestroy {


  /* =======================================================
     USUARIO
  ======================================================== */

  usuario = '';

  usuarioId = 0;

  oro = 0;


  /* =======================================================
     SALAS
  ======================================================== */

  salas: Sala[] = [];


  /* =======================================================
     ESTADOS DE PANTALLA
  ======================================================== */

  cargando = false;

  creandoSala = false;

  procesandoSalaId:
    number | null = null;

  cerrandoSalaId:
    number | null = null;


  /* =======================================================
     MENSAJES
  ======================================================== */

  mensajeError = '';

  mensajeExito = '';


  /* =======================================================
     ACTUALIZACIÓN AUTOMÁTICA
  ======================================================== */

  private intervaloActualizacion:
    ReturnType<typeof setInterval> | null = null;

  private readonly TIEMPO_ACTUALIZACION =
    5000;


  /* =======================================================
     SUSCRIPCIONES
  ======================================================== */

  private readonly suscripciones =
    new Subscription();


  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly salasService: SalasService,
    private readonly lobbyService: LobbyService
  ) {}


  /* =======================================================
     INICIO
  ======================================================== */

  ngOnInit(): void {

    this.cargarSesion();

  }


  ionViewWillEnter(): void {

    this.cargarSesion();


    if (
      this.usuarioId <= 0
    ) {
      return;
    }


    this.cargarSalas();

    this.iniciarActualizacionAutomatica();

  }


  ionViewDidLeave(): void {

    this.detenerActualizacionAutomatica();

  }


  ngOnDestroy(): void {

    this.detenerActualizacionAutomatica();

    this.suscripciones.unsubscribe();

  }


  /* =======================================================
     SESIÓN
  ======================================================== */

  private cargarSesion(): void {

    const sesion =
      this.auth.obtenerSesion();


    if (!sesion) {

      void this.router.navigate(
        ['/login']
      );

      return;

    }


    this.usuario =
      sesion.nombreUsuario;

    this.usuarioId =
      Number(
        sesion.usuarioId
      );

    this.oro =
      Number(
        sesion.oroActual ?? 0
      );

  }


  /* =======================================================
     CARGAR SALAS
  ======================================================== */

  cargarSalas(
    mostrarCarga: boolean = true
  ): void {

    if (
      this.usuarioId <= 0
    ) {
      return;
    }


    if (mostrarCarga) {

      this.cargando = true;

    }


    this.mensajeError = '';


    const suscripcion =
      this.salasService
        .obtenerSalas()
        .pipe(

          finalize(() => {

            this.cargando = false;

          })

        )
        .subscribe({

          next: (
            respuesta
          ) => {

            const lista =
              Array.isArray(respuesta)
                ? respuesta
                : [];


            /*
             * El Back ya elimina las salas cerradas.
             *
             * Aquí únicamente realizamos una segunda
             * validación defensiva.
             */
            this.salas =
              lista
                .filter(
                  sala =>
                    this.salaValida(
                      sala
                    )
                )
                .filter(
                  sala =>
                    !this.salaNoDisponible(
                      sala
                    )
                )
                .sort(
                  (a, b) =>
                    new Date(
                      b.fechaCreacion
                    ).getTime()
                    -
                    new Date(
                      a.fechaCreacion
                    ).getTime()
                );

          },


          error: (
            error
          ) => {

            console.error(
              'Error cargando salas:',
              error
            );


            this.mensajeError =
              this.obtenerMensajeError(

                error,

                'No fue posible obtener las salas.'

              );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =======================================================
     ACTUALIZACIÓN AUTOMÁTICA
  ======================================================== */

  private iniciarActualizacionAutomatica():
    void {

    this.detenerActualizacionAutomatica();


    this.intervaloActualizacion =
      setInterval(
        () => {

          if (
            !this.creandoSala &&
            this.procesandoSalaId === null &&
            this.cerrandoSalaId === null
          ) {

            this.cargarSalas(
              false
            );

          }

        },

        this.TIEMPO_ACTUALIZACION
      );

  }


  private detenerActualizacionAutomatica():
    void {

    if (
      this.intervaloActualizacion ===
      null
    ) {
      return;
    }


    clearInterval(
      this.intervaloActualizacion
    );


    this.intervaloActualizacion =
      null;

  }


  actualizar(): void {

    if (this.cargando) {
      return;
    }


    this.cargarSalas();

  }


  /* =======================================================
     CREAR SALA
  ======================================================== */

  crearSala(): void {

    if (
      this.creandoSala ||
      this.usuarioId <= 0
    ) {
      return;
    }


    this.limpiarMensajes();

    this.creandoSala = true;


    /*
     * CORRECCIÓN IMPORTANTE:
     *
     * El Back espera:
     *
     * JugadorCreadorId
     *
     * NO el nombre del usuario.
     */
    const suscripcion =
      this.salasService
        .crearSala({

          jugadorCreadorId:
            this.usuarioId

        })
        .subscribe({

          next: (
            sala
          ) => {

            if (
              !sala ||
              Number(
                sala.salaId
              ) <= 0
            ) {

              this.creandoSala = false;

              this.mensajeError =
                'El servidor no devolvió una sala válida.';

              return;

            }


            /*
             * Al crear una sala se prepara inmediatamente
             * su Lobby.
             */
            this.inicializarLobby(
              sala
            );

          },


          error: (
            error
          ) => {

            this.creandoSala = false;


            console.error(
              'Error creando sala:',
              error
            );


            this.mensajeError =
              this.obtenerMensajeError(

                error,

                'No fue posible crear la sala.'

              );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =======================================================
     INICIALIZAR LOBBY DEL CREADOR
  ======================================================== */

  private inicializarLobby(
    sala: Sala
  ): void {

    const request:
      InicializarLobby = {

        usuarioId:
          this.usuarioId,

        mapaId:
          null,

        dificultadId:
          null

      };


    const suscripcion =
      this.lobbyService
        .inicializarLobby(

          sala.salaId,

          request

        )
        .subscribe({

          next: () => {

            this.irAlLobby(
              sala.salaId
            );

          },


          error: (
            error
          ) => {

            const mensaje =
              this.obtenerMensajeError(
                error,
                ''
              );


            /*
             * Si el Lobby ya existe podemos entrar.
             */
            if (
              error?.status === 400 &&
              this.indicaLobbyExistente(
                mensaje
              )
            ) {

              this.irAlLobby(
                sala.salaId
              );

              return;

            }


            console.error(
              'Error inicializando lobby:',
              error
            );


            /*
             * Si el Lobby no pudo crearse,
             * cerramos la sala para no dejar basura.
             */
            const cierre =
              this.salasService
                .cerrarSala(
                  sala.salaId
                )
                .subscribe({

                  next: () => {

                    this.creandoSala =
                      false;

                  },

                  error: () => {

                    this.creandoSala =
                      false;

                  }

                });


            this.suscripciones.add(
              cierre
            );


            this.mensajeError =
              mensaje ||
              'La sala fue creada, pero no fue posible preparar el lobby.';

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =======================================================
     ENTRAR / UNIRSE
  ======================================================== */

  unirse(
    sala: Sala
  ): void {

    if (
      this.procesandoSalaId !== null ||
      this.creandoSala ||
      this.salaNoDisponible(
        sala
      )
    ) {

      return;

    }


    this.limpiarMensajes();


    /*
     * Si es el creador solamente entra.
     */
    if (
      this.esMiSala(
        sala
      )
    ) {

      this.entrarComoCreador(
        sala
      );

      return;

    }


    /*
     * Invitado.
     */
    this.procesandoSalaId =
      sala.salaId;


    /*
     * Conservamos LobbyService porque allí se registrará
     * realmente quién forma parte del Lobby.
     */
    const suscripcion =
      this.lobbyService
        .unirseLobby(

          sala.salaId,

          {
            usuarioId:
              this.usuarioId
          }

        )
        .pipe(

          finalize(() => {

            this.procesandoSalaId =
              null;

          })

        )
        .subscribe({

          next: () => {

            this.irAlLobby(
              sala.salaId
            );

          },


          error: (
            error
          ) => {

            console.error(
              'Error entrando a la sala:',
              error
            );


            this.mensajeError =
              this.obtenerMensajeError(

                error,

                'No fue posible entrar a la sala.'

              );


            this.cargarSalas(
              false
            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =======================================================
     ENTRAR COMO CREADOR
  ======================================================== */

  private entrarComoCreador(
    sala: Sala
  ): void {

    this.procesandoSalaId =
      sala.salaId;


    const suscripcion =
      this.lobbyService
        .obtenerLobby(
          sala.salaId
        )
        .pipe(

          finalize(() => {

            this.procesandoSalaId =
              null;

          })

        )
        .subscribe({

          next: () => {

            this.irAlLobby(
              sala.salaId
            );

          },


          error: () => {

            /*
             * Si todavía no existe,
             * lo inicializamos.
             */
            this.inicializarLobby(
              sala
            );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =======================================================
     CERRAR SALA
  ======================================================== */

  cerrarSala(
    sala: Sala
  ): void {

    if (
      !this.esMiSala(sala) ||
      this.cerrandoSalaId !== null
    ) {
      return;
    }


    const confirmar =
      window.confirm(
        '¿Deseás cerrar esta sala? Los demás jugadores deberán salir.'
      );


    if (!confirmar) {
      return;
    }


    this.limpiarMensajes();


    this.cerrandoSalaId =
      sala.salaId;


    const suscripcion =
      this.salasService
        .cerrarSala(
          sala.salaId
        )
        .pipe(

          finalize(() => {

            this.cerrandoSalaId =
              null;

          })

        )
        .subscribe({

          next: () => {

            this.salas =
              this.salas.filter(
                item =>
                  item.salaId !==
                  sala.salaId
              );


            this.mensajeExito =
              'Sala cerrada correctamente.';

          },


          error: (
            error
          ) => {

            console.error(
              'Error cerrando sala:',
              error
            );


            this.mensajeError =
              this.obtenerMensajeError(

                error,

                'No fue posible cerrar la sala.'

              );

          }

        });


    this.suscripciones.add(
      suscripcion
    );

  }


  /* =======================================================
     VALIDACIONES
  ======================================================== */

  esMiSala(
    sala: Sala
  ): boolean {

    return (
      Number(
        sala.jugadorCreadorId
      )
      ===
      Number(
        this.usuarioId
      )
    );

  }


  salaNoDisponible(
    sala: Sala
  ): boolean {

    const estado =
      String(
        sala.estadoSala ?? ''
      )
        .trim()
        .toLowerCase();


    const estadosNoDisponibles =
      [
        'cerrada',
        'finalizada',
        'jugando',
        'en partida'
      ];


    if (
      estadosNoDisponibles.includes(
        estado
      )
    ) {
      return true;
    }


    return (
      Number(
        sala.jugadoresActuales
      )
      >=
      Number(
        sala.maxJugadores
      )
    );

  }


  puedeUnirse(
    sala: Sala
  ): boolean {

    return (

      !this.esMiSala(
        sala
      )

      &&

      !this.salaNoDisponible(
        sala
      )

      &&

      !this.creandoSala

      &&

      this.procesandoSalaId ===
        null

    );

  }


  estaProcesando(
    sala: Sala
  ): boolean {

    return (

      this.procesandoSalaId ===
        sala.salaId

      ||

      this.cerrandoSalaId ===
        sala.salaId

    );

  }


  obtenerTextoEstado(
    sala: Sala
  ): string {

    if (
      this.esMiSala(
        sala
      )
    ) {

      return 'Tu sala';

    }


    if (
      Number(
        sala.jugadoresActuales
      )
      >=
      Number(
        sala.maxJugadores
      )
    ) {

      return 'Completa';

    }


    return (
      sala.estadoSala ||
      'Esperando'
    );

  }


  private salaValida(
    sala: Sala
  ): boolean {

    return Boolean(

      sala

      &&

      Number(
        sala.salaId
      ) > 0

      &&

      Number(
        sala.jugadorCreadorId
      ) > 0

    );

  }


  /* =======================================================
     LOBBY EXISTENTE
  ======================================================== */

  private indicaLobbyExistente(
    mensaje: string
  ): boolean {

    const texto =
      mensaje
        .trim()
        .toLowerCase();


    return (

      texto.includes(
        'lobby ya fue creado'
      )

      ||

      texto.includes(
        'lobby ya existe'
      )

      ||

      texto.includes(
        'ya tiene lobby'
      )

    );

  }


  /* =======================================================
     VOLVER AL MENÚ

     IMPORTANTE:
     Estar en la pantalla de lista de salas no significa
     necesariamente estar dentro de una sala.

     Por eso aquí NO cerramos salas automáticamente.
     La salida real se implementará en Lobby.
  ======================================================== */

  volver(): void {

    this.detenerActualizacionAutomatica();


    void this.router.navigate(
      ['/menu']
    );

  }


  /* =======================================================
     IR AL LOBBY
  ======================================================== */

  private irAlLobby(
    salaId: number
  ): void {

    this.creandoSala =
      false;

    this.procesandoSalaId =
      null;

    this.cerrandoSalaId =
      null;


    this.detenerActualizacionAutomatica();


    void this.router.navigate(

      ['/lobby'],

      {

        queryParams: {

          salaId:
            salaId

        }

      }

    );

  }


  /* =======================================================
     MENSAJES
  ======================================================== */

  private limpiarMensajes():
    void {

    this.mensajeError = '';

    this.mensajeExito = '';

  }


  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string
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