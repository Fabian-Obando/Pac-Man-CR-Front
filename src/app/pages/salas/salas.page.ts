import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Auth } from '../../services/auth';
import { SalasService, Sala } from '../../services/salas.service';
import {
  LobbyService,
  InicializarLobby
} from '../../services/lobby.service';

@Component({
  selector: 'app-salas',
  templateUrl: './salas.page.html',
  styleUrls: ['./salas.page.scss'],
  standalone: false
})
export class SalasPage implements OnInit {

  usuario = '';
  oro = 0;
  usuarioId = 0;

  salas: Sala[] = [];

  cargando = false;
  creandoSala = false;
  procesandoSalaId: number | null = null;

  mensajeError = '';

  constructor(
    private router: Router,
    private auth: Auth,
    private salasService: SalasService,
    private lobbyService: LobbyService
  ) {}

  ngOnInit(): void {
    const sesion = this.auth.obtenerSesion();

    if (!sesion) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = sesion.nombreUsuario;
    this.oro = sesion.oroActual;
    this.usuarioId = sesion.usuarioId;

    this.cargarSalas();
  }

  ionViewWillEnter(): void {
    if (this.usuarioId > 0) {
      this.cargarSalas();
    }
  }

  cargarSalas(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.salasService.obtenerSalas().subscribe({
      next: (respuesta) => {
        const salasAbiertas = respuesta
          .filter(sala =>
            sala.estadoSala !== 'Cerrada' &&
            sala.estadoSala !== 'Cancelada'
          )
          .sort(
            (a, b) =>
              new Date(b.fechaCreacion).getTime() -
              new Date(a.fechaCreacion).getTime()
          );

        /*
         * Evita mostrar muchas salas antiguas del mismo creador.
         * Se conserva únicamente la sala abierta más reciente
         * de cada usuario.
         */
        const salasPorCreador = new Map<number, Sala>();

        for (const sala of salasAbiertas) {
          if (!salasPorCreador.has(sala.jugadorCreadorId)) {
            salasPorCreador.set(sala.jugadorCreadorId, sala);
          }
        }

        this.salas = Array.from(salasPorCreador.values());
        this.cargando = false;
      },

      error: (error) => {
        console.error('Error al cargar las salas:', error);

        this.mensajeError =
          'No fue posible cargar las salas. Verifica que el Back esté ejecutándose.';

        this.cargando = false;
      }
    });
  }

  volver(): void {
    this.router.navigate(['/menu']);
  }

  crearSala(): void {
    if (this.creandoSala) {
      return;
    }

    this.creandoSala = true;
    this.mensajeError = '';

    this.salasService
      .crearSala({
        nombreCreador: this.usuario
      })
      .subscribe({
        next: (sala) => {
          /*
           * Primero verificamos si la sala ya tiene un Lobby.
           * Esto ocurre cuando el usuario pulsa Crear Sala,
           * pero ya tenía una sala abierta.
           */
          this.verificarOInicializarLobby(sala);
        },

        error: (error) => {
          console.error('Error al crear la sala:', error);

          this.mensajeError =
            this.obtenerMensajeError(
              error,
              'No fue posible crear la sala.'
            );

          this.creandoSala = false;
        }
      });
  }

  private verificarOInicializarLobby(sala: Sala): void {
    this.lobbyService.obtenerLobby(sala.salaId).subscribe({
      next: (lobby) => {
        /*
         * Si ya existe una partida pendiente, el Lobby ya fue
         * inicializado. Entramos directamente y no repetimos
         * POST /Inicializar.
         */
        if (lobby.partidaId !== null) {
          this.irAlLobby(sala.salaId);
          return;
        }

        this.inicializarLobby(sala);
      },

      error: (error) => {
        /*
         * Si todavía no se puede obtener el Lobby, intentamos
         * inicializarlo. Esto permite trabajar también con una
         * sala recién creada.
         */
        console.warn(
          'No se encontró un Lobby inicializado. Se intentará crear.',
          error
        );

        this.inicializarLobby(sala);
      }
    });
  }

