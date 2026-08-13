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
  ListaEsperaService,
  JugadorEspera
} from '../../services/lista-espera.service';


@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: false
})
export class ListaEsperaPage implements OnInit {

  usuarioId = 0;

  nombreUsuario =
    'Jugador';


  jugadores: JugadorEspera[] = [];

  miEstado?: JugadorEspera;


  cargando = false;

  procesando = false;


  mensajeError = '';

  mensajeExito = '';


  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly esperaService: ListaEsperaService
  ) {}


  ngOnInit(): void {

    this.inicializar();

  }


  ionViewWillEnter(): void {

    if (
      this.usuarioId > 0
    ) {

      this.cargar();

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


    this.cargar();

  }


  cargar(): void {

    if (this.cargando) {

      return;

    }


    this.cargando = true;

    this.mensajeError = '';


    this.esperaService
      .listar()
      .pipe(
        finalize(() => {

          this.cargando = false;

        })
      )
      .subscribe({

        next: jugadores => {

          this.jugadores =
            jugadores;


          this.miEstado =
            jugadores.find(x =>
              x.usuarioId ===
              this.usuarioId
            );

        },


        error: error => {

          console.error(
            'Error lista espera:',
            error
          );


          this.mensajeError =
            error?.status === 0
              ? 'No se pudo conectar con el servidor.'
              : 'No fue posible cargar la lista de espera.';

        }

      });

  }


  entrar(): void {

    if (
      this.procesando ||
      this.miEstado
    ) {

      return;

    }


    this.procesando = true;

    this.limpiarMensajes();


    this.esperaService
      .entrar(
        this.usuarioId
      )
      .pipe(
        finalize(() => {

          this.procesando = false;

        })
      )
      .subscribe({

        next: respuesta => {

          this.miEstado =
            respuesta;


          this.mensajeExito =
            'Entraste a la lista de espera.';


          this.cargar();

        },


        error: error => {

          this.mensajeError =
            this.obtenerMensaje(
              error,
              'No fue posible entrar a la lista de espera.'
            );

        }

      });

  }


  salir(): void {

    if (
      this.procesando ||
      !this.miEstado
    ) {

      return;

    }


    this.procesando = true;

    this.limpiarMensajes();


    this.esperaService
      .salir(
        this.usuarioId
      )
      .pipe(
        finalize(() => {

          this.procesando = false;

        })
      )
      .subscribe({

        next: respuesta => {

          this.miEstado =
            undefined;


          this.mensajeExito =
            respuesta?.mensaje ||
            'Saliste de la lista de espera.';


          this.cargar();

        },


        error: error => {

          this.mensajeError =
            this.obtenerMensaje(
              error,
              'No fue posible salir de la lista.'
            );

        }

      });

  }


  private obtenerMensaje(
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