import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../environments/environment';


/* ============================================================
   PAC-MAN CR
   SERVICIO DEL CENTRO DE ADMINISTRACIÓN

   Este servicio conecta el Front Administrativo con:

   /api/Admin

   Maneja:

   - Sesión administrativa
   - Dashboard
   - Jugadores
   - Estados de cuenta
   - Accesos
   - Partidas
   - Economía
   - Ranking
   - Moderación
   - Skins
   - Reportes mensuales
   - Reportes económicos
   - Reportes de partidas
   - Reportes de usuarios
   - Seguridad administrativa
============================================================ */


/* ============================================================
   IDENTIDAD DEL SISTEMA
============================================================ */

export interface AdminIdentidad {

  nombreJuego: string;

  nombreSistema: string;

  subtitulo: string;

  correoAdministrador: string;

  logo: string;

}


/* ============================================================
   SESIÓN ADMINISTRATIVA
============================================================ */

export interface AdminSesion {

  token: string;

  usuarioId: number;

  nombreUsuario: string;

  correo: string;

  venceUtc: string;

}


export interface AdminValidacionSesion {

  valida: boolean;

  usuarioId: number;

  correo: string;

  venceUtc: string;

}


/* ============================================================
   DASHBOARD
============================================================ */

export interface AdminResumen {

  totalUsuarios: number;

  usuariosActivos: number;

  nuevosUsuariosHoy: number;

  accesosUltimas24Horas: number;

  totalPartidas: number;

  partidasFinalizadas: number;

  partidasEnCurso: number;

  reportesPendientes: number;

  totalSkinsCompradas: number;

  oroActualJugadores: number;

  oroGanadoHistorico: number;

  oroGastadoHistorico: number;

}


/* ============================================================
   USUARIO
============================================================ */

export interface AdminUsuario {

  usuarioId: number;

  nombreUsuario: string;

  correo: string;

  fotoPerfil: string | null;

  nivel: number;

  oroActual: number;

  estadoCuenta: string;

  fechaRegistro: string;

  ultimoAcceso: string | null;

}


/* ============================================================
   ACCESO
============================================================ */

export interface AdminAcceso {

  accesoId: number;

  usuarioId: number;

  nombreUsuario: string;

  fechaIngreso: string;

  direccionIp: string;

  dispositivo: string;

  sistemaOperativo: string;

}


/* ============================================================
   TRANSACCIÓN DE ORO
============================================================ */

export interface AdminTransaccion {

  transaccionId: number;

  usuarioId: number;

  nombreUsuario: string;

  cantidad: number;

  tipoMovimiento: string;

  descripcion: string | null;

  fechaMovimiento: string;

}


/* ============================================================
   RESULTADO
============================================================ */

export interface AdminResultado {

  resultadoId: number;

  partidaId: number;

  usuarioId: number;

  rolId: number;

  posicionFinal: number;

  puntosObtenidos: number;

  oroGanado: number;

  fechaRegistro: string;

}


/* ============================================================
   SKIN DEL JUGADOR
============================================================ */

export interface AdminUsuarioSkin {

  usuarioSkinId: number;

  skinId: number;

  nombreSkin: string;

  tipoPersonaje: string;

  precioOro: number;

  equipada: boolean;

  fechaObtencion: string;

}


/* ============================================================
   DETALLE COMPLETO DEL JUGADOR
============================================================ */

export interface AdminUsuarioDetalle
  extends AdminUsuario {

  partidasJugadas: number;

  partidasGanadas: number;

  partidasPerdidas: number;

  frutasConsumidas: number;

  oroGanadoHistorico: number;

  oroGastadoHistorico: number;

  puntosRanking: number;

  posicionRanking: number | null;

  accesos: AdminAcceso[];

  transacciones: AdminTransaccion[];

  resultados: AdminResultado[];

  skins: AdminUsuarioSkin[];

}


/* ============================================================
   PARTIDA
============================================================ */

export interface AdminPartida {

  partidaId: number;

  salaId: number;

