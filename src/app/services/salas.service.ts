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
   MODELO DE SALA
========================================================= */

export interface Sala {

  salaId: number;

  codigoSala: string;

  jugadorCreadorId: number;

  nombreCreador: string;

  estadoSala: string;

  jugadoresActuales: number;

  maxJugadores: number;

  fechaCreacion: string;

}


/* =========================================================
   CREAR SALA
========================================================= */

export interface CrearSalaRequest {

  jugadorCreadorId: number;

}


@Injectable({
  providedIn: 'root'
})
export class SalasService {

  /*
   * Ejemplo:
   *
   * WEB:
   * http://localhost:5148/api/Salas
   *
   * ANDROID:
   * se utilizará la IP configurada posteriormente
   * en environment.
   */
  private readonly apiUrl =
    `${environment.apiUrl}/Salas`;


  constructor(
    private readonly http: HttpClient
  ) {}


  /* =======================================================
     LISTAR SALAS
  ======================================================== */

  obtenerSalas():
    Observable<Sala[]> {

    return this.http.get<Sala[]>(
      this.apiUrl
    );

  }


  /* =======================================================
     OBTENER SALA
  ======================================================== */

  obtenerSala(
    salaId: number
  ): Observable<Sala> {

    return this.http.get<Sala>(
      `${this.apiUrl}/${salaId}`
    );

  }


  /* =======================================================
     BUSCAR POR CÓDIGO
  ======================================================== */

  obtenerPorCodigo(
    codigo: string
  ): Observable<Sala> {

    const codigoSeguro =
      encodeURIComponent(
        codigo.trim()
      );

    return this.http.get<Sala>(
      `${this.apiUrl}/codigo/${codigoSeguro}`
    );

  }


  /* =======================================================
     CREAR SALA
  ======================================================== */

  crearSala(
    request: CrearSalaRequest
  ): Observable<Sala> {

    return this.http.post<Sala>(
      this.apiUrl,
      request
    );

  }


  /* =======================================================
     UNIRSE
  ======================================================== */

  unirseSala(
    salaId: number,
    usuarioId: number
  ): Observable<string> {

    return this.http.post(
      `${this.apiUrl}/${salaId}/unirse/${usuarioId}`,
      {},
      {
        responseType: 'text'
      }
    );

  }


  /* =======================================================
     ABANDONAR
  ======================================================== */

  abandonarSala(
    salaId: number,
    usuarioId: number
  ): Observable<void> {

    return this.http.post<void>(
      `${this.apiUrl}/${salaId}/abandonar/${usuarioId}`,
      {}
    );

  }


  /* =======================================================
     CERRAR
  ======================================================== */

  cerrarSala(
    salaId: number
  ): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${salaId}/cerrar`,
      {}
    );

  }

}