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


export interface RankingJugador {

  rankingId: number;

  usuarioId: number;

  nombreUsuario: string;

  fotoPerfil?: string | null;

  nivel: number;

  puntos: number;

  posicionActual: number;

  fechaActualizacion: string;

}


@Injectable({
  providedIn: 'root'
})
export class RankingService {

  private readonly apiUrl =
    `${environment.apiUrl}/RankingGlobals`;


  constructor(
    private readonly http: HttpClient
  ) {}


  listar():
    Observable<RankingJugador[]> {

    return this.http.get<RankingJugador[]>(
      this.apiUrl
    );

  }


  obtenerUsuario(
    usuarioId: number
  ): Observable<RankingJugador> {

    return this.http.get<RankingJugador>(
      `${this.apiUrl}/usuario/${usuarioId}`
    );

  }

}