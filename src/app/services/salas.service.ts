import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/*=========================================
DTOs
=========================================*/

export interface Sala {

  salaId: number;

  codigoSala: string;

  jugadorCreadorId: number;

  nombreCreador?: string;

  estadoSala: string;

  jugadoresActuales: number;

  maxJugadores: number;

  fechaCreacion: Date;

}
export interface CrearSalaRequest{

nombreCreador?: string;

}

/*=========================================
SERVICE
=========================================*/

@Injectable({
  providedIn:'root'
})

export class SalasService {

  private readonly apiUrl =
    `${environment.apiUrl}/Salas`;

  constructor(
    private http:HttpClient
  ){}

  /*=========================================
  Obtener todas las salas
  =========================================*/

  obtenerSalas():Observable<Sala[]>{

    return this.http.get<Sala[]>(this.apiUrl);

  }

  /*=========================================
  Obtener una sala
  =========================================*/

  obtenerSala(
    salaId:number
  ):Observable<Sala>{

    return this.http.get<Sala>(
      `${this.apiUrl}/${salaId}`
    );

  }

  /*=========================================
  Buscar por código
  =========================================*/

  obtenerPorCodigo(
    codigo:string
  ):Observable<Sala>{

    return this.http.get<Sala>(
      `${this.apiUrl}/codigo/${codigo}`
    );

  }

  /*=========================================
  Crear sala
  =========================================*/

  crearSala(
    request:CrearSalaRequest
  ):Observable<Sala>{

    return this.http.post<Sala>(
      this.apiUrl,
      request
    );

  }

  /*=========================================
  Unirse
  =========================================*/

  unirseSala(
    salaId:number,
    usuarioId:number
  ):Observable<any>{

    return this.http.post(
      `${this.apiUrl}/${salaId}/unirse/${usuarioId}`,
      {}
    );

  }

  /*=========================================
  Cerrar sala
  =========================================*/

  cerrarSala(
    salaId:number
  ):Observable<any>{

    return this.http.put(
      `${this.apiUrl}/${salaId}/cerrar`,
      {}
    );

  }

}