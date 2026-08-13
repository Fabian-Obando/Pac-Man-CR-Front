import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { RankingPage } from './ranking.page';

import {
  RankingPageRoutingModule
} from './ranking-routing.module';


@NgModule({

  declarations: [
    RankingPage
  ],

  imports: [
    CommonModule,
    IonicModule,
    RankingPageRoutingModule
  ]

})
export class RankingPageModule {}