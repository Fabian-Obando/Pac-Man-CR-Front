import { NgModule } from '@angular/core';

import {
  RouterModule,
  Routes
} from '@angular/router';

import {
  RestablecerContrasenaPage
} from './restablecer-contrasena.page';


/* =========================================================
   RUTAS DEL MÓDULO
========================================================= */

const routes: Routes = [

  {
    /*
     * Esta ruta vacía representa la página principal
     * dentro del módulo lazy-loaded.
     *
     * La ruta completa será:
     *
     * /restablecer-contrasena
     *
     * Y también permitirá recibir:
     *
     * /restablecer-contrasena?token=XXXXX
     */
    path: '',

    component:
      RestablecerContrasenaPage
  }

];


@NgModule({

  imports: [

    /*
     * Registra las rutas internas de este módulo.
     */
    RouterModule.forChild(
      routes
    )

  ],

  exports: [

    /*
     * Exportamos RouterModule para que la navegación
     * esté disponible dentro del módulo.
     */
    RouterModule

  ]

})
export class RestablecerContrasenaPageRoutingModule {}