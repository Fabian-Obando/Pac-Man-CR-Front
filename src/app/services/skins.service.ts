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
   SKIN DEL CATÁLOGO
========================================================= */

export interface SkinBackend {

  skinId: number;

  nombreSkin: string;

  descripcion?: string | null;

  tipoPersonaje: string;

  precioOro: number;

  activa: boolean;

}


/* =========================================================
   SKIN DEL USUARIO
========================================================= */

export interface UsuarioSkinBackend {

  usuarioSkinId: number;

  usuarioId: number;

  skinId: number;

  nombreSkin: string;

  tipoPersonaje: string;

  equipada: boolean;

  fechaObtencion: string;

}


/* =========================================================
   RESPUESTA DE COMPRA
========================================================= */

export interface CompraSkinRespuesta {

  mensaje: string;

  usuarioId: number;

  skinId: number;

  oroActual: number;

}


/* =========================================================
   RESPUESTA EQUIPAR
========================================================= */

export interface EquiparSkinRespuesta {

  mensaje: string;

  usuarioId: number;

  skinId: number;

  nombreSkin: string;

  tipoPersonaje: string;

}


/* =========================================================
   SERVICIO
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class SkinsService {

  /* =========================================================
     URLS
  ========================================================= */

  private readonly skinsUrl =
    `${environment.apiUrl}/Skins`;

  private readonly usuarioSkinsUrl =
    `${environment.apiUrl}/UsuarioSkins`;


  constructor(
    private readonly http: HttpClient
  ) {}


  /* =========================================================
     CATÁLOGO
  ========================================================= */

  obtenerSkins(): Observable<SkinBackend[]> {

    return this.http.get<SkinBackend[]>(
      this.skinsUrl
    );

  }


  /* =========================================================
     SKINS DEL JUGADOR
  ========================================================= */

  obtenerSkinsUsuario(
    usuarioId: number
  ): Observable<UsuarioSkinBackend[]> {

    return this.http.get<UsuarioSkinBackend[]>(
      `${this.usuarioSkinsUrl}/usuario/${usuarioId}`
    );

  }


  /* =========================================================
     SKINS EQUIPADAS
  ========================================================= */

  obtenerEquipadas(
    usuarioId: number
  ): Observable<UsuarioSkinBackend[]> {

    return this.http.get<UsuarioSkinBackend[]>(
      `${this.usuarioSkinsUrl}/equipadas/${usuarioId}`
    );

  }


  /* =========================================================
     INICIALIZAR SKINS GRATUITAS
  ========================================================= */

  inicializar(
    usuarioId: number
  ): Observable<any> {

    return this.http.post(
      `${this.usuarioSkinsUrl}/inicializar/${usuarioId}`,
      {}
    );

  }


  /* =========================================================
     COMPRAR
  ========================================================= */

  comprar(
    usuarioId: number,
    skinId: number
  ): Observable<CompraSkinRespuesta> {

    return this.http.post<CompraSkinRespuesta>(
      `${this.skinsUrl}/comprar`,
      {
        usuarioId,
        skinId
      }
    );

  }


  /* =========================================================
     EQUIPAR
  ========================================================= */

  equipar(
    usuarioId: number,
    skinId: number
  ): Observable<EquiparSkinRespuesta> {

    return this.http.put<EquiparSkinRespuesta>(
      `${this.usuarioSkinsUrl}/equipar`,
      {
        usuarioId,
        skinId
      }
    );

  }

}