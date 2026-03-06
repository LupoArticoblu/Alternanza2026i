import { bootstrapApplication } from '@angular/platform-browser';
// Cambiato il bootstrap anche lato server per puntare ad AppComponent
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';

const bootstrap = () =>
    bootstrapApplication(AppComponent, {
        providers: [
            // Usiamo il client standard senza dipendenze router mancanti
            provideHttpClient(),
        ]
    });

export default bootstrap;
