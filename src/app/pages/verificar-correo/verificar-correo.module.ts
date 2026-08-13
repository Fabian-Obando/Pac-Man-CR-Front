import { NgModule } from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  IonicModule
} from '@ionic/angular';

import {
  VerificarCorreoPageRoutingModule
} from './verificar-correo-routing.module';

import {
  VerificarCorreoPage
} from './verificar-correo.page';


@NgModule({

  declarations: [

    VerificarCorreoPage

  ],

  imports: [

    /*
     * Necesario para:
     * *ngIf
     * *ngFor
     */
    CommonModule,


    /*
     * Componentes Ionic:
     * ion-content
     * ion-button
     * ion-icon
     * ion-spinner
     */
    IonicModule,


    /*
     * IMPORTANTE:
     *
     * Define qué página debe mostrarse
     * cuando Angular carga este módulo.
     */
    VerificarCorreoPageRoutingModule

  ]

})
export class VerificarCorreoPageModule {}