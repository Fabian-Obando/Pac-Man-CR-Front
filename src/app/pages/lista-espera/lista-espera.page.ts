import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: false
})
export class ListaEsperaPage implements OnInit {

  codigoSala = 'PAC-2048';

  posicion = 2;

  personasDelante = 1;

  tiempo = 42;

  jugadores = 4;

  capacidad = 4;

  listo = false;

  intervalo!: any;

  constructor() {}

  ngOnInit() {

    this.intervalo = setInterval(() => {

      if (this.listo) {
        return;
      }

      if (this.tiempo > 0) {
        this.tiempo--;
      }

      if (this.tiempo === 25) {
        this.personasDelante = 0;
      }

      if (this.tiempo === 12) {
        this.posicion = 1;
      }

      if (this.tiempo === 0) {
        this.listo = true;
      }

    },1000);

  }

  entrarSala(){

    alert('Entrando a la partida...');

  }

  salirCola(){

    alert('Has salido de la lista de espera.');

  }

  get tiempoTexto(){

    const min = Math.floor(this.tiempo/60);

    const seg = this.tiempo%60;

    return `${min}:${seg.toString().padStart(2,'0')}`;

  }

}