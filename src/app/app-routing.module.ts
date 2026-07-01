import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then(m => m.RegistroPageModule)
  },
  {
    path: 'menu',
    loadChildren: () => import('./pages/menu/menu.module').then(m => m.MenuPageModule)
  },
  {
    path: 'salas',
    loadChildren: () => import('./pages/salas/salas.module').then(m => m.SalasPageModule)
  },
  {
    path: 'lobby',
    loadChildren: () => import('./pages/lobby/lobby.module').then(m => m.LobbyPageModule)
  },
  {
    path: 'seleccion-rol',
    loadChildren: () => import('./pages/seleccion-rol/seleccion-rol.module').then(m => m.SeleccionRolPageModule)
  },
  {
    path: 'juego',
    loadChildren: () => import('./pages/juego/juego.module').then(m => m.JuegoPageModule)
  },
  {
    path: 'amigos',
    loadChildren: () => import('./pages/amigos/amigos.module').then(m => m.AmigosPageModule)
  },
  {
    path: 'skins',
    loadChildren: () => import('./pages/skins/skins.module').then(m => m.SkinsPageModule)
  },
  {
    path: 'ranking',
    loadChildren: () => import('./pages/ranking/ranking.module').then(m => m.RankingPageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminPageModule)
  },
  {
    path: 'configuracion',
    loadChildren: () => import('./pages/configuracion/configuracion.module').then(m => m.ConfiguracionPageModule)
  },
  {
    path: 'lista-espera',
    loadChildren: () => import('./pages/lista-espera/lista-espera.module').then( m => m.ListaEsperaPageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then( m => m.PerfilPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }