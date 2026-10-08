import { Component, computed, inject } from '@angular/core';
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, mailOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { nombreCompleto } from '../../services/notificaciones.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonAvatar,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss'
})
export class PerfilComponent {
  readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);

  readonly nombre = computed(() => nombreCompleto(this.auth.user()));
  readonly iniciales = computed(() =>
    this.nombre()
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('')
  );

  constructor() {
    addIcons({ mailOutline, shieldCheckmarkOutline, logOutOutline });
  }

  logout(): void {
    this.auth.logout();
    this.nav.navigateRoot('/login');
  }
}
