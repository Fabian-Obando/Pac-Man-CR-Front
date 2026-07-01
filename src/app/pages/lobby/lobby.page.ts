import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.page.html',
  styleUrls: ['./lobby.page.scss'],
  standalone: false
})
export class LobbyPage implements OnInit {

  codigoSala = 'PAC-2048';
  jugadoresListos = 2;
  maxJugadores = 4;
  soyCreador = true;

  jugadores = [
    { nombre: 'Fabián', rol: 'Pac-Man', estado: 'Listo', color: 'yellow' },
    { nombre: 'Steven', rol: 'Fantasma', estado: 'Listo', color: 'cyan' },
    { nombre: 'Esperando...', rol: 'Vacío', estado: 'Pendiente', color: 'gray' },
    { nombre: 'Esperando...', rol: 'Vacío', estado: 'Pendiente', color: 'gray' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  invitarAmigo() {
    alert('Aquí luego abriremos la lista de amigos.');
  }

  elegirPersonaje() {
    this.router.navigate(['/seleccion-rol']);
  }

  iniciarPartida() {
    this.router.navigate(['/juego']);
  }

  salir() {
    this.router.navigate(['/salas']);
  }
}