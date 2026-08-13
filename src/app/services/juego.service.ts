import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../environments/environment';


/* ============================================================
   JUGADOR DENTRO DE LA PARTIDA
============================================================ */

export interface JugadorJuego {

  participanteId: number;

  usuarioId: number | null;

  nombreUsuario: string;

  rolId: number;

  rol: string;

  equipo: string;

  esBot: boolean;


  /* =========================
     POSICIÓN
  ========================= */

  posicionX: number;

  posicionY: number;

  direccion: string;


  /* =========================
     SKIN EQUIPADA
  ========================= */

  skinId: number;

  nombreSkin: string;

  claseSkin: string;


  /* =========================
     ESTADÍSTICAS
  ========================= */

  puntos: number;

  oroGanado: number;

  frutasConsumidas: number;


  /* =========================
     VIDAS
  ========================= */

  vidas: number;

  vivo: boolean;

  puedeMoverse: boolean;

  estadoJugador: string;


  /* =========================
     POWER PELLET
  ========================= */

  powerActivo: boolean;

  segundosPower: number;


  /* =========================
     ESCUDO
  ========================= */

  escudoActivo: boolean;

  segundosEscudo: number;


  /* =========================
     DOBLE PUNTAJE
  ========================= */

  doblePuntajeActivo: boolean;

  segundosDoblePuntaje: number;


  /* =========================
     VELOCIDAD
  ========================= */

  velocidadExtraActiva: boolean;

  segundosVelocidad: number;


  /* =========================
     FUERZA
  ========================= */

  fuerzaActiva: boolean;

  segundosFuerza: number;


  /* =========================
     CONGELADO
  ========================= */

  congelado: boolean;

  segundosCongelado: number;


  /* =========================
     VISIÓN
  ========================= */

  visionActiva: boolean;

  segundosVision: number;


  /* =========================
     REAPARICIÓN
  ========================= */

  segundosReaparicion: number;
}


/* ============================================================
   ESTADO COMPLETO DEL JUEGO
============================================================ */

export interface Juego {

  partidaId: number;

  salaId: number;


  /* =========================
     MAPA
  ========================= */

  mapaId: number;

  nombreMapa: string;


  /* =========================
     DIFICULTAD
  ========================= */

  dificultadId: number;

  nombreDificultad: string;


  /* =========================
     PARTIDA
  ========================= */

  estadoPartida: string;

  duracionSegundos: number;

  tiempoRestante: number;

  partidaFinalizada: boolean;

  equipoGanador: string;

  mensajeFinal: string;


  /* =========================
     MARCADOR
  ========================= */

  puntosPacMan: number;

  puntosVillanos: number;

  oroPacMan: number;

  oroVillanos: number;


  /* =========================
     LABERINTO
  ========================= */

  monedasIniciales: number;

  monedasRestantes: number;

  mapa: string[];

  celdasConsumidas: string[];


  /* =========================
     PARTICIPANTES
  ========================= */

  jugadores: JugadorJuego[];
}


/* ============================================================
   PETICIÓN DE MOVIMIENTO
============================================================ */

export interface MovimientoJuegoRequest {

  partidaId: number;

  participanteId: number;

  usuarioId: number;

  direccion:
    | 'Arriba'
    | 'Abajo'
    | 'Izquierda'
    | 'Derecha';
}


/* ============================================================
   RESPUESTA DE MOVIMIENTO
============================================================ */

export interface MovimientoJuegoRespuesta {

  movimientoRealizado: boolean;

  mensaje: string;

  estado: Juego | null;
}


/* ============================================================
   RESPUESTA DE FINALIZACIÓN
============================================================ */

export interface FinalizarJuegoRespuesta {

  guardado: boolean;

  mensaje: string;

  estado: Juego | null;
}


/* ============================================================
   SERVICIO
============================================================ */

@Injectable({
  providedIn: 'root'
})
export class JuegoService {


  /* =========================================================
     URL DEL BACKEND

     Desarrollo actual:
     http://192.168.1.16:5148/api/Juego

     Cuando luego hagamos Android final, esta URL seguirá
     dependiendo de environment.ts.
  ========================================================= */

  private readonly apiUrl =
    `${environment.apiUrl}/Juego`;


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private readonly http: HttpClient
  ) {}


  /* =========================================================
     OBTENER PARTIDA COMPLETA

     GET:
     /api/Juego/{partidaId}
  ========================================================= */

  obtenerJuego(
    partidaId: number
  ): Observable<Juego> {

    return this.http.get<Juego>(
      `${this.apiUrl}/${partidaId}`
    );

  }


  /* =========================================================
     OBTENER ESTADO ACTUAL

     GET:
     /api/Juego/{partidaId}/Estado

     Este será el endpoint principal para sincronizar:
     - reloj
     - jugadores
     - bots
     - vidas
     - puntos
     - oro
     - frutas
     - ganador
  ========================================================= */

  obtenerEstado(
    partidaId: number
  ): Observable<Juego> {

    return this.http.get<Juego>(
      `${this.apiUrl}/${partidaId}/Estado`
    );

  }


  /* =========================================================
     MOVER JUGADOR

     POST:
     /api/Juego/Mover

     Cada llamada mueve una casilla.

     El movimiento continuo NO se hace aquí.
     Se hará desde juego.page.ts con un intervalo suave.
  ========================================================= */

  mover(
    request: MovimientoJuegoRequest
  ): Observable<MovimientoJuegoRespuesta> {

    return this.http.post<MovimientoJuegoRespuesta>(
      `${this.apiUrl}/Mover`,
      request
    );

  }


  /* =========================================================
     MÉTODO AUXILIAR DE MOVIMIENTO

     Nos deja llamar:

     moverJugador(
       partidaId,
       participanteId,
       usuarioId,
       'Derecha'
     )

     desde juego.page.ts.
  ========================================================= */

  moverJugador(
    partidaId: number,
    participanteId: number,
    usuarioId: number,
    direccion:
      | 'Arriba'
      | 'Abajo'
      | 'Izquierda'
      | 'Derecha'
  ): Observable<MovimientoJuegoRespuesta> {

    const request: MovimientoJuegoRequest = {

      partidaId:
        partidaId,

      participanteId:
        participanteId,

      usuarioId:
        usuarioId,

      direccion:
        direccion

    };


    return this.mover(
      request
    );

  }


  /* =========================================================
     FINALIZAR PARTIDA

     POST:
     /api/Juego/{partidaId}/Finalizar

     El Back:
     - guarda resultados
     - suma oro
     - actualiza estadísticas
     - actualiza ranking
  ========================================================= */

  finalizarPartida(
    partidaId: number
  ): Observable<FinalizarJuegoRespuesta> {

    return this.http.post<FinalizarJuegoRespuesta>(
      `${this.apiUrl}/${partidaId}/Finalizar`,
      {}
    );

  }

}