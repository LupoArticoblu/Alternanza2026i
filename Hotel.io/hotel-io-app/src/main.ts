import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
// Importiamo AppComponent direttamente invece del boilerplate generato in src/app/
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    // Rimosso provideZonelessChangeDetection per usare il sistema standard di Angular 
    // e garantire compatibilità con le librerie/metodi scelti (come NgZone)
    provideHttpClient(),
  ],
}).catch((err) => console.error(err));
