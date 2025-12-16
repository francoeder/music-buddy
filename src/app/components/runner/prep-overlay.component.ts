import { Component, Input, OnChanges, SimpleChanges, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-prep-overlay',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="fixed inset-0 z-40 box-border bg-white/95 border-8 border-indigo-500 flex items-center justify-center">
      <div class="text-center">
        @if (shouldShowProgressBar()) {
          <div class="mx-auto w-80 md:w-[28rem] h-4 md:h-5 bg-indigo-100 border border-indigo-500 rounded-full overflow-hidden">
            <div class="h-full bg-indigo-600 ml-auto" [style.width.%]="progressPercent"></div>
          </div>
        }
        @if (shouldShowBigGetReady()) {
          <div class="mt-4 text-indigo-600 font-bold text-6xl md:text-7xl leading-none countdown-anim">
            {{ message | translate }}
          </div>
        } @else if (shouldShowCount()) {
          @if (shouldOverrideCountWithReady()) {
            <div class="mt-4 font-bold text-6xl md:text-7xl leading-none countdown-anim text-indigo-600">
              {{ 'runner.prep.getReady' | translate }}
            </div>
          } @else {
            <div class="mt-4 font-bold text-6xl md:text-7xl leading-none countdown-anim"
                 [class.text-indigo-600]="isAccent()"
                 [class.text-indigo-400]="!isAccent()">
              {{ countDisplay }}
            </div>
          }
          <div class="mt-2 font-bold text-2xl md:text-3xl leading-none countdown-anim text-gray-700">
            {{ message | translate }}
          </div>
        } @else {
          <div class="mt-4 text-gray-600 text-2xl tracking-wide">
            {{ message | translate }}
          </div>
        }
        @if (nextTitle) {
          <div class="mt-2 text-gray-700 text-lg">
            {{ 'runner.prep.nextExercise' | translate }} <span class="font-medium">{{ nextTitle }}</span>
          </div>
        }
        @if (bpm > 0) {
          <div class="mt-1 text-gray-700 text-lg">
            {{ 'runner.prep.bpm' | translate }} <span class="font-medium">{{ bpm }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `@keyframes countdownPulse { 0% { transform: scale(0.9); opacity: 0.7; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.9); opacity: 0.7; } }`,
    `.countdown-anim { animation: countdownPulse 1s ease-in-out infinite; }`
  ]
})
export class PrepOverlayComponent implements OnChanges, OnInit, OnDestroy {
  @Input() seconds = 5;
  @Input() nextTitle?: string;
  @Input() bpm = 0;
  @Input() message = '';
  @Input() beatStyle: 'none' | '4/4' | '3/4' | '2/4' = 'none';
  @Input() prepMeasures = 0;
  @Input() beatTick = 0;
  @Input() beatInMeasure = 1;
  @Input() breakSeconds = 0;
  @Input() autoplay = true;

  private initialSeconds: number | null = null;
  private currentSeconds = 5;
  private lastSecondChangeMs = 0;
  private rafId: number | null = null;
  progressPercent = 100;
  private cdr = inject(ChangeDetectorRef);
  private beatsPerMeasure = 1;
  private secondsPerBeat = 0;
  private measureSeconds = 0;
  countDisplay: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ('seconds' in changes) {
      const curr = changes['seconds'].currentValue as number;
      if (curr > 0 && (this.initialSeconds === null || curr > this.initialSeconds)) {
        this.initialSeconds = curr;
      }
      this.currentSeconds = curr;
      this.lastSecondChangeMs = performance.now();
      this.updateProgress();
      if (this.rafId === null) {
        this.startRaf();
      }
    }
    if ('bpm' in changes || 'beatStyle' in changes || 'prepMeasures' in changes) {
      this.recomputeBeatData();
    }
    if ('beatTick' in changes) {
      if (this.message === 'runner.prep.restTime') {
        this.countDisplay = null;
        return;
      }
      const t = changes['beatTick'].currentValue as number;
      if (typeof t === 'number' && t > 0 && this.bpm > 0 && this.prepMeasures > 0) {
        const totalBeats = this.prepMeasures * this.beatsPerMeasure;
        if (t <= totalBeats) {
          this.countDisplay = this.beatInMeasure || null;
        } else {
          // mantém o último número visível até o overlay fechar
          this.countDisplay = this.countDisplay;
        }
      } else {
        this.countDisplay = null;
      }
      this.cdr.detectChanges();
    }
  }

  ngOnInit(): void {
    this.lastSecondChangeMs = performance.now();
    this.startRaf();
    this.recomputeBeatData();
  }

  ngOnDestroy(): void {
    this.stopRaf();
  }

  private updateProgress() {
    if (!this.initialSeconds || this.initialSeconds <= 0) {
      this.progressPercent = 100;
      return;
    }
    const elapsed = (performance.now() - this.lastSecondChangeMs) / 1000;
    const remaining = Math.max(this.currentSeconds - elapsed, 0);
    if (this.shouldShowProgressBar()) {
      const threshold = Math.min(this.initialSeconds, this.metroStartThresholdSeconds());
      const window = Math.max(this.initialSeconds - threshold, 0);
      if (window <= 0) {
        this.progressPercent = (remaining / this.initialSeconds) * 100;
      } else {
        const remainingUntilMetroStart = Math.max(remaining - threshold, 0);
        this.progressPercent = (remainingUntilMetroStart / window) * 100;
      }
    } else {
      this.progressPercent = (remaining / this.initialSeconds) * 100;
    }
  }

  private startRaf() {
    const loop = () => {
      if (this.seconds <= 0) {
        this.stopRaf();
        return;
      }
      this.updateProgress();
      this.cdr.detectChanges();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopRaf() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private recomputeBeatData() {
    this.beatsPerMeasure =
      this.beatStyle === '4/4' ? 4 :
      this.beatStyle === '3/4' ? 3 :
      this.beatStyle === '2/4' ? 2 : 1;
    this.secondsPerBeat = this.bpm > 0 ? (60 / this.bpm) : 0;
    this.measureSeconds = this.beatsPerMeasure * this.secondsPerBeat;
  }

  isAccent(): boolean {
    if (this.beatStyle === 'none') return false;
    return this.beatInMeasure === 1;
  }

  shouldShowBigGetReady(): boolean {
    if (this.seconds <= 0) return false;
    if (this.message === 'runner.prep.restTime') return false;
    if (this.bpm <= 0 || this.prepMeasures <= 0) return false;
    return this.beatTick === 0;
  }

  shouldShowProgressBar(): boolean {
    if (this.seconds <= 0) return false;
    return this.message === 'runner.prep.restTime';
  }

  private metroStartThresholdSeconds(): number {
    if (this.bpm <= 0 || this.prepMeasures <= 0) return 0;
    const measuresTime = this.prepMeasures * this.measureSeconds;
    return Math.max(1, Math.ceil(measuresTime));
  }

  shouldShowCount(): boolean {
    if (this.message === 'runner.prep.restTime') return false;
    if (this.bpm <= 0 || this.prepMeasures <= 0) return false;
    return this.countDisplay !== null;
  }

  private shouldOverrideCountWithReady(): boolean {
    if (!this.autoplay) return false;
    if (this.breakSeconds > 5) return false;
    if (this.message === 'runner.prep.restTime') return false;
    if (this.bpm <= 0 || this.prepMeasures <= 0) return false;
    const threshold = this.metroStartThresholdSeconds();
    if (this.seconds > threshold) return false;
    return this.beatTick === 0;
  }
}
