import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  finalize,
  forkJoin,
  switchMap
} from 'rxjs';

import {
  Auth,
  UsuarioSesion
} from '../../services/auth';

import {
  SkinBackend,
  SkinsService,
  UsuarioSkinBackend
} from '../../services/skins.service';


/* =========================================================
   TIPOS VISUALES
========================================================= */

type CategoriaSkin =
  'Pac-Man' |
  'Fantasma' |
  'Monstruo';


type RarezaSkin =
  'Común' |
  'Rara' |
  'Épica' |
  'Legendaria' |
  'Mítica';


/* =========================================================
   MODELO QUE UTILIZA LA PANTALLA
========================================================= */

interface SkinVista {

  id: number;

  nombre: string;

  categoria: CategoriaSkin;

  rareza: RarezaSkin;

  precio: number;

  descripcion: string;

  /*
   * Conservamos tus clases CSS.
   */
  estilo: string;

  comprada: boolean;

  equipada: boolean;

}


/* =========================================================
   COMPONENTE
========================================================= */

@Component({
  selector: 'app-skins',
  templateUrl: './skins.page.html',
  styleUrls: ['./skins.page.scss'],
  standalone: false
})
export class SkinsPage implements OnInit {

  /* =========================================================
     USUARIO
  ========================================================= */

  usuario!: UsuarioSesion;

  usuarioId = 0;


  /*
   * Este valor siempre viene del usuario del backend.
   */
  oro = 0;


  /* =========================================================
     FILTROS
  ========================================================= */

  categoriaActual: CategoriaSkin =
    'Pac-Man';

  rarezaActual:
    'Todas' | RarezaSkin =
    'Todas';


  /* =========================================================
     SKINS
  ========================================================= */

  skins: SkinVista[] = [];

  skinSeleccionada?: SkinVista;


  /* =========================================================
     ESTADOS
  ========================================================= */

  cargando = false;

  procesandoCompra = false;

  procesandoEquipar = false;

  mensajeError = '';

