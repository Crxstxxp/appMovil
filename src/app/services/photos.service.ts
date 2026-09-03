import { Injectable, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export interface StoredPhoto {
  id: string;
  fileName: string;
  dataUrl: string;
}

const INDEX_KEY = 'plugins.photos.index';
const PHOTOS_DIR = 'plugins-photos';

/**
 * Encapsula el ciclo completo de la demo de cámara:
 * - Capturar una foto con @capacitor/camera.
 * - Persistir el recorte final en disco con @capacitor/filesystem.
 * - Guardar el índice de fotos con @capacitor/preferences para listarlas
 *   entre reinicios de la app.
 */
@Injectable({ providedIn: 'root' })
export class PhotosService {
  readonly photos = signal<StoredPhoto[]>([]);
  private loaded = false;

  /** Abre la cámara nativa y devuelve la foto sin recortar como data URL. */
  async takePhoto(): Promise<string> {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      quality: 85,
      allowEditing: false
    });

    return `data:image/jpeg;base64,${photo.base64String}`;
  }

  /** Carga el listado guardado en disco la primera vez que se necesita. */
  async ensureLoaded(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const { value } = await Preferences.get({ key: INDEX_KEY });
    const index: { id: string; fileName: string }[] = value ? JSON.parse(value) : [];
    const photos: StoredPhoto[] = [];

    for (const entry of index) {
      try {
        const file = await Filesystem.readFile({
          path: `${PHOTOS_DIR}/${entry.fileName}`,
          directory: Directory.Data
        });
        const base64 = typeof file.data === 'string' ? file.data : await this.blobToBase64(file.data);
        photos.push({ id: entry.id, fileName: entry.fileName, dataUrl: `data:image/jpeg;base64,${base64}` });
      } catch {
        // El archivo ya no existe o está corrupto: se omite del listado.
      }
    }

    this.photos.set(photos);
    this.loaded = true;
  }

  /** Guarda el recorte final (data URL) en disco y lo agrega al listado. */
  async saveCroppedPhoto(dataUrl: string): Promise<void> {
    const id = Date.now().toString();
    const fileName = `${id}.jpg`;
    const base64Data = dataUrl.split(',')[1] ?? '';

    await Filesystem.writeFile({
      path: `${PHOTOS_DIR}/${fileName}`,
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    });

    this.photos.update((current) => [...current, { id, fileName, dataUrl }]);
    await this.persistIndex();
  }

  async deletePhoto(id: string): Promise<void> {
    const photo = this.photos().find((item) => item.id === id);
    if (!photo) {
      return;
    }

    await Filesystem.deleteFile({
      path: `${PHOTOS_DIR}/${photo.fileName}`,
      directory: Directory.Data
    }).catch(() => undefined);

    this.photos.update((current) => current.filter((item) => item.id !== id));
    await this.persistIndex();
  }

  private async persistIndex(): Promise<void> {
    const index = this.photos().map(({ id, fileName }) => ({ id, fileName }));
    await Preferences.set({ key: INDEX_KEY, value: JSON.stringify(index) });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '');
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
