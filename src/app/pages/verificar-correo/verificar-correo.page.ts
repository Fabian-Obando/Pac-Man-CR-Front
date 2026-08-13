import {
  Component,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  Auth
} from '../../services/auth';


@Component({
  selector: 'app-verificar-correo',
  templateUrl: './verificar-correo.page.html',
  styleUrls: ['./verificar-correo.page.scss'],
  standalone: false
})
export class VerificarCorreoPage implements OnInit {

  /* =========================================================
     TOKEN
  ========================================================= */

  token = '';


  /* =========================================================
     ESTADOS
  ========================================================= */

  cargando = false;

  verificacionExitosa = false;

  verificacionFallida = false;


  /* =========================================================
     MENSAJES
  ========================================================= */

  mensaje = '';

  mensajeError = '';


  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: Auth
  ) {}


  /* =========================================================
     INICIO
  ========================================================= */

  ngOnInit(): void {

    /*
     * El token llega desde el enlace enviado por correo:
     *
     * /verificar-correo?token=XXXXX
     */
    this.route.queryParamMap
      .subscribe(params => {

        const tokenParametro =
          params.get('token');


        if (!tokenParametro) {

          this.verificacionFallida = true;

          this.verificacionExitosa = false;

          this.mensajeError =
            'El enlace de verificación no contiene un token válido.';

          return;

        }


        this.token =
          tokenParametro.trim();


        /*
         * Ejecutamos la verificación automáticamente.
         */
        this.verificarCorreo();

      });

  }


  /* =========================================================
     VERIFICAR CORREO
  ========================================================= */

  verificarCorreo(): void {

    if (
      this.cargando ||
      !this.token
    ) {

      return;

    }


    this.limpiarEstado();


    this.cargando = true;


    this.authService
      .verificarCorreo(
        this.token
      )
      .pipe(

        finalize(() => {

          this.cargando = false;

        })

      )
      .subscribe({

        /* =====================================================
           ÉXITO
        ===================================================== */

        next: respuesta => {

          this.verificacionExitosa = true;

          this.verificacionFallida = false;


          this.mensaje =
            respuesta?.mensaje ||
            'El correo fue verificado correctamente.';


          /*
           * Por seguridad no iniciamos sesión automáticamente.
           * El usuario vuelve al Login.
           */
          this.authService.cerrarSesion();

        },


        /* =====================================================
           ERROR
        ===================================================== */

        error: error => {

          console.error(
            'Error verificando correo:',
            error
          );


          this.verificacionExitosa = false;

          this.verificacionFallida = true;


          this.mensajeError =
            this.obtenerMensajeError(
              error
            );

        }

      });

  }


  /* =========================================================
     REINTENTAR
  ========================================================= */

  reintentar(): void {

    if (
      this.cargando ||
      !this.token
    ) {

      return;

    }


    this.verificarCorreo();

  }


  /* =========================================================
     IR AL LOGIN
  ========================================================= */

  irLogin(): void {

    if (this.cargando) {

      return;

    }


    void this.router.navigate(
      ['/login'],
      {
        replaceUrl: true
      }
    );

  }


  /* =========================================================
     IR AL REGISTRO
  ========================================================= */

  irRegistro(): void {

    if (this.cargando) {

      return;

    }


    void this.router.navigate(
      ['/registro']
    );

  }


  /* =========================================================
     MENSAJES DE ERROR
  ========================================================= */

  private obtenerMensajeError(
    error: any
  ): string {

    if (
      error?.status === 0
    ) {

      return (
        'No se pudo conectar con el servidor. ' +
        'Verifique que el backend esté ejecutándose.'
      );

    }


    if (
      error?.status === 400
    ) {

      return this.obtenerMensajeBackend(
        error,
        'El enlace de verificación es inválido o ya venció.'
      );

    }


    if (
      error?.status === 404
    ) {

      return this.obtenerMensajeBackend(
        error,
        'La cuenta asociada al enlace no existe.'
      );

    }


    if (
      error?.status === 403
    ) {

      return this.obtenerMensajeBackend(
        error,
        'La cuenta no puede verificarse en este momento.'
      );

    }


    if (
      error?.status === 409
    ) {

      return this.obtenerMensajeBackend(
        error,
        'La cuenta ya se encuentra verificada.'
      );

    }


    if (
      error?.status >= 500
    ) {

      return (
        'El servidor presentó un problema al verificar el correo.'
      );

    }


    return this.obtenerMensajeBackend(
      error,
      'No fue posible verificar el correo.'
    );

  }


  /* =========================================================
     EXTRAER MENSAJE DEL BACK
  ========================================================= */

  private obtenerMensajeBackend(
    error: any,
    mensajePredeterminado: string
  ): string {

    if (
      typeof error?.error ===
      'string'
    ) {

      return error.error;

    }


    if (
      typeof error?.error?.mensaje ===
      'string'
    ) {

      return error.error.mensaje;

    }


    if (
      typeof error?.error?.message ===
      'string'
    ) {

      return error.error.message;

    }


    return mensajePredeterminado;

  }


  /* =========================================================
     LIMPIAR ESTADO
  ========================================================= */

  private limpiarEstado(): void {

    this.mensaje = '';

    this.mensajeError = '';

    this.verificacionExitosa = false;

    this.verificacionFallida = false;

  }

}