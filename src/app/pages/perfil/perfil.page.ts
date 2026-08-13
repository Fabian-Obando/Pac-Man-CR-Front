import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  finalize,
  forkJoin
} from 'rxjs';

import {
  Auth,
  UsuarioSesion
} from '../../services/auth';

import {
  EstadisticasJugador,
  LogroUsuario,
  PerfilService,
  SkinEquipada
} from '../../services/perfil.service';

import {
  environment
} from '../../../environments/environment';


/* =========================================================
   TIPO DE COMENTARIO
========================================================= */

type TipoComentario =
  | 'Comentario'
  | 'Sugerencia'
  | 'Problema';


/* =========================================================
   REQUEST PARA REPORTES JUGADOR
========================================================= */

interface ComentarioRequest {

  usuarioReportadoId: number;

  usuarioReportaId: number;

  motivo: string;

  fechaReporte: string;

  estado: string;

}


/* =========================================================
   RESPUESTA DEL BACKEND
========================================================= */

interface ComentarioRespuesta {

  reporteId: number;

  usuarioReportadoId: number;

  usuarioReportaId: number;

  motivo: string;

  fechaReporte: string;

  estado: string;

}


/* =========================================================
   COMPONENTE
========================================================= */

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {


  /* =========================================================
     USUARIO
  ========================================================= */

  usuario!: UsuarioSesion;

  usuarioId = 0;

  nombre = '';

  correo = '';

  fotoPerfil = '';

  nivel = 1;

  oro = 0;

  estadoCuenta = '';

  fechaRegistro = '';

  ultimoAcceso = '';


  /* =========================================================
     ESTADÍSTICAS
  ========================================================= */

  estadisticas: EstadisticasJugador = {

    estadisticaId: 0,

    usuarioId: 0,

    partidasJugadas: 0,

    partidasGanadas: 0,

    partidasPerdidas: 0,

    frutasConsumidas: 0,

    oroGanado: 0

  };


  porcentajeVictorias = 0;


  /* =========================================================
     LOGROS
  ========================================================= */

  logros: LogroUsuario[] = [];


  /* =========================================================
     SKINS
  ========================================================= */

  skinsEquipadas: SkinEquipada[] = [];


  /* =========================================================
     ESTADOS GENERALES
  ========================================================= */

  cargando = false;

  mensajeError = '';


  /* =========================================================
     CENTRO DE COMENTARIOS
  ========================================================= */

  tipoComentario: TipoComentario =
    'Comentario';

  comentario = '';

  enviandoComentario = false;

  mensajeComentarioError = '';

  mensajeComentarioExito = '';

  readonly limiteComentario = 500;


  /* =========================================================
     URL REPORTES
  ========================================================= */

  private readonly reportesUrl =
    `${environment.apiUrl}/ReportesJugadors`;


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private readonly router: Router,
    private readonly auth: Auth,
    private readonly perfilService: PerfilService,
    private readonly http: HttpClient
  ) {}


  /* =========================================================
     INICIO
  ========================================================= */

  ngOnInit(): void {

    this.prepararPerfil();

  }


  /* =========================================================
     CADA VEZ QUE ENTRAMOS
  ========================================================= */

  ionViewWillEnter(): void {

    if (this.usuarioId > 0) {

      this.cargarPerfil();

    }

  }


  /* =========================================================
     PREPARAR PERFIL
  ========================================================= */

  private prepararPerfil(): void {

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


    this.aplicarUsuario(
      sesion
    );


    this.cargarPerfil();

  }


  /* =========================================================
     CARGAR PERFIL
  ========================================================= */

  cargarPerfil(): void {

    if (
      this.cargando ||
      this.usuarioId <= 0
    ) {

      return;

    }


    this.mensajeError = '';

    this.cargando = true;


    forkJoin({

      usuario:
        this.auth.obtenerUsuario(
          this.usuarioId
        ),

      estadisticas:
        this.perfilService
          .obtenerEstadisticas(
            this.usuarioId
          ),

      logros:
        this.perfilService
          .obtenerLogros(
            this.usuarioId
          ),

      skins:
        this.perfilService
          .obtenerSkinsEquipadas(
            this.usuarioId
          )

    })
      .pipe(

        finalize(() => {

          this.cargando = false;

        })

      )
      .subscribe({

        next: respuesta => {


          /* ===============================================
             USUARIO
          =============================================== */

          this.usuario =
            respuesta.usuario;


          this.auth.guardarSesion(
            respuesta.usuario
          );


          this.aplicarUsuario(
            respuesta.usuario
          );


          /* ===============================================
             ESTADÍSTICAS
          =============================================== */

          this.estadisticas =
            respuesta.estadisticas;


          this.calcularPorcentajeVictorias();


          /* ===============================================
             LOGROS
          =============================================== */

          this.logros =
            respuesta.logros ?? [];


          /* ===============================================
             SKINS
          =============================================== */

          this.skinsEquipadas =
            respuesta.skins ?? [];

        },


        error: (error: HttpErrorResponse) => {

          console.error(
            'Error cargando perfil:',
            error
          );


          if (
            error.status === 401 ||
            error.status === 404
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


          if (error.status === 0) {

            this.mensajeError =
              'No se pudo conectar con el servidor.';

            return;

          }


          this.mensajeError =
            'No fue posible cargar completamente el perfil.';

        }

      });

  }


  /* =========================================================
     APLICAR USUARIO
  ========================================================= */

  private aplicarUsuario(
    usuario: UsuarioSesion
  ): void {

    this.nombre =
      usuario.nombreUsuario ||
      'Jugador';


    this.correo =
      usuario.correo ||
      '';


    this.fotoPerfil =
      usuario.fotoPerfil ??
      '';


    this.nivel =
      Number(usuario.nivel) > 0
        ? Number(usuario.nivel)
        : 1;


    this.oro =
      Math.max(
        0,
        Number(usuario.oroActual) || 0
      );


    const usuarioExtendido =
      usuario as UsuarioSesion & {

        estadoCuenta?: string;

        fechaRegistro?: string;

        ultimoAcceso?: string;

      };


    this.estadoCuenta =
      usuarioExtendido.estadoCuenta ??
      'Activa';


    this.fechaRegistro =
      usuarioExtendido.fechaRegistro ??
      '';


    this.ultimoAcceso =
      usuarioExtendido.ultimoAcceso ??
      '';

  }


  /* =========================================================
     PORCENTAJE DE VICTORIAS
  ========================================================= */

  private calcularPorcentajeVictorias(): void {

    if (
      this.estadisticas.partidasJugadas <= 0
    ) {

      this.porcentajeVictorias = 0;

      return;

    }


    this.porcentajeVictorias =
      Math.round(
        (
          this.estadisticas.partidasGanadas /
          this.estadisticas.partidasJugadas
        ) * 100
      );

  }


  /* =========================================================
     SKIN EQUIPADA
  ========================================================= */

  obtenerSkinEquipada(
    tipo: string
  ): SkinEquipada | undefined {

    const tipoNormalizado =
      this.normalizarTexto(
        tipo
      );


    return this.skinsEquipadas.find(
      skin =>
        this.normalizarTexto(
          skin.tipoPersonaje
        ) === tipoNormalizado
    );

  }


  /* =========================================================
     ICONO SKIN
  ========================================================= */

  iconoSkin(
    tipo: string
  ): string {

    const valor =
      this.normalizarTexto(
        tipo
      );


    if (
      valor.includes('fantasma')
    ) {

      return '👻';

    }


    if (
      valor.includes('monstruo')
    ) {

      return '😈';

    }


    return '🟡';

  }


  /* =========================================================
     ICONO LOGRO
  ========================================================= */

  obtenerIconoLogro(
    logro: LogroUsuario
  ): string {

    const nombre =
      this.normalizarTexto(
        logro.nombreLogro
      );


    if (
      nombre.includes('fantasma')
    ) {

      return '👻';

    }


    if (
      nombre.includes('oro') ||
      nombre.includes('moneda')
    ) {

      return '🪙';

    }


    if (
      nombre.includes('partida') ||
      nombre.includes('veterano')
    ) {

      return '🎮';

    }


    return '🏆';

  }


  /* =========================================================
     FECHA
  ========================================================= */

  formatearFecha(
    fecha?: string
  ): string {

    if (!fecha) {

      return 'Sin información';

    }


    const valor =
      new Date(fecha);


    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {

      return 'Sin información';

    }


    return valor.toLocaleDateString(
      'es-CR'
    );

  }


  /* =========================================================
     NORMALIZAR
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
     SELECCIONAR TIPO DE COMENTARIO
  ========================================================= */

  seleccionarTipoComentario(
    tipo: TipoComentario
  ): void {

    if (this.enviandoComentario) {

      return;

    }


    this.tipoComentario =
      tipo;


    this.mensajeComentarioError =
      '';


    this.mensajeComentarioExito =
      '';

  }


  /* =========================================================
     CONTADOR
  ========================================================= */

  get caracteresComentario(): number {

    return this.comentario.length;

  }


  /* =========================================================
     ¿SE PUEDE ENVIAR?
  ========================================================= */

  get puedeEnviarComentario(): boolean {

    const mensaje =
      this.comentario.trim();


    return (
      !this.enviandoComentario &&
      this.usuarioId > 0 &&
      mensaje.length >= 5 &&
      mensaje.length <=
        this.limiteComentario
    );

  }


  /* =========================================================
     ENVIAR COMENTARIO
  ========================================================= */

  enviarComentario(): void {

    this.mensajeComentarioError =
      '';


    this.mensajeComentarioExito =
      '';


    if (this.usuarioId <= 0) {

      this.mensajeComentarioError =
        'No se encontró la sesión del jugador.';

      return;

    }


    const mensaje =
      this.comentario.trim();


    if (mensaje.length < 5) {

      this.mensajeComentarioError =
        'Escribe un mensaje de al menos 5 caracteres.';

      return;

    }


    if (
      mensaje.length >
      this.limiteComentario
    ) {

      this.mensajeComentarioError =
        `El mensaje no puede superar ${this.limiteComentario} caracteres.`;

      return;

    }


    /* =====================================================
       PREFIJO SEGÚN TIPO
    ===================================================== */

    const motivo =
      `[${this.tipoComentario.toUpperCase()}] ${mensaje}`;


    /* =====================================================
       OBJETO QUE RECIBE TU BACKEND
    ===================================================== */

    const request: ComentarioRequest = {

      usuarioReportadoId:
        this.usuarioId,

      usuarioReportaId:
        this.usuarioId,

      motivo:
        motivo,

      fechaReporte:
        new Date().toISOString(),

      estado:
        'Pendiente'

    };


    this.enviandoComentario =
      true;


    /* =====================================================
       POST DIRECTO A ReportesJugadorsController
    ===================================================== */

    this.http
      .post<ComentarioRespuesta>(
        this.reportesUrl,
        request
      )
      .pipe(

        finalize(() => {

          this.enviandoComentario =
            false;

        })

      )
      .subscribe({

        next: (
          respuesta: ComentarioRespuesta
        ) => {

          console.log(
            'Comentario enviado:',
            respuesta
          );


          this.mensajeComentarioExito =
            '¡Mensaje enviado! El equipo de PAC-MAN CR podrá revisarlo desde Administración.';


          this.comentario =
            '';


          this.tipoComentario =
            'Comentario';

        },


        error: (
          error: HttpErrorResponse
        ) => {

          console.error(
            'Error enviando comentario:',
            error
          );


          if (error.status === 0) {

            this.mensajeComentarioError =
              'No se pudo conectar con el servidor.';

            return;

          }


          if (error.status === 400) {

            this.mensajeComentarioError =
              'El servidor rechazó el mensaje. Revisa los datos enviados.';

            return;

          }


          if (error.status === 401) {

            this.mensajeComentarioError =
              'Tu sesión ya no es válida. Inicia sesión nuevamente.';

            return;

          }


          if (error.status === 500) {

            this.mensajeComentarioError =
              'Ocurrió un error en el servidor al guardar el mensaje.';

            return;

          }


          this.mensajeComentarioError =
            'No fue posible enviar el mensaje. Inténtalo nuevamente.';

        }

      });

  }


  /* =========================================================
     LIMPIAR COMENTARIO
  ========================================================= */

  limpiarComentario(): void {

    if (this.enviandoComentario) {

      return;

    }


    this.comentario =
      '';


    this.mensajeComentarioError =
      '';


    this.mensajeComentarioExito =
      '';

  }


  /* =========================================================
     ACTUALIZAR
  ========================================================= */

  actualizarPerfil(): void {

    this.cargarPerfil();

  }


  /* =========================================================
     SKINS
  ========================================================= */

  irSkins(): void {

    void this.router.navigate(
      ['/skins']
    );

  }


  /* =========================================================
     VOLVER
  ========================================================= */

  volverMenu(): void {

    void this.router.navigate(
      ['/menu']
    );

  }

}