import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon, IonItem, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { ResumenNotificacion, formatearFechaCorta } from '../../../services/buzon.service';

/** Fila de una notificación en "recientes" y en el historial. */
@Component({
  selector: 'app-notificacion-item',
  standalone: true,
  imports: [RouterLink, IonItem, IonLabel, IonIcon],
  templateUrl: './notificacion-item.component.html',
  styleUrl: './notificacion-item.component.scss'
})
export class NotificacionItemComponent {
  readonly notificacion = input.required<ResumenNotificacion>();
  /** Ruta del detalle; cada pestaña tiene la suya para que "atrás" vuelva a ella. */
  readonly enlace = input.required<string>();

  readonly formatearFechaCorta = formatearFechaCorta;

  constructor() {
    addIcons({ peopleOutline });
  }
}
