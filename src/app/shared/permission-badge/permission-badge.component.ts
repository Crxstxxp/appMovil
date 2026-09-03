import { Component, Input } from '@angular/core';

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'prompt';

@Component({
  selector: 'app-permission-badge',
  standalone: true,
  templateUrl: './permission-badge.component.html',
  styleUrl: './permission-badge.component.scss'
})
export class PermissionBadgeComponent {
  @Input({ required: true }) state: PermissionState = 'unknown';
  @Input() label = 'Permiso';

  get text(): string {
    switch (this.state) {
      case 'granted':
        return 'Concedido';
      case 'denied':
        return 'Denegado';
      case 'prompt':
        return 'Pendiente';
      default:
        return 'Sin consultar';
    }
  }
}
