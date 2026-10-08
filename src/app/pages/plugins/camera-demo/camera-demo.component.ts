import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { PermissionBadgeComponent, PermissionState } from '../../../shared/permission-badge/permission-badge.component';
import { PhotosService } from '../../../services/photos.service';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonRange,
  IonText,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, close, crop, imagesOutline } from 'ionicons/icons';

/** Tamaño (en px CSS) del marco cuadrado de recorte. */
const FRAME_SIZE = 260;
/** Resolución de salida del recorte final. */
const OUTPUT_SIZE = 512;

@Component({
  selector: 'app-camera-demo',
  standalone: true,
  imports: [PermissionBadgeComponent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonButton, IonIcon, IonRange, IonText, IonCard, IonCardContent],
  templateUrl: './camera-demo.component.html',
  styleUrl: './camera-demo.component.scss'
})
export class CameraDemoComponent implements OnInit {
  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly frameSize = FRAME_SIZE;
  permissionState: PermissionState = 'unknown';
  errorMessage = '';

  capturedImage: HTMLImageElement | null = null;
  capturedSrc: string | null = null;
  baseScale = 1;
  zoom = 1;
  pan = { left: 0, top: 0 };

  private dragging = false;
  private dragStart = { x: 0, y: 0, left: 0, top: 0 };

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

  onPointerDown(event: PointerEvent): void {
    if (!this.capturedImage) {
      return;
    }
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging = true;
    this.dragStart = { x: event.clientX, y: event.clientY, left: this.pan.left, top: this.pan.top };
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging || !this.capturedImage) {
      return;
    }
    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;
    this.pan = this.clampPan(this.dragStart.left + deltaX, this.dragStart.top + deltaY);
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  onZoomChange(value: string | number): void {
    this.zoom = Number(value);
    this.pan = this.clampPan(this.pan.left, this.pan.top);
  }

  cancelCrop(): void {
    this.capturedImage = null;
    this.capturedSrc = null;
  }

  async confirmCrop(): Promise<void> {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.capturedImage) {
      return;
    }

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const ratio = OUTPUT_SIZE / FRAME_SIZE;
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.save();
    ctx.scale(ratio, ratio);
    ctx.translate(this.pan.left, this.pan.top);
    ctx.scale(this.baseScale * this.zoom, this.baseScale * this.zoom);
    ctx.drawImage(this.capturedImage, 0, 0);
    ctx.restore();

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
        this.capturedImage = img;
        this.capturedSrc = dataUrl;
        this.baseScale = Math.max(FRAME_SIZE / img.naturalWidth, FRAME_SIZE / img.naturalHeight);
        this.zoom = 1;
        this.pan = this.clampPan(
          (FRAME_SIZE - img.naturalWidth * this.baseScale) / 2,
          (FRAME_SIZE - img.naturalHeight * this.baseScale) / 2
        );
        resolve();
      };
      img.onerror = () => reject(new Error('No se pudo cargar la foto capturada'));
      img.src = dataUrl;
    });
  }

  private clampPan(left: number, top: number): { left: number; top: number } {
    if (!this.capturedImage) {
      return { left, top };
    }
    const scale = this.baseScale * this.zoom;
    const dispW = this.capturedImage.naturalWidth * scale;
    const dispH = this.capturedImage.naturalHeight * scale;
    const minLeft = Math.min(0, FRAME_SIZE - dispW);
    const minTop = Math.min(0, FRAME_SIZE - dispH);
    return {
      left: Math.min(0, Math.max(minLeft, left)),
      top: Math.min(0, Math.max(minTop, top))
    };
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
