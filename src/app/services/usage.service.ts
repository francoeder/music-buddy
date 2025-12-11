import { Injectable, inject, signal, effect } from '@angular/core';
import { FIREBASE_DB } from '../app.config';
import { AuthService } from '../core/services/auth.service';
import { type Firestore, collection, doc, onSnapshot, setDoc, serverTimestamp, query, orderBy, limit as qlimit } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class UsageService {
  private db: Firestore = inject(FIREBASE_DB);
  private auth = inject(AuthService);
  private recentIdsSignal = signal<string[]>([]);
  private unsubscribe: (() => void) | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
      if (!user) {
        this.recentIdsSignal.set([]);
        return;
      }
      const colRef = collection(this.db, 'users', user.uid, 'recentRuns');
      const q = query(colRef, orderBy('ts', 'desc'), qlimit(3));
      this.unsubscribe = onSnapshot(q, snap => {
        const ids = snap.docs.map(d => d.id);
        this.recentIdsSignal.set(ids);
      });
    });
  }

  getRecentIds() {
    return this.recentIdsSignal.asReadonly();
  }

  async recordRun(trainingId: string) {
    const user = this.auth.user();
    if (!user) return;
    const ref = doc(this.db, 'users', user.uid, 'recentRuns', trainingId);
    await setDoc(ref, { ts: serverTimestamp() }, { merge: true });
  }
}

