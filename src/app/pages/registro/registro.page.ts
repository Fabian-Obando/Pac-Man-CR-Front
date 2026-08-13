import {
  Component
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  Auth
} from '../../services/auth';


@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: false
})
export class RegistroPage {

  /* =========================================================
     CAMPOS DEL FORMULARIO
  ========================================================= */

  nombreUsuario = '';

  correo = '';

  password = '';

  confirmarPassword = '';


  /* =========================================================
     VISIBILIDAD DE CONTRASEÑAS
  ========================================================= */

  mostrarPassword = false;

  mostrarConfirmar = false;


  /* =========================================================
     ESTADOS DE PANTALLA
  ========================================================= */

  cargando = false;

  mensajeError = '';

  mensajeExito = '';

  cuentaCreada = false;


  constructor(
    private readonly router: Router,
    private readonly authService: Auth
  ) {}


  /* =========================================================
     CREAR CUENTA
  ========================================================= */

  crearCuenta(): void {

    if (this.cargando) {
      return;
    }

    this.limpiarMensajes();


    const nombreLimpio =
      this.nombreUsuario
        .trim();

    const correoLimpio =
      this.correo
        .trim()
        .toLowerCase();


    /* ---------------------------------------------------------
       VALIDAR CAMPOS
    --------------------------------------------------------- */

    if (
      !nombreLimpio ||
      !correoLimpio ||
      !this.password ||
      !this.confirmarPassword
    ) {

      this.mensajeError =
        'Complete todos los campos.';

      return;

    }


    /* ---------------------------------------------------------
       VALIDAR NOMBRE
    --------------------------------------------------------- */

    if (
      nombreLimpio.length < 3 ||
      nombreLimpio.length > 25
    ) {

      this.mensajeError =
        'El nombre de usuario debe tener entre 3 y 25 caracteres.';

      return;

    }


    /* ---------------------------------------------------------
       VALIDAR CORREO
    --------------------------------------------------------- */

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
       VALIDAR CONTRASEÑA
    --------------------------------------------------------- */

    const errorPassword =
      this.validarPassword(
        this.password
      );

    if (errorPassword) {

      this.mensajeError =
        errorPassword;

      return;

    }


    /* ---------------------------------------------------------
       CONFIRMAR CONTRASEÑA
    --------------------------------------------------------- */

    if (
      this.password !==
      this.confirmarPassword
    ) {

      this.mensajeError =
        'Las contraseñas no coinciden.';

      return;

    }


    /* ---------------------------------------------------------
       ENVIAR AL BACKEND
    --------------------------------------------------------- */

    this.cargando = true;


    this.authService
      .registro({

        nombreUsuario:
          nombreLimpio,

        correo:
          correoLimpio,

        contrasena:
          this.password,

        fotoPerfil:
          null

      })
      .pipe(

        finalize(() => {

          this.cargando = false;

        })

      )
      .subscribe({

        /* =====================================================
           REGISTRO EXITOSO
        ===================================================== */

        next: usuario => {

          console.log(
            'Usuario registrado:',
            usuario
          );


          /*
           * IMPORTANTE:
           *
           * Ya NO guardamos sesión aquí.
           *
           * El backend crea la cuenta con estado:
           *
           * Pendiente
           *
           * Primero debe verificar el correo recibido.
           */
          this.authService.cerrarSesion();


          this.cuentaCreada = true;


          this.mensajeExito =
            'Cuenta creada correctamente. Revisa tu correo para verificarla antes de iniciar sesión.';


          /*
           * Limpiamos las contraseñas del componente.
           */
          this.password = '';

          this.confirmarPassword = '';

          this.mostrarPassword = false;

          this.mostrarConfirmar = false;

        },


        /* =====================================================
           ERROR
        ===================================================== */

        error: error => {

          console.error(
            'Error creando cuenta:',
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
     MOSTRAR / OCULTAR CONTRASEÑA
  ========================================================= */

  alternarPassword(): void {

    this.mostrarPassword =
      !this.mostrarPassword;

  }


  /* =========================================================
     MOSTRAR / OCULTAR CONFIRMACIÓN
  ========================================================= */

  alternarConfirmarPassword(): void {

    this.mostrarConfirmar =
      !this.mostrarConfirmar;

  }


  /* =========================================================
     ENTER
  ========================================================= */

  alPresionarEnter(): void {

    if (
      !this.cargando &&
      !this.cuentaCreada
    ) {

      this.crearCuenta();

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
        queryParams: {

          /*
           * Mandamos el correo escrito para que el usuario
           * no tenga que volver a escribirlo.
           */
          correo:
            this.correo
              .trim()
              .toLowerCase()

        }
      }
    );

  }


  /* =========================================================
     IR AL LOGIN DESPUÉS DEL REGISTRO
  ========================================================= */

  irLogin(): void {

    if (this.cargando) {
      return;
    }


    void this.router.navigate(
      ['/login'],
      {
        queryParams: {

          correo:
            this.correo
              .trim()
              .toLowerCase()

        },

        replaceUrl: true
      }
    );

  }


  /* =========================================================
     REENVIAR VERIFICACIÓN
  ========================================================= */

  reenviarVerificacion(): void {

    if (this.cargando) {
      return;
    }


    this.limpiarMensajes();


    const correoLimpio =
      this.correo
        .trim()
        .toLowerCase();


    if (!correoLimpio) {

      this.mensajeError =
        'No se encontró el correo de la cuenta.';

      return;

    }


    if (
      !this.correoValido(
        correoLimpio
      )
    ) {

      this.mensajeError =
        'El correo electrónico no es válido.';

      return;

    }


    this.cargando = true;


    this.authService
      .reenviarVerificacion(
        correoLimpio
      )
      .pipe(

        finalize(() => {

          this.cargando = false;

        })

      )
      .subscribe({

        next: respuesta => {

          this.mensajeExito =
            respuesta?.mensaje ||
            'Si la cuenta está pendiente, recibirás un nuevo correo de verificación.';

        },


        error: error => {

          console.error(
            'Error reenviando verificación:',
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
     CAMBIAR DATOS DESPUÉS DE REGISTRARSE

     Permite volver al formulario si el usuario se equivocó
     escribiendo algún dato.
  ========================================================= */

  cambiarDatos(): void {

    if (this.cargando) {
      return;
    }


    this.cuentaCreada = false;

    this.mensajeError = '';

    this.mensajeExito = '';

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
     VALIDAR CONTRASEÑA

     Debe coincidir con las reglas del AuthController.
  ========================================================= */

  private validarPassword(
    password: string
  ): string | null {

    if (
      !password ||
      password.trim().length === 0
    ) {

      return (
        'Debe ingresar una contraseña.'
      );

    }


    if (
      password.length < 8
    ) {

      return (
        'La contraseña debe tener al menos 8 caracteres.'
      );

    }


    if (
      password.length > 100
    ) {

      return (
        'La contraseña no puede superar los 100 caracteres.'
      );

    }


    if (
      !/[A-Z]/.test(
        password
      )
    ) {

      return (
        'La contraseña debe contener al menos una letra mayúscula.'
      );

    }


    if (
      !/[a-z]/.test(
        password
      )
    ) {

      return (
        'La contraseña debe contener al menos una letra minúscula.'
      );

    }


    if (
      !/[0-9]/.test(
        password
      )
    ) {

      return (
        'La contraseña debe contener al menos un número.'
      );

    }


    if (
      !/[^A-Za-z0-9]/.test(
        password
      )
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
        'Los datos del registro no son válidos.'
      );

    }


    if (
      error?.status === 409
    ) {

      return this.obtenerMensajeBackend(
        error,
        'El correo o el nombre de usuario ya están registrados.'
      );

    }


    if (
      error?.status === 429
    ) {

      return (
        'Se realizaron demasiadas solicitudes. ' +
        'Espere unos minutos antes de volver a intentarlo.'
      );

    }


    if (
      error?.status === 503
    ) {

      return (
        'No fue posible enviar el correo de verificación. ' +
        'Revise la configuración de Gmail e inténtelo nuevamente.'
      );

    }


    if (
      error?.status >= 500
    ) {

      return (
        'El servidor presentó un problema al crear la cuenta.'
      );

    }


    return this.obtenerMensajeBackend(
      error,
      'No se pudo crear la cuenta.'
    );

  }


  /* =========================================================
     EXTRAER MENSAJE DEL BACKEND
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