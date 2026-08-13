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


@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false
})
export class MenuPage implements OnInit {

  /* =========================================================
     DATOS DEL USUARIO
  ========================================================= */

  usuario!: UsuarioSesion;

  nombre = '';

  correo = '';

  fotoPerfil = '';

  nivel = 1;

  /*
   * El oro SIEMPRE pertenece al usuario autenticado.
   *
   * No se coloca una cantidad fija en el Front.
   * El valor se obtiene desde el Backend mediante:
   *
   * usuario.oroActual
   *
   * Esto permite que:
   *
   * Usuario A -> 0 monedas
   * Usuario B -> 250 monedas
   * Usuario C -> 500 monedas
   *
   * Cada cuenta mantiene su propio saldo.
   */
  monedas = 0;


  /* =========================================================
     EXPERIENCIA
  ========================================================= */

  /*
   * Por ahora estos datos se utilizan únicamente
   * para representar visualmente el nivel.
   *
   * Cuando conectemos completamente la experiencia
   * del juego podremos sustituirlos por datos del Backend.
   */
  xpActual = 0;

  xpMaxima = 500;

  porcentajeXp = 0;


  /* =========================================================
     ESTADO DEL MENÚ
  ========================================================= */

  cargandoUsuario = false;

  mensajeError = '';

  /*
   * Evita iniciar el flujo del juego mientras
   * todavía no tenemos una sesión válida.
   */
  menuListo = false;


  /* =========================================================
     ADMINISTRADOR
  ========================================================= */

  esAdministrador = false;

