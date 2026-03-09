 // JIT compilation requirement
import { bootstrapApplication } from '@angular/platform-browser';
import './index.css';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection()
  ]
}).catch(err => console.error(err));

// AI Studio usa un file `index.tsx` per tutti i tipi di progetto.