  mensajeExito = '';


  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly skinsService: SkinsService
  ) {}


  /* =========================================================
     INICIO
  ========================================================= */

  ngOnInit(): void {

    this.inicializarPantalla();

  }


  ionViewWillEnter(): void {

    /*
     * Al regresar de otra pantalla actualizamos
     * oro y skins.
     */
    if (this.usuarioId > 0) {

      this.cargarTienda();

    }

  }


  /* =========================================================
     INICIALIZAR
  ========================================================= */

  private inicializarPantalla(): void {

    const sesion =
      this.auth.obtenerSesion();


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


    this.usuario =
      sesion;

    this.usuarioId =
      Number(sesion.usuarioId);

    this.oro =
      Number(sesion.oroActual) || 0;


    this.cargarTienda();

  }


  /* =========================================================
     CARGAR TIENDA

     1. Inicializa skins gratuitas.
     2. Obtiene catálogo.
     3. Obtiene skins del usuario.
     4. Obtiene saldo actualizado.
  ========================================================= */

  cargarTienda(): void {

    if (
      this.cargando ||
      this.usuarioId <= 0
    ) {
      return;
    }


    this.limpiarMensajes();

    this.cargando = true;


    this.skinsService
      .inicializar(
        this.usuarioId
      )
      .pipe(

        switchMap(() =>
          forkJoin({

            catalogo:
              this.skinsService
                .obtenerSkins(),

            usuarioSkins:
              this.skinsService
                .obtenerSkinsUsuario(
                  this.usuarioId
                ),

            usuario:
              this.auth
                .obtenerUsuario(
                  this.usuarioId
                )

          })
        ),

        finalize(() => {

          this.cargando = false;

        })

      )
      .subscribe({

        next: respuesta => {

          /* -----------------------------------------------------
             ACTUALIZAR ORO
          ----------------------------------------------------- */

          this.usuario =
            respuesta.usuario;

          this.oro =
            Number(
              respuesta.usuario.oroActual
            ) || 0;


          /*
           * Actualizamos también la sesión.
           */
          this.auth.guardarSesion(
            respuesta.usuario
          );


          /* -----------------------------------------------------
             CREAR CATÁLOGO VISUAL
          ----------------------------------------------------- */

          this.skins =
            respuesta.catalogo
              .map(skin =>
                this.convertirSkin(
                  skin,
                  respuesta.usuarioSkins
                )
              );


          /*
           * Si había una skin seleccionada,
           * actualizamos su referencia.
           */
          if (this.skinSeleccionada) {

            this.skinSeleccionada =
              this.skins.find(x =>
                x.id ===
                this.skinSeleccionada?.id
              );

          }

        },


        error: error => {

          console.error(
            'Error cargando tienda:',
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
     FILTRAR SKINS
  ========================================================= */

  get skinsFiltradas(): SkinVista[] {

    return this.skins.filter(skin =>

      skin.categoria ===
        this.categoriaActual &&

      (
        this.rarezaActual === 'Todas' ||

        skin.rareza ===
          this.rarezaActual
      )

    );

  }


  /* =========================================================
     CAMBIAR CATEGORÍA
  ========================================================= */

  cambiarCategoria(
    categoria: CategoriaSkin
  ): void {

    this.categoriaActual =
      categoria;

    this.rarezaActual =
      'Todas';

    this.skinSeleccionada =
      undefined;

    this.limpiarMensajes();

  }


  /* =========================================================
     CAMBIAR RAREZA
  ========================================================= */

  cambiarRareza(
    rareza: 'Todas' | RarezaSkin
  ): void {

    this.rarezaActual =
      rareza;

  }


  /* =========================================================
     SELECCIONAR SKIN
  ========================================================= */

  seleccionarSkin(
    skin: SkinVista
  ): void {

    this.skinSeleccionada =
      skin;

    this.limpiarMensajes();

  }


  /* =========================================================
     COMPRAR SKIN
  ========================================================= */

  comprarSkin(): void {

    const skin =
      this.skinSeleccionada;


    if (
      !skin ||
      skin.comprada ||
      this.procesandoCompra
    ) {

      return;

    }


    if (
      this.oro <
      skin.precio
    ) {

      this.mensajeError =
        'No tienes suficiente oro para comprar esta skin.';

      return;

    }


    this.limpiarMensajes();

    this.procesandoCompra =
      true;


    this.skinsService
      .comprar(
        this.usuarioId,
        skin.id
      )
      .pipe(

        finalize(() => {

          this.procesandoCompra =
            false;

        })

      )
      .subscribe({

        next: respuesta => {

          /*
           * El saldo que mostramos es el que
           * devuelve el BACK.
           */
          this.oro =
            respuesta.oroActual;


          /*
           * Marcamos visualmente la skin.
           */
          skin.comprada =
            true;


          this.mensajeExito =
            respuesta.mensaje;


          /*
           * Actualizamos la sesión.
           */
          this.usuario.oroActual =
            respuesta.oroActual;

          this.auth.guardarSesion(
            this.usuario
          );

        },


        error: error => {

          console.error(
            'Error comprando skin:',
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
     EQUIPAR SKIN
  ========================================================= */

  equiparSkin(): void {

    const skin =
      this.skinSeleccionada;


    if (
      !skin ||
      !skin.comprada ||
      skin.equipada ||
      this.procesandoEquipar
    ) {

      return;

    }


    this.limpiarMensajes();

    this.procesandoEquipar =
      true;


    this.skinsService
      .equipar(
        this.usuarioId,
        skin.id
      )
      .pipe(

        finalize(() => {

          this.procesandoEquipar =
            false;

        })

      )
      .subscribe({

        next: respuesta => {

          /*
           * SOLO quitamos equipada a las skins
           * de la misma categoría.
           *
           * Así el usuario conserva:
           *
           * 1 Pac-Man equipado
           * 1 Fantasma equipado
           * 1 Monstruo equipado
           */
          this.skins
            .filter(x =>
              x.categoria ===
              skin.categoria
            )
            .forEach(x => {

              x.equipada = false;

            });


          skin.equipada =
            true;


          this.mensajeExito =
            respuesta.mensaje;

        },


        error: error => {

          console.error(
            'Error equipando skin:',
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
     CONVERTIR DATOS DEL BACK
  ========================================================= */

  private convertirSkin(
    skinBackend: SkinBackend,
    usuarioSkins: UsuarioSkinBackend[]
  ): SkinVista {

    const propiedad =
      usuarioSkins.find(x =>
        x.skinId ===
        skinBackend.skinId
      );


    const categoria =
      this.normalizarCategoria(
        skinBackend.tipoPersonaje
      );


    return {

      id:
        skinBackend.skinId,

      nombre:
        skinBackend.nombreSkin,

      categoria,

      rareza:
        this.obtenerRareza(
          skinBackend.nombreSkin,
          categoria
        ),

      /*
       * PRECIO REAL DEL BACK.
       */
      precio:
        Number(
          skinBackend.precioOro
        ) || 0,

      descripcion:
        skinBackend.descripcion ??
        '',

      /*
       * Aquí conservamos exactamente tus estilos.
       */
      estilo:
        this.obtenerEstilo(
          skinBackend.nombreSkin,
          categoria
        ),

      comprada:
        !!propiedad,

      equipada:
        propiedad?.equipada ??
        false

    };

  }


  /* =========================================================
     CATEGORÍA
  ========================================================= */

  private normalizarCategoria(
    tipo: string
  ): CategoriaSkin {

    const valor =
      tipo
        .trim()
        .toLowerCase();


    if (
      valor.includes('fantasma')
    ) {

      return 'Fantasma';

    }


    if (
      valor.includes('monstruo')
    ) {

      return 'Monstruo';

    }


    return 'Pac-Man';

  }


  /* =========================================================
     RAREZA

     Conservamos las rarezas que tú ya habías diseñado.
  ========================================================= */

  private obtenerRareza(
    nombre: string,
    categoria: CategoriaSkin
  ): RarezaSkin {

    const nombreNormalizado =
      this.normalizarTexto(
        nombre
      );


    if (
      nombreNormalizado === 'clasico' ||
      nombreNormalizado === 'rojo' ||
      nombreNormalizado === 'demonio'
    ) {

      return 'Común';

    }


    if (
      nombreNormalizado === 'hielo' ||
      nombreNormalizado === 'oni'
    ) {

      return 'Rara';

    }


    if (
      nombreNormalizado === 'lava' ||
      nombreNormalizado === 'sombra' ||
      nombreNormalizado === 'cyborg'
    ) {

      return 'Épica';

    }


    if (
      nombreNormalizado.includes('rey') ||
      nombreNormalizado === 'plasma' ||
      nombreNormalizado === 'dragon'
    ) {

      return 'Legendaria';

    }


    return 'Mítica';

  }


  /* =========================================================
     ESTILO VISUAL

     NO estamos eliminando tus diseños originales.
  ========================================================= */

  private obtenerEstilo(
    nombre: string,
    categoria: CategoriaSkin
  ): string {

    const valor =
      this.normalizarTexto(
        nombre
      );


    /* ---------------------------------------------------------
       PAC-MAN
    --------------------------------------------------------- */

    if (
      categoria === 'Pac-Man'
    ) {

      if (valor === 'hielo') {
        return 'pacman ice';
      }

      if (valor === 'lava') {
        return 'pacman lava';
      }

      if (valor.includes('rey')) {
        return 'pacman king';
      }

      if (valor === 'galaxia') {
        return 'pacman galaxy';
      }

      return 'pacman classic';

    }


    /* ---------------------------------------------------------
       FANTASMA
    --------------------------------------------------------- */

    if (
      categoria === 'Fantasma'
    ) {

      if (valor === 'hielo') {
        return 'ghost ice';
      }

      if (valor === 'sombra') {
        return 'ghost shadow';
      }

      if (valor === 'plasma') {
        return 'ghost plasma';
      }

      if (valor === 'cosmico') {
        return 'ghost cosmic';
      }

      return 'ghost red';

    }


    /* ---------------------------------------------------------
       MONSTRUO
    --------------------------------------------------------- */

    if (valor === 'oni') {
      return 'monster oni';
    }

    if (valor === 'cyborg') {
      return 'monster cyborg';
    }

    if (valor === 'dragon') {
      return 'monster dragon';
    }

    if (valor === 'hydra') {
      return 'monster hydra';
    }


    return 'monster demon';

  }


  /* =========================================================
     NORMALIZAR TEXTO
  ========================================================= */

  private normalizarTexto(
    texto: string
  ): string {

    return String(
      texto ?? ''
    )
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
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
        'No se pudo conectar con el servidor.'
      );

    }


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


    return (
      'No fue posible realizar la operación.'
    );

  }


  /* =========================================================
     LIMPIAR MENSAJES
  ========================================================= */

  private limpiarMensajes(): void {

    this.mensajeError = '';

    this.mensajeExito = '';

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