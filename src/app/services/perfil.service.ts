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
   ESTADÍSTICAS
========================================================= */

export interface EstadisticasJugador {

  estadisticaId: number;

  usuarioId: number;

  partidasJugadas: number;

  partidasGanadas: number;

  partidasPerdidas: number;

  frutasConsumidas: number;

  oroGanado: number;
}


/* =========================================================
   LOGRO
========================================================= */

export interface LogroUsuario {

  usuarioLogroId: number;

  usuarioId: number;

  logroId: number;

  nombreLogro: string;

  descripcion: string;

  recompensaOro: number;

  fechaDesbloqueo: string;
}


/* =========================================================
   SKIN EQUIPADA
========================================================= */

export interface SkinEquipada {

  usuarioSkinId: number;

  usuarioId: number;

  skinId: number;

  nombreSkin: string;

  tipoPersonaje: string;

  equipada: boolean;

  fechaObtencion: string;
}


/* =========================================================
   COMENTARIO / SUGERENCIA

   Se utiliza actualmente ReportesJugador para no modificar
   la estructura de la base de datos.

   UsuarioReportaId:
   jugador que envía el comentario.

   UsuarioReportadoId:
   se utiliza temporalmente el mismo jugador.

   Motivo:
   [COMENTARIO] mensaje...
   [SUGERENCIA] mensaje...
   [PROBLEMA] mensaje...
========================================================= */

export type TipoComentario =
  | 'Comentario'
  | 'Sugerencia'
  | 'Problema';


export interface ComentarioJugadorRequest {

  usuarioReportadoId: number;

  usuarioReportaId: number;

  motivo: string;

  fechaReporte: string;

  estado: string;
}


/* =========================================================
   RESPUESTA DEL REPORTE / COMENTARIO
========================================================= */

export interface ComentarioJugadorRespuesta {

  reporteId: number;

  usuarioReportadoId: number;

  usuarioReportaId: number;

  motivo: string;

  fechaReporte: string;

  estado: string;
}


/* =========================================================
   SERVICIO
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class PerfilService {


  /* =======================================================
     URLS
  ======================================================= */

  private readonly estadisticasUrl =
    `${environment.apiUrl}/EstadisticasJugadors`;

  private readonly logrosUrl =
    `${environment.apiUrl}/UsuarioLogros`;

  private readonly skinsUrl =
    `${environment.apiUrl}/UsuarioSkins`;

  private readonly reportesUrl =
    `${environment.apiUrl}/ReportesJugadors`;


  /* =======================================================
     CONSTRUCTOR
  ======================================================= */

  constructor(
    private readonly http: HttpClient
  ) {}


  /* =======================================================
     ESTADÍSTICAS DEL USUARIO
  ======================================================= */

  obtenerEstadisticas(
    usuarioId: number
  ): Observable<EstadisticasJugador> {

    return this.http.get<EstadisticasJugador>(
      `${this.estadisticasUrl}/usuario/${usuarioId}`
    );

  }


  /* =======================================================
     LOGROS DESBLOQUEADOS
  ======================================================= */

  obtenerLogros(
    usuarioId: number
  ): Observable<LogroUsuario[]> {

    return this.http.get<LogroUsuario[]>(
      `${this.logrosUrl}/usuario/${usuarioId}`
    );

  }


  /* =======================================================
     SKINS EQUIPADAS
  ======================================================= */

  obtenerSkinsEquipadas(
    usuarioId: number
  ): Observable<SkinEquipada[]> {

    return this.http.get<SkinEquipada[]>(
      `${this.skinsUrl}/equipadas/${usuarioId}`
    );

  }


  /* =======================================================
     ENVIAR COMENTARIO AL CENTRO ADMINISTRATIVO
  ======================================================= */

  enviarComentario(
    usuarioId: number,
    tipo: TipoComentario,
    mensaje: string
  ): Observable<ComentarioJugadorRespuesta> {

    const texto =
      `[${tipo.toUpperCase()}] ${mensaje.trim()}`;

    const request: ComentarioJugadorRequest = {

      usuarioReportadoId:
        usuarioId,

      usuarioReportaId:
        usuarioId,

      motivo:
        texto,

      fechaReporte:
        new Date().toISOString(),

      estado:
        'Pendiente'

    };


    return this.http.post<ComentarioJugadorRespuesta>(
      this.reportesUrl,
      request
    );

  }

}