  private inicializarLobby(sala: Sala): void {
    const request: InicializarLobby = {
      usuarioId: this.usuarioId,
      mapaId: null,
      dificultadId: null
    };

    this.lobbyService
      .inicializarLobby(sala.salaId, request)
      .subscribe({
        next: () => {
          this.irAlLobby(sala.salaId);
        },

        error: (error) => {
          console.error('Error al inicializar el Lobby:', error);

          /*
           * Si el Back indica que el Lobby ya estaba creado
           * la navegación.
           */
          const mensaje = this.obtenerMensajeError(error, '');

          if (
            error?.status === 400 &&
            mensaje.toLowerCase().includes('lobby ya fue creado')
          ) {
            this.irAlLobby(sala.salaId);
            return;
          }

          this.mensajeError =
            mensaje || 'No fue posible inicializar el Lobby.';

          this.creandoSala = false;
        }
      });
  }

unirse(sala: Sala): void {

  if (
    this.procesandoSalaId !== null ||
    sala.estadoSala === 'Cerrada' ||
    sala.estadoSala === 'Jugando' ||
    sala.estadoSala === 'En partida' ||
    sala.estadoSala === 'Completa' ||
    sala.jugadoresActuales >= sala.maxJugadores
  ) {
    return;
  }

  this.procesandoSalaId = sala.salaId;
  this.mensajeError = '';

  this.lobbyService
    .unirseLobby(
      sala.salaId,
      {
        usuarioId: this.usuarioId
      }
    )
    .subscribe({

      next: () => {

        this.procesandoSalaId = null;

        this.irAlLobby(sala.salaId);

      },

      error: (error) => {

        console.error(error);

        const mensaje = this.obtenerMensajeError(error, '');

        /*
         * Si todavía no existe el Lobby,
         * lo inicializamos automáticamente.
         */
        if (mensaje.toLowerCase().includes('lobby no existe')) {

          const request: InicializarLobby = {

            usuarioId: this.usuarioId,

            mapaId: null,

            dificultadId: null

          };

          this.lobbyService
            .inicializarLobby(
              sala.salaId,
              request
            )
            .subscribe({

              next: () => {

                this.procesandoSalaId = null;

                this.irAlLobby(sala.salaId);

              },

              error: (err) => {

                console.error(err);

                this.mensajeError =
                  'No fue posible crear el Lobby.';

                this.procesandoSalaId = null;

              }

            });

          return;

        }

        this.mensajeError =
          this.obtenerMensajeError(
            error,
            'No fue posible unirse a la sala.'
          );

        this.procesandoSalaId = null;

      }

    });

}

cerrarSala(sala: Sala): void {

  if (!this.esMiSala(sala)) {

    return;

  }

  if (!confirm('¿Cerrar esta sala?')) {

    return;

  }

  this.salasService
    .cerrarSala(sala.salaId)
    .subscribe({

      next: () => {

        this.cargarSalas();

      },

      error: (err) => {

        console.error(err);

      }

    });

}

  esMiSala(sala: Sala): boolean {
    return sala.jugadorCreadorId === this.usuarioId;
  }

  salaNoDisponible(sala: Sala): boolean {
    return (
      sala.estadoSala === 'Cerrada' ||
      sala.estadoSala === 'Jugando' ||
      sala.estadoSala === 'En partida' ||
      sala.estadoSala === 'Completa' ||
      sala.jugadoresActuales >= sala.maxJugadores
    );
  }

  actualizar(): void {
    this.cargarSalas();
  }

  private irAlLobby(salaId: number): void {
    this.creandoSala = false;
    this.procesandoSalaId = null;

    this.router.navigate(['/lobby'], {
      queryParams: {
        salaId
      }
    });
  }

  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string
  ): string {
    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (typeof error?.error?.message === 'string') {
      return error.error.message;
    }

    if (typeof error?.message === 'string') {
      return error.message;
    }

    return mensajePredeterminado;
  }
}