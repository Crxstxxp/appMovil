import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { BatteryInfo, Device, DeviceId, DeviceInfo } from '@capacitor/device';
import { ConnectionStatus, Network } from '@capacitor/network';
import { DemoHeaderComponent } from '../../../shared/demo-header/demo-header.component';

@Component({
  selector: 'app-device-demo',
  standalone: true,
  imports: [DemoHeaderComponent, DecimalPipe],
  templateUrl: './device-demo.component.html',
  styleUrl: './device-demo.component.scss'
})
export class DeviceDemoComponent implements OnInit, OnDestroy {
  deviceInfo: DeviceInfo | null = null;
  deviceId: DeviceId | null = null;
  batteryInfo: BatteryInfo | null = null;
  networkStatus: ConnectionStatus | null = null;

  private networkListener: PluginListenerHandle | null = null;

  async ngOnInit(): Promise<void> {
    const [info, id, battery, network] = await Promise.all([
      Device.getInfo(),
      Device.getId(),
      Device.getBatteryInfo(),
      Network.getStatus()
    ]);

    this.deviceInfo = info;
    this.deviceId = id;
    this.batteryInfo = battery;
    this.networkStatus = network;

    this.networkListener = await Network.addListener('networkStatusChange', (status) => {
      this.networkStatus = status;
    });
  }

  ngOnDestroy(): void {
    this.networkListener?.remove();
  }
}