  codigoSala: string;

  mapaId: number;

  nombreMapa: string;

  dificultadId: number;

  nombreDificultad: string;

  estadoPartida: string;

  fechaInicio: string | null;

  fechaFin: string | null;

  ganadorId: number | null;

}


/* ============================================================
   RANKING
============================================================ */

export interface AdminRanking {

  rankingId: number;

  usuarioId: number;

  nombreUsuario: string;

  puntos: number;

  posicionActual: number | null;

  fechaActualizacion: string;

}


/* ============================================================
   MODERACIÓN
============================================================ */

export interface AdminReporte {

  reporteId: number;

  usuarioReportaId: number;

  usuarioReporta: string;

  usuarioReportadoId: number;

  usuarioReportado: string;

  motivo: string;

  estado: string;

  fechaReporte: string;

}


/* ============================================================
   SKINS COMPRADAS / OBTENIDAS
============================================================ */

export interface AdminCompraSkin {

  usuarioSkinId: number;

  usuarioId: number;

  nombreUsuario: string;

  skinId: number;

  nombreSkin: string;

  tipoPersonaje: string;

  precioOro: number;

  equipada: boolean;

  fechaObtencion: string;

}


/* ============================================================
   TOP JUGADORES DEL PERÍODO
============================================================ */

export interface AdminTopJugadorPeriodo {

  usuarioId: number;

  nombreUsuario: string;

  partidasJugadas: number;

  puntosObtenidos: number;

  oroGanado: number;

}


/* ============================================================
   RESULTADO PARA REPORTES
============================================================ */

export interface AdminResultadoReporte {

  resultadoId: number;

  partidaId: number;

  usuarioId: number;

  nombreUsuario: string;

  rolId: number;

  posicionFinal: number;

  puntosObtenidos: number;

  oroGanado: number;

  fechaRegistro: string;

}


/* ============================================================
   REPORTE MENSUAL COMPLETO
============================================================ */

export interface AdminReporteMensual {

  nombreJuego: string;

  nombreSistema: string;

  correoAdministrador: string;

  anio: number;

  mes: number;

  nombrePeriodo: string;

  fechaGeneracionUtc: string;

  totalUsuariosNuevos: number;

  totalAccesos: number;

  totalPartidas: number;

  partidasFinalizadas: number;

  partidasEnCurso: number;

  totalMovimientosOro: number;

  oroGanado: number;

  oroGastado: number;

  totalSkinsObtenidas: number;

  valorSkinsEnOro: number;

  totalReportes: number;

  reportesPendientes: number;

  usuariosNuevos: AdminUsuario[];

  accesos: AdminAcceso[];

  partidas: AdminPartida[];

  transacciones: AdminTransaccion[];

  skins: AdminCompraSkin[];

  resultados: AdminResultadoReporte[];

  reportes: AdminReporte[];

  topJugadores: AdminTopJugadorPeriodo[];

}


/* ============================================================
   REPORTE ECONÓMICO
============================================================ */

export interface AdminReporteEconomia {

  nombreJuego: string;

  nombrePeriodo: string;

  fechaGeneracionUtc: string;

  totalMovimientos: number;

  oroEntrante: number;

  oroGastado: number;

  balanceNeto: number;

  skinsObtenidas: number;

  valorSkinsEnOro: number;

  movimientos: AdminTransaccion[];

  skins: AdminCompraSkin[];

}


/* ============================================================
   REPORTE DE PARTIDAS
============================================================ */

export interface AdminReportePartidas {

  nombreJuego: string;

  nombrePeriodo: string;

  fechaGeneracionUtc: string;

  totalPartidas: number;

  partidasFinalizadas: number;

  partidasEnCurso: number;

  totalResultados: number;

  puntosGenerados: number;

  oroEntregado: number;

  partidas: AdminPartida[];

  topJugadores: AdminTopJugadorPeriodo[];

}


/* ============================================================
   REPORTE DE USUARIOS
============================================================ */

export interface AdminReporteUsuarios {

