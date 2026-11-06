import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { API_URL } from '../config/api.config';
import { nombreCompleto } from './notificaciones.service';

const BUZON_URL = `${API_URL}/api/BuzonElectronicoPopjl`;
const HEADERS = { Accept: 'application/json, text/plain, */*' };

/**
 * Resultados por página del historial (el scroll infinito pide de a una).
 * Lomkit sólo acepta los valores de `limits()` del resource: 10, 25 o 50.
 */
const POR_PAGINA = 25;

/* ------------------------------------------------------------------ */
/* Catálogos (mismos valores que los enums del backend y del panel web) */
/* ------------------------------------------------------------------ */

export enum EstadoDestinatario {
  PENDIENTE = 1,
  ENVIADO = 2,
  ENTREGADO = 3,
  ACCEDIDO = 4,
  REBOTADO = 5,
  QUEJA = 6,
  FALLIDO = 7
}

export const ESTADO_DESTINATARIO_LABEL: Record<EstadoDestinatario, string> = {
  [EstadoDestinatario.PENDIENTE]: 'Pendiente',
  [EstadoDestinatario.ENVIADO]: 'Enviado',
  [EstadoDestinatario.ENTREGADO]: 'Entregado',
  [EstadoDestinatario.ACCEDIDO]: 'Accedido',
  [EstadoDestinatario.REBOTADO]: 'Rebotado',
  [EstadoDestinatario.QUEJA]: 'Queja',
  [EstadoDestinatario.FALLIDO]: 'Fallido'
};

const ESTADOS_CON_ERROR = new Set([
  EstadoDestinatario.REBOTADO,
  EstadoDestinatario.QUEJA,
  EstadoDestinatario.FALLIDO
]);

export function esEstadoConError(status: number): boolean {
  return ESTADOS_CON_ERROR.has(status);
}

/** Acciones de `eventos_acceso_buzon`: lo que abrió el destinatario. */
const ACCESO_CONSULTA = 1;
const ACCESO_DESCARGA = 3;

/** `eventos_entrega_buzon.event_type` de un reenvío. */
const EVENTO_REENVIO = 11;

const ESTATUS_ENVIANDO = 3;
const DOCUMENTO_OFICIAL = 1;

const TIPO_CAMPO_FECHA = 3;
const TIPO_CAMPO_IMAGEN = 4;
const TIPO_CAMPO_DOCUMENTO = 5;

/** El usuario técnico con el que el sistema emite avisos automáticos. */
const EMAIL_USUARIO_BUZON = 'buzon@mail.com';

/* ------------------------------------------------------------------ */
/* Respuestas de la API                                                */
/* ------------------------------------------------------------------ */

interface PersonaApi {
  id: number;
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  email: string;
}

export type TipoCardInicio = 'enviadas' | 'entregadas' | 'pendientes' | 'no_enviadas';

export interface CardInicio {
  tipo: TipoCardInicio;
  hoy: number;
  esta_semana: number;
}

export interface PuntoGrafica {
  fecha: string;
  total: number;
}

interface InicioApi {
  cards: CardInicio[];
  grafica: PuntoGrafica[];
  notificaciones_recientes: {
    id: number;
    folio?: string | null;
    tipo?: string | null;
    asunto?: string | null;
    descripcion?: string | null;
    fecha_creacion?: string | null;
    destinatarios?: number | null;
    enviado_por?: string | null;
  }[];
}

interface NotificacionSearchApi {
  id: number;
  folio?: string | null;
  titulo?: string | null;
  body_intro?: string | null;
  created_at: string;
  created_by?: number | null;
  destinatarios_count?: number | null;
  plantilla?: { tipo?: { nombre?: string | null } | null } | null;
}

interface SearchResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
}

interface DestinatarioApi {
  id: number;
  recipient_id: number;
  status: number;
  last_time_accessed_at?: string | null;
  accesos?: { action: number }[] | null;
  eventos_entrega?: { event_type: number }[] | null;
  user?: PersonaApi | null;
  perfil?: { activo: boolean | number; terminos_aceptados_at: string | null } | null;
}

interface DocumentoApi {
  id: number;
  role: number;
  nombre: string;
  size_documento: number;
}

