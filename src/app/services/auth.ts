import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface RegistroRequest {
  nombreUsuario: string;
  correo: string;
  contrasena: string;
  fotoPerfil?: string | null;
}

export interface UsuarioSesion {
  usuarioId: number;
  nombreUsuario: string;
  correo: string;
  fotoPerfil?: string |null;
  nivel: number;
  oroActual: number;
  estadoCuenta: string;
  fechaRegistro: string;
  ultimoAcceso?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private readonly apiUrl = `${environment.apiUrl}/Auth`;

  private readonly sessionKey = 'pacman_usuario';

  constructor(private http: HttpClient) { }

  login(request: LoginRequest): Observable<UsuarioSesion> {
    return this.http.post<UsuarioSesion>(
      `${this.apiUrl}/Login`,
      request
    );
  }

  registro(request: RegistroRequest): Observable<UsuarioSesion> {
    return this.http.post<UsuarioSesion>(
      `${this.apiUrl}/Registro`,
      request
    );
  }

  guardarSesion(usuario: UsuarioSesion): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(usuario));
  }

  obtenerSesion(): UsuarioSesion | null {

    const datos = localStorage.getItem(this.sessionKey);

    if (!datos) {
      return null;
    }

    try {
      return JSON.parse(datos) as UsuarioSesion;
    } catch {

      this.cerrarSesion();

      return null;
    }
  }

  estaAutenticado(): boolean {
    return this.obtenerSesion() !== null;
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sessionKey);
  }

}