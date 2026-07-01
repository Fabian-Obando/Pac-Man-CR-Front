import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SkinsPageRoutingModule } from './skins-routing.module';

import { SkinsPage } from './skins.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SkinsPageRoutingModule
  ],
  declarations: [SkinsPage]
})
export class SkinsPageModule {}
