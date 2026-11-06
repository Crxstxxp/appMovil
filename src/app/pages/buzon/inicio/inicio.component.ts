import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeCircle,
  cloudOfflineOutline,
  fileTrayOutline,
  paperPlane,
  time
} from 'ionicons/icons';
import {
  BuzonService,
  PuntoGrafica,
  TableroInicio,
  TipoCardInicio
} from '../../../services/buzon.service';
import { NotificacionItemComponent } from '../notificacion-item/notificacion-item.component';

/** Título, color e icono de cada tarjeta: los mismos del panel web. */
const TARJETAS: Record<TipoCardInicio, { titulo: string; color: string; icono: string }> = {
  enviadas: { titulo: 'Enviadas', color: '#2563EB', icono: 'paper-plane' },
  entregadas: { titulo: 'Entregadas', color: '#16A34A', icono: 'checkmark-circle' },
  pendientes: { titulo: 'Pendientes', color: '#F59E0B', icono: 'time' },
  no_enviadas: { titulo: 'No enviadas', color: '#DC2626', icono: 'close-circle' }
};

type Periodo = '7' | '30';

@Component({
  selector: 'app-buzon-inicio',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonIcon,
    IonText,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonButton,
    NotificacionItemComponent
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent implements OnInit {
  private readonly buzon = inject(BuzonService);

  readonly tablero = signal<TableroInicio | null>(null);
  readonly cargando = signal(true);
  readonly errorMessage = signal('');
  periodo = signal<Periodo>('7');

  readonly tarjetas = computed(() =>
    (this.tablero()?.cards ?? [])
      .filter((card) => TARJETAS[card.tipo])
      .map((card) => ({ ...card, ...TARJETAS[card.tipo] }))
  );

  /** Puntos de la gráfica en el periodo elegido, con su altura relativa al máximo. */
  readonly barras = computed(() => {
    const puntos = recortarPeriodo(this.tablero()?.grafica ?? [], Number(this.periodo()));
    const maximo = Math.max(1, ...puntos.map((p) => p.total));

    return puntos.map((p) => ({
      ...p,
      altura: (p.total / maximo) * 100,
      etiqueta: parsearFecha(p.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    }));
  });

  readonly totalPeriodo = computed(() => this.barras().reduce((suma, p) => suma + p.total, 0));

  constructor() {
    addIcons({ paperPlane, checkmarkCircle, time, closeCircle, cloudOfflineOutline, fileTrayOutline });
  }

  ngOnInit(): void {
    this.cargar();
  }

  refrescar(event: RefresherCustomEvent): void {
    this.cargar(() => event.target.complete());
  }

  cargar(done?: () => void): void {
    this.errorMessage.set('');

    this.buzon.inicio().subscribe({
      next: (tablero) => {
        this.tablero.set(tablero);
        this.cargando.set(false);
        done?.();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorMessage.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : (err.error?.message ?? 'No se pudo cargar el tablero')
        );
        done?.();
      }
    });
  }
}

/** La gráfica llega como "YYYY-MM-DD"; `new Date()` la tomaría en UTC y correría un día. */
function parsearFecha(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function claveDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * El backend sólo manda los días que tuvieron envíos, de todo el historial.
 * Aquí se arman los `dias` consecutivos que terminan hoy, con cero en los vacíos.
 */
function recortarPeriodo(puntos: PuntoGrafica[], dias: number): PuntoGrafica[] {
  const totales = new Map(puntos.map((p) => [p.fecha.slice(0, 10), p.total]));
  const hoy = new Date();

  return Array.from({ length: dias }, (_, i) => {
    const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (dias - 1 - i));
    const fecha = claveDia(dia);
    return { fecha, total: totales.get(fecha) ?? 0 };
  });
}
