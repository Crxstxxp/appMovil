import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '../config/api.config';

interface Persona {
  id: number;
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  email: string;
}

/** Registro tal como lo devuelve GET /api/SNEDJ/notificaciones. */
export interface Notificacion {
  id: number;
  folio: string;
  numero_expediente: string;
  titulo: string;
  contenido: string;
  status: number;
  plazo: string | null;
  origen: string;
  created_at: string;
  autor: Persona | null;
  consejo: { id: number; nombre: string; siglas: string } | null;
  notificados: (Persona & { status: number })[];
}

/** Etiquetas de `status`, las mismas que usa el panel web. */
export const ESTATUS_NOTIFICACION: Record<number, string> = {
  1: 'Borrador',
  2: 'En revisión secretaría',
  3: 'Aceptado secretaría',
  4: 'Rechazado DJ',
  5: 'En revisión DJ',
  7: 'Enviando',
  8: 'Finalizado',
  9: 'Rechazado secretaría'
};

export function nombreCompleto(p: Persona | null): string {
  if (!p) return '-';
  return [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ') || '-';
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Notificacion[]> {
    return this.http
      .get<{ data: Notificacion[] }>(`${API_URL}/api/SNEDJ/notificaciones`, {
        headers: { Accept: 'application/json, text/plain, */*' }
      })
      .pipe(map((res) => res.data ?? []));
  }
}
