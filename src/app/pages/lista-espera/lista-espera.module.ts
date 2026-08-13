import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { ListaEsperaPage } from './lista-espera.page';

import {
  ListaEsperaPageRoutingModule
} from './lista-espera-routing.module';


@NgModule({

  declarations: [
    ListaEsperaPage
  ],

  imports: [
    CommonModule,
    IonicModule,
    ListaEsperaPageRoutingModule
  ]

})
export class ListaEsperaPageModule {}