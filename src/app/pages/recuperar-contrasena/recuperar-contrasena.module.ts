/* =========================================================
   PAC-MAN CR
   MÓDULO - RECUPERAR CONTRASEÑA
========================================================= */

import {
  NgModule
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  IonicModule
} from '@ionic/angular';

import {
  RecuperarContrasenaPageRoutingModule
} from './recuperar-contrasena-routing.module';

import {
  RecuperarContrasenaPage
} from './recuperar-contrasena.page';


@NgModule({

  /* =========================================================
     COMPONENTES
  ========================================================= */

  declarations: [

    RecuperarContrasenaPage

  ],


  /* =========================================================
     MÓDULOS
  ========================================================= */

  imports: [

    /*
     * Necesario para:
     *
     * *ngIf
     * *ngFor
     * pipes comunes
     */
    CommonModule,


    /*
     * Necesario para:
     *
     * [(ngModel)]
     */
    FormsModule,


    /*
     * Necesario para:
     *
     * ion-content
     * ion-item
     * ion-input
     * ion-button
     * ion-icon
     * ion-spinner
     */
    IonicModule,


    /*
     * IMPORTANTE:
     *
     * Hace que:
     *
     * /recuperar-contrasena
     *
     * muestre:
     *
     * RecuperarContrasenaPage
     */
    RecuperarContrasenaPageRoutingModule

  ]

})
export class RecuperarContrasenaPageModule {}