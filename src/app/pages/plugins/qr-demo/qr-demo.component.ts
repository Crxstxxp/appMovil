import { Component, OnInit } from '@angular/core';
import { BarcodeFormat, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { PermissionBadgeComponent, PermissionState } from '../../../shared/permission-badge/permission-badge.component';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonNote,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { qrCode, scanOutline } from 'ionicons/icons';

interface ScanEntry {
  value: string;
  format: string;
  scannedAt: number;
}

@Component({
  selector: 'app-qr-demo',
  standalone: true,
  imports: [PermissionBadgeComponent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonButton, IonIcon, IonList, IonListHeader, IonItem, IonLabel, IonNote, IonText],
  templateUrl: './qr-demo.component.html',
  styleUrl: './qr-demo.component.scss'
})
export class QrDemoComponent implements OnInit {
  constructor() {
    addIcons({ qrCode, scanOutline });
  }

  permissionState: PermissionState = 'unknown';
  errorMessage = '';
  scanning = false;
  history: ScanEntry[] = [];

  async ngOnInit(): Promise<void> {
    const status = await BarcodeScanner.checkPermissions();
    this.permissionState = this.mapState(status.camera);
  }

  async requestPermission(): Promise<PermissionState> {
    const status = await BarcodeScanner.requestPermissions();
    this.permissionState = this.mapState(status.camera);
    return this.permissionState;
  }

  async scan(): Promise<void> {
    this.errorMessage = '';

    let state = this.permissionState;
    if (state !== 'granted') {
      state = await this.requestPermission();
      if (state !== 'granted') {
        this.errorMessage = 'Necesitas conceder el permiso de cámara para continuar.';
        return;
      }
    }

    this.scanning = true;
    try {
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode]
      });
      const barcode = barcodes[0];
      if (barcode) {
        this.history = [
          { value: barcode.rawValue, format: barcode.format, scannedAt: Date.now() },
          ...this.history
        ];
      }
    } catch (error) {
      // El usuario canceló el escaneo o el módulo de Google no está disponible.
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo escanear el código.';
    } finally {
      this.scanning = false;
    }
  }

  private mapState(state: string): PermissionState {
    if (state === 'granted') return 'granted';
    if (state === 'denied') return 'denied';
    if (state === 'prompt' || state === 'prompt-with-rationale') return 'prompt';
    return 'unknown';
  }
}
