import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, person, timeOutline } from 'ionicons/icons';

/** Pestañas del Buzón electrónico. La clase `tema-buzon` aplica su paleta a todo el módulo. */
@Component({
  selector: 'app-buzon-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './buzon-tabs.component.html',
  host: { class: 'tema-buzon' }
})
export class BuzonTabsComponent {
  constructor() {
    addIcons({ home, timeOutline, person });
  }
}
