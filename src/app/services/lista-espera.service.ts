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


export interface JugadorEspera {

  esperaId: number;

  usuarioId: number;

  nombreUsuario: string;

  nivel: number;

  fechaIngreso: string;

  estadoEspera: string;

  posicion: number;

}


@Injectable({
  providedIn: 'root'
})
export class ListaEsperaService {

  private readonly apiUrl =
    `${environment.apiUrl}/ListaEsperas`;


  constructor(
    private readonly http: HttpClient
  ) {}


  listar():
    Observable<JugadorEspera[]> {

    return this.http.get<JugadorEspera[]>(
      this.apiUrl
    );

  }


  obtenerUsuario(
    usuarioId: number
  ): Observable<JugadorEspera> {

    return this.http.get<JugadorEspera>(
      `${this.apiUrl}/usuario/${usuarioId}`
    );

  }


  entrar(
    usuarioId: number
  ): Observable<JugadorEspera> {

    return this.http.post<JugadorEspera>(
      `${this.apiUrl}/entrar/${usuarioId}`,
      {}
    );

  }


  salir(
    usuarioId: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/usuario/${usuarioId}`
    );

  }

}