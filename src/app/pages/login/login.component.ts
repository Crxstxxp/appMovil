import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
  IonText,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { notifications } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner, IonText, IonIcon],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly nav = inject(NavController);

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor() {
    addIcons({ notifications });
  }

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        // navigateRoot: el login no queda en el historial (el botón atrás no vuelve aquí).
        this.nav.navigateRoot('/home');
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
