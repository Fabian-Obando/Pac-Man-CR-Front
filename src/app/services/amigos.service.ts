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


export interface AmigoRelacion {

  amigoId: number;

  usuarioId: number;

  usuarioAmigoId: number;

  fechaAgregado: string;

  estadoAmistad: string;

  otroUsuarioId: number;

  nombreUsuario: string;

  correo: string;

  fotoPerfil?: string | null;

  nivel: number;

  solicitudRecibida: boolean;

}


export interface UsuarioBusqueda {

  usuarioId: number;

  nombreUsuario: string;

  correo: string;

  fotoPerfil?: string | null;

  nivel: number;

}


@Injectable({
  providedIn: 'root'
})
export class AmigosService {

  private readonly apiUrl =
    `${environment.apiUrl}/Amigos`;


  constructor(
    private readonly http: HttpClient
  ) {}


  obtenerPorUsuario(
    usuarioId: number
  ): Observable<AmigoRelacion[]> {

    return this.http.get<AmigoRelacion[]>(
      `${this.apiUrl}/usuario/${usuarioId}`
    );

  }


  buscarUsuarios(
    usuarioId: number,
    termino: string
  ): Observable<UsuarioBusqueda[]> {

    return this.http.get<UsuarioBusqueda[]>(
      `${this.apiUrl}/buscar`,
      {
        params: {
          usuarioId:
            usuarioId.toString(),

          termino
        }
      }
    );

  }


  enviarSolicitud(
    usuarioId: number,
    usuarioAmigoId: number
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/solicitud`,
      {
        usuarioId,
        usuarioAmigoId
      }
    );

  }


  aceptarSolicitud(
    amigoId: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${amigoId}/aceptar`,
      {}
    );

  }


  eliminar(
    amigoId: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${amigoId}`
    );

  }

}