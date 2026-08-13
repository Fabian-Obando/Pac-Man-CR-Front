/* =========================================================
   PAC-MAN CR
   RECUPERAR CONTRASEÑA
========================================================= */

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
  selector: 'app-recuperar-contrasena',
  templateUrl: './recuperar-contrasena.page.html',
  styleUrls: ['./recuperar-contrasena.page.scss'],
  standalone: false
})
export class RecuperarContrasenaPage implements OnInit {

  /* =========================================================
     FORMULARIO
  ========================================================= */

  correo = '';


  /* =========================================================
     ESTADOS
  ========================================================= */

  cargando = false;

  correoEnviado = false;


  /* =========================================================
     MENSAJES
  ========================================================= */

  mensajeError = '';

  mensajeExito = '';


  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: Auth
  ) {}


  /* =========================================================
     INICIO
  ========================================================= */

  ngOnInit(): void {

    /*
     * Si llegamos desde Login:
     *
     * /recuperar-contrasena?correo=usuario@gmail.com
     *
     * recuperamos automáticamente ese correo.
     */
    this.route.queryParamMap
      .subscribe(params => {

        const correoParametro =
          params.get('correo');


        if (
          correoParametro
        ) {

          this.correo =
            correoParametro
              .trim()
              .toLowerCase();

        }

      });

  }


  /* =========================================================
     SOLICITAR RECUPERACIÓN
  ========================================================= */

  enviarRecuperacion(): void {

    if (
      this.cargando
    ) {
      return;
    }


    this.limpiarMensajes();


    const correoLimpio =
      this.correo
        .trim()
        .toLowerCase();


    /* ---------------------------------------------------------
       VALIDACIÓN
    --------------------------------------------------------- */

    if (
      !correoLimpio
    ) {

      this.mensajeError =
        'Debe ingresar su correo electrónico.';

      return;

    }


    if (
      !this.correoValido(
        correoLimpio
      )
    ) {

      this.mensajeError =
        'Ingrese un correo electrónico válido.';

      return;

    }


    /* ---------------------------------------------------------
       SOLICITAR AL BACK
    --------------------------------------------------------- */

    this.cargando = true;


    this.authService
      .solicitarRecuperacion(
        correoLimpio
      )
      .pipe(

        finalize(() => {

          this.cargando = false;

        })

      )
      .subscribe({

        /* =====================================================
           CORREO SOLICITADO
        ===================================================== */

        next: respuesta => {

          /*
           * Guardamos el correo limpio.
           */
          this.correo =
            correoLimpio;


          /*
           * Mostramos el estado de correo enviado.
           */
          this.correoEnviado =
            true;


          /*
           * Por seguridad, el backend devuelve una
           * respuesta genérica exista o no el correo.
           */
          this.mensajeExito =
            respuesta?.mensaje ||
            (
              'Si existe una cuenta registrada con ese correo, ' +
              'recibirá un enlace para cambiar la contraseña.'
            );

        },


        /* =====================================================
           ERROR
        ===================================================== */

        error: error => {

          console.error(
            'Error solicitando recuperación:',
            error
          );


          this.correoEnviado =
            false;


          this.mensajeError =
            this.obtenerMensajeError(
              error
            );

        }

      });

  }


  /* =========================================================
     REENVIAR CORREO
  ========================================================= */

  reenviarCorreo(): void {

    if (
      this.cargando
    ) {
      return;
    }


    /*
     * Volvemos a utilizar el mismo endpoint.
     *
     * El Back generará un token nuevo.
     */
    this.enviarRecuperacion();

  }


  /* =========================================================
     ENTER
  ========================================================= */

  alPresionarEnter(): void {

    if (
      !this.cargando
    ) {

      this.enviarRecuperacion();

    }

  }


  /* =========================================================
     VOLVER AL LOGIN
  ========================================================= */

  volverLogin(): void {

    if (
      this.cargando
    ) {
      return;
    }


    const correoLimpio =
      this.correo
        .trim()
        .toLowerCase();


    void this.router.navigate(
      ['/login'],
      {
        queryParams:
          correoLimpio
            ? {
                correo: correoLimpio
              }
            : {}
      }
    );

  }


  /* =========================================================
     CAMBIAR CORREO
  ========================================================= */

  cambiarCorreo(): void {

    if (
      this.cargando
    ) {
      return;
    }


    this.correoEnviado =
      false;


    this.mensajeError =
      '';


    this.mensajeExito =
      '';

  }


  /* =========================================================
     VALIDAR CORREO
  ========================================================= */

  private correoValido(
    correo: string
  ): boolean {

    const expresion =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


    return expresion.test(
      correo
    );

  }


  /* =========================================================
     ERRORES
  ========================================================= */

  private obtenerMensajeError(
    error: any
  ): string {

    /* ---------------------------------------------------------
       BACK NO DISPONIBLE
    --------------------------------------------------------- */

    if (
      error?.status === 0
    ) {

      return (
        'No se pudo conectar con el servidor. ' +
        'Verifique que el backend esté ejecutándose.'
      );

    }


    /* ---------------------------------------------------------
       PETICIÓN INVÁLIDA
    --------------------------------------------------------- */

    if (
      error?.status === 400
    ) {

      return this.obtenerMensajeBackend(
        error,
        'El correo enviado no es válido.'
      );

    }


    /* ---------------------------------------------------------
       DEMASIADOS INTENTOS
    --------------------------------------------------------- */

    if (
      error?.status === 429
    ) {

      return (
        'Se realizaron demasiadas solicitudes. ' +
        'Espere unos minutos antes de volver a intentarlo.'
      );

    }


    /* ---------------------------------------------------------
       SERVICIO GMAIL NO DISPONIBLE
    --------------------------------------------------------- */

    if (
      error?.status === 503
    ) {

      return (
        'El servicio de correo no está disponible en este momento. ' +
        'Inténtelo nuevamente más tarde.'
      );

    }


    /* ---------------------------------------------------------
       ERROR DEL SERVIDOR
    --------------------------------------------------------- */

    if (
      error?.status >= 500
    ) {

      return (
        'El servidor presentó un problema al enviar ' +
        'el correo de recuperación.'
      );

    }


    return this.obtenerMensajeBackend(
      error,
      'No fue posible solicitar la recuperación de contraseña.'
    );

  }


  /* =========================================================
     MENSAJE DEL BACKEND
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
      typeof error?.error?.message ===
      'string'
    ) {

      return error.error.message;

    }


    if (
      typeof error?.error?.mensaje ===
      'string'
    ) {

      return error.error.mensaje;

    }


    return mensajePredeterminado;

  }


  /* =========================================================
     LIMPIAR MENSAJES
  ========================================================= */

  private limpiarMensajes(): void {

    this.mensajeError =
      '';


    this.mensajeExito =
      '';

  }

}