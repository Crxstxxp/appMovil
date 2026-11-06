import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mail, notifications } from 'ionicons/icons';
import { MODULOS, Modulo } from '../../config/api.config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);

  readonly MODULOS = MODULOS;

  modulo: Modulo = MODULOS.SNEDJ;
  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor() {
    addIcons({ notifications, mail });
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.email.trim(), this.password, this.modulo).subscribe({
      next: () => {
        this.loading = false;
        // navigateRoot: el login no queda en el historial (el botón atrás no vuelve aquí).
        this.nav.navigateRoot(this.auth.rutaInicio());
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage =
          err.status === 0
            ? 'No se pudo conectar con el servidor'
            : (err.error?.message ?? 'Correo o contraseña incorrectos');
      }
    });
  }
}
