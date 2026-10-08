import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonBadge,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, fileTrayOutline } from 'ionicons/icons';
import {
  ESTATUS_NOTIFICACION,
  Notificacion,
  NotificacionesService,
  nombreCompleto
} from '../../services/notificaciones.service';

/** Color de Ionic para la etiqueta de cada `status`. */
const COLOR_ESTATUS: Record<number, string> = {
  2: 'warning',
  3: 'success',
  4: 'danger',
  5: 'warning',
  7: 'tertiary',
  8: 'success',
  9: 'danger'
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonBadge,
    IonIcon,
    IonText,
    IonSkeletonText
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly notificacionesService = inject(NotificacionesService);

  readonly notificaciones = signal<Notificacion[]>([]);
  /** Solo la primera carga muestra el esqueleto; el refresh usa el spinner del refresher. */
  readonly cargando = signal(true);
  readonly errorMessage = signal('');

  readonly nombreCompleto = nombreCompleto;

  constructor() {
    addIcons({ cloudOfflineOutline, fileTrayOutline });
  }

  ngOnInit(): void {
    this.cargar();
  }

  /** Lo dispara el gesto de jalar hacia abajo (ion-refresher). */
  refrescar(event: RefresherCustomEvent): void {
    this.cargar(() => event.target.complete());
  }

  cargar(done?: () => void): void {
    this.errorMessage.set('');

    this.notificacionesService.listar().subscribe({
      next: (data) => {
        this.notificaciones.set(data);
        this.cargando.set(false);
        done?.();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorMessage.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : (err.error?.message ?? 'No se pudieron cargar las notificaciones')
        );
        done?.();
      }
    });
  }

  estatus(status: number): string {
    return ESTATUS_NOTIFICACION[status] ?? 'Borrador';
  }

  colorEstatus(status: number): string {
    return COLOR_ESTATUS[status] ?? 'medium';
  }
}
