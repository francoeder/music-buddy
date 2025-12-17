import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MetronomeService } from '../../services/metronome.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-metronome',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatIconModule, FormsModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
      
      <!-- Main Card -->
      <div class="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
        
        <!-- Header / Title -->
        <div class="bg-[#0E3A59] p-6 text-center">
          <h1 class="text-white text-xl font-bold tracking-widest uppercase opacity-90">
            {{ 'common.metronome' | translate }}
          </h1>
        </div>

        <div class="p-6 sm:p-8 flex flex-col items-center gap-8">
          
          <!-- BPM Display & Slider -->
          <div class="w-full flex flex-col items-center gap-4">
            <div class="text-center">
              <div class="text-[#38D6F3] font-medium text-lg uppercase tracking-wider mb-1">
                {{ tempoMarking }}
              </div>
              <div class="flex items-center justify-center gap-4">
                <button mat-icon-button (click)="adjustBpm(-1)" class="text-gray-400 hover:text-gray-600">
                  <mat-icon>remove</mat-icon>
                </button>
                <div class="text-7xl font-bold text-[#0E3A59] tabular-nums w-40 text-center">
                  {{ bpm }}
                </div>
                <button mat-icon-button (click)="adjustBpm(1)" class="text-gray-400 hover:text-gray-600">
                  <mat-icon>add</mat-icon>
                </button>
              </div>
              <div class="text-gray-400 font-medium text-sm tracking-widest mt-1">BPM</div>
            </div>

            <!-- Slider -->
            <div class="w-full px-4">
              <input 
                type="range" 
                min="30" 
                max="250" 
                [ngModel]="bpm" 
                (ngModelChange)="setBpm($event)"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#38D6F3]"
              >
            </div>
          </div>

          <!-- Visualizer (F1 Lights) -->
          <div class="h-12 flex items-center justify-center">
             <div class="flex gap-4">
               @for (i of dotsIndices; track i) {
                 <!-- Removed transition-all to ensure snappy flash response -->
                 <div class="w-6 h-6 rounded-full border-2"
                      [ngClass]="getLightClass(i)">
                 </div>
               }
             </div>
          </div>

          <!-- Play Button -->
          <div class="flex justify-center">
            <button 
              (click)="togglePlay()"
              class="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 focus:outline-none"
              [ngClass]="isPlaying() ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-[#38D6F3] text-white hover:bg-[#2bc4e0]'">
              <mat-icon class="!w-10 !h-10 !text-[40px] leading-[40px]">
                {{ isPlaying() ? 'stop' : 'play_arrow' }}
              </mat-icon>
            </button>
          </div>

          <!-- Settings (Time Signature) -->
          <div class="w-full pt-6 border-t border-gray-100">
            <div class="flex justify-between items-center bg-gray-50 rounded-xl p-4">
              <span class="text-gray-600 font-medium">{{ 'common.beatAccent' | translate }}</span>
              
              <div class="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <button 
                  *ngFor="let style of styles"
                  (click)="setSignature(style)"
                  class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                  [ngClass]="currentStyle === style ? 'bg-[#0E3A59] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'">
                  {{ style === 'none' ? 'OFF' : style }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <!-- Footer Note -->
      <p class="mt-6 text-gray-400 text-sm text-center max-w-xs mx-auto">
        {{ 'app.title' | translate }}
      </p>

    </div>
  `,
  styles: [`
    /* Custom Slider Styles if needed beyond Tailwind accent-color */
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 20px;
      width: 20px;
      border-radius: 50%;
      background: #38D6F3;
      cursor: pointer;
      margin-top: -6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%;
      height: 8px;
      cursor: pointer;
      background: #E5E7EB;
      border-radius: 4px;
    }
    
    /* Flash Animation for Metronome Light */
    @keyframes flash-green {
      0% { background-color: #22c55e; border-color: #22c55e; box-shadow: 0 0 15px rgba(34,197,94,0.8); transform: scale(1.1); }
      50% { background-color: #22c55e; border-color: #22c55e; box-shadow: 0 0 15px rgba(34,197,94,0.8); transform: scale(1.1); }
      100% { background-color: transparent; border-color: #d1d5db; box-shadow: none; transform: scale(1); }
    }
    .animate-flash {
      animation: flash-green 0.15s ease-out forwards;
    }
  `]
})
export class MetronomeComponent implements OnInit, OnDestroy {
  private metro = inject(MetronomeService);
  
  isPlaying = this.metro.isPlaying;
  
  // Local state for UI that syncs with service
  get bpm() { return this.metro.currentBpm() || 120; }
  get currentStyle() { return this.metro.beatStyle(); }
  
  // Derived state
  get beatTick() { return this.metro.beatTick(); }
  get beatInMeasure() { return this.metro.beatInMeasure(); }

  styles: ('none' | '4/4' | '3/4' | '2/4')[] = ['4/4', '3/4', '2/4', 'none'];

  constructor() {}

  get dotsIndices(): number[] {
    const style = this.currentStyle;
    if (style === '4/4') return [0, 1, 2, 3];
    if (style === '3/4') return [0, 1, 2];
    if (style === '2/4') return [0, 1];
    // For 'none', return an array with the current beatTick.
    // By tracking 'i' in the template, this forces the element to be destroyed and recreated on every beat,
    // which guarantees the CSS animation restarts reliably.
    return [this.beatTick]; 
  }

  get tempoMarking(): string {
    const b = this.bpm;
    if (b < 60) return 'Largo';
    if (b < 66) return 'Larghetto';
    if (b < 76) return 'Adagio';
    if (b < 108) return 'Andante';
    if (b < 120) return 'Moderato';
    if (b < 168) return 'Allegro';
    if (b < 200) return 'Presto';
    return 'Prestissimo';
  }

  ngOnInit() {
    // Restore BPM from localStorage
    const savedBpm = localStorage.getItem('music-buddy-metronome-bpm');
    if (savedBpm) {
      const bpm = parseInt(savedBpm, 10);
      if (!isNaN(bpm) && bpm > 0) {
        this.metro.setBpm(bpm);
      }
    }

    // Ensure we start with a default BPM if 0
    if (this.metro.currentBpm() === 0) {
      this.metro.setBpm(120);
    }
    // Default style if none
    if (this.metro.beatStyle() === 'none') {
      this.metro.setBeatStyle('4/4');
    }
  }

  ngOnDestroy() {
    this.metro.stop();
  }

  togglePlay() {
    if (this.isPlaying()) {
      this.metro.stop();
    } else {
      this.metro.start(this.bpm);
    }
  }

  setBpm(val: number) {
    this.metro.setBpm(val);
    localStorage.setItem('music-buddy-metronome-bpm', val.toString());
  }

  adjustBpm(delta: number) {
    this.setBpm(this.bpm + delta);
  }

  setSignature(style: 'none' | '4/4' | '3/4' | '2/4') {
    this.metro.setBeatStyle(style);
  }

  getLightClass(index: number): string {
    if (!this.isPlaying()) return 'bg-transparent border-gray-300';
    
    // beatInMeasure is 1-based (1, 2, 3, 4)
    // index is 0-based (0, 1, 2, 3)
    const currentBeat = this.beatInMeasure; // 1..4
    const currentIndex = currentBeat - 1;   // 0..3

    // User request: All lit lights should be green in the Metronome component
    if (this.currentStyle === 'none') {
       // For 'none' style, since the element is recreated every beat (due to dotsIndices returning [beatTick]),
       // we simply apply the animation class. It will run once per element lifecycle.
       return 'animate-flash bg-transparent border-gray-300';
    } else if (index <= currentIndex) {
       return 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
    } else {
       return 'bg-transparent border-gray-300';
    }
  }
}