  nombreJuego: string;

  nombrePeriodo: string;

  fechaGeneracionUtc: string;

  totalUsuariosNuevos: number;

  totalAccesos: number;

  usuariosActivosActuales: number;

  usuariosBloqueadosActuales: number;

  usuariosNuevos: AdminUsuario[];

  accesos: AdminAcceso[];

}


/* ============================================================
   REQUEST CAMBIAR CONTRASEÑA
============================================================ */

export interface AdminCambiarContrasena {

  contrasenaActual: string;

  nuevaContrasena: string;

  confirmarContrasena: string;

}


/* ============================================================
   SERVICIO
============================================================ */

@Injectable({
  providedIn: 'root'
})
export class AdminService {


  /* =========================================================
     URL DEL BACK

     Ejemplo:

     http://192.168.1.16:5148/api/Admin

     La IP NO se escribe aquí directamente.
     Seguimos utilizando environment.apiUrl.
  ========================================================= */

  private readonly apiUrl =
    `${environment.apiUrl}/Admin`;


  /* =========================================================
     CLAVES LOCALES

     El token administrativo está separado completamente
     de cualquier sesión normal de jugador.
  ========================================================= */

  private readonly TOKEN_KEY =
    'pacman_admin_token';

  private readonly ADMIN_ID_KEY =
    'pacman_admin_id';

  private readonly ADMIN_NAME_KEY =
    'pacman_admin_nombre';

  private readonly ADMIN_EMAIL_KEY =
    'pacman_admin_correo';

  private readonly ADMIN_EXPIRES_KEY =
    'pacman_admin_vence';


  constructor(
    private readonly http: HttpClient
  ) {}


  /* =========================================================
     CREAR HEADERS PROTEGIDOS

     Todos los endpoints administrativos protegidos reciben:

     X-Admin-Token
  ========================================================= */

  private crearHeaders(): HttpHeaders {

    const token =
      this.obtenerToken();

    let headers =
      new HttpHeaders({
        'Content-Type':
          'application/json'
      });

    if (token) {

      headers =
        headers.set(
          'X-Admin-Token',
          token
        );

    }

    return headers;

  }


  /* =========================================================
     INICIAR SESIÓN ADMINISTRATIVA
  ========================================================= */

  iniciarSesion(
    correo: string,
    contrasena: string
  ): Observable<AdminSesion> {

    return this.http.post<AdminSesion>(
      `${this.apiUrl}/Sesion`,
      {
        correo,
        contrasena
      }
    );

  }


  /* =========================================================
     GUARDAR SESIÓN

     Se ejecutará después del login exitoso.
  ========================================================= */

  guardarSesion(
    sesion: AdminSesion
  ): void {

    localStorage.setItem(
      this.TOKEN_KEY,
      sesion.token
    );

    localStorage.setItem(
      this.ADMIN_ID_KEY,
      String(
        sesion.usuarioId
      )
    );

    localStorage.setItem(
      this.ADMIN_NAME_KEY,
      sesion.nombreUsuario
    );

    localStorage.setItem(
      this.ADMIN_EMAIL_KEY,
      sesion.correo
    );

    localStorage.setItem(
      this.ADMIN_EXPIRES_KEY,
      sesion.venceUtc
    );

  }


  /* =========================================================
     OBTENER TOKEN
  ========================================================= */

  obtenerToken(): string | null {

    return localStorage.getItem(
      this.TOKEN_KEY
    );

  }


  /* =========================================================
     OBTENER NOMBRE ADMIN
  ========================================================= */

  obtenerNombreAdmin(): string {

    return (
      localStorage.getItem(
        this.ADMIN_NAME_KEY
      )
      ??
      'Administrador'
    );

  }


  /* =========================================================
     OBTENER CORREO ADMIN
  ========================================================= */

  obtenerCorreoAdmin(): string {

    return (
      localStorage.getItem(
        this.ADMIN_EMAIL_KEY
      )
      ??
      ''
    );

  }


