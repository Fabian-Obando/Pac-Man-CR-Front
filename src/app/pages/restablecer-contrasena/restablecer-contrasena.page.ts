import {
  Component,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { finalize } from 'rxjs';

import { Auth } from '../../services/auth';


@Component({
  selector: 'app-restablecer-contrasena',
  templateUrl: './restablecer-contrasena.page.html',
  styleUrls: ['./restablecer-contrasena.page.scss'],
  standalone: false
})
export class RestablecerContrasenaPage implements OnInit {

  token = '';

  nuevaContrasena = '';
  confirmarContrasena = '';

  mostrarNuevaContrasena = false;
  mostrarConfirmacion = false;

  cargando = false;

  mensajeError = '';
  mensajeExito = '';

  contrasenaActualizada = false;


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
     * El token llegará desde Gmail:
     *
     * /restablecer-contrasena?token=XXXXX
     */
    const tokenParametro =
      this.route.snapshot.queryParamMap.get(
        'token'
      );

    if (!tokenParametro) {

      this.mensajeError =
        'El enlace de recuperación no contiene un token válido.';

      return;

    }

    this.token =
      tokenParametro.trim();

  }


  /* =========================================================
     RESTABLECER CONTRASEÑA
  ========================================================= */

  restablecerContrasena(): void {

    if (this.cargando) {
      return;
    }

    this.limpiarMensajes();


    /* ---------------------------------------------------------
       VALIDAR TOKEN
    --------------------------------------------------------- */

    if (!this.token) {

      this.mensajeError =
        'El enlace de recuperación no es válido.';

      return;

    }


    /* ---------------------------------------------------------
       VALIDAR CONTRASEÑAS
    --------------------------------------------------------- */

    const errorContrasena =
      this.validarContrasena(
        this.nuevaContrasena
      );

    if (errorContrasena) {

      this.mensajeError =
        errorContrasena;

      return;

    }


    if (
      !this.confirmarContrasena
    ) {

      this.mensajeError =
        'Debe confirmar la nueva contraseña.';

      return;

    }


    if (
      this.nuevaContrasena !==
      this.confirmarContrasena
    ) {

      this.mensajeError =
        'Las contraseñas no coinciden.';

      return;

    }


    this.cargando = true;


    /* ---------------------------------------------------------
       LLAMADA AL BACKEND
    --------------------------------------------------------- */

    this.authService
      .restablecerContrasena({

        token:
          this.token,

        nuevaContrasena:
          this.nuevaContrasena,

        confirmarContrasena:
          this.confirmarContrasena

      })
      .pipe(
        finalize(() => {

          this.cargando = false;

        })
      )
      .subscribe({

        next: respuesta => {

          this.contrasenaActualizada =
            true;

          this.mensajeExito =
            respuesta?.mensaje ||
            'La contraseña fue actualizada correctamente.';

          /*
           * Limpiamos las contraseñas del componente
           * por seguridad.
           */
          this.nuevaContrasena = '';
          this.confirmarContrasena = '';

        },


        error: error => {

          console.error(
            'Error restableciendo contraseña:',
            error
          );

          this.mensajeError =
            this.obtenerMensajeError(
              error
            );

        }

      });

  }


  /* =========================================================
     MOSTRAR / OCULTAR CONTRASEÑAS
  ========================================================= */

  alternarNuevaContrasena(): void {

    this.mostrarNuevaContrasena =
      !this.mostrarNuevaContrasena;

  }


  alternarConfirmacion(): void {

    this.mostrarConfirmacion =
      !this.mostrarConfirmacion;

  }


  /* =========================================================
     ENTER
  ========================================================= */

  alPresionarEnter(): void {

    if (
      !this.cargando &&
      !this.contrasenaActualizada
    ) {

      this.restablecerContrasena();

    }

  }


  /* =========================================================
     VOLVER AL LOGIN
  ========================================================= */

  volverLogin(): void {

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
     VALIDACIÓN DE CONTRASEÑA
  ========================================================= */

  private validarContrasena(
    contrasena: string
  ): string | null {

    if (
      !contrasena ||
      contrasena.trim().length === 0
    ) {

      return (
        'Debe ingresar una nueva contraseña.'
      );

    }


    if (contrasena.length < 8) {

      return (
        'La contraseña debe tener al menos 8 caracteres.'
      );

    }


    if (contrasena.length > 100) {

      return (
        'La contraseña no puede superar los 100 caracteres.'
      );

    }


    if (
      !/[A-Z]/.test(contrasena)
    ) {

      return (
        'La contraseña debe contener al menos una letra mayúscula.'
      );

    }


    if (
      !/[a-z]/.test(contrasena)
    ) {

      return (
        'La contraseña debe contener al menos una letra minúscula.'
      );

    }


    if (
      !/[0-9]/.test(contrasena)
    ) {

      return (
        'La contraseña debe contener al menos un número.'
      );

    }


    if (
      !/[^A-Za-z0-9]/.test(contrasena)
    ) {

      return (
        'La contraseña debe contener al menos un símbolo.'
      );

    }


    return null;

  }


  /* =========================================================
     MANEJO DE ERRORES
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
        'El enlace de recuperación es inválido o ya venció.'
      );

    }


    if (
      error?.status === 404
    ) {

      return (
        'La cuenta asociada a este enlace ya no existe.'
      );

    }


    if (
      error?.status === 503
    ) {

      return (
        'El servicio no está disponible en este momento.'
      );

    }


    if (
      error?.status >= 500
    ) {

      return (
        'El servidor presentó un problema al cambiar la contraseña.'
      );

    }


    return this.obtenerMensajeBackend(
      error,
      'No fue posible cambiar la contraseña.'
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

    this.mensajeError = '';
    this.mensajeExito = '';

  }

}