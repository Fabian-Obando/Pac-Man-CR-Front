import {
  Injectable
} from '@angular/core';

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
   CONFIGURACIÓN DEL USUARIO
========================================================= */

export interface ConfiguracionUsuario {

  configuracionId: number;

  usuarioId: number;

  volumenMusica: number;

  volumenEfectos: number;

  idioma: string;

  notificaciones: boolean;

}


/* =========================================================
   DATOS PARA GUARDAR
========================================================= */

export interface ConfiguracionUsuarioRequest {

  usuarioId: number;

  volumenMusica: number;

  volumenEfectos: number;

  idioma: string;

  notificaciones: boolean;

}


/* =========================================================
   SERVICIO
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

  private readonly apiUrl =
    `${environment.apiUrl}/ConfiguracionUsuarios`;


  constructor(
    private readonly http: HttpClient
  ) {}


  /* =========================================================
     OBTENER CONFIGURACIÓN DEL USUARIO
  ========================================================= */

  obtenerPorUsuario(
    usuarioId: number
  ): Observable<ConfiguracionUsuario> {

    return this.http.get<ConfiguracionUsuario>(
      `${this.apiUrl}/usuario/${usuarioId}`
    );

  }


  /* =========================================================
     GUARDAR CONFIGURACIÓN
  ========================================================= */

  guardar(
    usuarioId: number,
    configuracion: ConfiguracionUsuarioRequest
  ): Observable<ConfiguracionUsuario> {

    return this.http.put<ConfiguracionUsuario>(
      `${this.apiUrl}/usuario/${usuarioId}`,
      configuracion
    );

  }

}