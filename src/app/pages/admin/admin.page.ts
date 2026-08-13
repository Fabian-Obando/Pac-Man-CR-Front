import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  forkJoin,
  finalize,
  Subject,
  takeUntil
} from 'rxjs';

import {
  AdminAcceso,
  AdminCompraSkin,
  AdminIdentidad,
  AdminPartida,
  AdminRanking,
  AdminReporte,
  AdminReporteEconomia,
  AdminReporteMensual,
  AdminReportePartidas,
  AdminReporteUsuarios,
  AdminResumen,
  AdminService,
  AdminTransaccion,
  AdminUsuario,
  AdminUsuarioDetalle
} from '../../services/admin.service';

import {
  Auth
} from '../../services/auth';


/* ============================================================
   SECCIONES DEL CENTRO ADMINISTRATIVO
============================================================ */

type SeccionAdmin =
  | 'dashboard'
  | 'usuarios'
  | 'partidas'
  | 'economia'
  | 'skins'
  | 'ranking'
  | 'moderacion'
  | 'accesos'
  | 'reportes'
  | 'seguridad';


/* ============================================================
   TIPOS DE REPORTE
============================================================ */

type TipoReporteAdmin =
  | 'mensual'
  | 'economia'
  | 'partidas'
  | 'usuarios';


/* ============================================================
   TIPOS DE MENSAJE
============================================================ */

