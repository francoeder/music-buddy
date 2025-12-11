import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="flex flex-col justify-center items-center min-h-screen p-4">
      <img
        src="assets/images/music-buddy-avatar.png"
        alt="Music Buddy Avatar"
        class="mx-auto mb-6 w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain"
      />
      <mat-card class="w-full max-w-md p-6">
        <h2 class="text-xl font-semibold mb-4">{{ 'login.title' | translate }}</h2>
        <button mat-raised-button color="primary" class="w-full" (click)="onLogin()">
          <span class="w-full flex items-center justify-center gap-2">
            <img src="assets/icons/google.svg" alt="Google" class="w-5 h-5" />
            <span>{{ 'login.google' | translate }}</span>
          </span>
        </button>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  async onLogin() {
    await this.auth.loginWithGoogle();
    await this.router.navigateByUrl('/home');
  }
}
