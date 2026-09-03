import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { DemoHeaderComponent } from '../../../shared/demo-header/demo-header.component';
import { PermissionBadgeComponent, PermissionState } from '../../../shared/permission-badge/permission-badge.component';

@Component({
  selector: 'app-geolocation-demo',
  standalone: true,
  imports: [DemoHeaderComponent, PermissionBadgeComponent, DatePipe, DecimalPipe],
  templateUrl: './geolocation-demo.component.html',
  styleUrl: './geolocation-demo.component.scss'
})
export class GeolocationDemoComponent implements OnInit, OnDestroy {
  permissionState: PermissionState = 'unknown';
  errorMessage = '';
  loading = false;
  position: Position | null = null;
  watching = false;

  private watchId: string | null = null;

  async ngOnInit(): Promise<void> {
    const status = await Geolocation.checkPermissions();
    this.permissionState = this.mapState(status.location);
  }

  async ngOnDestroy(): Promise<void> {
    await this.stopWatch();
  }

  async requestPermission(): Promise<PermissionState> {
    const status = await Geolocation.requestPermissions({ permissions: ['location'] });
    this.permissionState = this.mapState(status.location);
    return this.permissionState;
  }

  async getCurrentPosition(): Promise<void> {
    this.errorMessage = '';

    let state = this.permissionState;
    if (state !== 'granted') {
      state = await this.requestPermission();
      if (state !== 'granted') {
        this.errorMessage = 'Necesitas conceder el permiso de ubicación para continuar.';
        return;
      }
    }

    this.loading = true;
    try {
      this.position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudo obtener la ubicación.';
    } finally {
      this.loading = false;
    }
  }

  async toggleWatch(): Promise<void> {
    if (this.watching) {
      await this.stopWatch();
      return;
    }

    let state = this.permissionState;
    if (state !== 'granted') {
      state = await this.requestPermission();
      if (state !== 'granted') {
        this.errorMessage = 'Necesitas conceder el permiso de ubicación para continuar.';
        return;
      }
    }

    this.errorMessage = '';
    this.watching = true;
    this.watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (position, error) => {
      if (error) {
        this.errorMessage = error.message;
        return;
      }
      this.position = position;
    });
  }

  private async stopWatch(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
    this.watching = false;
  }

  private mapState(state: string): PermissionState {
    if (state === 'granted') return 'granted';
    if (state === 'denied') return 'denied';
    if (state === 'prompt' || state === 'prompt-with-rationale') return 'prompt';
    return 'unknown';
  }
}
