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
  Auth,
  UsuarioSesion
} from '../../services/auth';

import {
  JugadorLobby,
  Lobby,
  LobbyService
} from '../../services/lobby.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
  standalone: false
})
export class LobbyPage implements OnInit, OnDestroy {

  usuario!: UsuarioSesion;

  lobby!: Lobby;

  salaId = 0;

  codigoSala = '';

  cargando = true;

  procesando = false;

  mensaje = '';

  intervalo?: ReturnType<typeof setInterval>;

  readonly ROL_PACMAN = 1;
  readonly ROL_FANTASMA = 2;
  readonly ROL_MONSTRUO = 3;

  readonly MAX_PACMAN = 2;
  readonly MAX_FANTASMA = 1;
  readonly MAX_MONSTRUO = 1;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: Auth,
    private lobbyService: LobbyService
  ) {}

  ngOnInit(): void {

    const sesion = this.auth.obtenerSesion();

    if (!sesion) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = sesion;

    const idRecibido =
      this.route.snapshot.queryParamMap.get('salaId');

    const idConvertido = Number(idRecibido);

    if (
      !idRecibido ||
      !Number.isInteger(idConvertido) ||
      idConvertido <= 0
    ) {
      this.router.navigate(['/salas']);
      return;
    }

    this.salaId = idConvertido;

    this.cargarLobby();

    this.intervalo = setInterval(() => {

      if (!this.procesando) {
        this.cargarLobby(false);
      }

    }, 3000);

  }

  ngOnDestroy(): void {

    this.detenerActualizacion();

  }

  private detenerActualizacion(): void {

    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = undefined;
    }

  }

  cargarLobby(
    mostrarCarga: boolean = true
  ): void {

    if (mostrarCarga) {
      this.cargando = true;
    }

    this.mensaje = '';

    this.lobbyService
      .obtenerLobby(this.salaId)
      .subscribe({

        next: (respuesta) => {

          this.lobby = respuesta;

          this.codigoSala = respuesta.codigoSala;

          this.cargando = false;

          /*
           * Cuando una partida ya comenzó, el Back actual
           * puede devolver el Lobby sin partida pendiente.
           * No redirigimos automáticamente para evitar bucles.
           */
          if (
            respuesta.estadoSala === 'Cerrada' ||
            respuesta.estadoPartida === 'Cancelada'
          ) {
            this.detenerActualizacion();

            this.mensaje =
              'Esta sala fue cerrada por su creador.';
          }

        },

        error: (error) => {

          console.error(
            'Error al cargar el Lobby:',
            error
          );

          this.cargando = false;

          this.mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar el Lobby.'
            );

        }

      });

  }

  actualizarLobby(): void {

    this.cargarLobby(false);

  }

  invitarAmigo(): void {

    if (!this.esCreador()) {
      this.mensaje =
        'Solo el creador puede invitar jugadores.';
      return;
    }

    this.router.navigate(
      ['/amigos'],
      {
        queryParams: {
          salaId: this.salaId
        }
      }
    );

  }

 agregarBot(): void {

  if (this.procesando) {
    return;
  }

  if (!this.esCreador()) {
    this.mensaje =
      'Solo el creador puede agregar bots.';
    return;
  }

  if (this.salaCompleta()) {
    this.mensaje =
      'La sala ya tiene cuatro participantes.';
    return;
  }

  this.procesando = true;
  this.mensaje = '';

  this.lobbyService
    .agregarBot(
      this.salaId,
      {
        usuarioCreadorId: this.usuario.usuarioId,

        rolId: 0
      }
    )
    .subscribe({

      next: (respuesta) => {

        this.lobby = respuesta;

        this.procesando = false;

      },

      error: (error) => {

        console.error(error);

        this.procesando = false;

      }

    });

}

  cambiarRol(
    rolId: number
  ): void {

    if (this.procesando) {
      return;
    }

    const jugadorActual = this.miJugador();

    if (!jugadorActual) {
      this.mensaje =
        'No apareces como participante del Lobby.';
      return;
    }

    if (jugadorActual.rolId === rolId) {
      this.mensaje =
        'Ya tienes seleccionado ese personaje.';
      return;
    }

    if (!this.rolDisponibleParaUsuario(rolId)) {
      this.mensaje =
        this.obtenerMensajeRolLleno(rolId);
      return;
    }

    this.procesando = true;
    this.mensaje = '';

    this.lobbyService
      .cambiarRol(
        this.salaId,
        {
          usuarioId: this.usuario.usuarioId,
          rolId
        }
      )
      .subscribe({

        next: (respuesta) => {

          this.lobby = respuesta;

          this.procesando = false;

        },

        error: (error) => {

          console.error(
            'Error al cambiar el rol:',
            error
          );

          this.mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible cambiar el personaje.'
            );

          this.procesando = false;

        }

      });

  }

  marcarListo(): void {

    this.cambiarEstadoJugador('Listo');

  }

  quitarListo(): void {

    this.cambiarEstadoJugador(
      'Seleccionando'
    );

  }

  alternarListo(): void {

    if (this.estaListo()) {
      this.quitarListo();
    } else {
      this.marcarListo();
    }

  }

  private cambiarEstadoJugador(
    estadoJugador: string
  ): void {

    if (this.procesando) {
      return;
    }

    if (!this.miJugador()) {
      this.mensaje =
        'No apareces como participante del Lobby.';
      return;
    }

    this.procesando = true;
    this.mensaje = '';

    this.lobbyService
      .cambiarEstado(
        this.salaId,
        {
          usuarioId: this.usuario.usuarioId,
          estadoJugador
        }
      )
      .subscribe({

        next: (respuesta) => {

          this.lobby = respuesta;

          this.procesando = false;

        },

        error: (error) => {

          console.error(
            'Error al cambiar el estado:',
            error
          );

          this.mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible cambiar tu estado.'
            );

          this.procesando = false;

        }

      });

  }

  iniciarPartida(): void {

    if (this.procesando) {
      return;
    }

    if (!this.esCreador()) {
      this.mensaje =
        'Solo el creador puede iniciar la partida.';
      return;
    }

    if (!this.salaCompleta()) {
      this.mensaje =
        'Deben existir cuatro participantes. Puedes invitar jugadores o agregar bots.';
      return;
    }

    if (!this.distribucionRolesCorrecta()) {
      this.mensaje =
        'La partida necesita exactamente 2 Pac-Man, 1 Fantasma y 1 Monstruo.';
      return;
    }

    if (!this.puedeIniciar()) {
      this.mensaje =
        'Todos los participantes deben estar listos.';
      return;
    }

    const partidaIdActual =
      this.lobby.partidaId;

    this.procesando = true;
    this.mensaje = '';

    this.lobbyService
      .iniciarPartida(
        this.salaId,
        {
          usuarioCreadorId:
            this.usuario.usuarioId
        }
      )
      .subscribe({

        next: (respuesta) => {

          const partidaId =
            respuesta.partidaId ??
            partidaIdActual;

          this.lobby = respuesta;

          this.procesando = false;

          if (!partidaId) {
            this.mensaje =
              'La partida inició, pero no se recibió su identificador.';
            return;
          }

          this.detenerActualizacion();

          this.router.navigate(
            ['/juego'],
            {
              queryParams: {
                salaId: this.salaId,
                partidaId
              }
            }
          );

        },

        error: (error) => {

          console.error(
            'Error al iniciar la partida:',
            error
          );

          this.mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible iniciar la partida.'
            );

          this.procesando = false;

        }

      });

  }

  cerrarSala(): void {

    if (this.procesando) {
      return;
    }

    if (!this.esCreador()) {
      this.mensaje =
        'Solo el creador puede cerrar la sala.';
      return;
    }

    const confirmar = window.confirm(
      '¿Deseas cerrar esta sala? Todos los participantes saldrán del Lobby.'
    );

    if (!confirmar) {
      return;
    }

    this.procesando = true;
    this.mensaje = '';

    /*
     * En el Back actual, SalirLobby cierra la sala
     * automáticamente cuando quien sale es el creador.
     */
    this.lobbyService
      .salirLobby(
        this.salaId,
        this.usuario.usuarioId
      )
      .subscribe({

        next: () => {

          this.procesando = false;

          this.detenerActualizacion();

          this.router.navigate(['/salas']);

        },

        error: (error) => {

          console.error(
            'Error al cerrar la sala:',
            error
          );

          this.mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible cerrar la sala.'
            );

          this.procesando = false;

        }

      });

  }

  salir(): void {

    if (this.procesando) {
      return;
    }

    if (this.esCreador()) {
      this.cerrarSala();
      return;
    }

    this.procesando = true;
    this.mensaje = '';

    this.lobbyService
      .salirLobby(
        this.salaId,
        this.usuario.usuarioId
      )
      .subscribe({

        next: () => {

          this.procesando = false;

          this.detenerActualizacion();

          this.router.navigate(['/salas']);

        },

        error: (error) => {

          console.error(
            'Error al salir del Lobby:',
            error
          );

          this.mensaje =
            this.obtenerMensajeError(
              error,
              'No fue posible salir del Lobby.'
            );

          this.procesando = false;

        }

      });

  }

  esCreador(): boolean {

    return Boolean(
      this.lobby &&
      this.usuario &&
      this.lobby.jugadorCreadorId ===
        this.usuario.usuarioId
    );

  }

  miJugador(): JugadorLobby | undefined {

    if (!this.lobby?.jugadores) {
      return undefined;
    }

    return this.lobby.jugadores.find(
      jugador =>
        !jugador.esBot &&
        jugador.usuarioId ===
          this.usuario.usuarioId
    );

  }

  estaListo(): boolean {

    return (
      this.miJugador()?.estadoJugador ===
      'Listo'
    );

  }

  puedeIniciar(): boolean {

    return Boolean(
      this.lobby &&
      this.lobby.todosListos &&
      this.salaCompleta() &&
      this.distribucionRolesCorrecta()
    );

  }

  totalJugadores(): number {

    return this.lobby?.jugadores?.length ?? 0;

  }

  salaCompleta(): boolean {

    return (
      this.totalJugadores() >=
      (this.lobby?.maxJugadores ?? 4)
    );

  }

  contarRol(
    rolId: number
  ): number {

    if (!this.lobby?.jugadores) {
      return 0;
    }

    return this.lobby.jugadores.filter(
      jugador => jugador.rolId === rolId
    ).length;

  }

  rolDisponible(
    rolId: number
  ): boolean {

    const cantidad = this.contarRol(rolId);

    switch (rolId) {

      case this.ROL_PACMAN:
        return cantidad < this.MAX_PACMAN;

      case this.ROL_FANTASMA:
        return cantidad < this.MAX_FANTASMA;

      case this.ROL_MONSTRUO:
        return cantidad < this.MAX_MONSTRUO;

      default:
        return false;

    }

  }

  rolDisponibleParaUsuario(
    rolId: number
  ): boolean {

    const jugadorActual = this.miJugador();

    if (jugadorActual?.rolId === rolId) {
      return true;
    }

    return this.rolDisponible(rolId);

  }

  distribucionRolesCorrecta(): boolean {

    return (
      this.contarRol(this.ROL_PACMAN) === 2 &&
      this.contarRol(this.ROL_FANTASMA) === 1 &&
      this.contarRol(this.ROL_MONSTRUO) === 1
    );

  }

  nombreRolNormalizado(
    nombreRol: string | null | undefined
  ): string {

    return (nombreRol ?? '')
      .toLowerCase()
      .replace(/[\s_-]/g, '');

  }

  esRolPacMan(
    jugador: JugadorLobby
  ): boolean {

    return (
      jugador.rolId === this.ROL_PACMAN ||
      this.nombreRolNormalizado(
        jugador.nombreRol
      ) === 'pacman'
    );

  }

  esRolFantasma(
    jugador: JugadorLobby
  ): boolean {

    return (
      jugador.rolId === this.ROL_FANTASMA ||
      this.nombreRolNormalizado(
        jugador.nombreRol
      ) === 'fantasma'
    );

  }

  esRolMonstruo(
    jugador: JugadorLobby
  ): boolean {

    return (
      jugador.rolId === this.ROL_MONSTRUO ||
      this.nombreRolNormalizado(
        jugador.nombreRol
      ) === 'monstruo'
    );

  }

  private obtenerMensajeRolLleno(
    rolId: number
  ): string {

    switch (rolId) {

      case this.ROL_PACMAN:
        return 'Ya están ocupados los dos espacios de Pac-Man.';

      case this.ROL_FANTASMA:
        return 'El rol de Fantasma ya está ocupado.';

      case this.ROL_MONSTRUO:
        return 'El rol de Monstruo ya está ocupado.';

      default:
        return 'Ese rol no está disponible.';

    }

  }

  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string
  ): string {

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (
      typeof error?.error?.message ===
      'string'
    ) {
      return error.error.message;
    }

    if (typeof error?.message === 'string') {
      return error.message;
    }

    return mensajePredeterminado;

  }

}