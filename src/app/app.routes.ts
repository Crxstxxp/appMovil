import { Routes } from '@angular/router';
import { MODULOS } from './config/api.config';
import { authGuard } from './guards/auth.guard';
import { moduloGuard } from './guards/modulo.guard';

const detalleBuzon = () =>
  import('./pages/buzon/detalle/detalle.component').then((m) => m.DetalleComponent);

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/tabs/tabs.component').then((m) => m.TabsComponent),
    canActivate: [authGuard, moduloGuard(MODULOS.SNEDJ)],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'plugins',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/plugins/plugins.component').then((m) => m.PluginsComponent)
          },
          {
            path: 'camara',
            loadComponent: () =>
              import('./pages/plugins/camera-demo/camera-demo.component').then(
                (m) => m.CameraDemoComponent
              )
          },
          {
            path: 'geolocalizacion',
            loadComponent: () =>
              import('./pages/plugins/geolocation-demo/geolocation-demo.component').then(
                (m) => m.GeolocationDemoComponent
              )
          },
          {
            path: 'qr',
            loadComponent: () =>
              import('./pages/plugins/qr-demo/qr-demo.component').then((m) => m.QrDemoComponent)
          },
          {
            path: 'dispositivo',
            loadComponent: () =>
              import('./pages/plugins/device-demo/device-demo.component').then(
                (m) => m.DeviceDemoComponent
              )
          }
        ]
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'home' }
    ]
  },
  {
    // Buzón electrónico: sólo con una sesión iniciada en ese módulo.
    path: 'buzon',
    loadComponent: () =>
      import('./pages/buzon/tabs/buzon-tabs.component').then((m) => m.BuzonTabsComponent),
    canActivate: [authGuard, moduloGuard(MODULOS.BUZON)],
    children: [
      {
        path: 'inicio',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/buzon/inicio/inicio.component').then((m) => m.InicioComponent)
          },
          // El detalle se repite en cada pestaña para que "atrás" vuelva a la de origen.
          { path: 'notificacion/:id', loadComponent: detalleBuzon }
        ]
      },
      {
        path: 'historial',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/buzon/historial/historial.component').then(
                (m) => m.HistorialComponent
              )
          },
          { path: ':id', loadComponent: detalleBuzon }
        ]
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
