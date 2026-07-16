import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/*=========================================================
DTOs
=========================================================*/

export interface JugadorJuego {

  participanteId: number;

  usuarioId: number | null;

  nombreUsuario: string;

  nombreRol: string;

  esBot: boolean;

  posicionX: number;

  posicionY: number;

  puntos: number;

  vivo: boolean;

}

export interface Juego {
  mensajeFinal: string;
  ganador: string;

  partidaId: number;

  salaId: number;

  estadoPartida: string;

  monedasRestantes: number;

  partidaFinalizada: boolean;

  jugadores: JugadorJuego[];

}

export interface ActualizarEstadoRequest {

  usuarioId: number;

  posicionX: number;

  posicionY: number;

  direccion: string;

}

export interface FinalizarJuegoRequest {

  usuarioId: number;

}

@Injectable({
  providedIn: 'root'
})
export class JuegoService {

  private readonly apiUrl =
    `${environment.apiUrl}/Juego`;

  constructor(
    private http: HttpClient
  ) { }

  /*======================================================
    OBTENER JUEGO
  ======================================================*/

  obtenerJuego(
    partidaId: number
  ): Observable<Juego> {

    return this.http.get<Juego>(
      `${this.apiUrl}/${partidaId}`
    );

  }

  /*======================================================
    OBTENER ESTADO
  ======================================================*/

  obtenerEstado(
    partidaId: number
  ): Observable<Juego> {

    return this.http.get<Juego>(
      `${this.apiUrl}/${partidaId}/Estado`
    );

  }

  /*======================================================
    ACTUALIZAR ESTADO
  ======================================================*/

  actualizarEstado(
    partidaId: number,
    request: ActualizarEstadoRequest
  ): Observable<Juego> {

    return this.http.post<Juego>(
      `${this.apiUrl}/${partidaId}/ActualizarEstado`,
      request
    );

  }

  /*======================================================
    MOVER JUGADOR
  ======================================================*/

  moverJugador(
    partidaId: number,
    request: ActualizarEstadoRequest
  ): Observable<Juego> {

    return this.http.post<Juego>(
      `${this.apiUrl}/${partidaId}/Mover`,
      request
    );

  }

  /*======================================================
    FINALIZAR PARTIDA
  ======================================================*/

  finalizarPartida(
    partidaId: number,
    request: FinalizarJuegoRequest
  ): Observable<void> {

    return this.http.post<void>(
      `${this.apiUrl}/${partidaId}/Finalizar`,
      request
    );

  }

  /*======================================================
    ACTUALIZAR (Polling)
  ======================================================*/

  actualizarJuego(
    partidaId: number
  ): Observable<Juego> {

    return this.http.get<Juego>(
      `${this.apiUrl}/${partidaId}/Actualizar`
    );

  }

}