type TipoMensajeAdmin =
  | 'info'
  | 'exito'
  | 'error'
  | 'advertencia';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false
})
export class AdminPage
  implements OnInit, OnDestroy {


  /* ============================================================
     DESTRUCCIÓN
  ============================================================ */

  private readonly destruir$ =
    new Subject<void>();


  /* ============================================================
     ADMINISTRADOR MAESTRO
  ============================================================ */

  readonly correoAdministrador =
    'pacmancr.game@gmail.com';


  nombreAdministrador =
    'Administrador';


  /* ============================================================
     IDENTIDAD PAC-MAN CR
  ============================================================ */

  identidad:
    AdminIdentidad | null =
    null;


  /*
   * El logo visual se construirá desde HTML + SCSS
   * con:
   *
   * PAC-MAN + FANTASMA + MONSTRUO.
   *
   * Así no dependemos obligatoriamente de una imagen externa.
   */
  readonly nombreSistema =
    'PAC-MAN CR';


  readonly subtituloSistema =
    'Centro de Administración';


  /* ============================================================
     NAVEGACIÓN
  ============================================================ */

  seccionActual:
    SeccionAdmin =
    'dashboard';


  menuAbierto =
    false;


  /* ============================================================
     CARGAS
  ============================================================ */

  cargando =
    true;


  actualizando =
    false;


  cargandoUsuario =
    false;


  cargandoReporte =
    false;


  cambiandoContrasena =
    false;


  /* ============================================================
     MENSAJES
  ============================================================ */

  mensaje =
    '';


  tipoMensaje:
    TipoMensajeAdmin =
    'info';


  private timeoutMensaje?:
    ReturnType<typeof setTimeout>;


  /* ============================================================
     DASHBOARD
  ============================================================ */

  resumen:
    AdminResumen | null =
    null;


  /* ============================================================
     USUARIOS
  ============================================================ */

  usuarios:
    AdminUsuario[] =
    [];


  buscarUsuario =
    '';


  filtroEstadoUsuario =
    '';


  usuarioSeleccionado:
    AdminUsuarioDetalle | null =
    null;


  modalUsuarioAbierto =
    false;


  /* ============================================================
     PARTIDAS
  ============================================================ */

  partidas:
    AdminPartida[] =
    [];


  /* ============================================================
     ECONOMÍA
  ============================================================ */

  transacciones:
    AdminTransaccion[] =
    [];


  /* ============================================================
     SKINS
  ============================================================ */

  skinsCompradas:
    AdminCompraSkin[] =
    [];


  /* ============================================================
     RANKING
  ============================================================ */

  ranking:
    AdminRanking[] =
    [];


  /* ============================================================
     MODERACIÓN
  ============================================================ */

  reportesJugadores:
    AdminReporte[] =
    [];


  /* ============================================================
     ACCESOS
  ============================================================ */

  accesos:
    AdminAcceso[] =
    [];


  /* ============================================================
     SEGURIDAD
  ============================================================ */

  contrasenaActual =
    '';


  nuevaContrasena =
    '';


  confirmarContrasena =
    '';


  mostrarContrasenas =
    false;


  /* ============================================================
     REPORTES ADMINISTRATIVOS
  ============================================================ */

  tipoReporte:
    TipoReporteAdmin =
    'mensual';


  mesReporte =
    new Date().getMonth() + 1;


  anioReporte =
    new Date().getFullYear();


  readonly meses = [

    {
      numero: 1,
      nombre: 'Enero'
    },

    {
      numero: 2,
      nombre: 'Febrero'
    },

    {
      numero: 3,
      nombre: 'Marzo'
    },

    {
      numero: 4,
      nombre: 'Abril'
    },

    {
      numero: 5,
      nombre: 'Mayo'
    },

    {
      numero: 6,
      nombre: 'Junio'
    },

    {
      numero: 7,
      nombre: 'Julio'
    },

    {
      numero: 8,
      nombre: 'Agosto'
    },

    {
      numero: 9,
      nombre: 'Septiembre'
    },

    {
      numero: 10,
      nombre: 'Octubre'
    },

    {
      numero: 11,
      nombre: 'Noviembre'
    },

    {
      numero: 12,
      nombre: 'Diciembre'
    }

  ];


  readonly aniosDisponibles:
    number[] = [];


  reporteMensual:
    AdminReporteMensual | null =
    null;


  reporteEconomia:
    AdminReporteEconomia | null =
    null;


  reportePartidas:
    AdminReportePartidas | null =
    null;


  reporteUsuarios:
    AdminReporteUsuarios | null =
    null;


  /* ============================================================
     CONSTRUCTOR
  ============================================================ */

  constructor(
    private readonly adminService:
      AdminService,

    private readonly auth:
      Auth,

    private readonly router:
      Router
  ) {

    this.generarAniosDisponibles();

  }


  /* ============================================================
     INICIO
  ============================================================ */

  ngOnInit(): void {

    this.validarEntradaAdministrador();

  }


  ionViewWillEnter(): void {

    if (
      !this.cargando &&
      this.adminService.tieneSesionLocal()
    ) {

      this.actualizarDashboardSilencioso();

    }

  }


  ngOnDestroy(): void {

    if (
      this.timeoutMensaje
    ) {

      clearTimeout(
        this.timeoutMensaje
      );

    }


    this.destruir$.next();

    this.destruir$.complete();

  }


/* ============================================================
   VALIDAR ACCESO ADMINISTRATIVO

   IMPORTANTE:

   El administrador utiliza EXCLUSIVAMENTE AdminService.

   NO necesita:
   - sesión de jugador
   - Auth
   - entrar al menú
   - aparecer como jugador

   El acceso se valida mediante:
   - pacman_admin_token
   - vencimiento local
   - validación contra el Backend
============================================================ */

private validarEntradaAdministrador(): void {

  this.cargando =
    true;


  /* =========================================================
     1. VERIFICAR SESIÓN LOCAL ADMIN
  ========================================================= */

  if (
    !this.adminService.tieneSesionLocal()
  ) {

    console.warn(
      'No existe una sesión administrativa local.'
    );


    this.adminService
      .limpiarSesion();


    this.cargando =
      false;


    void this.router.navigate(
      ['/login'],
      {
        replaceUrl: true
      }
    );


    return;

  }


  /* =========================================================
     2. OBTENER DATOS VISUALES DEL ADMIN
  ========================================================= */

  this.nombreAdministrador =
    this.adminService
      .obtenerNombreAdmin();


  /* =========================================================
     3. VALIDAR TOKEN CONTRA EL BACK
  ========================================================= */

  this.adminService
    .validarSesion()
    .pipe(

      takeUntil(
        this.destruir$
      )

    )
    .subscribe({

      /* =====================================================
         SESIÓN CORRECTA
      ===================================================== */

      next: respuesta => {

        console.log(
          'Validación Admin:',
          respuesta
        );


        if (
          !respuesta ||
          !respuesta.valida
        ) {

          console.warn(
            'La sesión administrativa no es válida.'
          );


          this.adminService
            .limpiarSesion();


          this.cargando =
            false;


          void this.router.navigate(
            ['/login'],
            {
              replaceUrl: true
            }
          );


          return;

        }


        /* =================================================
           SEGURIDAD EXTRA

           Confirmamos que la sesión pertenece al correo
           maestro del sistema.
        ================================================= */

        if (
          String(
            respuesta.correo ?? ''
          )
            .trim()
            .toLowerCase()
          !==
          this.correoAdministrador
        ) {

          console.warn(
            'El token no pertenece al administrador autorizado.'
          );


          this.adminService
            .limpiarSesion();


          this.cargando =
            false;


          void this.router.navigate(
            ['/login'],
            {
              replaceUrl: true
            }
          );


          return;

        }


        /* =================================================
           TODO CORRECTO

           Ahora sí cargamos el Centro Administrativo.
        ================================================= */

        this.nombreAdministrador =
          this.adminService
            .obtenerNombreAdmin();


        this.cargarCentroAdministrativo();

      },


      /* =====================================================
         ERROR VALIDANDO TOKEN
      ===================================================== */

      error: error => {

        console.error(
          'Error validando sesión administrativa:',
          error
        );


        this.adminService
          .limpiarSesion();


        this.cargando =
          false;


        void this.router.navigate(
          ['/login'],
          {
            replaceUrl: true
          }
        );

      }

    });

}

  /* ============================================================
     CARGA PRINCIPAL
  ============================================================ */

  private cargarCentroAdministrativo(): void {

    this.cargando =
      true;


    this.actualizando =
      true;


    forkJoin({

      identidad:
        this.adminService
          .obtenerIdentidad(),

      resumen:
        this.adminService
          .obtenerResumen(),

      usuarios:
        this.adminService
          .obtenerUsuarios(),

      partidas:
        this.adminService
          .obtenerPartidas(
            100
          ),

      transacciones:
        this.adminService
          .obtenerTransacciones(
            200
          ),

      ranking:
        this.adminService
          .obtenerRanking(),

      reportes:
        this.adminService
          .obtenerReportes(),

      accesos:
        this.adminService
          .obtenerAccesos(
            100
          ),

      skins:
        this.adminService
          .obtenerSkinsCompradas(
            200
          )

    })

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cargando =
              false;


            this.actualizando =
              false;

          }
        )

      )

      .subscribe({

        next: datos => {

          this.identidad =
            datos.identidad;


          this.resumen =
            datos.resumen;


          this.usuarios =
            datos.usuarios;


          this.partidas =
            datos.partidas;


          this.transacciones =
            datos.transacciones;


          this.ranking =
            datos.ranking;


          this.reportesJugadores =
            datos.reportes;


          this.accesos =
            datos.accesos;


          this.skinsCompradas =
            datos.skins;


          this.mostrarMensaje(
            'Centro de Administración cargado correctamente.',
            'exito'
          );

        },


        error: error => {

          console.error(
            'Error cargando Centro de Administración:',
            error
          );


          if (
            error?.status === 401
          ) {

            this.adminService
              .limpiarSesion();


            this.mostrarMensaje(
              'La sesión administrativa dejó de ser válida.',
              'error'
            );


            setTimeout(
              () => {

                this.expulsarDeAdministracion();

              },
              1200
            );


            return;

          }


          this.mostrarMensaje(
            this.obtenerMensajeError(
              error,
              'No fue posible cargar todos los datos administrativos.'
            ),
            'error'
          );

        }

      });

  }


  /* ============================================================
     ACTUALIZAR TODO
  ============================================================ */

  actualizarTodo(): void {

    if (
      this.actualizando
    ) {

      return;

    }


    this.actualizando =
      true;


    forkJoin({

      resumen:
        this.adminService
          .obtenerResumen(),

      usuarios:
        this.adminService
          .obtenerUsuarios(
            this.buscarUsuario,
            this.filtroEstadoUsuario
          ),

      partidas:
        this.adminService
          .obtenerPartidas(
            100
          ),

      transacciones:
        this.adminService
          .obtenerTransacciones(
            200
          ),

      ranking:
        this.adminService
          .obtenerRanking(),

      reportes:
        this.adminService
          .obtenerReportes(),

      accesos:
        this.adminService
          .obtenerAccesos(
            100
          ),

      skins:
        this.adminService
          .obtenerSkinsCompradas(
            200
          )

    })

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.actualizando =
              false;

          }
        )

      )

      .subscribe({

        next: datos => {

          this.resumen =
            datos.resumen;


          this.usuarios =
            datos.usuarios;


          this.partidas =
            datos.partidas;


          this.transacciones =
            datos.transacciones;


          this.ranking =
            datos.ranking;


          this.reportesJugadores =
            datos.reportes;


          this.accesos =
            datos.accesos;


          this.skinsCompradas =
            datos.skins;


          this.mostrarMensaje(
            'Datos administrativos actualizados.',
            'exito'
          );

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            'No fue posible actualizar los datos.',
            'error'
          );

        }

      });

  }


  private actualizarDashboardSilencioso(): void {

    this.adminService
      .obtenerResumen()
      .pipe(
        takeUntil(
          this.destruir$
        )
      )
      .subscribe({

        next: resumen => {

          this.resumen =
            resumen;

        },

        error: () => {

          // No mostramos error porque es actualización silenciosa.

        }

      });

  }


  /* ============================================================
     NAVEGACIÓN INTERNA
  ============================================================ */

  cambiarSeccion(
    seccion: SeccionAdmin
  ): void {

    this.seccionActual =
      seccion;


    this.menuAbierto =
      false;


    this.limpiarMensaje();

  }


  esSeccion(
    seccion: SeccionAdmin
  ): boolean {

    return (
      this.seccionActual ===
      seccion
    );

  }


  alternarMenu(): void {

    this.menuAbierto =
      !this.menuAbierto;

  }


  cerrarMenu(): void {

    this.menuAbierto =
      false;

  }


  /* ============================================================
     USUARIOS
  ============================================================ */

  buscarUsuarios(): void {

    this.adminService
      .obtenerUsuarios(
        this.buscarUsuario,
        this.filtroEstadoUsuario
      )
      .pipe(
        takeUntil(
          this.destruir$
        )
      )
      .subscribe({

        next: usuarios => {

          this.usuarios =
            usuarios;

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            'No fue posible consultar los jugadores.',
            'error'
          );

        }

      });

  }


  limpiarFiltrosUsuario(): void {

    this.buscarUsuario =
      '';


    this.filtroEstadoUsuario =
      '';


    this.buscarUsuarios();

  }


  abrirUsuario(
    usuario: AdminUsuario
  ): void {

    if (
      this.cargandoUsuario
    ) {

      return;

    }


    this.modalUsuarioAbierto =
      true;


    this.cargandoUsuario =
      true;


    this.usuarioSeleccionado =
      null;


    this.adminService
      .obtenerUsuario(
        usuario.usuarioId
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cargandoUsuario =
              false;

          }
        )

      )

      .subscribe({

        next: usuarioDetalle => {

          this.usuarioSeleccionado =
            usuarioDetalle;

        },


        error: error => {

          console.error(
            error
          );


          this.modalUsuarioAbierto =
            false;


          this.mostrarMensaje(
            'No fue posible abrir el expediente del jugador.',
            'error'
          );

        }

      });

  }


  cerrarUsuario(): void {

    this.modalUsuarioAbierto =
      false;


    this.usuarioSeleccionado =
      null;

  }


  /* ============================================================
     ESTADO DE JUGADOR
  ============================================================ */

  activarUsuario(
    usuario:
      AdminUsuario |
      AdminUsuarioDetalle
  ): void {

    this.actualizarEstadoUsuario(
      usuario,
      'Activo'
    );

  }


  inactivarUsuario(
    usuario:
      AdminUsuario |
      AdminUsuarioDetalle
  ): void {

    this.actualizarEstadoUsuario(
      usuario,
      'Inactivo'
    );

  }


  bloquearUsuario(
    usuario:
      AdminUsuario |
      AdminUsuarioDetalle
  ): void {

    this.actualizarEstadoUsuario(
      usuario,
      'Bloqueado'
    );

  }


  private actualizarEstadoUsuario(
    usuario:
      AdminUsuario |
      AdminUsuarioDetalle,

    estado:
      'Activo' |
      'Inactivo' |
      'Bloqueado'
  ): void {

    const confirmar =
      window.confirm(
        `¿Desea cambiar la cuenta de "${usuario.nombreUsuario}" al estado "${estado}"?`
      );


    if (
      !confirmar
    ) {

      return;

    }


    this.adminService
      .cambiarEstadoUsuario(
        usuario.usuarioId,
        estado
      )

      .pipe(
        takeUntil(
          this.destruir$
        )
      )

      .subscribe({

        next: () => {

          usuario.estadoCuenta =
            estado;


          if (
            this.usuarioSeleccionado
            &&
            this.usuarioSeleccionado.usuarioId ===
            usuario.usuarioId
          ) {

            this.usuarioSeleccionado
              .estadoCuenta =
              estado;

          }


          const indice =
            this.usuarios.findIndex(
              x =>
                x.usuarioId ===
                usuario.usuarioId
            );


          if (
            indice >= 0
          ) {

            this.usuarios[indice]
              .estadoCuenta =
              estado;

          }


          this.mostrarMensaje(
            `Cuenta actualizada a ${estado}.`,
            'exito'
          );


          this.actualizarResumen();

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            this.obtenerMensajeError(
              error,
              'No fue posible cambiar el estado de la cuenta.'
            ),
            'error'
          );

        }

      });

  }


  /* ============================================================
     ELIMINACIÓN DEFINITIVA

     El service ya tiene el método preparado.

     Pero NO lo ejecutamos todavía hasta que agreguemos
     el DELETE real y seguro al AdminController.
  ============================================================ */

  eliminarUsuario(
    usuario:
      AdminUsuario |
      AdminUsuarioDetalle
  ): void {

    this.mostrarMensaje(
      `La eliminación definitiva de "${usuario.nombreUsuario}" quedará habilitada cuando agreguemos el DELETE seguro del Back. Mientras tanto puede bloquear o inactivar la cuenta.`,
      'advertencia'
    );

  }


  /* ============================================================
     MODERACIÓN
  ============================================================ */

  cambiarEstadoReporte(
    reporte: AdminReporte,
    estado:
      'Pendiente' |
      'Revisado' |
      'Resuelto' |
      'Descartado'
  ): void {

    if (
      reporte.estado ===
      estado
    ) {

      return;

    }


    this.adminService
      .cambiarEstadoReporte(
        reporte.reporteId,
        estado
      )

      .pipe(
        takeUntil(
          this.destruir$
        )
      )

      .subscribe({

        next: () => {

          reporte.estado =
            estado;


          this.mostrarMensaje(
            'Reporte actualizado correctamente.',
            'exito'
          );


          this.actualizarResumen();

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            'No fue posible actualizar el reporte.',
            'error'
          );

        }

      });

  }


  /* ============================================================
     ACTUALIZAR RESUMEN
  ============================================================ */

  private actualizarResumen(): void {

    this.adminService
      .obtenerResumen()
      .pipe(
        takeUntil(
          this.destruir$
        )
      )
      .subscribe({

        next: resumen => {

          this.resumen =
            resumen;

        },

        error: () => {

        }

      });

  }


  /* ============================================================
     SEGURIDAD
  ============================================================ */

  alternarContrasenas(): void {

    this.mostrarContrasenas =
      !this.mostrarContrasenas;

  }


  cambiarContrasenaAdministrador(): void {

    this.limpiarMensaje();


    if (
      !this.contrasenaActual.trim()
      ||
      !this.nuevaContrasena.trim()
      ||
      !this.confirmarContrasena.trim()
    ) {

      this.mostrarMensaje(
        'Debe completar todos los campos de contraseña.',
        'error'
      );

      return;

    }


    if (
      this.nuevaContrasena !==
      this.confirmarContrasena
    ) {

      this.mostrarMensaje(
        'La nueva contraseña y su confirmación no coinciden.',
        'error'
      );

      return;

    }


    if (
      this.nuevaContrasena.length <
      12
    ) {

      this.mostrarMensaje(
        'La nueva contraseña administrativa debe tener al menos 12 caracteres.',
        'error'
      );

      return;

    }


    this.cambiandoContrasena =
      true;


    this.adminService
      .cambiarContrasena({

        contrasenaActual:
          this.contrasenaActual,

        nuevaContrasena:
          this.nuevaContrasena,

        confirmarContrasena:
          this.confirmarContrasena

      })

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cambiandoContrasena =
              false;

          }
        )

      )

      .subscribe({

        next: respuesta => {

          this.contrasenaActual =
            '';


          this.nuevaContrasena =
            '';


          this.confirmarContrasena =
            '';


          this.mostrarContrasenas =
            false;


          alert(
            respuesta?.mensaje
            ??
            'Contraseña administrativa actualizada.'
          );


          /*
           * El Back invalida los tokens después
           * de cambiar la contraseña.
           */

          this.adminService
            .limpiarSesion();


          this.auth
            .cerrarSesion();


          void this.router.navigate(
            ['/login'],
            {
              replaceUrl: true
            }
          );

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            this.obtenerMensajeError(
              error,
              'No fue posible cambiar la contraseña administrativa.'
            ),
            'error'
          );

        }

      });

  }


  /* ============================================================
     REPORTES ADMINISTRATIVOS
  ============================================================ */

  generarReporte(): void {

    if (
      this.cargandoReporte
    ) {

      return;

    }


    if (
      !this.periodoReporteValido()
    ) {

      this.mostrarMensaje(
        'Seleccione un período válido.',
        'error'
      );

      return;

    }


    switch (
      this.tipoReporte
    ) {

      case 'economia':

        this.generarReporteEconomia();

        break;


      case 'partidas':

        this.generarReportePartidas();

        break;


      case 'usuarios':

        this.generarReporteUsuarios();

        break;


      case 'mensual':
      default:

        this.generarReporteMensual();

        break;

    }

  }


  /* ============================================================
     REPORTE MENSUAL
  ============================================================ */

  private generarReporteMensual(): void {

    this.cargandoReporte =
      true;


    this.adminService
      .obtenerReporteMensual(
        this.anioReporte,
        this.mesReporte
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cargandoReporte =
              false;

          }
        )

      )

      .subscribe({

        next: reporte => {

          this.reporteMensual =
            reporte;


          this.reporteEconomia =
            null;


          this.reportePartidas =
            null;


          this.reporteUsuarios =
            null;


          this.mostrarMensaje(
            'Reporte mensual generado correctamente.',
            'exito'
          );

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            this.obtenerMensajeError(
              error,
              'No fue posible generar el reporte mensual.'
            ),
            'error'
          );

        }

      });

  }


  /* ============================================================
     REPORTE ECONOMÍA
  ============================================================ */

  private generarReporteEconomia(): void {

    this.cargandoReporte =
      true;


    this.adminService
      .obtenerReporteEconomia(
        this.anioReporte,
        this.mesReporte
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cargandoReporte =
              false;

          }
        )

      )

      .subscribe({

        next: reporte => {

          this.reporteEconomia =
            reporte;


          this.reporteMensual =
            null;


          this.reportePartidas =
            null;


          this.reporteUsuarios =
            null;


          this.mostrarMensaje(
            'Reporte económico generado.',
            'exito'
          );

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            this.obtenerMensajeError(
              error,
              'No fue posible generar el reporte económico.'
            ),
            'error'
          );

        }

      });

  }


  /* ============================================================
     REPORTE PARTIDAS
  ============================================================ */

  private generarReportePartidas(): void {

    this.cargandoReporte =
      true;


    this.adminService
      .obtenerReportePartidas(
        this.anioReporte,
        this.mesReporte
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cargandoReporte =
              false;

          }
        )

      )

      .subscribe({

        next: reporte => {

          this.reportePartidas =
            reporte;


          this.reporteMensual =
            null;


          this.reporteEconomia =
            null;


          this.reporteUsuarios =
            null;


          this.mostrarMensaje(
            'Reporte de partidas generado.',
            'exito'
          );

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            this.obtenerMensajeError(
              error,
              'No fue posible generar el reporte de partidas.'
            ),
            'error'
          );

        }

      });

  }


  /* ============================================================
     REPORTE USUARIOS
  ============================================================ */

  private generarReporteUsuarios(): void {

    this.cargandoReporte =
      true;


    this.adminService
      .obtenerReporteUsuarios(
        this.anioReporte,
        this.mesReporte
      )

      .pipe(

        takeUntil(
          this.destruir$
        ),

        finalize(
          () => {

            this.cargandoReporte =
              false;

          }
        )

      )

      .subscribe({

        next: reporte => {

          this.reporteUsuarios =
            reporte;


          this.reporteMensual =
            null;


          this.reporteEconomia =
            null;


          this.reportePartidas =
            null;


          this.mostrarMensaje(
            'Reporte de jugadores generado.',
            'exito'
          );

        },


        error: error => {

          console.error(
            error
          );


          this.mostrarMensaje(
            this.obtenerMensajeError(
              error,
              'No fue posible generar el reporte de jugadores.'
            ),
            'error'
          );

        }

      });

  }


  /* ============================================================
     IMPRIMIR / GUARDAR COMO PDF

     No depende de librerías externas.

     Crea un documento profesional y abre el diálogo
     de impresión del sistema, donde puede utilizarse
     "Guardar como PDF".
  ============================================================ */

  imprimirReportePDF(): void {

    let contenido =
      '';


    let titulo =
      'Reporte Administrativo';


    if (
      this.reporteMensual
    ) {

      titulo =
        `Reporte Mensual - ${this.reporteMensual.nombrePeriodo}`;


      contenido =
        this.construirReporteMensualHTML(
          this.reporteMensual
        );

    }

    else if (
      this.reporteEconomia
    ) {

      titulo =
        `Reporte Económico - ${this.reporteEconomia.nombrePeriodo}`;


      contenido =
        this.construirReporteEconomiaHTML(
          this.reporteEconomia
        );

    }

    else if (
      this.reportePartidas
    ) {

      titulo =
        `Reporte de Partidas - ${this.reportePartidas.nombrePeriodo}`;


      contenido =
        this.construirReportePartidasHTML(
          this.reportePartidas
        );

    }

    else if (
      this.reporteUsuarios
    ) {

      titulo =
        `Reporte de Jugadores - ${this.reporteUsuarios.nombrePeriodo}`;


      contenido =
        this.construirReporteUsuariosHTML(
          this.reporteUsuarios
        );

    }

    else {

      this.mostrarMensaje(
        'Primero debe generar un reporte.',
        'advertencia'
      );

      return;

    }


    const ventana =
      window.open(
        '',
        '_blank',
        'width=1100,height=800'
      );


    if (
      !ventana
    ) {

      this.mostrarMensaje(
        'El navegador bloqueó la ventana de impresión.',
        'error'
      );

      return;

    }


    ventana.document.open();


    ventana.document.write(
      this.crearDocumentoImpresion(
        titulo,
        contenido
      )
    );


    ventana.document.close();


    /*
     * Esperamos un instante para que el documento
     * termine de dibujarse.
     */

    setTimeout(
      () => {

        ventana.focus();

        ventana.print();

      },
      450
    );

  }


  /* ============================================================
     HTML REPORTE MENSUAL
  ============================================================ */

  private construirReporteMensualHTML(
    reporte: AdminReporteMensual
  ): string {

    const top =
      reporte.topJugadores
        .map(
          (
            jugador,
            indice
          ) => `
            <tr>
              <td>#${indice + 1}</td>
              <td>${this.escaparHTML(jugador.nombreUsuario)}</td>
              <td>${jugador.partidasJugadas}</td>
              <td>${this.formatearNumero(jugador.puntosObtenidos)}</td>
              <td>${this.formatearNumero(jugador.oroGanado)}</td>
            </tr>
          `
        )
        .join('');


    const movimientos =
      reporte.transacciones
        .slice(
          0,
          50
        )
        .map(
          x => `
            <tr>
              <td>${this.formatearFecha(x.fechaMovimiento)}</td>
              <td>${this.escaparHTML(x.nombreUsuario)}</td>
              <td>${this.escaparHTML(x.tipoMovimiento)}</td>
              <td>${this.formatearNumero(x.cantidad)}</td>
              <td>${this.escaparHTML(x.descripcion || 'Sin descripción')}</td>
            </tr>
          `
        )
        .join('');


    return `
      ${this.crearEncabezadoReporte(
        'REPORTE ADMINISTRATIVO MENSUAL',
        reporte.nombrePeriodo
      )}

      <section class="summary-grid">

        ${this.crearTarjetaPDF(
          'Usuarios nuevos',
          reporte.totalUsuariosNuevos
        )}

        ${this.crearTarjetaPDF(
          'Accesos',
          reporte.totalAccesos
        )}

        ${this.crearTarjetaPDF(
          'Partidas',
          reporte.totalPartidas
        )}

        ${this.crearTarjetaPDF(
          'Partidas finalizadas',
          reporte.partidasFinalizadas
        )}

        ${this.crearTarjetaPDF(
          'Oro ganado',
          this.formatearNumero(
            reporte.oroGanado
          )
        )}

        ${this.crearTarjetaPDF(
          'Oro gastado',
          this.formatearNumero(
            reporte.oroGastado
          )
        )}

        ${this.crearTarjetaPDF(
          'Skins obtenidas',
          reporte.totalSkinsObtenidas
        )}

        ${this.crearTarjetaPDF(
          'Reportes de jugadores',
          reporte.totalReportes
        )}

      </section>


      <h2>Resumen ejecutivo</h2>

      <p>
        Durante ${this.escaparHTML(reporte.nombrePeriodo)},
        PAC-MAN CR registró
        <strong>${reporte.totalUsuariosNuevos}</strong>
        nuevos jugadores,
        <strong>${reporte.totalAccesos}</strong>
        accesos y
        <strong>${reporte.totalPartidas}</strong>
        partidas.
        El sistema distribuyó
        <strong>${this.formatearNumero(reporte.oroGanado)}</strong>
        unidades de oro virtual y registró
        <strong>${this.formatearNumero(reporte.oroGastado)}</strong>
        unidades utilizadas dentro de la economía del juego.
      </p>


      <h2>Top de jugadores del período</h2>

      <table>
        <thead>
          <tr>
            <th>Posición</th>
            <th>Jugador</th>
            <th>Partidas</th>
            <th>Puntos</th>
            <th>Oro ganado</th>
          </tr>
        </thead>

        <tbody>
          ${top || `
            <tr>
              <td colspan="5">
                No existen resultados para este período.
              </td>
            </tr>
          `}
        </tbody>
      </table>


      <h2>Movimientos de oro</h2>

      <table>

        <thead>
          <tr>
            <th>Fecha</th>
            <th>Jugador</th>
            <th>Movimiento</th>
            <th>Cantidad</th>
            <th>Descripción</th>
          </tr>
        </thead>

        <tbody>
          ${movimientos || `
            <tr>
              <td colspan="5">
                No existen movimientos registrados.
              </td>
            </tr>
          `}
        </tbody>

      </table>


      ${this.crearPieReporte(
        reporte.fechaGeneracionUtc
      )}
    `;

  }


  /* ============================================================
     HTML REPORTE ECONOMÍA
  ============================================================ */

  private construirReporteEconomiaHTML(
    reporte: AdminReporteEconomia
  ): string {

    const movimientos =
      reporte.movimientos
        .map(
          x => `
            <tr>
              <td>${this.formatearFecha(x.fechaMovimiento)}</td>
              <td>${this.escaparHTML(x.nombreUsuario)}</td>
              <td>${this.escaparHTML(x.tipoMovimiento)}</td>
              <td>${this.formatearNumero(x.cantidad)}</td>
              <td>${this.escaparHTML(x.descripcion || 'Sin descripción')}</td>
            </tr>
          `
        )
        .join('');


    return `
      ${this.crearEncabezadoReporte(
        'REPORTE ECONÓMICO',
        reporte.nombrePeriodo
      )}

      <section class="summary-grid">

        ${this.crearTarjetaPDF(
          'Movimientos',
          reporte.totalMovimientos
        )}

        ${this.crearTarjetaPDF(
          'Oro entrante',
          this.formatearNumero(
            reporte.oroEntrante
          )
        )}

        ${this.crearTarjetaPDF(
          'Oro gastado',
          this.formatearNumero(
            reporte.oroGastado
          )
        )}

        ${this.crearTarjetaPDF(
          'Balance neto',
          this.formatearNumero(
            reporte.balanceNeto
          )
        )}

        ${this.crearTarjetaPDF(
          'Skins obtenidas',
          reporte.skinsObtenidas
        )}

        ${this.crearTarjetaPDF(
          'Valor de skins',
          this.formatearNumero(
            reporte.valorSkinsEnOro
          )
        )}

      </section>


      <h2>Movimientos de la economía</h2>

      <table>

        <thead>
          <tr>
            <th>Fecha</th>
            <th>Jugador</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Descripción</th>
          </tr>
        </thead>

        <tbody>
          ${movimientos || `
            <tr>
              <td colspan="5">
                No existen movimientos registrados.
              </td>
            </tr>
          `}
        </tbody>

      </table>


      ${this.crearPieReporte(
        reporte.fechaGeneracionUtc
      )}
    `;

  }


  /* ============================================================
     HTML REPORTE PARTIDAS
  ============================================================ */

  private construirReportePartidasHTML(
    reporte: AdminReportePartidas
  ): string {

    const partidas =
      reporte.partidas
        .map(
          x => `
            <tr>
              <td>#${x.partidaId}</td>
              <td>${this.escaparHTML(x.codigoSala)}</td>
              <td>${this.escaparHTML(x.nombreMapa)}</td>
              <td>${this.escaparHTML(x.nombreDificultad)}</td>
              <td>${this.escaparHTML(x.estadoPartida)}</td>
              <td>${this.formatearFecha(x.fechaInicio)}</td>
              <td>${this.formatearFecha(x.fechaFin)}</td>
            </tr>
          `
        )
        .join('');


    return `
      ${this.crearEncabezadoReporte(
        'REPORTE DE PARTIDAS',
        reporte.nombrePeriodo
      )}

      <section class="summary-grid">

        ${this.crearTarjetaPDF(
          'Total partidas',
          reporte.totalPartidas
        )}

        ${this.crearTarjetaPDF(
          'Finalizadas',
          reporte.partidasFinalizadas
        )}

        ${this.crearTarjetaPDF(
          'En curso',
          reporte.partidasEnCurso
        )}

        ${this.crearTarjetaPDF(
          'Resultados',
          reporte.totalResultados
        )}

        ${this.crearTarjetaPDF(
          'Puntos generados',
          this.formatearNumero(
            reporte.puntosGenerados
          )
        )}

        ${this.crearTarjetaPDF(
          'Oro entregado',
          this.formatearNumero(
            reporte.oroEntregado
          )
        )}

      </section>


      <h2>Historial de partidas</h2>

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Sala</th>
            <th>Mapa</th>
            <th>Dificultad</th>
            <th>Estado</th>
            <th>Inicio</th>
            <th>Finalización</th>
          </tr>
        </thead>

        <tbody>
          ${partidas || `
            <tr>
              <td colspan="7">
                No existen partidas para este período.
              </td>
            </tr>
          `}
        </tbody>

      </table>


      ${this.crearPieReporte(
        reporte.fechaGeneracionUtc
      )}
    `;

  }


  /* ============================================================
     HTML REPORTE USUARIOS
  ============================================================ */

  private construirReporteUsuariosHTML(
    reporte: AdminReporteUsuarios
  ): string {

    const usuarios =
      reporte.usuariosNuevos
        .map(
          x => `
            <tr>
              <td>#${x.usuarioId}</td>
              <td>${this.escaparHTML(x.nombreUsuario)}</td>
              <td>${this.escaparHTML(x.correo)}</td>
              <td>${x.nivel}</td>
              <td>${this.formatearNumero(x.oroActual)}</td>
              <td>${this.escaparHTML(x.estadoCuenta)}</td>
              <td>${this.formatearFecha(x.fechaRegistro)}</td>
            </tr>
          `
        )
        .join('');


    return `
      ${this.crearEncabezadoReporte(
        'REPORTE DE JUGADORES',
        reporte.nombrePeriodo
      )}

      <section class="summary-grid">

        ${this.crearTarjetaPDF(
          'Nuevos jugadores',
          reporte.totalUsuariosNuevos
        )}

        ${this.crearTarjetaPDF(
          'Accesos del período',
          reporte.totalAccesos
        )}

        ${this.crearTarjetaPDF(
          'Activos actuales',
          reporte.usuariosActivosActuales
        )}

        ${this.crearTarjetaPDF(
          'Bloqueados actuales',
          reporte.usuariosBloqueadosActuales
        )}

      </section>


      <h2>Nuevos jugadores</h2>

      <table>

        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Nivel</th>
            <th>Oro</th>
            <th>Estado</th>
            <th>Registro</th>
          </tr>
        </thead>

        <tbody>
          ${usuarios || `
            <tr>
              <td colspan="7">
                No existen nuevos jugadores para este período.
              </td>
            </tr>
          `}
        </tbody>

      </table>


      ${this.crearPieReporte(
        reporte.fechaGeneracionUtc
      )}
    `;

  }


  /* ============================================================
     DOCUMENTO DE IMPRESIÓN PROFESIONAL
  ============================================================ */

  private crearDocumentoImpresion(
    titulo: string,
    contenido: string
  ): string {

    return `
      <!DOCTYPE html>

      <html lang="es">

      <head>

        <meta charset="UTF-8">

        <title>
          ${this.escaparHTML(titulo)}
        </title>

        <style>

          @page {

            size: A4;

            margin:
              14mm;

          }


          * {

            box-sizing:
              border-box;

          }


          body {

            margin:
              0;

            color:
              #172033;

            background:
              white;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size:
              11px;

          }


          .report-header {

            display:
              flex;

            align-items:
              center;

            justify-content:
              space-between;

            padding:
              18px;

            margin-bottom:
              18px;

            border-radius:
              14px;

            background:
              #07101e;

            color:
              white;

          }


          .brand {

            display:
              flex;

            align-items:
              center;

            gap:
              14px;

          }


          .brand-art {

            display:
              flex;

            align-items:
              center;

            gap:
              3px;

            font-size:
              27px;

          }


          .brand h1 {

            margin:
              0;

            color:
              #ffd800;

            font-size:
              24px;

          }


          .brand span {

            color:
              #00eaff;

            font-size:
              9px;

            letter-spacing:
              1.4px;

          }


          .report-title {

            text-align:
              right;

          }


          .report-title strong {

            display:
              block;

            font-size:
              13px;

          }


          .report-title span {

            display:
              block;

            margin-top:
              5px;

            color:
              #b6c5dd;

          }


          .summary-grid {

            display:
              grid;

            grid-template-columns:
              repeat(
                4,
                1fr
              );

            gap:
              8px;

            margin-bottom:
              22px;

          }


          .summary-card {

            padding:
              11px;

            border:
              1px solid
              #dce3ec;

            border-radius:
              9px;

            background:
              #f7f9fc;

          }


          .summary-card small {

            display:
              block;

            color:
              #728096;

            font-size:
              8px;

            text-transform:
              uppercase;

          }


          .summary-card strong {

            display:
              block;

            margin-top:
              5px;

            color:
              #111827;

            font-size:
              17px;

          }


          h2 {

            margin:
              22px 0 8px;

            padding-bottom:
              5px;

            border-bottom:
              2px solid
              #ffd800;

            color:
              #07101e;

            font-size:
              15px;

          }


          p {

            line-height:
              1.55;

          }


          table {

            width:
              100%;

            border-collapse:
              collapse;

            margin-top:
              8px;

          }


          th {

            padding:
              8px 6px;

            background:
              #07101e;

            color:
              white;

            font-size:
              8px;

            text-align:
              left;

          }


          td {

            padding:
              7px 6px;

            border-bottom:
              1px solid
              #e6eaf0;

            font-size:
              8px;

            vertical-align:
              top;

          }


          tbody tr:nth-child(even) {

            background:
              #f8fafc;

          }


          .report-footer {

            margin-top:
              28px;

            padding-top:
              10px;

            border-top:
              1px solid
              #d6dde7;

            color:
              #6b7280;

            font-size:
              8px;

            text-align:
              center;

          }


          .security-note {

            margin-top:
              6px;

            color:
              #9a6b00;

          }


          @media print {

            body {

              print-color-adjust:
                exact;

              -webkit-print-color-adjust:
                exact;

            }


            tr,
            td,
            th {

              break-inside:
                avoid;

            }

          }

        </style>

      </head>


      <body>

        ${contenido}

      </body>

      </html>
    `;

  }


  /* ============================================================
     ENCABEZADO DE LOS REPORTES
  ============================================================ */

  private crearEncabezadoReporte(
    titulo: string,
    periodo: string
  ): string {

    return `
      <header class="report-header">

        <div class="brand">

          <div class="brand-art">
            🟡 👻 😈
          </div>

          <div>

            <h1>
              PAC-MAN CR
            </h1>

            <span>
              CENTRO DE ADMINISTRACIÓN
            </span>

          </div>

        </div>


        <div class="report-title">

          <strong>
            ${this.escaparHTML(titulo)}
          </strong>

          <span>
            ${this.escaparHTML(periodo)}
          </span>

        </div>

      </header>
    `;

  }


  /* ============================================================
     TARJETA PDF
  ============================================================ */

  private crearTarjetaPDF(
    titulo: string,
    valor:
      string |
      number
  ): string {

    return `
      <article class="summary-card">

        <small>
          ${this.escaparHTML(titulo)}
        </small>

        <strong>
          ${this.escaparHTML(String(valor))}
        </strong>

      </article>
    `;

  }


  /* ============================================================
     PIE DE REPORTE
  ============================================================ */

  private crearPieReporte(
    fechaGeneracion: string
  ): string {

    return `
      <footer class="report-footer">

        <strong>
          PAC-MAN CR · Centro de Administración
        </strong>

        <br>

        Reporte generado:
        ${this.escaparHTML(
          this.formatearFecha(
            fechaGeneracion
          )
        )}

        <br>

        Administrador:
        ${this.escaparHTML(
          this.correoAdministrador
        )}

        <div class="security-note">

          Documento administrativo interno.
          Los valores de oro corresponden a moneda virtual
          utilizada exclusivamente dentro de PAC-MAN CR.

        </div>

      </footer>
    `;

  }


  /* ============================================================
     ¿HAY REPORTE PARA IMPRIMIR?
  ============================================================ */

  get hayReporteGenerado(): boolean {

    return Boolean(
      this.reporteMensual
      ||
      this.reporteEconomia
      ||
      this.reportePartidas
      ||
      this.reporteUsuarios
    );

  }


  /* ============================================================
     NOMBRE REPORTE SELECCIONADO
  ============================================================ */

  get nombreTipoReporte(): string {

    switch (
      this.tipoReporte
    ) {

      case 'economia':

        return 'Reporte económico';


      case 'partidas':

        return 'Reporte de partidas';


      case 'usuarios':

        return 'Reporte de jugadores';


      case 'mensual':
      default:

        return 'Reporte mensual completo';

    }

  }


  /* ============================================================
     PERÍODO
  ============================================================ */

  get nombrePeriodoSeleccionado(): string {

    const mes =
      this.meses.find(
        x =>
          x.numero ===
          Number(
            this.mesReporte
          )
      );


    return (
      `${mes?.nombre ?? this.mesReporte} ` +
      `${this.anioReporte}`
    );

  }


  private periodoReporteValido(): boolean {

    return (
      Number.isInteger(
        Number(
          this.anioReporte
        )
      )
      &&
      Number(
        this.anioReporte
      ) >= 2020
      &&
      Number.isInteger(
        Number(
          this.mesReporte
        )
      )
      &&
      Number(
        this.mesReporte
      ) >= 1
      &&
      Number(
        this.mesReporte
      ) <= 12
    );

  }


  private generarAniosDisponibles(): void {

    const actual =
      new Date()
        .getFullYear();


    for (
      let anio =
        actual;

      anio >=
        2024;

      anio--
    ) {

      this.aniosDisponibles.push(
        anio
      );

    }

  }


  /* ============================================================
     DASHBOARD - CÁLCULOS VISUALES
  ============================================================ */

  get porcentajeUsuariosActivos(): number {

    const total =
      Number(
        this.resumen?.totalUsuarios
        ??
        0
      );


    const activos =
      Number(
        this.resumen?.usuariosActivos
        ??
        0
      );


    if (
      total <= 0
    ) {

      return 0;

    }


    return Math.round(
      (
        activos /
        total
      )
      *
      100
    );

  }


  get porcentajePartidasFinalizadas(): number {

    const total =
      Number(
        this.resumen?.totalPartidas
        ??
        0
      );


    const finalizadas =
      Number(
        this.resumen?.partidasFinalizadas
        ??
        0
      );


    if (
      total <= 0
    ) {

      return 0;

    }


    return Math.round(
      (
        finalizadas /
        total
      )
      *
      100
    );

  }


  get balanceEconomicoGlobal(): number {

    return (

      Number(
        this.resumen?.oroGanadoHistorico
        ??
        0
      )

      -

      Number(
        this.resumen?.oroGastadoHistorico
        ??
        0
      )

    );

  }


  /* ============================================================
     USUARIO - CÁLCULOS
  ============================================================ */

  porcentajeVictorias(
    usuario:
      AdminUsuarioDetalle |
      null
  ): number {

    if (
      !usuario
      ||
      usuario.partidasJugadas <= 0
    ) {

      return 0;

    }


    return Math.round(
      (
        usuario.partidasGanadas /
        usuario.partidasJugadas
      )
      *
      100
    );

  }


  /* ============================================================
     FORMATO DE FECHA
  ============================================================ */

  formatearFecha(
    fecha:
      string |
      null |
      undefined
  ): string {

    if (
      !fecha
    ) {

      return 'Sin registro';

    }


    const valor =
      new Date(
        fecha
      );


    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {

      return String(
        fecha
      );

    }


    return valor
      .toLocaleString(
        'es-CR',
        {
          day:
            '2-digit',

          month:
            '2-digit',

          year:
            'numeric',

          hour:
            '2-digit',

          minute:
            '2-digit'
        }
      );

  }


  /* ============================================================
     FORMATO DE NÚMEROS
  ============================================================ */

  formatearNumero(
    numero:
      number |
      null |
      undefined
  ): string {

    return Number(
      numero ?? 0
    )
      .toLocaleString(
        'es-CR'
      );

  }


  /* ============================================================
     ESTADOS VISUALES
  ============================================================ */

  claseEstadoUsuario(
    estado:
      string |
      null |
      undefined
  ): string {

    const normal =
      this.normalizarTexto(
        estado
      );


    if (
      normal.includes(
        'bloqueado'
      )
    ) {

      return 'estado-bloqueado';

    }


    if (
      normal.includes(
        'inactivo'
      )
    ) {

      return 'estado-inactivo';

    }


    return 'estado-activo';

  }


  claseEstadoPartida(
    estado:
      string |
      null |
      undefined
  ): string {

    const normal =
      this.normalizarTexto(
        estado
      );


    if (
      normal.includes(
        'finalizada'
      )
    ) {

      return 'estado-finalizada';

    }


    if (
      normal.includes(
        'encurso'
      )
      ||
      normal.includes(
        'jugando'
      )
    ) {

      return 'estado-jugando';

    }


    return 'estado-pendiente';

  }


  claseEstadoReporte(
    estado:
      string |
      null |
      undefined
  ): string {

    const normal =
      this.normalizarTexto(
        estado
      );


    if (
      normal.includes(
        'resuelto'
      )
    ) {

      return 'reporte-resuelto';

    }


    if (
      normal.includes(
        'descartado'
      )
    ) {

      return 'reporte-descartado';

    }


    if (
      normal.includes(
        'revisado'
      )
    ) {

      return 'reporte-revisado';

    }


    return 'reporte-pendiente';

  }


  /* ============================================================
     ORO
  ============================================================ */

  esMovimientoPositivo(
    movimiento:
      AdminTransaccion
  ): boolean {

    return (
      movimiento.cantidad >
      0
    );

  }


  /* ============================================================
     CERRAR SESIÓN
  ============================================================ */

  cerrarSesion(): void {

    const confirmar =
      window.confirm(
        '¿Seguro que desea cerrar la sesión administrativa?'
      );


    if (
      !confirmar
    ) {

      return;

    }


    this.adminService
      .cerrarSesion()

      .pipe(
        takeUntil(
          this.destruir$
        )
      )

      .subscribe({

        next: () => {

          this.finalizarSesionLocal();

        },


        error: () => {

          /*
           * Aunque el servidor no conteste,
           * limpiamos la sesión local.
           */

          this.finalizarSesionLocal();

        }

      });

  }


