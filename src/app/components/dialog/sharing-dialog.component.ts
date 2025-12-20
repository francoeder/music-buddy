import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TrainingService } from '../../services/training.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Training } from '../../models/training.model';

@Component({
  selector: 'app-sharing-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    TranslateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ 'dialogs.sharing.title' | translate }}</h2>
    <mat-dialog-content>
      <div class="mb-4">
        <p class="text-sm text-gray-500 mb-2">{{ 'dialogs.sharing.instruction' | translate }}</p>
        <div class="flex gap-2 items-start w-full" [formGroup]="form">
          <mat-form-field appearance="fill" class="flex-1" subscriptSizing="dynamic">
            <mat-label>{{ 'dialogs.sharing.emailLabel' | translate }}</mat-label>
            <input matInput type="email" formControlName="email" (keyup.enter)="add()">
            <mat-error *ngIf="form.get('email')?.hasError('email')">{{ 'dialogs.sharing.invalidEmail' | translate }}</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('pattern')">{{ 'dialogs.sharing.gmailRequired' | translate }}</mat-error>
          </mat-form-field>
          <button mat-flat-button color="primary" class="!h-[56px] shrink-0" [disabled]="form.invalid || processing()" (click)="add()">
            <mat-icon>add</mat-icon> {{ 'dialogs.sharing.add' | translate }}
          </button>
        </div>
      </div>

      <div class="mb-4">
        <h3 class="text-md font-medium mb-2">{{ 'dialogs.sharing.whoHasAccess' | translate }}</h3>
        <mat-list>
          <mat-list-item *ngFor="let email of sharedWith()">
            <span matListItemTitle>{{ email }}</span>
            <button mat-icon-button matListItemMeta (click)="remove(email)" [disabled]="processing()">
              <mat-icon color="warn">delete</mat-icon>
            </button>
          </mat-list-item>
          <mat-list-item *ngIf="sharedWith().length === 0">
            <span class="text-gray-400 italic">{{ 'dialogs.sharing.notShared' | translate }}</span>
          </mat-list-item>
        </mat-list>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-200">
        <button mat-stroked-button class="w-full" (click)="copyLink()">
          <mat-icon>link</mat-icon> {{ 'dialogs.sharing.copyLink' | translate }}
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.close' | translate }}</button>
    </mat-dialog-actions>
  `
})
export class SharingDialogComponent {
  private fb = inject(FormBuilder);
  private svc = inject(TrainingService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private data = inject<Training>(MAT_DIALOG_DATA);
  
  // Reactively track the training
  training = computed(() => this.svc.getById(this.data._id));
  sharedWith = computed(() => this.training()?.sharedWith ?? []);
  
  processing = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)]]
  });

  async add() {
    if (this.form.invalid) return;
    const email = this.form.getRawValue().email?.toLowerCase();
    if (!email) return;
    
    if (this.sharedWith().includes(email)) {
      this.form.reset();
      return;
    }

    this.processing.set(true);
    try {
      await this.svc.shareWithEmail(this.data._id, email);
      this.form.reset();
      this.snack.open(
        this.translate.instant('dialogs.sharing.accessGranted'), 
        this.translate.instant('pwa.ok'), 
        { duration: 3000 }
      );
    } catch (err) {
      console.error(err);
      this.snack.open(
        this.translate.instant('dialogs.sharing.errorSharing'), 
        this.translate.instant('pwa.ok'), 
        { duration: 3000 }
      );
    } finally {
      this.processing.set(false);
    }
  }

  async remove(email: string) {
    if (!confirm(this.translate.instant('dialogs.sharing.revokeConfirm', { email }))) return;
    
    this.processing.set(true);
    try {
      await this.svc.revokeAccess(this.data._id, email);
      this.snack.open(
        this.translate.instant('dialogs.sharing.accessRevoked'), 
        this.translate.instant('pwa.ok'), 
        { duration: 3000 }
      );
    } catch (err) {
      console.error(err);
      this.snack.open(
        this.translate.instant('dialogs.sharing.errorRevoking'), 
        this.translate.instant('pwa.ok'), 
        { duration: 3000 }
      );
    } finally {
      this.processing.set(false);
    }
  }

  copyLink() {
    const url = `${window.location.origin}/trainings?shared=${this.data._id}`;
    navigator.clipboard.writeText(url);
    this.snack.open(
      this.translate.instant('dialogs.sharing.linkCopied'), 
      this.translate.instant('pwa.ok'), 
      { duration: 3000 }
    );
  }
}
