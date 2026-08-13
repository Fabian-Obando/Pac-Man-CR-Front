/* =========================================================
   PAC-MAN CR
   ROUTING - RECUPERAR CONTRASEÑA
========================================================= */

import {
  NgModule
} from '@angular/core';

import {
  RouterModule,
  Routes
} from '@angular/router';

import {
  RecuperarContrasenaPage
} from './recuperar-contrasena.page';


/* =========================================================
   RUTAS INTERNAS DEL MÓDULO

   AppRouting carga:

   /recuperar-contrasena

   Y este archivo indica que debe mostrar:

   RecuperarContrasenaPage
========================================================= */

const routes: Routes = [

  {
    path: '',
    component: RecuperarContrasenaPage
  }

];


@NgModule({

  imports: [

    /*
     * Registra las rutas internas de este
     * módulo lazy-loaded.
     */
    RouterModule.forChild(
      routes
    )

  ],

  exports: [

    /*
     * Permite que el módulo principal
     * utilice estas rutas.
     */
    RouterModule

  ]

})
export class RecuperarContrasenaPageRoutingModule {}