import { Component, Input } from '@angular/core';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, helpCircle, timeOutline } from 'ionicons/icons';

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'prompt';

const ESTADOS: Record<PermissionState, { text: string; color: string; icon: string }> = {
  granted: { text: 'Concedido', color: 'success', icon: 'checkmark-circle' },
  denied: { text: 'Denegado', color: 'danger', icon: 'close-circle' },
  prompt: { text: 'Pendiente', color: 'warning', icon: 'time-outline' },
  unknown: { text: 'Sin consultar', color: 'medium', icon: 'help-circle' }
};

@Component({
  selector: 'app-permission-badge',
  standalone: true,
  imports: [IonChip, IonIcon, IonLabel],
  templateUrl: './permission-badge.component.html',
  styleUrl: './permission-badge.component.scss'
})
export class PermissionBadgeComponent {
  @Input({ required: true }) state: PermissionState = 'unknown';
  @Input() label = 'Permiso';

  constructor() {
    addIcons({ checkmarkCircle, closeCircle, timeOutline, helpCircle });
  }

  get estado() {
    return ESTADOS[this.state];
  }
}