interface NotificacionDetalleApi {
  id: number;
  folio?: string | null;
  titulo?: string | null;
  body_intro?: string | null;
  payload?: Record<string, unknown> | null;
  status: number;
  sent_at?: string | null;
  created_at: string;
  formulario?: { key: string; label: string; type: number }[] | null;
  plantilla?: { nombre?: string | null; tipo?: { nombre?: string | null } | null } | null;
  user?: PersonaApi | null;
  destinatarios?: DestinatarioApi[] | null;
  destinatarios_individuales?: DestinatarioApi[] | null;
  destinatarios_globales?: DestinatarioApi[] | null;
  listas?: { id: number; nombre?: string | null }[] | null;
  documentos?: DocumentoApi[] | null;
}

/* ------------------------------------------------------------------ */
/* Modelos que consumen las pantallas                                  */
/* ------------------------------------------------------------------ */

export interface TableroInicio {
  cards: CardInicio[];
  grafica: PuntoGrafica[];
  recientes: ResumenNotificacion[];
}

/** Una fila del historial o de "recientes" en el inicio. */
export interface ResumenNotificacion {
  id: number;
  folio: string | null;
  tipo: string;
  asunto: string;
  descripcion: string;
  fecha: string;
  enviadoPor: string | null;
  destinatarios: number;
}

export interface PaginaHistorial {
  items: ResumenNotificacion[];
  hayMas: boolean;
}

export interface Campo {
  etiqueta: string;
  valor: string | null;
}

export interface Documento {
  id: number;
  nombre: string;
  oficial: boolean;
  tamano: string;
}

export interface Destinatario {
  id: number;
  nombre: string;
  correo: string;
  status: number;
  estado: string;
  abrio: boolean;
  descargo: boolean;
  /** null: la persona aún no tiene perfil en el buzón. */
  aceptoTerminos: boolean | null;
  ultimoAcceso: string | null;
  reenvios: number;
  activo: boolean;
}

export interface DetalleNotificacion {
  id: number;
  folio: string | null;
  asunto: string | null;
  enviando: boolean;
  informacion: Campo[];
  campos: Campo[];
  documentos: Documento[];
  destinatarios: Destinatario[];
}

/* ------------------------------------------------------------------ */
/* Formato                                                             */
/* ------------------------------------------------------------------ */

/** Fecha en español, como el panel web: "29 de octubre de 2026, 10:30". */
export function formatearFecha(fecha: string | null | undefined, conHora = true): string {
  if (!fecha) return '—';

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return fecha;

  return valor.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {})
  });
}

export function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return '—';

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return fecha;

  return valor.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function nombreCreador(persona: PersonaApi | null | undefined): string | null {
  if (!persona) return null;
  if (persona.email.toLowerCase() === EMAIL_USUARIO_BUZON) return 'Buzón';
  return nombreCompleto(persona);
}

/* ------------------------------------------------------------------ */
/* Mapeos                                                              */
/* ------------------------------------------------------------------ */

function describirTipoEnvio(n: NotificacionDetalleApi): string | null {
  const globales = n.destinatarios_globales ?? [];
  if (globales.length > 0) {
    return `Aviso general (${globales.length} destinatarios)`;
  }

  const individuales = (n.destinatarios_individuales ?? []).length;
  const listas = (n.listas ?? []).length;
  const partes: string[] = [];

  if (listas > 0) partes.push(`${listas} ${listas === 1 ? 'grupo' : 'grupos'}`);
  if (individuales > 0) {
    partes.push(
      `${individuales} destinatario${individuales === 1 ? '' : 's'} individual${individuales === 1 ? '' : 'es'}`
    );
  }

  return partes.length > 0 ? partes.join(' y ') : null;
}

/**
 * Valores capturados al redactar. Las etiquetas salen de `notificacion.formulario`
 * (la copia congelada al emitir), nunca de la plantilla actual. Las plantillas
 * de campos libres no tienen formulario: las etiquetas viajan en el payload.
 */
