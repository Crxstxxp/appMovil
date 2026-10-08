import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import {
  ESTATUS_NOTIFICACION,
  Notificacion,
  NotificacionesService,
  nombreCompleto
} from '../../services/notificaciones.service';

/** Distancia (px) que hay que jalar para que se dispare el refresh. */
const PULL_THRESHOLD = 70;
const PULL_MAX = 110;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  /** Desplazamiento actual del gesto de jalar, en px. */
  readonly pull = signal(0);

  readonly nombreCompleto = nombreCompleto;
  readonly PULL_THRESHOLD = PULL_THRESHOLD;

  private touchStartY: number | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');

    this.notificacionesService.listar().subscribe({
      next: (data) => {
        this.notificaciones.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : (err.error?.message ?? 'No se pudieron cargar las notificaciones')
        );
      }
    });
  }

  estatus(status: number): string {
    return ESTATUS_NOTIFICACION[status] ?? 'Borrador';
  }

  // --- Jalar para refrescar -------------------------------------------------
  // El host es el contenedor con scroll: el gesto solo cuenta si empieza
  // con la lista arriba del todo.

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    this.touchStartY = this.host.scrollTop <= 0 && !this.loading() ? e.touches[0].clientY : null;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e: TouchEvent): void {
    if (this.touchStartY === null) return;
    const dy = e.touches[0].clientY - this.touchStartY;
    if (dy <= 0) {
      this.pull.set(0);
      return;
    }
    // Evita que el WebView haga su propio scroll/rebote mientras se jala.
    if (e.cancelable) e.preventDefault();
    this.pull.set(Math.min(dy * 0.5, PULL_MAX));
  }

  @HostListener('touchend')
  @HostListener('touchcancel')
  onTouchEnd(): void {
    if (this.touchStartY === null) return;
    this.touchStartY = null;
    if (this.pull() >= PULL_THRESHOLD) this.cargar();
    this.pull.set(0);
  }
}
