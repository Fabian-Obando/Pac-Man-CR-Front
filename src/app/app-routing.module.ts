import { NgModule } from '@angular/core';

import {
  PreloadAllModules,
  RouterModule,
  Routes
} from '@angular/router';


const routes: Routes = [


  /* =========================================================
     RUTA INICIAL
  ========================================================= */

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },


  /* =========================================================
     HOME
  ========================================================= */

  {
    path: 'home',

    loadChildren: () =>
      import('./home/home.module')
        .then(
          m => m.HomePageModule
        )
  },


  /* =========================================================
     AUTENTICACIÓN
  ========================================================= */

  {
    path: 'login',

    loadChildren: () =>
      import('./pages/login/login.module')
        .then(
          m => m.LoginPageModule
        )
  },


  {
    path: 'registro',

    loadChildren: () =>
      import('./pages/registro/registro.module')
        .then(
          m => m.RegistroPageModule
        )
  },


  /* =========================================================
     RECUPERAR CONTRASEÑA
  ========================================================= */

  {
    path: 'recuperar-contrasena',

    loadChildren: () =>
      import(
        './pages/recuperar-contrasena/recuperar-contrasena.module'
      )
        .then(
          m => m.RecuperarContrasenaPageModule
        )
  },


  /* =========================================================
     RESTABLECER CONTRASEÑA
  ========================================================= */

  {
    path: 'restablecer-contrasena',

    loadChildren: () =>
      import(
        './pages/restablecer-contrasena/restablecer-contrasena.module'
      )
        .then(
          m => m.RestablecerContrasenaPageModule
        )
  },


  /* =========================================================
     VERIFICAR CORREO

     Esta ruta carga el módulo de verificación.

     Dentro de verificar-correo.module.ts se importa:

     VerificarCorreoPageRoutingModule

     Y ese routing interno contiene:

     path: ''
     component: VerificarCorreoPage
  ========================================================= */

  {
    path: 'verificar-correo',

    loadChildren: () =>
      import(
        './pages/verificar-correo/verificar-correo.module'
      )
        .then(
          m => m.VerificarCorreoPageModule
        )
  },


  /* =========================================================
     MENÚ PRINCIPAL
  ========================================================= */

  {
    path: 'menu',

    loadChildren: () =>
      import('./pages/menu/menu.module')
        .then(
          m => m.MenuPageModule
        )
  },


  /* =========================================================
     SALAS
  ========================================================= */

  {
    path: 'salas',

    loadChildren: () =>
      import('./pages/salas/salas.module')
        .then(
          m => m.SalasPageModule
        )
  },


  /* =========================================================
     LOBBY
  ========================================================= */

  {
    path: 'lobby',

    loadChildren: () =>
      import('./pages/lobby/lobby.module')
        .then(
          m => m.LobbyPageModule
        )
  },


  /* =========================================================
     SELECCIÓN DE ROL
  ========================================================= */

  {
    path: 'seleccion-rol',

    loadChildren: () =>
      import(
        './pages/seleccion-rol/seleccion-rol.module'
      )
        .then(
          m => m.SeleccionRolPageModule
        )
  },


  /* =========================================================
     JUEGO
  ========================================================= */

  {
    path: 'juego',

    loadChildren: () =>
      import('./pages/juego/juego.module')
        .then(
          m => m.JuegoPageModule
        )
  },


  /* =========================================================
     AMIGOS
  ========================================================= */

  {
    path: 'amigos',

    loadChildren: () =>
      import('./pages/amigos/amigos.module')
        .then(
          m => m.AmigosPageModule
        )
  },


  /* =========================================================
     SKINS
  ========================================================= */

  {
    path: 'skins',

    loadChildren: () =>
      import('./pages/skins/skins.module')
        .then(
          m => m.SkinsPageModule
        )
  },


  /* =========================================================
     RANKING
  ========================================================= */

  {
    path: 'ranking',

    loadChildren: () =>
      import('./pages/ranking/ranking.module')
        .then(
          m => m.RankingPageModule
        )
  },


  /* =========================================================
     ADMINISTRACIÓN

     IMPORTANTE:

     El Login administrativo navega a:

     /administrador

     Por eso esta ruta debe llamarse exactamente:

     administrador
  ========================================================= */

  {
    path: 'administrador',

    loadChildren: () =>
      import('./pages/admin/admin.module')
        .then(
          m => m.AdminPageModule
        )
  },


  /* =========================================================
     COMPATIBILIDAD CON /admin

     Si en alguna parte vieja del proyecto todavía
     existe una navegación hacia /admin,
     automáticamente la enviamos a /administrador.
  ========================================================= */

  {
    path: 'admin',

    redirectTo: 'administrador',
    pathMatch: 'full'
  },


  /* =========================================================
     CONFIGURACIÓN
  ========================================================= */

  {
    path: 'configuracion',

    loadChildren: () =>
      import(
        './pages/configuracion/configuracion.module'
      )
        .then(
          m => m.ConfiguracionPageModule
        )
  },


  /* =========================================================
     LISTA DE ESPERA
  ========================================================= */

  {
    path: 'lista-espera',

    loadChildren: () =>
      import(
        './pages/lista-espera/lista-espera.module'
      )
        .then(
          m => m.ListaEsperaPageModule
        )
  },


  /* =========================================================
     PERFIL
  ========================================================= */

  {
    path: 'perfil',

    loadChildren: () =>
      import('./pages/perfil/perfil.module')
        .then(
          m => m.PerfilPageModule
        )
  },


  /* =========================================================
     RUTA NO ENCONTRADA

     Si alguien escribe una URL que no existe,
     lo enviamos al login.
  ========================================================= */

  {
    path: '**',
    redirectTo: 'login'
  }

];


@NgModule({

  imports: [

    RouterModule.forRoot(
      routes,
      {
        preloadingStrategy:
          PreloadAllModules
      }
    )

  ],


  exports: [

    RouterModule

  ]

})
export class AppRoutingModule {}