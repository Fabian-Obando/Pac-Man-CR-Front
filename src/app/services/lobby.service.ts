import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/*======================================================
  DTOs
======================================================*/

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

  rolId: number;

}

export interface IniciarPartida {

  usuarioCreadorId: number;

}

/*======================================================
  SERVICE
======================================================*/

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  private readonly apiUrl = `${environment.apiUrl}/Lobby`;

  constructor(
    private http: HttpClient
  ) { }

  /*====================================================*/

  obtenerLobby(
    salaId: number
  ): Observable<Lobby> {

    return this.http.get<Lobby>(
      `${this.apiUrl}/${salaId}`
    );

  }

  /*====================================================*/

  inicializarLobby(
    salaId: number,
    request: InicializarLobby
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/Inicializar`,
      request
    );

  }

  /*====================================================*/

  unirseLobby(
    salaId: number,
    request: UnirseLobby
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/Unirse`,
      request
    );

  }

  /*====================================================*/

  agregarBot(
    salaId: number,
    request: AgregarBot
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/AgregarBot`,
      request
    );

  }

  /*====================================================*/

  cambiarRol(
    salaId: number,
    request: CambiarRol
  ): Observable<Lobby> {

    return this.http.put<Lobby>(
      `${this.apiUrl}/${salaId}/Rol`,
      request
    );

  }

  /*====================================================*/

  cambiarEstado(
    salaId: number,
    request: CambiarEstado
  ): Observable<Lobby> {

    return this.http.put<Lobby>(
      `${this.apiUrl}/${salaId}/Estado`,
      request
    );

  }

  /*====================================================*/

  iniciarPartida(
    salaId: number,
    request: IniciarPartida
  ): Observable<Lobby> {

    return this.http.post<Lobby>(
      `${this.apiUrl}/${salaId}/Iniciar`,
      request
    );

  }

  /*====================================================*/

  salirLobby(
    salaId: number,
    usuarioId: number
  ): Observable<Lobby> {

    return this.http.delete<Lobby>(
      `${this.apiUrl}/${salaId}/Salir/${usuarioId}`
    );

  }

}