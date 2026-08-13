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
  AmigosService,
  AmigoRelacion,
  UsuarioBusqueda
} from '../../services/amigos.service';


@Component({
  selector: 'app-amigos',
  templateUrl: './amigos.page.html',
  styleUrls: ['./amigos.page.scss'],
  standalone: false
})
export class AmigosPage implements OnInit {

  usuarioId = 0;

  nombreUsuario =
    'Jugador';


  amigos: AmigoRelacion[] = [];

  solicitudes: AmigoRelacion[] = [];

  solicitudesEnviadas: AmigoRelacion[] = [];

  resultados: UsuarioBusqueda[] = [];


  terminoBusqueda = '';


  cargando = false;

  buscando = false;

  procesandoId = 0;


  mensajeError = '';

  mensajeExito = '';


  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly amigosService: AmigosService
  ) {}


  ngOnInit(): void {

    this.inicializar();

  }


  ionViewWillEnter(): void {

    if (
      this.usuarioId > 0
    ) {

      this.cargarAmigos();

    }

  }


  private inicializar(): void {

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


    this.usuarioId =
      Number(sesion.usuarioId);


    this.nombreUsuario =
      sesion.nombreUsuario ||
      'Jugador';


    this.cargarAmigos();

  }


  cargarAmigos(): void {

    if (
      this.cargando ||
      this.usuarioId <= 0
    ) {

      return;

    }


    this.cargando = true;

    this.mensajeError = '';


    this.amigosService
      .obtenerPorUsuario(
        this.usuarioId
      )
      .pipe(
        finalize(() => {

          this.cargando = false;

        })
      )
      .subscribe({

        next: relaciones => {

          this.amigos =
            relaciones.filter(x =>
              x.estadoAmistad ===
              'Aceptada'
            );


          this.solicitudes =
            relaciones.filter(x =>
              x.estadoAmistad === 'Pendiente' &&
              x.solicitudRecibida
            );


          this.solicitudesEnviadas =
            relaciones.filter(x =>
              x.estadoAmistad === 'Pendiente' &&
              !x.solicitudRecibida
            );

        },


        error: error => {

          console.error(
            'Error cargando amigos:',
            error
          );


          this.mensajeError =
            error?.status === 0
              ? 'No se pudo conectar con el servidor.'
              : 'No fue posible cargar tus amigos.';

        }

      });

  }


  buscar(): void {

    const termino =
      this.terminoBusqueda.trim();


    if (
      termino.length < 2 ||
      this.buscando
    ) {

      if (!termino) {

        this.resultados = [];

      }

      return;

    }


    this.buscando = true;

    this.mensajeError = '';


    this.amigosService
      .buscarUsuarios(
        this.usuarioId,
        termino
      )
      .pipe(
        finalize(() => {

          this.buscando = false;

        })
      )
      .subscribe({

        next: usuarios => {

          this.resultados =
            usuarios.filter(usuario =>
              !this.relacionExistente(
                usuario.usuarioId
              )
            );

        },


        error: error => {

          console.error(
            'Error buscando usuarios:',
            error
          );

          this.mensajeError =
            'No fue posible realizar la búsqueda.';

        }

      });

  }


  enviarSolicitud(
    usuario: UsuarioBusqueda
  ): void {

    if (
      this.procesandoId > 0
    ) {

      return;

    }


    this.procesandoId =
      usuario.usuarioId;


    this.limpiarMensajes();


    this.amigosService
      .enviarSolicitud(
        this.usuarioId,
        usuario.usuarioId
      )
      .pipe(
        finalize(() => {

          this.procesandoId = 0;

        })
      )
      .subscribe({

        next: respuesta => {

          this.mensajeExito =
            respuesta?.mensaje ||
            'Solicitud enviada correctamente.';


          this.resultados =
            this.resultados.filter(x =>
              x.usuarioId !==
              usuario.usuarioId
            );


          this.cargarAmigos();

        },


        error: error => {

          this.mensajeError =
            this.obtenerError(
              error,
              'No fue posible enviar la solicitud.'
            );

        }

      });

  }


  aceptar(
    relacion: AmigoRelacion
  ): void {

    this.procesarRelacion(
      relacion,
      'aceptar'
    );

  }


  rechazar(
    relacion: AmigoRelacion
  ): void {

    this.procesarRelacion(
      relacion,
      'eliminar'
    );

  }


  eliminarAmigo(
    relacion: AmigoRelacion
  ): void {

    this.procesarRelacion(
      relacion,
      'eliminar'
    );

  }


  cancelarSolicitud(
    relacion: AmigoRelacion
  ): void {

    this.procesarRelacion(
      relacion,
      'eliminar'
    );

  }


  private procesarRelacion(
    relacion: AmigoRelacion,
    accion: 'aceptar' | 'eliminar'
  ): void {

    if (
      this.procesandoId > 0
    ) {

      return;

    }


    this.procesandoId =
      relacion.amigoId;


    this.limpiarMensajes();


    const peticion =
      accion === 'aceptar'
        ? this.amigosService
            .aceptarSolicitud(
              relacion.amigoId
            )
        : this.amigosService
            .eliminar(
              relacion.amigoId
            );


    peticion
      .pipe(
        finalize(() => {

          this.procesandoId = 0;

        })
      )
      .subscribe({

        next: respuesta => {

          this.mensajeExito =
            respuesta?.mensaje ||
            (
              accion === 'aceptar'
                ? 'Solicitud aceptada.'
                : 'Registro eliminado.'
            );


          this.cargarAmigos();

        },


        error: error => {

          this.mensajeError =
            this.obtenerError(
              error,
              'No fue posible completar la acción.'
            );

        }

      });

  }


  private relacionExistente(
    otroUsuarioId: number
  ): boolean {

    return [
      ...this.amigos,
      ...this.solicitudes,
      ...this.solicitudesEnviadas
    ]
      .some(x =>
        x.otroUsuarioId ===
        otroUsuarioId
      );

  }


  private obtenerError(
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


    return predeterminado;

  }


  private limpiarMensajes(): void {

    this.mensajeError = '';

    this.mensajeExito = '';

  }


  volverMenu(): void {

    void this.router.navigate(
      ['/menu']
    );

  }

}