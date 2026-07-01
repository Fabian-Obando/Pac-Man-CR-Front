import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeleccionRolPage } from './seleccion-rol.page';

const routes: Routes = [
  {
    path: '',
    component: SeleccionRolPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SeleccionRolPageRoutingModule {}
