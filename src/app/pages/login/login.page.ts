import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  Auth,
  UsuarioSesion
} from '../../services/auth';

import {
  AdminService
} from '../../services/admin.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {


  /* =========================================================
     CAMPOS
  ========================================================= */

  correo = '';

  password = '';


  /* =========================================================
     ESTADOS
  ========================================================= */

  mostrarPassword = false;

  cargando = false;

  mensajeError = '';

  mensajeExito = '';


  /* =========================================================
     ADMINISTRADOR OFICIAL PAC-MAN CR

     Esta cuenta:

     - Es el administrador interno del juego.
     - NO participa como jugador.
     - NO entra al menú de jugadores.
     - NO entra a salas.
     - NO aparece en partidas.
     - NO aparece en rankings.
     - NO puede recuperar contraseña desde Login.
     - NO puede registrarse desde Registro.
     - Utiliza una sesión administrativa independiente.
  ========================================================= */

  private readonly correoAdministrador =
    'pacmancr.game@gmail.com';


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private readonly router: Router,
    private readonly authService: Auth,
    private readonly adminService: AdminService
  ) {}


  /* =========================================================
     INICIO
  ========================================================= */

  ngOnInit(): void {

    /*
     * Primero verificamos si existe una sesión
     * administrativa todavía válida.
     */

    if (
      this.adminService.tieneSesionLocal()
    ) {

      this.adminService
        .validarSesion()
        .subscribe({

          next: validacion => {

            if (
              validacion?.valida
            ) {

              void this.router.navigate(
                ['/administrador'],
                {
                  replaceUrl: true
                }
              );

              return;

            }


            /*
             * Si el token local existe pero ya no es
             * válido en el Back, lo eliminamos.
             */

            this.adminService
              .limpiarSesion();

          },


          error: () => {

            /*
             * Token vencido, inválido o Backend
             * rechazó la sesión.
             */

            this.adminService
              .limpiarSesion();

          }

        });


      return;

    }


    /*
     * Si NO existe sesión administrativa,
     * verificamos si existe una sesión normal.
     */

    const sesion =
      this.authService.obtenerSesion();


    if (
      sesion &&
      Number(
        sesion.usuarioId
      ) > 0
    ) {


      /* =====================================================
         NUNCA DEJAMOS AL ADMIN COMO JUGADOR
      ===================================================== */

      if (
        this.esAdministrador(
          sesion.correo
        )
      ) {

        this.authService
          .cerrarSesion();


        this.adminService
          .limpiarSesion();


        return;

      }


      /* =====================================================
         JUGADOR NORMAL
      ===================================================== */

      void this.router.navigate(
        ['/menu'],
        {
          replaceUrl: true
        }
      );

    }

  }


  /* =========================================================
     LOGIN PRINCIPAL
  ========================================================= */

  login(): void {

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


    /* =====================================================
       CAMPOS VACÍOS
    ===================================================== */

    if (
      !correoLimpio ||
      !this.password
    ) {

      this.mensajeError =
        'Debe completar el correo y la contraseña.';

      return;

    }


    /* =====================================================
       CORREO
    ===================================================== */

    if (
      !this.correoValido(
        correoLimpio
      )
    ) {

      this.mensajeError =
        'Ingrese un correo electrónico válido.';

      return;

    }


    /* =====================================================
       CONTRASEÑA
    ===================================================== */

    if (
      this.password
        .trim()
        .length === 0
    ) {

      this.mensajeError =
        'Debe ingresar la contraseña.';

      return;

    }


    /* =====================================================
       ADMINISTRADOR
    ===================================================== */

    if (
      this.esAdministrador(
        correoLimpio
      )
    ) {

      this.loginAdministrador(
        correoLimpio
      );

      return;

    }


    /* =====================================================
       JUGADOR
    ===================================================== */

    this.loginJugador(
      correoLimpio
    );

  }


  /* =========================================================
     LOGIN DE JUGADOR NORMAL
  ========================================================= */

  private loginJugador(
    correoLimpio: string
  ): void {

    this.cargando =
      true;


    /*
     * Seguridad:
     *
     * un jugador normal nunca necesita tener
     * una sesión administrativa guardada.
     */

    this.adminService
      .limpiarSesion();


    this.authService
      .login({

        correo:
          correoLimpio,

        contrasena:
          this.password

      })
      .pipe(

        finalize(
          () => {

            this.cargando =
              false;

          }
        )

      )
      .subscribe({

        /* =====================================================
           LOGIN CORRECTO
        ===================================================== */

        next: respuesta => {

          console.log(
            'Respuesta Login Jugador:',
            respuesta
          );


          /*
           * Dejamos compatibilidad con distintas
           * estructuras posibles del Back.
           */

          const datos =

            (respuesta as any)?.usuario ??

            (respuesta as any)?.data ??

            (respuesta as any)?.resultado ??

            respuesta;


          const usuario =
            this.normalizarUsuario(
              datos
            );


          /* =================================================
             VALIDAR USUARIO
          ================================================= */

          if (
            !usuario
          ) {

            console.error(
              'Respuesta de usuario inválida:',
              respuesta
            );


            this.authService
              .cerrarSesion();


            this.mensajeError =
              'El servidor respondió, pero no devolvió correctamente los datos del usuario.';

            return;

          }


          /* =================================================
             SEGURIDAD EXTRA

             Si por alguna razón el Back devolviera
             la cuenta administrativa desde este flujo,
             no permitimos que continúe como jugador.
          ================================================= */

          if (
            this.esAdministrador(
              usuario.correo
            )
          ) {

            this.authService
              .cerrarSesion();


            this.mensajeError =
              'La cuenta administrativa debe ingresar mediante el acceso administrativo.';

            return;

          }


          /* =================================================
             VALIDAR ESTADO DE CUENTA
          ================================================= */

          if (
            !this.cuentaPuedeIngresar(
              usuario.estadoCuenta
            )
          ) {

            this.authService
              .cerrarSesion();


            this.mensajeError =
              this.obtenerMensajeEstadoCuenta(
                usuario.estadoCuenta
              );

            return;

          }


          /* =================================================
             GUARDAR SESIÓN DEL JUGADOR
          ================================================= */

          this.authService
            .guardarSesion(
              usuario
            );


          const sesionGuardada =
            this.authService
              .obtenerSesion();


          if (
            !sesionGuardada ||
            Number(
              sesionGuardada.usuarioId
            ) <= 0
          ) {

            this.authService
              .cerrarSesion();


            this.mensajeError =
              'No fue posible guardar correctamente la sesión.';

            return;

          }


          /* =================================================
             TODO CORRECTO
          ================================================= */

          this.password =
            '';


          this.mensajeExito =
            'Inicio de sesión correcto.';


          /* =================================================
             JUGADOR -> MENÚ
          ================================================= */

          void this.router.navigate(
            ['/menu'],
            {
              replaceUrl: true
            }
          );

        },


        /* =====================================================
           ERROR
        ===================================================== */

        error: error => {

          console.error(
            'Error Login Jugador:',
            error
          );


          this.authService
            .cerrarSesion();


          this.mensajeError =
            this.obtenerMensajeError(
              error
            );

        }

      });

  }


  /* =========================================================
     LOGIN ADMINISTRADOR

     FLUJO:

     Login
       ↓
     AdminService.iniciarSesion()
       ↓
     POST /api/Admin/Sesion
       ↓
     Back valida correo y contraseña
       ↓
     Back genera X-Admin-Token
       ↓
     AdminService.guardarSesion()
       ↓
     AdminService.validarSesion()
       ↓
     /administrador
  ========================================================= */

  private loginAdministrador(
    correoLimpio: string
  ): void {

    this.cargando =
      true;


    /*
     * El administrador NO utiliza la sesión
     * normal de los jugadores.
     */

    this.authService
      .cerrarSesion();


    /*
     * Quitamos cualquier token Admin anterior
     * antes de crear uno nuevo.
     */

    this.adminService
      .limpiarSesion();


    this.adminService
      .iniciarSesion(
        correoLimpio,
        this.password
      )
      .pipe(

        finalize(
          () => {

            this.cargando =
              false;

          }
        )

      )
      .subscribe({

        /* =====================================================
           SESIÓN ADMIN CREADA
        ===================================================== */

        next: sesionAdmin => {

          console.log(
            'Respuesta Sesión Admin:',
            sesionAdmin
          );


          /* =================================================
             VALIDAR RESPUESTA
          ================================================= */

          if (
            !sesionAdmin ||
            !sesionAdmin.token ||
            Number(
              sesionAdmin.usuarioId
            ) <= 0
          ) {

            this.adminService
              .limpiarSesion();


            this.mensajeError =
              'El servidor no devolvió una sesión administrativa válida.';

            return;

          }


          /* =================================================
             SEGURIDAD: CORREO
          ================================================= */

          if (
            !this.esAdministrador(
              sesionAdmin.correo
            )
          ) {

            this.adminService
              .limpiarSesion();


            this.mensajeError =
              'La cuenta autenticada no corresponde al administrador autorizado.';

            return;

          }


          /* =================================================
             GUARDAR SESIÓN ADMIN COMPLETA

             AdminService guarda:

             - token
             - UsuarioId
             - NombreUsuario
             - Correo
             - vencimiento
          ================================================= */

          this.adminService
            .guardarSesion(
              sesionAdmin
            );


          /* =================================================
             VALIDAR TOKEN CONTRA EL BACK
          ================================================= */

          this.adminService
            .validarSesion()
            .subscribe({

              /* =============================================
                 TOKEN CORRECTO
              ============================================= */

              next: validacion => {

                if (
                  !validacion ||
                  !validacion.valida
                ) {

                  this.adminService
                    .limpiarSesion();


                  this.mensajeError =
                    'La sesión administrativa no pudo ser validada.';

                  return;

                }


                /* =============================================
                   VALIDAR USUARIO ADMIN
                ============================================= */

                if (
                  Number(
                    validacion.usuarioId
                  ) <= 0
                ) {

                  this.adminService
                    .limpiarSesion();


                  this.mensajeError =
                    'La sesión administrativa no contiene un usuario válido.';

                  return;

                }


                /* =============================================
                   VALIDAR CORREO ADMIN
                ============================================= */

                if (
                  !this.esAdministrador(
                    validacion.correo
                  )
                ) {

                  this.adminService
                    .limpiarSesion();


                  this.mensajeError =
                    'La sesión administrativa no corresponde a la cuenta autorizada.';

                  return;

                }


                /* =============================================
                   TODO CORRECTO
                ============================================= */

                this.password =
                  '';


                this.mensajeExito =
                  'Acceso administrativo correcto.';


                console.log(
                  'Administrador autenticado correctamente:',
                  {
                    usuarioId:
                      validacion.usuarioId,

                    correo:
                      validacion.correo
                  }
                );


                /* =============================================
                   ADMIN -> CENTRO ADMINISTRATIVO
                ============================================= */

                void this.router.navigate(
                  ['/administrador'],
                  {
                    replaceUrl: true
                  }
                );

              },


              /* =============================================
                 ERROR VALIDANDO TOKEN
              ============================================= */

              error: error => {

                console.error(
                  'Error validando sesión administrativa:',
                  error
                );


                this.adminService
                  .limpiarSesion();


                this.mensajeError =
                  this.obtenerMensajeErrorAdmin(
                    error
                  );

              }

            });

        },


        /* =====================================================
           ERROR CREANDO SESIÓN ADMIN
        ===================================================== */

        error: error => {

          console.error(
            'Error Sesión Administrativa:',
            error
          );


          this.adminService
            .limpiarSesion();


          this.authService
            .cerrarSesion();


          this.mensajeError =
            this.obtenerMensajeErrorAdmin(
              error
            );

        }

      });

  }


  /* =========================================================
     RECUPERAR CONTRASEÑA
  ========================================================= */

  irRecuperarContrasena(): void {

    this.limpiarMensajes();


    const correoLimpio =
      this.correo
        .trim()
        .toLowerCase();


    /* =====================================================
       EL ADMIN NO PUEDE RECUPERAR SU CONTRASEÑA AQUÍ
    ===================================================== */

    if (
      this.esAdministrador(
        correoLimpio
      )
    ) {

      this.mensajeError =
        'La cuenta administrativa no permite recuperar la contraseña desde esta pantalla.';

      return;

    }


    /* =====================================================
       JUGADORES NORMALES
    ===================================================== */

    void this.router.navigate(
      ['/recuperar-contrasena'],
      {

        queryParams:

          correoLimpio

            ? {

                correo:
                  correoLimpio

              }

            : {}

      }
    );

  }


  /* =========================================================
     REGISTRO
  ========================================================= */

  irRegistro(): void {

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


    /* =====================================================
       ADMIN NO SE REGISTRA
    ===================================================== */

    if (
      this.esAdministrador(
        correoLimpio
      )
    ) {

      this.mensajeError =
        'La cuenta administrativa no puede registrarse desde esta pantalla.';

      return;

    }


    /* =====================================================
       JUGADOR NORMAL
    ===================================================== */

    void this.router.navigate(
      ['/registro']
    );

  }


  /* =========================================================
     MOSTRAR / OCULTAR CONTRASEÑA
  ========================================================= */

  alternarPassword(): void {

    this.mostrarPassword =
      !this.mostrarPassword;

  }


  /* =========================================================
     ENTER
  ========================================================= */

  alPresionarEnter(): void {

    if (
      !this.cargando
    ) {

      this.login();

    }

  }


  /* =========================================================
     MÉTODO USADO POR HTML

     Permite ocultar:

     ¿Olvidaste tu contraseña?

     cuando el correo escrito sea el Admin.
  ========================================================= */

  esCorreoAdministradorActual(): boolean {

    return this.esAdministrador(
      this.correo
    );

  }


  /* =========================================================
     VALIDAR ADMINISTRADOR
  ========================================================= */

  private esAdministrador(
    correo:
      string |
      null |
      undefined
  ): boolean {

    const correoNormalizado =
      String(
        correo ?? ''
      )
        .trim()
        .toLowerCase();


    return (
      correoNormalizado ===
      this.correoAdministrador
    );

  }


  /* =========================================================
     NORMALIZAR USUARIO NORMAL

     Esto conserva compatibilidad con el AuthController
     que ya utilizaban los jugadores.
  ========================================================= */

  private normalizarUsuario(
    datos: any
  ): UsuarioSesion | null {

    if (
      !datos ||
      typeof datos !== 'object'
    ) {

      return null;

    }


    /* =====================================================
       ID
    ===================================================== */

    const usuarioId =
      Number(

        datos.usuarioId ??

        datos.UsuarioId ??

        datos.idUsuario ??

        datos.IdUsuario ??

        0

      );


    if (
      !Number.isInteger(
        usuarioId
      ) ||
      usuarioId <= 0
    ) {

      return null;

    }


    /* =====================================================
       NOMBRE
    ===================================================== */

    const nombreUsuario =
      String(

        datos.nombreUsuario ??

        datos.NombreUsuario ??

        datos.nombre ??

        datos.Nombre ??

        ''

      )
        .trim();


    /* =====================================================
       CORREO
    ===================================================== */

    const correo =
      String(

        datos.correo ??

        datos.Correo ??

        datos.email ??

        datos.Email ??

        this.correo

      )
        .trim()
        .toLowerCase();


    /* =====================================================
       FOTO
    ===================================================== */

    const fotoPerfil =

      datos.fotoPerfil ??

      datos.FotoPerfil ??

      null;


    /* =====================================================
       NIVEL
    ===================================================== */

    const nivel =
      this.numeroSeguro(

        datos.nivel ??
        datos.Nivel,

        1

      );


    /* =====================================================
       ORO
    ===================================================== */

    const oroActual =
      this.numeroSeguro(

        datos.oroActual ??

        datos.OroActual ??

        datos.oro ??

        datos.Oro,

        0

      );


    /* =====================================================
       ESTADO
    ===================================================== */

    const estadoCuenta =
      String(

        datos.estadoCuenta ??

        datos.EstadoCuenta ??

        datos.estado ??

        datos.Estado ??

        'Activo'

      )
        .trim();


    /* =====================================================
       FECHA REGISTRO
    ===================================================== */

    const fechaRegistro =
      String(

        datos.fechaRegistro ??

        datos.FechaRegistro ??

        new Date().toISOString()

      );


    /* =====================================================
       ÚLTIMO ACCESO
    ===================================================== */

    const ultimoAcceso =

      datos.ultimoAcceso ??

      datos.UltimoAcceso ??

      null;


    /* =====================================================
       USUARIO NORMALIZADO
    ===================================================== */

    return {

      usuarioId,

      nombreUsuario:

        nombreUsuario ||

        correo.split('@')[0],

      correo,

      fotoPerfil,

      nivel,

      oroActual,

      estadoCuenta,

      fechaRegistro,

      ultimoAcceso

    };

  }


  /* =========================================================
     VALIDAR FORMATO CORREO
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
     VALIDAR ESTADO CUENTA
  ========================================================= */

  private cuentaPuedeIngresar(
    estadoCuenta: string
  ): boolean {

    const estado =
      this.normalizarTexto(
        estadoCuenta
      );


    return (

      estado === 'activo' ||

      estado === 'activa' ||

      estado === 'active' ||

      estado === 'habilitado' ||

      estado === 'habilitada'

    );

  }


  /* =========================================================
     MENSAJE SEGÚN ESTADO
  ========================================================= */

  private obtenerMensajeEstadoCuenta(
    estadoCuenta: string
  ): string {

    const estado =
      this.normalizarTexto(
        estadoCuenta
      );


    /* =====================================================
       PENDIENTE
    ===================================================== */

    if (
      estado.includes(
        'pendiente'
      ) ||

      estado.includes(
        'verificacion'
      ) ||

      estado.includes(
        'verificar'
      )
    ) {

      return (
        'Debe verificar su correo electrónico ' +
        'antes de iniciar sesión.'
      );

    }


    /* =====================================================
       BLOQUEADA
    ===================================================== */

    if (
      estado.includes(
        'bloqueado'
      ) ||

      estado.includes(
        'bloqueada'
      )
    ) {

      return (
        'La cuenta se encuentra bloqueada.'
      );

    }


    /* =====================================================
       SUSPENDIDA
    ===================================================== */

    if (
      estado.includes(
        'suspendido'
      ) ||

      estado.includes(
        'suspendida'
      )
    ) {

      return (
        'La cuenta se encuentra suspendida.'
      );

    }


    /* =====================================================
       INACTIVA
    ===================================================== */

    if (
      estado.includes(
        'inactivo'
      ) ||

      estado.includes(
        'inactiva'
      )
    ) {

      return (
        'La cuenta se encuentra inactiva.'
      );

    }


    return (
      `La cuenta se encuentra en estado: ${estadoCuenta}.`
    );

  }


  /* =========================================================
     ERRORES LOGIN JUGADOR
  ========================================================= */

  private obtenerMensajeError(
    error: any
  ): string {

    /* =====================================================
       SIN CONEXIÓN
    ===================================================== */

    if (
      error?.status === 0
    ) {

      return (
        'No se pudo conectar con el servidor. ' +
        'Verifique que el backend esté ejecutándose.'
      );

    }


    /* =====================================================
       BAD REQUEST
    ===================================================== */

    if (
      error?.status === 400
    ) {

      return this.obtenerMensajeBackend(
        error,
        'Los datos enviados no son válidos.'
      );

    }


    /* =====================================================
       NO AUTORIZADO
    ===================================================== */

    if (
      error?.status === 401
    ) {

      return (
        'El correo o la contraseña son incorrectos.'
      );

    }


    /* =====================================================
       PROHIBIDO
    ===================================================== */

    if (
      error?.status === 403
    ) {

      return this.obtenerMensajeBackend(
        error,
        'Debe verificar su correo electrónico antes de iniciar sesión.'
      );

    }


    /* =====================================================
       NO ENCONTRADO
    ===================================================== */

    if (
      error?.status === 404
    ) {

      return (
        'No se encontró una cuenta con ese correo.'
      );

    }


    /* =====================================================
       CONFLICTO
    ===================================================== */

    if (
      error?.status === 409
    ) {

      return this.obtenerMensajeBackend(
        error,
        'Existe un conflicto con el estado de la cuenta.'
      );

    }


    /* =====================================================
       DEMASIADOS INTENTOS
    ===================================================== */

    if (
      error?.status === 429
    ) {

      return (
        'Se realizaron demasiados intentos. ' +
        'Espere unos minutos antes de intentarlo nuevamente.'
      );

    }


    /* =====================================================
       ERROR SERVIDOR
    ===================================================== */

    if (
      error?.status >= 500
    ) {

      return (
        'El servidor presentó un error al iniciar sesión.'
      );

    }


    return this.obtenerMensajeBackend(
      error,
      'No se pudo iniciar sesión.'
    );

  }


  /* =========================================================
     ERRORES ADMINISTRADOR
  ========================================================= */

  private obtenerMensajeErrorAdmin(
    error: any
  ): string {

    /* =====================================================
       SIN CONEXIÓN
    ===================================================== */

    if (
      error?.status === 0
    ) {

      return (
        'No fue posible conectar con el servidor administrativo. ' +
        'Verifique que el Backend esté ejecutándose.'
      );

    }


    /* =====================================================
       DATOS INVÁLIDOS
    ===================================================== */

    if (
      error?.status === 400
    ) {

      return this.obtenerMensajeBackend(
        error,
        'Debe ingresar las credenciales administrativas.'
      );

    }


    /* =====================================================
       CREDENCIALES INCORRECTAS
    ===================================================== */

    if (
      error?.status === 401
    ) {

      return (
        'Las credenciales administrativas son incorrectas.'
      );

    }


    /* =====================================================
       CUENTA BLOQUEADA / INACTIVA
    ===================================================== */

    if (
      error?.status === 403
    ) {

      return this.obtenerMensajeBackend(
        error,
        'La cuenta administrativa no tiene permitido ingresar.'
      );

    }


    /* =====================================================
       NO EXISTE
    ===================================================== */

    if (
      error?.status === 404
    ) {

      return (
        'No se encontró la cuenta administrativa.'
      );

    }


    /* =====================================================
       DEMASIADOS INTENTOS
    ===================================================== */

    if (
      error?.status === 429
    ) {

      return (
        'Se realizaron demasiados intentos administrativos. ' +
        'Espere antes de intentarlo nuevamente.'
      );

    }


    /* =====================================================
       ERROR SERVIDOR
    ===================================================== */

    if (
      error?.status >= 500
    ) {

      return (
        'El servidor presentó un error al crear la sesión administrativa.'
      );

    }


    return this.obtenerMensajeBackend(
      error,
      'No fue posible iniciar la sesión administrativa.'
    );

  }


  /* =========================================================
     MENSAJE DEL BACK
  ========================================================= */

  private obtenerMensajeBackend(
    error: any,
    mensajePredeterminado: string
  ): string {

    /* =====================================================
       STRING DIRECTO
    ===================================================== */

    if (
      typeof error?.error ===
      'string'
    ) {

      return error.error;

    }


    /* =====================================================
       message
    ===================================================== */

    if (
      typeof error?.error?.message ===
      'string'
    ) {

      return error.error.message;

    }


    /* =====================================================
       mensaje
    ===================================================== */

    if (
      typeof error?.error?.mensaje ===
      'string'
    ) {

      return error.error.mensaje;

    }


    /* =====================================================
       Message
    ===================================================== */

    if (
      typeof error?.error?.Message ===
      'string'
    ) {

      return error.error.Message;

    }


    /* =====================================================
       Mensaje
    ===================================================== */

    if (
      typeof error?.error?.Mensaje ===
      'string'
    ) {

      return error.error.Mensaje;

    }


    return mensajePredeterminado;

  }


  /* =========================================================
     NÚMERO SEGURO
  ========================================================= */

  private numeroSeguro(
    valor: unknown,
    predeterminado: number
  ): number {

    const numero =
      Number(
        valor
      );


    return Number.isFinite(
      numero
    )
      ? numero
      : predeterminado;

  }


  /* =========================================================
     NORMALIZAR TEXTO
  ========================================================= */

  private normalizarTexto(
    texto:
      string |
      null |
      undefined
  ): string {

    return String(
      texto ?? ''
    )
      .trim()
      .toLowerCase()
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );

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