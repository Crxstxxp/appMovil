import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  closeCircle,
  cloudDownloadOutline,
  cloudOfflineOutline,
  documentAttachOutline,
  documentTextOutline,
  removeOutline,
  sendOutline
} from 'ionicons/icons';
import {
  BuzonService,
  DetalleNotificacion,
  Destinatario,
  Documento,
  EstadoDestinatario,
  esEstadoConError,
  formatearFecha
} from '../../../services/buzon.service';

type Filtro = 'todos' | 'accedidos' | 'entregados' | 'pendientes' | 'error';

const FILTROS: { valor: Filtro; etiqueta: string; aplica: (d: Destinatario) => boolean }[] = [
  { valor: 'todos', etiqueta: 'Todos', aplica: () => true },
  { valor: 'accedidos', etiqueta: 'Accedidos', aplica: (d) => d.status === EstadoDestinatario.ACCEDIDO },
  {
    valor: 'entregados',
    etiqueta: 'Entregados',
    aplica: (d) => d.status === EstadoDestinatario.ENVIADO || d.status === EstadoDestinatario.ENTREGADO
  },
  { valor: 'pendientes', etiqueta: 'Pendientes', aplica: (d) => d.status === EstadoDestinatario.PENDIENTE },
  { valor: 'error', etiqueta: 'Con error', aplica: (d) => esEstadoConError(d.status) }
];

/** Color de Ionic para la etiqueta del estado de cada destinatario. */
const COLOR_ESTADO: Record<number, string> = {
  [EstadoDestinatario.PENDIENTE]: 'medium',
  [EstadoDestinatario.ENVIADO]: 'secondary',
  [EstadoDestinatario.ENTREGADO]: 'success',
  [EstadoDestinatario.ACCEDIDO]: 'primary'
};

@Component({
  selector: 'app-buzon-detalle',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonIcon,
    IonText,
    IonSpinner,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss'
})
export class DetalleComponent implements OnInit {
  private readonly buzon = inject(BuzonService);
  private readonly toast = inject(ToastController);
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  /** Se llega desde Inicio o desde Historial; "atrás" vuelve a la pestaña de origen. */
  readonly volverA = inject(Router).url.startsWith('/buzon/inicio') ? '/buzon/inicio' : '/buzon/historial';

  readonly detalle = signal<DetalleNotificacion | null>(null);
  readonly cargando = signal(true);
  readonly errorMessage = signal('');
  readonly descargandoId = signal<number | null>(null);
  readonly filtro = signal<Filtro>('todos');

  readonly filtros = computed(() => {
    const destinatarios = this.detalle()?.destinatarios ?? [];
    return FILTROS.map((f) => ({ ...f, total: destinatarios.filter(f.aplica).length }));
  });

  readonly destinatariosFiltrados = computed(() => {
    const filtro = FILTROS.find((f) => f.valor === this.filtro())!;
    return (this.detalle()?.destinatarios ?? []).filter(filtro.aplica);
  });

  readonly formatearFecha = formatearFecha;

  constructor() {
    addIcons({
      checkmarkCircle,
      closeCircle,
      removeOutline,
      cloudDownloadOutline,
      cloudOfflineOutline,
      documentTextOutline,
      documentAttachOutline,
      sendOutline
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  refrescar(event: RefresherCustomEvent): void {
    this.cargar(() => event.target.complete());
  }

  cargar(done?: () => void): void {
    this.errorMessage.set('');

    this.buzon.detalle(this.id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.cargando.set(false);
        done?.();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorMessage.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : err.status === 404
              ? 'La notificación no existe o no tienes acceso a ella'
              : (err.error?.message ?? 'No se pudo cargar la notificación')
        );
        done?.();
      }
    });
  }

  descargar(documento: Documento): void {
    if (this.descargandoId() !== null) return;
    this.descargandoId.set(documento.id);

    this.buzon.descargarDocumento(this.id, documento.id).subscribe({
      next: async (blob) => {
        try {
          await this.buzon.guardarArchivo(blob, documento.nombre);
          this.avisar(`Se guardó ${documento.nombre} en Documentos`, 'success');
        } catch {
          this.avisar('No se pudo guardar el documento', 'danger');
        } finally {
          this.descargandoId.set(null);
        }
      },
      error: () => {
        this.descargandoId.set(null);
        this.avisar('No se pudo obtener el documento. Inténtalo de nuevo.', 'danger');
      }
    });
  }

  colorEstado(status: number): string {
    return esEstadoConError(status) ? 'danger' : (COLOR_ESTADO[status] ?? 'medium');
  }

  private async avisar(message: string, color: string): Promise<void> {
    const toast = await this.toast.create({ message, color, duration: 2500, position: 'bottom' });
    await toast.present();
  }
}
