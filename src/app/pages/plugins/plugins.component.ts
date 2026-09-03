import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PluginEntry {
  path: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-plugins',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './plugins.component.html',
  styleUrl: './plugins.component.scss'
})
export class PluginsComponent {
  readonly entries: PluginEntry[] = [
    {
      path: 'camara',
      icon: '📷',
      title: 'Cámara',
      description: 'Tomar una foto, recortarla y guardarla en un listado'
    },
    {
      path: 'geolocalizacion',
      icon: '📍',
      title: 'Geolocalización',
      description: 'Ubicación actual y seguimiento en vivo'
    },
    {
      path: 'qr',
      icon: '🔳',
      title: 'Escáner QR',
      description: 'Leer códigos QR y de barras con la cámara'
    },
    {
      path: 'dispositivo',
      icon: '📶',
      title: 'Dispositivo y red',
      description: 'Info del equipo, batería y estado de conexión'
    }
  ];
}
