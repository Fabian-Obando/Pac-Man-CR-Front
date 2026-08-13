import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../environments/environment';


/* =========================================================
   JUGADOR DEL LOBBY
========================================================= */

export interface JugadorLobby {

  participanteId: number;

  usuarioId: number | null;

  nombreUsuario: string;

  rolId: number;

  nombreRol: string;

  esBot: boolean;

  puntosPartida: number;

  estadoJugador: string;

  esCreador: boolean;

}


/* =========================================================
   RESPUESTA PRINCIPAL DEL LOBBY
========================================================= */

export interface Lobby {

  salaId: number;

  partidaId: number | null;

  codigoSala: string;

  jugadorCreadorId: number;

  estadoSala: string;

  estadoPartida: string;

  jugadoresActuales: number;

  maxJugadores: number;

  mapaId: number | null;

  nombreMapa: string;

  dificultadId: number | null;

  nombreDificultad: string;

  todosListos: boolean;

  jugadores: JugadorLobby[];

}


/* =========================================================
   REQUESTS
========================================================= */

export interface InicializarLobby {

  usuarioId: number;

  mapaId?: number | null;

  dificultadId?: number | null;

}


export interface UnirseLobby {

  usuarioId: number;

}


export interface CambiarRol {

  usuarioId: number;

  rolId: number;

}


export interface CambiarEstado {

  usuarioId: number;

  estadoJugador: string;

}


export interface AgregarBot {

  usuarioCreadorId: number;

  /*
   * 0 permite que el Back seleccione automáticamente
   * el rol que haga falta.
   */
  rolId: number;

}


export interface IniciarPartida {

  usuarioCreadorId: number;

}


/* =========================================================
   NUEVO:
   CAMBIAR LABERINTO
========================================================= */

export interface CambiarMapaLobby {

  usuarioCreadorId: number;

  mapaId: number;

}


/* =========================================================
   SERVICIO
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class LobbyService {


  /*
   * IMPORTANTE PARA ANDROID:
   *
   * No utilizamos localhost.
   *
   * Todo depende de environment.apiUrl.
   */
  private readonly apiUrl =
    `${environment.apiUrl}/Lobby`;


  constructor(
    private readonly http: HttpClient
  ) {}


  /* =======================================================
     OBTENER LOBBY
  ======================================================== */

  obtenerLobby(
    salaId: number
  ): Observable<Lobby> {

    return this.http.get<Lobby>(
      `${this.apiUrl}/${salaId}`
    );

  }


  /* =======================================================
     INICIALIZAR
  ======================================================== */

  inicializarLobby(
    salaId: number,
    request: InicializarLobby
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/Inicializar`,
      request
    );

  }


  /* =======================================================
     UNIRSE
  ======================================================== */

  unirseLobby(
    salaId: number,
    request: UnirseLobby
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/Unirse`,
      request
    );

  }


  /* =======================================================
     AGREGAR BOT
  ======================================================== */

  agregarBot(
    salaId: number,
    request: AgregarBot
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/AgregarBot`,
      request
    );

  }


  /* =======================================================
     CAMBIAR ROL
  ======================================================== */

  cambiarRol(
    salaId: number,
    request: CambiarRol
  ): Observable<Lobby> {

    return this.http.put<Lobby>(
      `${this.apiUrl}/${salaId}/Rol`,
      request
    );

  }


  /* =======================================================
     LISTO / SELECCIONANDO
  ======================================================== */

  cambiarEstado(
    salaId: number,
    request: CambiarEstado
  ): Observable<Lobby> {

    return this.http.put<Lobby>(
      `${this.apiUrl}/${salaId}/Estado`,
      request
    );

  }


  /* =======================================================
     CAMBIAR LABERINTO

     Solo el creador puede utilizar este endpoint.
  ======================================================== */

  cambiarMapa(
    salaId: number,
    request: CambiarMapaLobby
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${salaId}/Mapa`,
      request
    );

  }


  /* =======================================================
     INICIAR PARTIDA
  ======================================================== */

  iniciarPartida(
    salaId: number,
    request: IniciarPartida
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/Iniciar`,
      request
    );

  }


  /* =======================================================
     SALIR DEL LOBBY
  ======================================================== */

  salirLobby(
    salaId: number,
    usuarioId: number
  ): Observable<Lobby> {

    return this.http.delete<Lobby>(
      `${this.apiUrl}/${salaId}/Salir/${usuarioId}`
    );

  }

}