import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../core/services/auth.service';
import { Training } from '../../models/training.model';
import { ConfirmDialogComponent } from '../dialog/confirm-dialog.component';
import { TopRecentTrainingsComponent } from './top-recent-trainings.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, TopRecentTrainingsComponent, TranslateModule],
  template: `
    <div class="p-6">
      <app-top-recent-trainings></app-top-recent-trainings>
      <div class="mt-6 px-6 flex flex-wrap items-center gap-3 sm:gap-2 justify-center sm:justify-start">
        <button mat-raised-button color="primary" class="flex items-center gap-2" (click)="goToTrainings()">
          <mat-icon>library_music</mat-icon>
          {{ 'home.viewAllTrainings' | translate }}
        </button>
        <button mat-stroked-button class="flex items-center gap-2" (click)="create()">
          <mat-icon>add</mat-icon>
          {{ 'home.createNewTraining' | translate }}
        </button>
      </div>
    </div>
  `
  ,
  styles: [
    `.fab-create{position:fixed;right:1.5rem;bottom:1.5rem;z-index:1000;}`
  ]
})
export class HomeComponent {
  private svc = inject(TrainingService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  trainings = computed(() => this.svc.getAll()());
  goToTrainings() {
    this.router.navigate(['/trainings']);
  }

  create() {
    const id = crypto.randomUUID();
    this.router.navigate(['/training', id]);
  }

  remove(t: Training) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Training',
        message: `Are you sure you want to delete "${t.title}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      },
      width: '360px'
    });
    ref.afterClosed().subscribe(result => {
      if (result === true) this.svc.delete(t._id);
    });
  }

}
