import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Esempio di endpoint Express Rest API.
 * Decommentare e definire gli endpoint necessari.
 *
 * Esempio:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Gestisci la richiesta API
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Gestisce tutte le altre richieste renderizzando l'applicazione Angular.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Avvia il server se questo modulo è il punto di ingresso principale, o se viene eseguito tramite PM2.
 * Il server ascolta la porta definita dalla variabile d'ambiente `PORT`, o predefinita a 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Gestisce le richieste usate dallo strumento Angular CLI (per il server di sviluppo e durante la build) o Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