function camposDe(n: NotificacionDetalleApi): Campo[] {
  const payload = n.payload ?? {};
  const libres = payload['campos'];

  if (Array.isArray(libres)) {
    return (libres as { label?: string; value?: string }[]).map((c) => ({
      etiqueta: c.label ?? '',
      valor: c.value ?? null
    }));
  }

  return (n.formulario ?? [])
    .filter((c) => c.type !== TIPO_CAMPO_IMAGEN && c.type !== TIPO_CAMPO_DOCUMENTO)
    .map((c) => {
      const crudo = payload[c.key];
      const valor = crudo == null ? null : String(crudo);
      return {
        etiqueta: c.label,
        valor: c.type === TIPO_CAMPO_FECHA && valor ? formatearFecha(valor, false) : valor
      };
    });
}

function mapearDestinatario(d: DestinatarioApi): Destinatario {
  const accesos = d.accesos ?? [];
  const persona = d.user;

  return {
    id: d.id,
    nombre: persona ? nombreCompleto(persona) : 'Sin información',
    correo: persona?.email ?? 'Sin información',
    status: d.status,
    estado: ESTADO_DESTINATARIO_LABEL[d.status as EstadoDestinatario] ?? '—',
    abrio: accesos.some((a) => a.action === ACCESO_CONSULTA),
    descargo: accesos.some((a) => a.action === ACCESO_DESCARGA),
    aceptoTerminos: d.perfil ? d.perfil.terminos_aceptados_at !== null : null,
    ultimoAcceso: d.last_time_accessed_at ?? null,
    reenvios: (d.eventos_entrega ?? []).filter((e) => e.event_type === EVENTO_REENVIO).length,
    activo: d.perfil ? Boolean(d.perfil.activo) : true
  };
}

function mapearDetalle(n: NotificacionDetalleApi): DetalleNotificacion {
  const destinatarios = n.destinatarios ?? [];

  return {
    id: n.id,
    folio: n.folio ?? null,
    asunto: n.titulo ?? null,
    enviando: n.status === ESTATUS_ENVIANDO,
    informacion: [
      { etiqueta: 'Folio', valor: n.folio ?? null },
      { etiqueta: 'Tipo de notificación', valor: n.plantilla?.tipo?.nombre ?? null },
      { etiqueta: 'Título / Asunto del correo', valor: n.titulo ?? null },
      { etiqueta: 'Descripción', valor: n.body_intro ?? null },
      { etiqueta: 'Plantilla utilizada', valor: n.plantilla?.nombre ?? null },
      { etiqueta: 'Fecha de envío / creación', valor: formatearFecha(n.sent_at ?? n.created_at) },
      { etiqueta: 'Enviado por', valor: nombreCreador(n.user) },
      { etiqueta: 'Destinatarios', valor: String(destinatarios.length) },
      { etiqueta: 'Tipo de envío', valor: describirTipoEnvio(n) }
    ],
    campos: camposDe(n),
    documentos: (n.documentos ?? [])
      .map((doc) => ({
        id: doc.id,
        nombre: doc.nombre,
        oficial: doc.role === DOCUMENTO_OFICIAL,
        tamano: formatearBytes(doc.size_documento)
      }))
      // El documento oficial va primero, como en el panel web.
      .sort((a, b) => Number(b.oficial) - Number(a.oficial)),
    destinatarios: destinatarios.map(mapearDestinatario)
  };
}

/* ------------------------------------------------------------------ */
/* Servicio                                                            */
/* ------------------------------------------------------------------ */

/** Consulta del Buzón electrónico: los mismos endpoints que usa el panel web. */
@Injectable({ providedIn: 'root' })
export class BuzonService {
  private readonly http = inject(HttpClient);

  /** Nombres de quien creó cada notificación; no cambian, así que se guardan. */
  private readonly creadores = new Map<number, string>();

  inicio(): Observable<TableroInicio> {
    return this.http.get<InicioApi>(`${BUZON_URL}/inicio`, { headers: HEADERS }).pipe(
      map((res) => ({
        cards: res.cards ?? [],
        grafica: res.grafica ?? [],
        recientes: (res.notificaciones_recientes ?? []).map((item) => ({
          id: item.id,
          folio: item.folio ?? null,
          tipo: item.tipo ?? '--',
          asunto: item.asunto ?? '--',
          descripcion: item.descripcion ?? '--',
          fecha: item.fecha_creacion ?? '',
          enviadoPor: item.enviado_por ?? null,
          destinatarios: item.destinatarios ?? 0
        }))
      }))
    );
  }

