import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { Training, Exercise } from '../../models/training.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-training-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatCheckboxModule, MatIconModule, MatSelectModule, TranslateModule],
  template: `
    <div class="relative min-h-[300px]">
      <mat-dialog-content #content class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <h2 class="text-xl font-semibold">{{ 'dialogs.training.title' | translate }}</h2>
        <form [formGroup]="form" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            <mat-form-field appearance="fill" class="w-full">
              <mat-label>{{ 'common.title' | translate }}</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>
            <mat-form-field appearance="fill" class="w-full">
              <mat-label>{{ 'common.owner' | translate }}</mat-label>
              <input matInput formControlName="owner" />
            </mat-form-field>
            <ng-container *ngIf="showCoverPreview(); else coverInput">
              <div class="md:col-span-2 flex items-center gap-3">
                <img [src]="form.get('cover')?.value" [alt]="'common.cover' | translate" class="h-24 w-auto object-cover rounded border" />
                <button mat-stroked-button (click)="editCover()">
                  <mat-icon>edit</mat-icon>
                  {{ 'common.edit' | translate }}
                </button>
              </div>
            </ng-container>
            <ng-template #coverInput>
              <mat-form-field appearance="fill" class="w-full md:col-span-2">
                <mat-label>{{ 'common.coverUrl' | translate }}</mat-label>
                <input matInput formControlName="cover" />
              </mat-form-field>
            </ng-template>
            <div class="md:col-span-2 flex items-center gap-3" *ngIf="editingCover || !isImage(form.get('cover')?.value || '')">
              <button mat-stroked-button (click)="coverInput.click()">{{ 'common.uploadImage' | translate }}</button>
              <input #coverInput hidden type="file" accept="image/*" (change)="onCoverSelected($event)" />
            </div>
            <mat-checkbox formControlName="active" class="md:col-span-2">{{ 'common.active' | translate }}</mat-checkbox>
          </div>

          <div class="mt-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ 'common.exercises' | translate }}</h3>
            </div>

            <div class="space-y-3 mt-3" formArrayName="exercises">
              <div class="p-3 border rounded" *ngFor="let ex of exercises.controls; let i = index" [formGroupName]="i">
                <div class="grid grid-cols-12 gap-3 items-start">
                  <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-4">
                    <mat-label>{{ 'common.title' | translate }}</mat-label>
                    <input matInput formControlName="title" />
                  </mat-form-field>

                  <mat-form-field appearance="fill" class="w-full col-span-6 md:col-span-2">
                    <mat-label>{{ 'common.bpm' | translate }}</mat-label>
                    <input matInput type="number" formControlName="bpm" />
                  </mat-form-field>

                  <mat-form-field appearance="fill" class="w-full col-span-3 md:col-span-2">
                    <mat-label>{{ 'common.minutes' | translate }}</mat-label>
                    <input matInput type="number" formControlName="durationMinutes" />
                  </mat-form-field>

                  <mat-form-field appearance="fill" class="w-full col-span-3 md:col-span-2">
                    <mat-label>{{ 'common.seconds' | translate }}</mat-label>
                    <input matInput type="number" formControlName="durationSeconds" />
                  </mat-form-field>

                  <mat-form-field appearance="fill" class="w-full col-span-6 md:col-span-2">
                    <mat-label>{{ 'common.breakSeconds' | translate }}</mat-label>
                    <input matInput type="number" min="5" formControlName="breakSeconds" />
                  </mat-form-field>

                  <mat-form-field appearance="fill" class="w-full col-span-12 md:col-span-4">
                    <mat-label>{{ 'dialogs.exercise.prepMeasures' | translate }}</mat-label>
                    <mat-select formControlName="prepMeasures">
                      <mat-option [value]="2">{{ 'prepMeasures.two' | translate }}</mat-option>
                      <mat-option [value]="1">{{ 'prepMeasures.one' | translate }}</mat-option>
                      <mat-option [value]="0">{{ 'prepMeasures.none' | translate }}</mat-option>
                    </mat-select>
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

                  <ng-container *ngIf="showResourcePreview(i); else resourceInput">
                    <div class="col-span-12 flex items-center gap-3">
                      <img [src]="ex.get('resourceLink')?.value" [alt]="'common.resource' | translate" class="h-24 w-auto object-cover rounded border" />
                      <button mat-stroked-button (click)="editResource(i)">
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
                </div>
                <div class="flex items-center justify-between mt-2">
                  <div *ngIf="editingResource(i) || !isImage(ex.get('resourceLink')?.value || '')">
                    <button mat-stroked-button (click)="fileInput.click()">{{ 'common.uploadImage' | translate }}</button>
                    <input #fileInput hidden type="file" accept="image/*" (change)="onFileSelected($event, i)" />
                  </div>
                  <button mat-button color="warn" (click)="removeExercise(i)">{{ 'common.remove' | translate }}</button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions class="px-4 py-3 border-t w-full pr-0 flex items-center justify-between">
        <div class="space-x-2">
          <button mat-raised-button (click)="cancel()">{{ 'common.cancel' | translate }}</button>
          <button mat-raised-button color="primary" (click)="save()">{{ 'common.save' | translate }}</button>
        </div>
        <button mat-raised-button color="secondary" class="ml-auto" (click)="addExercise()">
          <mat-icon>add</mat-icon>
          {{ 'common.addExercise' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class TrainingDialogComponent {
  private fb = inject(FormBuilder);
  private data = inject<Training>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<TrainingDialogComponent>);
  @ViewChild('content') content?: ElementRef<HTMLElement>;
  private editingSet = new Set<number>();
  private auth = inject(AuthService);
  editingCover = false;

  form = this.fb.group({
    _id: [this.data._id, Validators.required],
    title: [this.data.title, Validators.required],
    owner: [this.data.owner],
    active: [this.data.active],
    cover: [this.data.cover ?? ''],
    exercises: this.fb.array(this.data.exercises.map(e => this.exerciseGroup(e)))
  });

  constructor() {
    const email = this.auth.user()?.email ?? '';
    this.form.get('owner')?.setValue(email);
    this.form.get('owner')?.disable({ emitEvent: false });
  }

  get exercises() {
    return this.form.get('exercises') as FormArray;
  }

  addExercise() {
    const id = this.exercises.length + 1;
    const ex: Exercise = { id, title: 'Exercise', bpm: 0, durationMinutes: 1, durationSeconds: 0, breakSeconds: 10, beatStyle: 'none', prepMeasures: 2 };
    this.exercises.push(this.exerciseGroup(ex));
    setTimeout(() => {
      const el = this.content?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
      const inputs = el.querySelectorAll('input[formcontrolname="title"]');
      const last = inputs.item(inputs.length - 1) as HTMLInputElement | null;
      last?.focus();
      last?.select();
    }, 0);
  }

  removeExercise(i: number) {
    this.exercises.removeAt(i);
  }

  save() {
    const email = this.auth.user()?.email ?? '';
    this.form.get('owner')?.setValue(email);
    if (this.form.valid) this.dialogRef.close(this.form.getRawValue());
  }

  cancel() {
    this.dialogRef.close();
  }

  onCoverSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.form.get('cover')?.setValue(base64);
      this.editingCover = false;
    };
    reader.readAsDataURL(file);
  }

  onFileSelected(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const group = this.exercises.at(index);
      group.get('resourceLink')?.setValue(base64);
    };
    reader.readAsDataURL(file);
  }

  showResourcePreview(index: number) {
    const group = this.exercises.at(index);
    const link = group.get('resourceLink')?.value as string;
    return !!link && this.isImage(link) && !this.editingSet.has(index);
  }

  editResource(index: number) {
    this.editingSet.add(index);
  }

  editingResource(index: number) {
    return this.editingSet.has(index);
  }

  showCoverPreview() {
    const link = this.form.get('cover')?.value as string;
    return !!link && this.isImage(link) && !this.editingCover;
  }

  editCover() {
    this.editingCover = true;
  }

  isImage(link?: string) {
    if (!link) return false;
    return link.startsWith('data:image') || /(\.jpeg|\.jpg|\.png|\.webp)$/i.test(link);
  }

  private exerciseGroup(e: Exercise) {
    return this.fb.group({
      id: [e.id, Validators.required],
      title: [e.title, Validators.required],
      resourceLink: [e.resourceLink ?? ''],
      bpm: [e.bpm, [Validators.min(0)]],
      durationMinutes: [e.durationMinutes, [Validators.min(0)]],
      durationSeconds: [e.durationSeconds, [Validators.min(0)]],
      breakSeconds: [e.breakSeconds, [Validators.min(5)]],
      beatStyle: [e.beatStyle ?? 'none'],
      prepMeasures: [e.prepMeasures ?? 2]
    });
  }
}
