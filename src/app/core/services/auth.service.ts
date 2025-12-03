import { inject, Injectable, computed, signal } from '@angular/core';
import { FIREBASE_AUTH } from '../../app.config';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
  type Auth
} from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth = inject(FIREBASE_AUTH);
  private _user = signal<User | null>(null);

  user = computed(() => this._user());
  isAuthenticated = computed(() => !!this._user());

  constructor() {
    onAuthStateChanged(this.auth, (u) => this._user.set(u));
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    this._user.set(result.user);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  authStateOnce(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (u) => {
        unsubscribe();
        this._user.set(u);
        resolve(u);
      });
    });
  }
}