private finalizarSesionLocal(): void {

  this.adminService
    .limpiarSesion();


  void this.router.navigate(
    ['/login'],
    {
      replaceUrl: true
    }
  );

}


private expulsarDeAdministracion(): void {

  /*
   * El Administrador no utiliza Auth.
   * Solo limpiamos su sesión administrativa.
   */

  this.adminService
    .limpiarSesion();


  void this.router.navigate(
    ['/login'],
    {
      replaceUrl: true
    }
  );

}


  /* ============================================================
     MENSAJES
  ============================================================ */

  private mostrarMensaje(
    mensaje: string,
    tipo:
      TipoMensajeAdmin
  ): void {

    if (
      this.timeoutMensaje
    ) {

      clearTimeout(
        this.timeoutMensaje
      );

    }


    this.mensaje =
      mensaje;


    this.tipoMensaje =
      tipo;


    this.timeoutMensaje =
      setTimeout(
        () => {

          if (
            this.mensaje ===
            mensaje
          ) {

            this.limpiarMensaje();

          }

        },
        4200
      );

  }


  limpiarMensaje(): void {

    this.mensaje =
      '';


    this.tipoMensaje =
      'info';

  }


  /* ============================================================
     ERROR BACK
  ============================================================ */

  private obtenerMensajeError(
    error: any,
    predeterminado: string
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


    if (
      typeof error?.message ===
      'string'
    ) {

      return error.message;

    }


    return predeterminado;

  }


  /* ============================================================
     NORMALIZAR
  ============================================================ */

  private normalizarCorreo(
    correo:
      string |
      null |
      undefined
  ): string {

    return String(
      correo ?? ''
    )
      .trim()
      .toLowerCase();

  }


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
      )
      .replace(
        /[\s_-]/g,
        ''
      );

  }


  /* ============================================================
     SEGURIDAD PARA HTML DE PDF
  ============================================================ */

  private escaparHTML(
    valor:
      string |
      null |
      undefined
  ): string {

    return String(
      valor ?? ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  }

}