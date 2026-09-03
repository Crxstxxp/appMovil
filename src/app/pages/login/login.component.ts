import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Credenciales de demo, hardcodeadas en el propio componente.
  private readonly credentials = {
    username: 'criss',
    secret: 'secret'
  };

  username = '';
  secret = '';
  errorMessage = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    const isValid =
      this.username.trim() === this.credentials.username &&
      this.secret === this.credentials.secret;

    if (!isValid) {
      this.errorMessage = 'Usuario o contraseña incorrectos';
      return;
    }

    this.errorMessage = '';
    this.auth.login();
    this.router.navigateByUrl('/home');
  }
}
