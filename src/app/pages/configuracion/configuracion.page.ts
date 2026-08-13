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
  Auth
} from '../../services/auth';

import {
  ConfiguracionService,
  ConfiguracionUsuario
} from '../../services/configuracion.service';


@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false
})
export class ConfiguracionPage implements OnInit {

  /* =========================================================
     DATOS DEL USUARIO
  ========================================================= */

  usuarioId = 0;

  nombreUsuario = 'Jugador';


  /* =========================================================
     CONFIGURACIÓN
  ========================================================= */

  configuracionId = 0;

  /*
   * Volumen de música del jugador.
   *
   * Actualmente se guarda en la BD.
   * Más adelante será utilizado por el sistema
   * de audio real del juego.
   */
  volumenMusica = 70;


  /*
   * Volumen de efectos.
   *
   * Servirá para sonidos como:
   *
   * - comer puntos
   * - frutas
   * - ganar
   * - perder
   * - botones
   * - poderes
   */
  volumenEfectos = 80;


  /*
   * Preferencia de notificaciones.
   */
  notificaciones = true;


  /*
   * Aunque el Front ya no permite seleccionar idioma,
   * el Backend todavía utiliza este campo.
   *
   * Lo enviamos siempre como Español para mantener
   * compatibilidad con la entidad actual.
   */
  private readonly idiomaPredeterminado =
    'Español';


  /* =========================================================
     ESTADOS DE LA PÁGINA
  ========================================================= */

  cargando = false;

  guardando = false;

  cambiosPendientes = false;

  mensajeError = '';

