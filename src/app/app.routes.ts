import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/tabs/tabs.component').then((m) => m.TabsComponent),
    canActivate: [authGuard],
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
  { path: '**', redirectTo: 'login' }
];
