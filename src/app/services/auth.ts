import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';


/* =========================================================
   REQUEST - LOGIN
========================================================= */

export interface LoginRequest {

  correo: string;

  contrasena: string;

}


/* =========================================================
   REQUEST - REGISTRO
========================================================= */

export interface RegistroRequest {

  nombreUsuario: string;

  correo: string;

  contrasena: string;

  fotoPerfil?: string | null;

}


/* =========================================================
   USUARIO DE SESIÓN
========================================================= */

export interface UsuarioSesion {

  usuarioId: number;

  nombreUsuario: string;

  correo: string;

  fotoPerfil?: string | null;

  nivel: number;

  oroActual: number;

  estadoCuenta: string;

  fechaRegistro: string;

  ultimoAcceso?: string | null;

}


/* =========================================================
   REQUEST - SOLICITAR RECUPERACIÓN
========================================================= */

export interface SolicitarRecuperacionRequest {

  correo: string;

}


/* =========================================================
   REQUEST - RESTABLECER CONTRASEÑA
========================================================= */

export interface RestablecerContrasenaRequest {

  token: string;

  nuevaContrasena: string;

  confirmarContrasena: string;

}


/* =========================================================
   REQUEST - REENVIAR VERIFICACIÓN
========================================================= */

export interface ReenviarVerificacionRequest {

  correo: string;

}


/* =========================================================
   RESPUESTA SIMPLE DE AUTENTICACIÓN
========================================================= */

export interface MensajeAuthResponse {

  mensaje: string;

}


/* =========================================================
   RESPUESTA AL VERIFICAR CORREO
========================================================= */

export interface VerificarCorreoResponse {

  mensaje: string;

  usuario?: UsuarioSesion;

}


