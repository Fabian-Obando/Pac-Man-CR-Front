import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeleccionRolPageRoutingModule } from './seleccion-rol-routing.module';

import { SeleccionRolPage } from './seleccion-rol.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SeleccionRolPageRoutingModule
  ],
  declarations: [SeleccionRolPage]
})
export class SeleccionRolPageModule {}
