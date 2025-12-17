import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Exercise } from '../../models/training.model';

@Component({
  selector: 'app-exercise-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, TranslateModule],
  template: `
    <div class="min-h-[300px] min-w-[750px]">
      <mat-dialog-content class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <h2 class="text-xl font-semibold">{{ 'dialogs.exercise.title' | translate }}</h2>
        <form [formGroup]="form" class="grid grid-cols-12 gap-3 items-start">
          <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-6">
            <mat-label>{{ 'common.title' | translate }}</mat-label>
            <input matInput formControlName="title" />
          </mat-form-field>

          <fieldset class="col-span-12 border border-indigo-300 rounded p-3">
            <legend class="px-2 text-sm font-medium text-indigo-700">{{ 'common.metronome' | translate }}</legend>
            <div class="grid grid-cols-12 gap-3">
              <mat-form-field appearance="fill" class="w-full col-span-6 md:col-span-4">
                <mat-label>{{ 'common.bpm' | translate }}</mat-label>
                <input matInput type="number" formControlName="bpm" />
              </mat-form-field>
              <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-4">
                <mat-label>{{ 'common.beatAccent' | translate }}</mat-label>
                <mat-select formControlName="beatStyle">
                  <mat-option value="none">{{ 'beat.none' | translate }}</mat-option>
                  <mat-option value="4/4">{{ 'beat.4_4' | translate }}</mat-option>
                  <mat-option value="3/4">{{ 'beat.3_4' | translate }}</mat-option>
                  <mat-option value="2/4">{{ 'beat.2_4' | translate }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-4">
                <mat-label>{{ 'dialogs.exercise.prepMeasures' | translate }}</mat-label>
                <mat-select formControlName="prepMeasures">
                  <mat-option [value]="0">{{ 'prepMeasures.none' | translate }}</mat-option>
                  <mat-option [value]="1">{{ 'prepMeasures.one' | translate }}</mat-option>
                  <mat-option [value]="2">{{ 'prepMeasures.two' | translate }}</mat-option>
                  <mat-option [value]="4">{{ 'prepMeasures.four' | translate }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </fieldset>

          <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-4">
            <mat-label>{{ 'common.minutes' | translate }}</mat-label>
            <input matInput type="number" formControlName="durationMinutes" />
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-4">
            <mat-label>{{ 'common.seconds' | translate }}</mat-label>
            <input matInput type="number" formControlName="durationSeconds" />
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-4">
            <mat-label>{{ 'common.breakSeconds' | translate }}</mat-label>
            <input matInput type="number" min="5" formControlName="breakSeconds" />
          </mat-form-field>

          <ng-container *ngIf="showResourcePreview(); else resourceInput">
            <div class="col-span-12 flex items-center gap-3">
              <img [src]="form.get('resourceLink')?.value" [alt]="'common.resource' | translate" class="h-24 w-auto object-cover rounded border" />
              <button mat-stroked-button (click)="editResource()">
                <mat-icon>edit</mat-icon>
                {{ 'common.edit' | translate }}
              </button>
            </div>
          </ng-container>
          <ng-template #resourceInput>
            <mat-form-field appearance="fill" class="w-full col-span-12">
              <mat-label>{{ 'common.resourceUrl' | translate }}</mat-label>
              <input matInput formControlName="resourceLink" />
            </mat-form-field>
          </ng-template>

          <div class="col-span-12" *ngIf="editingResource || !isImage(form.get('resourceLink')?.value || '')">
            <button mat-stroked-button (click)="fileInput.click()">{{ 'common.uploadImage' | translate }}</button>
            <input #fileInput hidden type="file" accept="image/*" (change)="onFileSelected($event)" />
          </div>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions class="px-4 py-3 border-t w-full pr-0 flex items-center justify-end">
        <button mat-raised-button (click)="cancel()">{{ 'common.cancel' | translate }}</button>
        <button mat-raised-button color="primary" (click)="save()">{{ 'common.save' | translate }}</button>
      </mat-dialog-actions>
    </div>
  `
})
export class ExerciseDialogComponent {
  private fb = inject(FormBuilder);
  private data = inject<Exercise>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ExerciseDialogComponent>);

  editingResource = false;

  form = this.fb.group({
    id: [this.data.id, Validators.required],
    title: [this.data.title, Validators.required],
    resourceLink: [this.data.resourceLink ?? ''],
    bpm: [this.data.bpm, [Validators.min(0)]],
    durationMinutes: [this.data.durationMinutes, [Validators.min(0)]],
    durationSeconds: [this.data.durationSeconds, [Validators.min(0)]],
    breakSeconds: [this.data.breakSeconds, [Validators.min(5)]],
    beatStyle: [this.data.beatStyle ?? 'none'],
    prepMeasures: [this.data.prepMeasures ?? 2]
  });

  save() {
    if (this.form.valid) this.dialogRef.close(this.form.getRawValue());
  }

  cancel() {
    this.dialogRef.close();
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.form.get('resourceLink')?.setValue(base64);
      this.editingResource = false;
    };
    reader.readAsDataURL(file);
  }

  showResourcePreview() {
    const link = this.form.get('resourceLink')?.value as string;
    return !!link && this.isImage(link) && !this.editingResource;
  }

  editResource() {
    this.editingResource = true;
  }

  isImage(link?: string) {
    if (!link) return false;
    return link.startsWith('data:image') || /(\.jpeg|\.jpg|\.png|\.webp)$/i.test(link);
  }
}