/* =========================================================
   SERVICIO AUTH
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class Auth {

  /*
   * URL base:
   *
   * https://localhost:xxxx/api/Auth
   */
  private readonly apiUrl =
    `${environment.apiUrl}/Auth`;


  /*
   * Clave utilizada para guardar la sesión
   * en localStorage.
   */
  private readonly sessionKey =
    'pacman_usuario';


  constructor(
    private readonly http: HttpClient
  ) {}


  /* =======================================================
     LOGIN
  ======================================================= */

  login(
    request: LoginRequest
  ): Observable<UsuarioSesion> {

    return this.http.post<UsuarioSesion>(
      `${this.apiUrl}/Login`,
      request
    );

  }


  /* =======================================================
     REGISTRO
  ======================================================= */

  registro(
    request: RegistroRequest
  ): Observable<UsuarioSesion> {

    return this.http.post<UsuarioSesion>(
      `${this.apiUrl}/Registro`,
      request
    );

  }


  /* =======================================================
     SOLICITAR RECUPERACIÓN DE CONTRASEÑA

     Endpoint:
     POST /api/Auth/SolicitarRecuperacion
  ======================================================= */

  solicitarRecuperacion(
    correo: string
  ): Observable<MensajeAuthResponse> {

    const request: SolicitarRecuperacionRequest = {

      correo:
        correo
          .trim()
          .toLowerCase()

    };

    return this.http.post<MensajeAuthResponse>(
      `${this.apiUrl}/SolicitarRecuperacion`,
      request
    );

  }


  /* =======================================================
     RESTABLECER CONTRASEÑA

     Endpoint:
     POST /api/Auth/RestablecerContrasena
  ======================================================= */

  restablecerContrasena(
    request: RestablecerContrasenaRequest
  ): Observable<MensajeAuthResponse> {

    return this.http.post<MensajeAuthResponse>(
      `${this.apiUrl}/RestablecerContrasena`,
      request
    );

  }


  /* =======================================================
     VERIFICAR CORREO

     Endpoint:
     GET /api/Auth/VerificarCorreo?token=...
  ======================================================= */

  verificarCorreo(
    token: string
  ): Observable<VerificarCorreoResponse> {

    const params = new HttpParams()
      .set(
        'token',
        token
      );

    return this.http.get<VerificarCorreoResponse>(
      `${this.apiUrl}/VerificarCorreo`,
      {
        params
      }
    );

  }


  /* =======================================================
     REENVIAR CORREO DE VERIFICACIÓN

     Endpoint:
     POST /api/Auth/ReenviarVerificacion
  ======================================================= */

  reenviarVerificacion(
    correo: string
  ): Observable<MensajeAuthResponse> {

    const request: ReenviarVerificacionRequest = {

      correo:
        correo
          .trim()
          .toLowerCase()

    };

    return this.http.post<MensajeAuthResponse>(
      `${this.apiUrl}/ReenviarVerificacion`,
      request
    );

  }


  /* =======================================================
     OBTENER USUARIO ACTUALIZADO

     Endpoint:
     GET /api/Auth/Usuario/{usuarioId}

     Sirve para refrescar:
     - Oro.
     - Nivel.
     - Estado de cuenta.
     - Información del usuario.
  ======================================================= */

  obtenerUsuario(
    usuarioId: number
  ): Observable<UsuarioSesion> {

    return this.http.get<UsuarioSesion>(
      `${this.apiUrl}/Usuario/${usuarioId}`
    );

  }


  /* =======================================================
     GUARDAR SESIÓN
  ======================================================= */

  guardarSesion(
    usuario: UsuarioSesion
  ): void {

    /*
     * Evitamos guardar sesiones inválidas.
     */
    if (
      !usuario ||
      Number(usuario.usuarioId) <= 0
    ) {

      console.error(
        'Se intentó guardar una sesión inválida:',
        usuario
      );

      return;

    }


    localStorage.setItem(
      this.sessionKey,
      JSON.stringify(usuario)
    );

  }


  /* =======================================================
     OBTENER SESIÓN
  ======================================================= */

  obtenerSesion(): UsuarioSesion | null {

    const datos =
      localStorage.getItem(
        this.sessionKey
      );


    if (!datos) {

      return null;

    }


    try {

      const usuario =
        JSON.parse(datos) as UsuarioSesion;


      /*
       * Una sesión sin ID no se considera válida.
       *
       * Esto ayuda con el problema que teníamos
       * en Salas y Lobby donde el backend recibía
       * usuarioId = 0 o undefined.
       */
      if (
        !usuario ||
        Number(usuario.usuarioId) <= 0
      ) {

        this.cerrarSesion();

        return null;

      }


      return usuario;

    }
    catch (error) {

      console.error(
        'Error leyendo la sesión del usuario:',
        error
      );


      /*
       * Si el JSON guardado está dañado,
       * eliminamos la sesión.
       */
      this.cerrarSesion();


      return null;

    }

  }


  /* =======================================================
     ACTUALIZAR PARTE DE LA SESIÓN

     Ejemplo:
     actualizarSesion({
       oroActual: 500
     });
  ======================================================= */

  actualizarSesion(
    cambios: Partial<UsuarioSesion>
  ): void {

    const usuarioActual =
      this.obtenerSesion();


    if (!usuarioActual) {

      return;

    }


    const usuarioActualizado: UsuarioSesion = {

      ...usuarioActual,

      ...cambios,

      /*
       * Protegemos el usuarioId para que nunca
       * sea sustituido por 0 o undefined.
       */
      usuarioId:
        Number(cambios.usuarioId) > 0
          ? Number(cambios.usuarioId)
          : usuarioActual.usuarioId

    };


    this.guardarSesion(
      usuarioActualizado
    );

  }


  /* =======================================================
     REFRESCAR SESIÓN DESDE EL BACK

     Muy útil después de:
     - Ganar oro.
     - Subir de nivel.
     - Comprar skins.
     - Cambiar información.
  ======================================================= */

  refrescarSesion(): void {

    const sesion =
      this.obtenerSesion();


    if (!sesion) {

      return;

    }


    this.obtenerUsuario(
      sesion.usuarioId
    )
    .subscribe({

      next: usuario => {

        if (
          usuario &&
          Number(usuario.usuarioId) > 0
        ) {

          this.guardarSesion(
            usuario
          );

        }

      },


      error: error => {

        console.warn(
          'No fue posible refrescar la sesión:',
          error
        );

      }

    });

  }


  /* =======================================================
     SABER SI EL USUARIO ESTÁ AUTENTICADO
  ======================================================= */

  estaAutenticado(): boolean {

    const usuario =
      this.obtenerSesion();


    return Boolean(
      usuario &&
      Number(usuario.usuarioId) > 0
    );

  }


  /* =======================================================
     OBTENER SOLAMENTE EL USUARIO ID
  ======================================================= */

  obtenerUsuarioId(): number | null {

    const usuario =
      this.obtenerSesion();


    if (!usuario) {

      return null;

    }


    const usuarioId =
      Number(usuario.usuarioId);


    return usuarioId > 0
      ? usuarioId
      : null;

  }


  /* =======================================================
     OBTENER NOMBRE DEL USUARIO
  ======================================================= */

  obtenerNombreUsuario(): string {

    const usuario =
      this.obtenerSesion();


    return usuario?.nombreUsuario ?? '';

  }


  /* =======================================================
     OBTENER CORREO DEL USUARIO
  ======================================================= */

  obtenerCorreoUsuario(): string {

    const usuario =
      this.obtenerSesion();


    return usuario?.correo ?? '';

  }


  /* =======================================================
     OBTENER ORO
  ======================================================= */

  obtenerOroActual(): number {

    const usuario =
      this.obtenerSesion();


    return Number(
      usuario?.oroActual ?? 0
    );

  }


  /* =======================================================
     ACTUALIZAR ORO LOCAL

     Esto evita tener que modificar manualmente
     todo el objeto usuario.
  ======================================================= */

  actualizarOro(
    nuevoOro: number
  ): void {

    if (
      !Number.isFinite(nuevoOro) ||
      nuevoOro < 0
    ) {

      return;

    }


    this.actualizarSesion({

      oroActual: nuevoOro

    });

  }


  /* =======================================================
     CERRAR SESIÓN
  ======================================================= */

  cerrarSesion(): void {

    localStorage.removeItem(
      this.sessionKey
    );

  }

}