  mensajeExito = '';


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly configuracionService: ConfiguracionService
  ) {}


  /* =========================================================
     INICIO
  ========================================================= */

  ngOnInit(): void {

    this.prepararConfiguracion();

  }


  /* =========================================================
     IONIC
     CADA VEZ QUE VOLVEMOS A CONFIGURACIÓN
  ========================================================= */

  ionViewWillEnter(): void {

    /*
     * Ionic puede mantener la página en memoria.
     *
     * Por eso, cuando regresamos a ella,
     * volvemos a consultar el Backend.
     */
    if (
      this.usuarioId > 0 &&
      !this.cargando
    ) {

      this.cargarConfiguracion();

    }

  }


  /* =========================================================
     PREPARAR CONFIGURACIÓN
  ========================================================= */

  private prepararConfiguracion(): void {

    const sesion =
      this.auth.obtenerSesion();


    /* ---------------------------------------------------------
       VALIDAR SESIÓN
    --------------------------------------------------------- */

    if (
      !sesion ||
      Number(sesion.usuarioId) <= 0
    ) {

      this.auth.cerrarSesion();


      void this.router.navigate(
        ['/login'],
        {
          replaceUrl: true
        }
      );


      return;

    }


    /* ---------------------------------------------------------
       USUARIO ACTUAL
    --------------------------------------------------------- */

    this.usuarioId =
      Number(
        sesion.usuarioId
      );


    this.nombreUsuario =
      sesion.nombreUsuario ||
      'Jugador';


    /* ---------------------------------------------------------
       CARGAR DATOS
    --------------------------------------------------------- */

    this.cargarConfiguracion();

  }


  /* =========================================================
     CARGAR CONFIGURACIÓN DESDE EL BACKEND
  ========================================================= */

  cargarConfiguracion(): void {

    if (
      this.cargando ||
      this.usuarioId <= 0
    ) {

      return;

    }


    this.mensajeError = '';

    this.mensajeExito = '';

    this.cargando = true;


    this.configuracionService
      .obtenerPorUsuario(
        this.usuarioId
      )
      .pipe(

        finalize(() => {

          this.cargando =
            false;

        })

      )
      .subscribe({

        /* -----------------------------------------------------
           CORRECTO
        ----------------------------------------------------- */

        next: configuracion => {

          this.aplicarConfiguracion(
            configuracion
          );


          this.cambiosPendientes =
            false;

        },


        /* -----------------------------------------------------
           ERROR
        ----------------------------------------------------- */

        error: error => {

          console.error(
            'Error cargando configuración:',
            error
          );


          if (
            error?.status === 0
          ) {

            this.mensajeError =
              'No se pudo conectar con el servidor.';

            return;

          }


          if (
            error?.status === 404
          ) {

            this.mensajeError =
              'No se encontró la configuración del usuario.';

            return;

          }


          this.mensajeError =
            'No fue posible cargar la configuración.';

        }

      });

  }


  /* =========================================================
     APLICAR DATOS RECIBIDOS
  ========================================================= */

  private aplicarConfiguracion(
    configuracion: ConfiguracionUsuario
  ): void {

    this.configuracionId =
      Number(
        configuracion.configuracionId
      ) || 0;


    this.volumenMusica =
      this.limitarVolumen(
        configuracion.volumenMusica
      );


    this.volumenEfectos =
      this.limitarVolumen(
        configuracion.volumenEfectos
      );


    this.notificaciones =
      Boolean(
        configuracion.notificaciones
      );

  }


  /* =========================================================
     CAMBIO DE VOLUMEN DE MÚSICA
  ========================================================= */

  cambiarVolumenMusica(): void {

    /*
     * ngModel actualiza el valor inmediatamente.
     *
     * Aquí solo aseguramos que esté entre 0 y 100.
     */
    this.volumenMusica =
      this.limitarVolumen(
        this.volumenMusica
      );


    this.marcarCambio();

  }


  /* =========================================================
     CAMBIO DE VOLUMEN DE EFECTOS
  ========================================================= */

  cambiarVolumenEfectos(): void {

    this.volumenEfectos =
      this.limitarVolumen(
        this.volumenEfectos
      );


    this.marcarCambio();

  }


  /* =========================================================
     NOTIFICACIONES
  ========================================================= */

  cambiarNotificaciones(
    event: any
  ): void {

    this.notificaciones =
      Boolean(
        event?.detail?.checked
      );


    this.marcarCambio();

  }


  /* =========================================================
     MARCAR CAMBIO
  ========================================================= */

  private marcarCambio(): void {

    this.cambiosPendientes =
      true;


    /*
     * Si el usuario modifica algo después de guardar,
     * quitamos el mensaje de éxito anterior.
     */
    this.mensajeExito =
      '';

  }


  /* =========================================================
     GUARDAR CONFIGURACIÓN
  ========================================================= */

  guardarConfiguracion(): void {

    if (
      this.guardando ||
      this.usuarioId <= 0
    ) {

      return;

    }


    this.mensajeError =
      '';

    this.mensajeExito =
      '';

    this.guardando =
      true;


    /* ---------------------------------------------------------
       VALIDAR VOLÚMENES
    --------------------------------------------------------- */

    this.volumenMusica =
      this.limitarVolumen(
        this.volumenMusica
      );


    this.volumenEfectos =
      this.limitarVolumen(
        this.volumenEfectos
      );


    /* ---------------------------------------------------------
       ENVIAR AL BACK
    --------------------------------------------------------- */

    this.configuracionService
      .guardar(
        this.usuarioId,
        {
          usuarioId:
            this.usuarioId,

          volumenMusica:
            this.volumenMusica,

          volumenEfectos:
            this.volumenEfectos,

          /*
           * Seguimos enviando Español porque
           * el DTO actual del Backend lo requiere.
           */
          idioma:
            this.idiomaPredeterminado,

          notificaciones:
            this.notificaciones
        }
      )
      .pipe(

        finalize(() => {

          this.guardando =
            false;

        })

      )
      .subscribe({

        /* -----------------------------------------------------
           GUARDADO CORRECTAMENTE
        ----------------------------------------------------- */

        next: configuracion => {

          this.aplicarConfiguracion(
            configuracion
          );


          this.cambiosPendientes =
            false;


          this.mensajeExito =
            'Configuración guardada correctamente.';

        },


        /* -----------------------------------------------------
           ERROR
        ----------------------------------------------------- */

        error: error => {

          console.error(
            'Error guardando configuración:',
            error
          );


          if (
            error?.status === 0
          ) {

            this.mensajeError =
              'No se pudo conectar con el servidor.';

            return;

          }


          this.mensajeError =
            'No fue posible guardar la configuración.';

        }

      });

  }


  /* =========================================================
     RESTAURAR VALORES
  ========================================================= */

  restaurarPredeterminados(): void {

    if (
      this.guardando
    ) {

      return;

    }


    /*
     * Estos son solamente los valores que se muestran.
     *
     * Para guardarlos realmente en la BD,
     * el jugador debe presionar GUARDAR CAMBIOS.
     */
    this.volumenMusica =
      70;


    this.volumenEfectos =
      80;


    this.notificaciones =
      true;


    this.marcarCambio();

  }


  /* =========================================================
     LIMITAR VALOR ENTRE 0 Y 100
  ========================================================= */

  private limitarVolumen(
    valor: unknown
  ): number {

    const numero =
      Number(valor);


    if (
      !Number.isFinite(
        numero
      )
    ) {

      return 0;

    }


    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          numero
        )
      )
    );

  }


  /* =========================================================
     VOLVER AL MENÚ
  ========================================================= */

  volverMenu(): void {

    void this.router.navigate(
      ['/menu']
    );

  }

}