  administrador = false;


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private readonly router: Router,
    private readonly auth: Auth
  ) {}


  /* =========================================================
     INICIALIZACIÓN
  ========================================================= */

  ngOnInit(): void {

    /*
     * Cargamos inmediatamente los datos guardados
     * cuando Angular crea la página.
     */
    this.cargarSesion();

  }


  /* =========================================================
     IONIC - CADA VEZ QUE ENTRAMOS AL MENÚ
  ========================================================= */

  ionViewWillEnter(): void {

    /*
     * MUY IMPORTANTE:
     *
     * Ionic puede conservar esta página en memoria.
     *
     * Por eso ngOnInit() no necesariamente se ejecuta
     * cuando regresamos desde otra pantalla.
     *
     * ionViewWillEnter() sí se ejecuta cuando volvemos.
     *
     * Esto permite actualizar:
     *
     * - oro después de comprar una skin;
     * - datos del perfil;
     * - nivel;
     * - futuras recompensas;
     * - datos después de una partida.
     */
    this.cargarSesion();

  }


  /* =========================================================
     CARGAR SESIÓN
  ========================================================= */

  private cargarSesion(): void {

    this.mensajeError = '';

    const sesion =
      this.auth.obtenerSesion();


    /* ---------------------------------------------------------
       VALIDAR SESIÓN
    --------------------------------------------------------- */

    if (
      !sesion ||
      Number(sesion.usuarioId) <= 0
    ) {

      /*
       * Si no existe un usuario autenticado,
       * eliminamos cualquier sesión inválida.
       */
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
       GUARDAR USUARIO ACTUAL
    --------------------------------------------------------- */

    /*
     * Primero mostramos los datos que tenemos
     * guardados localmente.
     *
     * De esta manera la pantalla aparece rápido
     * mientras esperamos la API.
     */
    this.aplicarUsuario(
      sesion
    );


    /* ---------------------------------------------------------
       CONSULTAR DATOS ACTUALES AL BACKEND
    --------------------------------------------------------- */

    /*
     * Después pedimos nuevamente el usuario al Backend.
     *
     * Esto es especialmente importante para el oro.
     *
     * Ejemplo:
     *
     * Teníamos: 300
     * Compra Hielo: -50
     * Backend: 250
     * Volvemos al menú
     * Backend responde: 250
     * Menú muestra: 250
     */
    this.refrescarUsuario();

  }


  /* =========================================================
     REFRESCAR USUARIO DESDE EL BACKEND
  ========================================================= */

  refrescarUsuario(): void {

    /*
     * Evitamos realizar solicitudes duplicadas.
     */
    if (
      this.cargandoUsuario ||
      !this.usuario ||
      Number(this.usuario.usuarioId) <= 0
    ) {

      return;

    }


    this.cargandoUsuario = true;


    this.auth
      .obtenerUsuario(
        this.usuario.usuarioId
      )
      .pipe(

        finalize(() => {

          this.cargandoUsuario = false;

          /*
           * Aunque exista un problema temporal
           * de conexión permitimos utilizar el menú
           * con los últimos datos disponibles.
           */
          this.menuListo = true;

        })

      )
      .subscribe({

        /* -----------------------------------------------------
           RESPUESTA CORRECTA
        ----------------------------------------------------- */

        next: usuarioActualizado => {

          if (
            !usuarioActualizado ||
            Number(usuarioActualizado.usuarioId) <= 0
          ) {

            this.mensajeError =
              'No fue posible actualizar la información de la cuenta.';

            return;

          }


          /*
           * Guardamos nuevamente la sesión.
           *
           * Así cualquier otra pantalla tendrá también
           * los datos más recientes del jugador.
           */
          this.auth.guardarSesion(
            usuarioActualizado
          );


          /*
           * Actualizamos la interfaz.
           */
          this.aplicarUsuario(
            usuarioActualizado
          );

        },


        /* -----------------------------------------------------
           ERROR
        ----------------------------------------------------- */

        error: error => {

          console.warn(
            'No se pudo refrescar el usuario:',
            error
          );


          /*
           * Si la sesión ya no es válida o el usuario
           * dejó de existir, cerramos la sesión.
           */
          if (
            error?.status === 401 ||
            error?.status === 404
          ) {

            this.cerrarSesion();

            return;

          }


          /*
           * Status 0 normalmente significa que Angular
           * no logró comunicarse con la API.
           *
           * Puede ocurrir si:
           *
           * - el Backend está apagado;
           * - la IP cambió;
           * - el teléfono no puede alcanzar la PC;
           * - existe un problema de red.
           */
          if (
            error?.status === 0
          ) {

            this.mensajeError =
              'No se pudo actualizar la cuenta. Se muestran los últimos datos guardados.';

            return;

          }


          this.mensajeError =
            'No fue posible actualizar algunos datos del usuario.';

        }

      });

  }


  /* =========================================================
     APLICAR DATOS DEL USUARIO
  ========================================================= */

  private aplicarUsuario(
    usuario: UsuarioSesion
  ): void {

    this.usuario =
      usuario;


    /* ---------------------------------------------------------
       NOMBRE
    --------------------------------------------------------- */

    this.nombre =
      usuario.nombreUsuario ||
      'Jugador';


    /* ---------------------------------------------------------
       CORREO
    --------------------------------------------------------- */

    this.correo =
      usuario.correo ||
      '';


    /* ---------------------------------------------------------
       FOTO
    --------------------------------------------------------- */

    this.fotoPerfil =
      usuario.fotoPerfil ??
      '';


    /* ---------------------------------------------------------
       NIVEL
    --------------------------------------------------------- */

    this.nivel =
      Number(usuario.nivel) > 0
        ? Number(usuario.nivel)
        : 1;


    /* ---------------------------------------------------------
       ORO
    --------------------------------------------------------- */

    /*
     * El valor proviene exclusivamente del Backend.
     *
     * Nunca debemos sumar/restar oro aquí manualmente
     * como fuente oficial.
     *
     * Las compras y recompensas modifican la BD.
     * El Front solamente representa el resultado.
     */
    const oroBackend =
      Number(usuario.oroActual);


    this.monedas =
      Number.isFinite(oroBackend) &&
      oroBackend >= 0
        ? oroBackend
        : 0;


    /* ---------------------------------------------------------
       EXPERIENCIA
    --------------------------------------------------------- */

    this.calcularExperiencia();


    /* ---------------------------------------------------------
       ADMINISTRADOR
    --------------------------------------------------------- */

    this.verificarAdministrador();


    this.menuListo = true;

  }


  /* =========================================================
     EXPERIENCIA
  ========================================================= */

  private calcularExperiencia(): void {

    /*
     * TEMPORAL:
     *
     * Esto solamente mantiene funcionando
     * la representación visual de experiencia.
     *
     * No afecta:
     *
     * - monedas;
     * - tienda;
     * - skins;
     * - salas;
     * - partidas.
     */
    this.xpMaxima =
      Math.max(
        500,
        this.nivel * 500
      );


    this.xpActual =
      Math.min(
        this.xpMaxima,
        Math.max(
          0,
          this.nivel * 180
        )
      );


    this.porcentajeXp =
      this.xpMaxima > 0
        ? Math.min(
            100,
            Math.round(
              (
                this.xpActual /
                this.xpMaxima
              ) * 100
            )
          )
        : 0;

  }


  /* =========================================================
     ADMINISTRADOR
  ========================================================= */

  private verificarAdministrador(): void {

    /*
     * Por ahora se mantiene desactivado.
     *
     * Posteriormente podemos conectarlo al rol
     * real enviado por el Backend.
     */
    this.esAdministrador = false;

    this.administrador = false;

  }


  /* =========================================================
     JUGAR
  ========================================================= */

  jugar(): void {

    if (!this.menuListo) {

      return;

    }


    /*
     * Flujo principal:
     *
     * MENÚ
     *   ↓
     * SALAS
     */
    void this.router.navigate(
      ['/salas']
    );

  }


  /* =========================================================
     AMIGOS
  ========================================================= */

  amigos(): void {

    void this.router.navigate(
      ['/amigos']
    );

  }


  /* =========================================================
     RANKING
  ========================================================= */

  ranking(): void {

    void this.router.navigate(
      ['/ranking']
    );

  }


  /* =========================================================
     SKINS / TIENDA
  ========================================================= */

  skins(): void {

    /*
     * La tienda maneja:
     *
     * - oro del usuario;
     * - skins disponibles;
     * - skins compradas;
     * - skins equipadas.
     *
     * Cuando regresemos, ionViewWillEnter()
     * volverá a consultar al Backend.
     */
    void this.router.navigate(
      ['/skins']
    );

  }


  /* =========================================================
     CONFIGURACIÓN
  ========================================================= */

  configuracion(): void {

    void this.router.navigate(
      ['/configuracion']
    );

  }


  /* =========================================================
     PERFIL
  ========================================================= */

  perfil(): void {

    void this.router.navigate(
      ['/perfil']
    );

  }


  /* =========================================================
     LISTA DE ESPERA
  ========================================================= */

  listaEspera(): void {

    void this.router.navigate(
      ['/lista-espera']
    );

  }


  /* =========================================================
     ADMINISTRACIÓN
  ========================================================= */

  admin(): void {

    if (!this.esAdministrador) {

      return;

    }


    void this.router.navigate(
      ['/admin']
    );

  }


  /* =========================================================
     ACTUALIZACIÓN MANUAL
  ========================================================= */

  actualizarDatos(): void {

    /*
     * Botón ↻ de la esquina superior derecha.
     *
     * Fuerza una nueva consulta del usuario
     * al Backend.
     */
    this.refrescarUsuario();

  }


  /* =========================================================
     CERRAR SESIÓN
  ========================================================= */

  cerrarSesion(): void {

    /*
     * Eliminamos la sesión almacenada.
     */
    this.auth.cerrarSesion();


    /*
     * Limpiamos los datos que permanecen
     * en memoria.
     */
    this.nombre = '';

    this.correo = '';

    this.fotoPerfil = '';

    this.monedas = 0;

    this.nivel = 1;

    this.xpActual = 0;

    this.xpMaxima = 500;

    this.porcentajeXp = 0;

    this.menuListo = false;


    /*
     * replaceUrl evita regresar al menú
     * utilizando Atrás después del logout.
     */
    void this.router.navigate(
      ['/login'],
      {
        replaceUrl: true
      }
    );

  }

}