import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Camera } from '@capacitor/camera';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, close, crop, imagesOutline } from 'ionicons/icons';
import { PermissionBadgeComponent, PermissionState } from '../../../shared/permission-badge/permission-badge.component';
import { PhotosService } from '../../../services/photos.service';

/** Tamaño mínimo (px en pantalla) del recorte, para que las esquinas no se crucen. */
const MIN_SIZE = 48;
/** Lado más largo (px) de la imagen recortada que se guarda. */
const MAX_OUTPUT = 1280;

/** Qué se está arrastrando: una de las 4 esquinas o el recorte entero. */
type DragTarget = 'tl' | 'tr' | 'bl' | 'br' | 'move';

/** Recorte en px de pantalla, relativo a la foto mostrada. */
interface CropRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

@Component({
  selector: 'app-camera-demo',
  standalone: true,
  imports: [
    PermissionBadgeComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonText,
    IonCard,
    IonCardContent
  ],
  templateUrl: './camera-demo.component.html',
  styleUrl: './camera-demo.component.scss'
})
export class CameraDemoComponent implements OnInit {
  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('stageEl') private stageRef?: ElementRef<HTMLElement>;

  readonly corners: DragTarget[] = ['tl', 'tr', 'bl', 'br'];

  permissionState: PermissionState = 'unknown';
  errorMessage = '';

  capturedImage: HTMLImageElement | null = null;
  capturedSrc: string | null = null;
  /** Tamaño con el que se pinta la foto en pantalla. */
  stage = { width: 0, height: 0 };
  /** px de pantalla por px de la foto original. */
  private displayScale = 1;
  rect: CropRect = { left: 0, top: 0, right: 0, bottom: 0 };

  private dragTarget: DragTarget | null = null;
  private dragStart = { x: 0, y: 0, rect: this.rect };

  constructor(readonly photosService: PhotosService) {
    addIcons({ camera, close, crop, imagesOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.photosService.ensureLoaded();
    const status = await Camera.checkPermissions();
    this.permissionState = this.mapState(status.camera);
  }

  async requestPermission(): Promise<PermissionState> {
    const status = await Camera.requestPermissions({ permissions: ['camera'] });
    this.permissionState = this.mapState(status.camera);
    return this.permissionState;
  }

  async takePhoto(): Promise<void> {
    this.errorMessage = '';

    let state = this.permissionState;
    if (state !== 'granted') {
      state = await this.requestPermission();
      if (state !== 'granted') {
        this.errorMessage = 'Necesitas conceder el permiso de cámara para continuar.';
        return;
      }
    }

    try {
      const dataUrl = await this.photosService.takePhoto();
      await this.loadForCrop(dataUrl);
    } catch (error) {
      // El usuario canceló la captura u ocurrió un error del plugin.
      this.errorMessage = this.extractMessage(error);
    }
  }

  // --- Arrastre de esquinas -------------------------------------------------

  startDrag(event: PointerEvent, target: DragTarget): void {
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragTarget = target;
    this.dragStart = { x: event.clientX, y: event.clientY, rect: { ...this.rect } };
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragTarget || !this.stageRef) {
      return;
    }

    const { width: W, height: H } = this.stage;
    const start = this.dragStart.rect;

    if (this.dragTarget === 'move') {
      const w = start.right - start.left;
      const h = start.bottom - start.top;
      const left = clamp(start.left + event.clientX - this.dragStart.x, 0, W - w);
      const top = clamp(start.top + event.clientY - this.dragStart.y, 0, H - h);
      this.rect = { left, top, right: left + w, bottom: top + h };
      return;
    }

    // Posición del dedo dentro de la foto mostrada.
    const bounds = this.stageRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const r = { ...this.rect };

    if (this.dragTarget === 'tl' || this.dragTarget === 'bl') {
      r.left = clamp(x, 0, r.right - MIN_SIZE);
    } else {
      r.right = clamp(x, r.left + MIN_SIZE, W);
    }
    if (this.dragTarget === 'tl' || this.dragTarget === 'tr') {
      r.top = clamp(y, 0, r.bottom - MIN_SIZE);
    } else {
      r.bottom = clamp(y, r.top + MIN_SIZE, H);
    }
    this.rect = r;
  }

  onPointerUp(): void {
    this.dragTarget = null;
  }

  /** Posición (px) de cada esquina para pintar su punto. */
  cornerPos(corner: DragTarget): { x: number; y: number } {
    return {
      x: corner === 'tl' || corner === 'bl' ? this.rect.left : this.rect.right,
      y: corner === 'tl' || corner === 'tr' ? this.rect.top : this.rect.bottom
    };
  }

  // --- Guardar ---------------------------------------------------------------

  cancelCrop(): void {
    this.capturedImage = null;
    this.capturedSrc = null;
  }

  async confirmCrop(): Promise<void> {
    const canvas = this.canvasRef?.nativeElement;
    const img = this.capturedImage;
    if (!canvas || !img) {
      return;
    }

    // Recorte en px de la foto original.
    const sx = this.rect.left / this.displayScale;
    const sy = this.rect.top / this.displayScale;
    const sw = (this.rect.right - this.rect.left) / this.displayScale;
    const sh = (this.rect.bottom - this.rect.top) / this.displayScale;

    const outScale = Math.min(1, MAX_OUTPUT / Math.max(sw, sh));
    canvas.width = Math.round(sw * outScale);
    canvas.height = Math.round(sh * outScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    await this.photosService.saveCroppedPhoto(dataUrl);
    this.cancelCrop();
  }

  async deletePhoto(id: string): Promise<void> {
    await this.photosService.deletePhoto(id);
  }

  private loadForCrop(dataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // La foto entera tiene que caber: ancho de la tarjeta y algo más de media pantalla de alto.
        const maxW = Math.min(window.innerWidth - 64, 480);
        const maxH = window.innerHeight * 0.55;
        this.displayScale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
        this.stage = {
          width: Math.round(img.naturalWidth * this.displayScale),
          height: Math.round(img.naturalHeight * this.displayScale)
        };

        // Recorte inicial: la foto con un margen del 10% por lado.
        const mx = this.stage.width * 0.1;
        const my = this.stage.height * 0.1;
        this.rect = { left: mx, top: my, right: this.stage.width - mx, bottom: this.stage.height - my };

        this.capturedImage = img;
        this.capturedSrc = dataUrl;
        resolve();
      };
      img.onerror = () => reject(new Error('No se pudo cargar la foto capturada'));
      img.src = dataUrl;
    });
  }

  private mapState(state: string): PermissionState {
    if (state === 'granted') return 'granted';
    if (state === 'denied') return 'denied';
    if (state === 'prompt' || state === 'prompt-with-rationale') return 'prompt';
    return 'unknown';
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return 'No se pudo tomar la foto.';
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
