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
  RankingService,
  RankingJugador
} from '../../services/ranking.service';


@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.page.html',
  styleUrls: ['./ranking.page.scss'],
  standalone: false
})
export class RankingPage implements OnInit {

  usuarioId = 0;

  ranking: RankingJugador[] = [];

  miRanking?: RankingJugador;

  cargando = false;

  mensajeError = '';


  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly rankingService: RankingService
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


    this.cargar();

  }


  cargar(): void {

    if (this.cargando) {

      return;

    }


    this.cargando = true;

    this.mensajeError = '';


    this.rankingService
      .listar()
      .pipe(
        finalize(() => {

          this.cargando = false;

        })
      )
      .subscribe({

        next: ranking => {

          this.ranking =
            ranking;


          this.miRanking =
            ranking.find(x =>
              x.usuarioId ===
              this.usuarioId
            );

        },


        error: error => {

          console.error(
            'Error ranking:',
            error
          );


          this.mensajeError =
            error?.status === 0
              ? 'No se pudo conectar con el servidor.'
              : 'No fue posible cargar el ranking.';

        }

      });

  }


  medalla(
    posicion: number
  ): string {

    switch (posicion) {

      case 1:
        return '🥇';

      case 2:
        return '🥈';

      case 3:
        return '🥉';

      default:
        return '🎮';

    }

  }


  volverMenu(): void {

    void this.router.navigate(
      ['/menu']
    );

  }

}