  /** Una página del historial, de la más reciente a la más antigua. */
  historial(pagina: number, busqueda = ''): Observable<PaginaHistorial> {
    const termino = busqueda.trim();
    const filtros = termino
      ? [
          {
            nested: [
              { field: 'titulo', operator: 'like', value: `%${termino}%` },
              { field: 'folio', operator: 'like', value: `%${termino}%`, type: 'or' }
            ]
          }
        ]
      : [];

    return this.http
      .post<SearchResponse<NotificacionSearchApi>>(
        `${BUZON_URL}/notificaciones/search`,
        {
          search: {
            ...(filtros.length ? { filters: filtros } : {}),
            includes: [{ relation: 'plantilla', includes: [{ relation: 'tipo' }] }],
            sorts: [{ field: 'created_at', direction: 'desc' }],
            limit: POR_PAGINA,
            page: pagina
          }
        },
        { headers: HEADERS }
      )
      .pipe(
        switchMap((res) => {
          const items = res.data ?? [];
          const ids = items.map((i) => i.created_by).filter((id): id is number => Boolean(id));

          return this.resolverCreadores(ids).pipe(
            map(() => ({
              hayMas: res.current_page < res.last_page,
              items: items.map((item) => ({
                id: item.id,
                folio: item.folio ?? null,
                tipo: item.plantilla?.tipo?.nombre ?? '--',
                asunto: item.titulo ?? '--',
                descripcion: item.body_intro ?? '--',
                fecha: item.created_at,
                enviadoPor: item.created_by ? (this.creadores.get(item.created_by) ?? null) : null,
                destinatarios: item.destinatarios_count ?? 0
              }))
            }))
          );
        })
      );
  }

  /** El `show` ya trae destinatarios, accesos, documentos y creador: una sola petición. */
  detalle(id: number): Observable<DetalleNotificacion> {
    return this.http
      .get<{ data: NotificacionDetalleApi }>(`${BUZON_URL}/notificaciones/${id}`, {
        headers: HEADERS
      })
      .pipe(map((res) => mapearDetalle(res.data)));
  }

  descargarDocumento(notificacionId: number, documentoId: number): Observable<Blob> {
    return this.http.get(
      `${BUZON_URL}/notificaciones/${notificacionId}/documentos/${documentoId}/descargar`,
      { responseType: 'blob' }
    );
  }

  /**
   * En el móvil guarda el archivo en Documentos; en el navegador lo descarga.
   * Devuelve dónde quedó, para avisarle al usuario.
   */
  async guardarArchivo(blob: Blob, nombre: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
      return nombre;
    }

    const { uri } = await Filesystem.writeFile({
      path: nombre,
      data: await blobABase64(blob),
      directory: Directory.Documents,
      recursive: true
    });
    return uri;
  }

  /**
   * El nombre de quien envió no viene en la búsqueda, sólo `created_by`. Si el
   * token no puede consultar usuarios se deja sin nombre en vez de fallar la lista.
   */
  private resolverCreadores(ids: number[]): Observable<void> {
    const faltantes = Array.from(new Set(ids)).filter((id) => !this.creadores.has(id));
    if (faltantes.length === 0) return of(undefined);

    return this.http
      .post<SearchResponse<PersonaApi>>(
        `${API_URL}/api/Core/usuarios/search`,
        { search: { filters: [{ field: 'id', operator: 'in', value: faltantes }], limit: 50 } },
        { headers: HEADERS }
      )
      .pipe(
        map((res) => {
          for (const persona of res.data ?? []) {
            this.creadores.set(persona.id, nombreCreador(persona) ?? '-');
          }
        }),
        catchError(() => of(undefined))
      );
  }
}

function blobABase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    // readAsDataURL da "data:<mime>;base64,<datos>": Filesystem sólo quiere los datos.
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.readAsDataURL(blob);
  });
}
