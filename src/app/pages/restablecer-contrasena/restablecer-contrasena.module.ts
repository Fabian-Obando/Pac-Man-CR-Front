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
  RestablecerContrasenaPageRoutingModule
} from './restablecer-contrasena-routing.module';

import {
  RestablecerContrasenaPage
} from './restablecer-contrasena.page';


@NgModule({

  /* =======================================================
     COMPONENTES DEL MÓDULO
  ======================================================== */

  declarations: [

    RestablecerContrasenaPage

  ],


  /* =======================================================
     MÓDULOS NECESARIOS
  ======================================================== */

  imports: [

    /*
     * Necesario para directivas de Angular como:
     *
     * *ngIf
     * *ngFor
     */
    CommonModule,


    /*
     * Necesario para utilizar:
     *
     * [(ngModel)]
     *
     * en los campos de contraseña.
     */
    FormsModule,


    /*
     * Componentes visuales de Ionic:
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
     * MUY IMPORTANTE:
     *
     * Conecta la ruta:
     *
     * /restablecer-contrasena
     *
     * con:
     *
     * RestablecerContrasenaPage
     */
    RestablecerContrasenaPageRoutingModule

  ]

})
export class RestablecerContrasenaPageModule {}