import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AmigosPage } from './amigos.page';

import {
  AmigosPageRoutingModule
} from './amigos-routing.module';


@NgModule({

  declarations: [
    AmigosPage
  ],

  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AmigosPageRoutingModule
  ]

})
export class AmigosPageModule {}