import { NgModule } from '@angular/core';

import {
  RouterModule,
  Routes
} from '@angular/router';

import {
  VerificarCorreoPage
} from './verificar-correo.page';


const routes: Routes = [

  /* =========================================================
     RUTA INTERNA

     Cuando AppRouting carga:
     /verificar-correo

     este módulo mostrará VerificarCorreoPage.
  ========================================================= */

  {
    path: '',
    component: VerificarCorreoPage
  }

];


@NgModule({

  imports: [

    RouterModule.forChild(
      routes
    )

  ],

  exports: [

    RouterModule

  ]

})
export class VerificarCorreoPageRoutingModule {}