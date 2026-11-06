import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  InfiniteScrollCustomEvent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, fileTrayOutline } from 'ionicons/icons';
import { BuzonService, ResumenNotificacion } from '../../../services/buzon.service';
import { NotificacionItemComponent } from '../notificacion-item/notificacion-item.component';

@Component({
  selector: 'app-buzon-historial',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSearchbar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonIcon,
    IonText,
    IonSkeletonText,
    NotificacionItemComponent
  ],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.scss'
})
export class HistorialComponent implements OnInit {
  private readonly buzon = inject(BuzonService);

  readonly notificaciones = signal<ResumenNotificacion[]>([]);
  readonly cargando = signal(true);
  readonly errorMessage = signal('');
  readonly hayMas = signal(false);

  private pagina = 1;
  private busqueda = '';

  constructor() {
    addIcons({ cloudOfflineOutline, fileTrayOutline });
  }

  ngOnInit(): void {
    this.reiniciar();
  }

  /** El searchbar ya trae debounce: cada cambio vuelve a la primera página. */
  buscar(event: CustomEvent<{ value?: string | null }>): void {
    this.busqueda = event.detail.value ?? '';
    this.cargando.set(true);
    this.reiniciar();
  }

  refrescar(event: RefresherCustomEvent): void {
    this.reiniciar(() => event.target.complete());
  }

  siguientePagina(event: InfiniteScrollCustomEvent): void {
    this.cargarPagina(this.pagina + 1, () => event.target.complete());
  }

  private reiniciar(done?: () => void): void {
    this.cargarPagina(1, done);
  }

  private cargarPagina(pagina: number, done?: () => void): void {
    this.errorMessage.set('');
    const busqueda = this.busqueda;

    this.buzon.historial(pagina, busqueda).subscribe({
      next: ({ items, hayMas }) => {
        // Si se escribió otra búsqueda mientras tanto, esta respuesta ya no vale.
        if (busqueda !== this.busqueda) return done?.();

        this.pagina = pagina;
        this.notificaciones.update((actuales) => (pagina === 1 ? items : [...actuales, ...items]));
        this.hayMas.set(hayMas);
        this.cargando.set(false);
        done?.();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorMessage.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : (err.error?.message ?? 'No se pudo cargar el historial')
        );
        done?.();
      }
    });
  }
}