  /* =========================================================
     ¿EXISTE SESIÓN LOCAL?
  ========================================================= */

  tieneSesionLocal(): boolean {

    const token =
      this.obtenerToken();

    const vence =
      localStorage.getItem(
        this.ADMIN_EXPIRES_KEY
      );

    if (
      !token
      ||
      !vence
    ) {

      return false;

    }

    const fechaVencimiento =
      new Date(
        vence
      );

    if (
      Number.isNaN(
        fechaVencimiento.getTime()
      )
    ) {

      return false;

    }

    return (
      fechaVencimiento.getTime()
      >
      Date.now()
    );

  }


  /* =========================================================
     VALIDAR SESIÓN CONTRA EL BACK
  ========================================================= */

  validarSesion():
    Observable<AdminValidacionSesion> {

    return this.http.get<AdminValidacionSesion>(
      `${this.apiUrl}/ValidarSesion`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     CERRAR SESIÓN
  ========================================================= */

  cerrarSesion():
    Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/Sesion`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     LIMPIAR DATOS LOCALES
  ========================================================= */

  limpiarSesion(): void {

    localStorage.removeItem(
      this.TOKEN_KEY
    );

    localStorage.removeItem(
      this.ADMIN_ID_KEY
    );

    localStorage.removeItem(
      this.ADMIN_NAME_KEY
    );

    localStorage.removeItem(
      this.ADMIN_EMAIL_KEY
    );

    localStorage.removeItem(
      this.ADMIN_EXPIRES_KEY
    );

  }


  /* =========================================================
     IDENTIDAD DEL SISTEMA
  ========================================================= */

  obtenerIdentidad():
    Observable<AdminIdentidad> {

    return this.http.get<AdminIdentidad>(
      `${this.apiUrl}/Identidad`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     DASHBOARD
  ========================================================= */

  obtenerResumen():
    Observable<AdminResumen> {

    return this.http.get<AdminResumen>(
      `${this.apiUrl}/Resumen`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     USUARIOS
  ========================================================= */

  obtenerUsuarios(
    buscar: string = '',
    estado: string = ''
  ): Observable<AdminUsuario[]> {

    let params =
      new HttpParams();

    if (
      buscar.trim()
    ) {

      params =
        params.set(
          'buscar',
          buscar.trim()
        );

    }

    if (
      estado.trim()
    ) {

      params =
        params.set(
          'estado',
          estado.trim()
        );

    }

    return this.http.get<AdminUsuario[]>(
      `${this.apiUrl}/Usuarios`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     DETALLE DEL JUGADOR
  ========================================================= */

  obtenerUsuario(
    usuarioId: number
  ): Observable<AdminUsuarioDetalle> {

    return this.http.get<AdminUsuarioDetalle>(
      `${this.apiUrl}/Usuarios/${usuarioId}`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     CAMBIAR ESTADO DE CUENTA

     Estados:

     Activo
     Inactivo
     Bloqueado
  ========================================================= */

  cambiarEstadoUsuario(
    usuarioId: number,
    estado: 'Activo' | 'Inactivo' | 'Bloqueado'
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/Usuarios/${usuarioId}/Estado`,
      {
        estado
      },
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     ELIMINAR JUGADOR

     IMPORTANTE:

     Este método queda preparado para el endpoint:

     DELETE /api/Admin/Usuarios/{usuarioId}

     Debe existir en AdminController antes de habilitar
     el botón definitivo en producción.
  ========================================================= */

  eliminarUsuario(
    usuarioId: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/Usuarios/${usuarioId}`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     ACCESOS
  ========================================================= */

  obtenerAccesos(
    limite: number = 100
  ): Observable<AdminAcceso[]> {

    const params =
      new HttpParams()
        .set(
          'limite',
          String(limite)
        );

    return this.http.get<AdminAcceso[]>(
      `${this.apiUrl}/Accesos`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     PARTIDAS
  ========================================================= */

  obtenerPartidas(
    limite: number = 100
  ): Observable<AdminPartida[]> {

    const params =
      new HttpParams()
        .set(
          'limite',
          String(limite)
        );

    return this.http.get<AdminPartida[]>(
      `${this.apiUrl}/Partidas`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     TRANSACCIONES DE ORO
  ========================================================= */

  obtenerTransacciones(
    limite: number = 200
  ): Observable<AdminTransaccion[]> {

    const params =
      new HttpParams()
        .set(
          'limite',
          String(limite)
        );

    return this.http.get<AdminTransaccion[]>(
      `${this.apiUrl}/Transacciones`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     RANKING
  ========================================================= */

  obtenerRanking():
    Observable<AdminRanking[]> {

    return this.http.get<AdminRanking[]>(
      `${this.apiUrl}/Ranking`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     REPORTES / MODERACIÓN
  ========================================================= */

  obtenerReportes():
    Observable<AdminReporte[]> {

    return this.http.get<AdminReporte[]>(
      `${this.apiUrl}/Reportes`,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     CAMBIAR ESTADO DE REPORTE
  ========================================================= */

  cambiarEstadoReporte(
    reporteId: number,
    estado:
      | 'Pendiente'
      | 'Revisado'
      | 'Resuelto'
      | 'Descartado'
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/Reportes/${reporteId}/Estado`,
      {
        estado
      },
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     SKINS COMPRADAS / OBTENIDAS
  ========================================================= */

  obtenerSkinsCompradas(
    limite: number = 200
  ): Observable<AdminCompraSkin[]> {

    const params =
      new HttpParams()
        .set(
          'limite',
          String(limite)
        );

    return this.http.get<AdminCompraSkin[]>(
      `${this.apiUrl}/SkinsCompradas`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     REPORTE MENSUAL COMPLETO

     Será la fuente principal del PDF administrativo.
  ========================================================= */

  obtenerReporteMensual(
    anio: number,
    mes: number
  ): Observable<AdminReporteMensual> {

    const params =
      this.crearPeriodoParams(
        anio,
        mes
      );

    return this.http.get<AdminReporteMensual>(
      `${this.apiUrl}/ReportesSistema/Mensual`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     REPORTE ECONÓMICO
  ========================================================= */

  obtenerReporteEconomia(
    anio: number,
    mes: number
  ): Observable<AdminReporteEconomia> {

    const params =
      this.crearPeriodoParams(
        anio,
        mes
      );

    return this.http.get<AdminReporteEconomia>(
      `${this.apiUrl}/ReportesSistema/Economia`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     REPORTE DE PARTIDAS
  ========================================================= */

  obtenerReportePartidas(
    anio: number,
    mes: number
  ): Observable<AdminReportePartidas> {

    const params =
      this.crearPeriodoParams(
        anio,
        mes
      );

    return this.http.get<AdminReportePartidas>(
      `${this.apiUrl}/ReportesSistema/Partidas`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     REPORTE DE USUARIOS
  ========================================================= */

  obtenerReporteUsuarios(
    anio: number,
    mes: number
  ): Observable<AdminReporteUsuarios> {

    const params =
      this.crearPeriodoParams(
        anio,
        mes
      );

    return this.http.get<AdminReporteUsuarios>(
      `${this.apiUrl}/ReportesSistema/Usuarios`,
      {
        headers:
          this.crearHeaders(),

        params
      }
    );

  }


  /* =========================================================
     CAMBIAR CONTRASEÑA ADMINISTRATIVA

     Solo funciona estando dentro de una sesión Admin.
  ========================================================= */

  cambiarContrasena(
    request: AdminCambiarContrasena
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/CambiarContrasena`,
      request,
      {
        headers:
          this.crearHeaders()
      }
    );

  }


  /* =========================================================
     CREAR PARÁMETROS DE PERÍODO
  ========================================================= */

  private crearPeriodoParams(
    anio: number,
    mes: number
  ): HttpParams {

    return new HttpParams()
      .set(
        'anio',
        String(anio)
      )
      .set(
        'mes',
        String(mes)
      );

  }

}