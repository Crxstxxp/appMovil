import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, location, phonePortrait, qrCode } from 'ionicons/icons';

interface PluginEntry {
  path: string;
  icon: string;
  color: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-plugins',
  standalone: true,
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel],
  templateUrl: './plugins.component.html',
  styleUrl: './plugins.component.scss'
})
export class PluginsComponent {
  readonly entries: PluginEntry[] = [
    {
      path: 'camara',
      icon: 'camera',
      color: 'primary',
      title: 'Cámara',
      description: 'Tomar una foto, recortarla y guardarla en un listado'
    },
    {
      path: 'geolocalizacion',
      icon: 'location',
      color: 'danger',
      title: 'Geolocalización',
      description: 'Ubicación actual y seguimiento en vivo'
    },
    {
      path: 'qr',
      icon: 'qr-code',
      color: 'success',
      title: 'Escáner QR',
      description: 'Leer códigos QR y de barras con la cámara'
    },
    {
      path: 'dispositivo',
      icon: 'phone-portrait',
      color: 'tertiary',
      title: 'Dispositivo y red',
      description: 'Info del equipo, batería y estado de conexión'
    }
  ];

  constructor() {
    addIcons({ camera, location, qrCode, phonePortrait });
  }
}
