# Hotel.io

Piattaforma demo per ricerca e gestione di hotel con backend FastAPI e frontend Angular.

Descrizione

- Hotel.io è un progetto dimostrativo che fornisce API per la gestione di hotel, autenticazione, recensioni e un semplice chatbot.
- Il frontend è sviluppato con Angular (componenti standalone) e comunica con il backend via HTTP.

Requisiti

- Python 3.10+
- Node.js (versione LTS consigliata)
- npm
- (Opzionale) Un modello LLM locale (es. Ollama) per le funzionalità AI

Installazione

Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

Frontend

```bash
cd hotel-io-app
npm install
npm run start
```

Avvio

Avviare il backend (esempio):

```bash
uvicorn backend.main:app --reload --port 8000
```

Avviare il frontend (esempio):

```bash
cd hotel-io-app
npm run start
```

Struttura principale

- `backend/`: API FastAPI, modelli ORM (`models.py`), schemi Pydantic (`schemas.py`), configurazione DB (`database.py`), endpoint in `main.py`.
- `hotel-io-app/`: frontend Angular (componenti standalone in `src/components`, servizi in `src/services`, root in `src/app.component.ts`).

Endpoint chiave

- `GET /hotels` — lista hotel (opzionale `user_id` per `isLiked`)
- `POST /hotels` — crea hotel
- `POST /login`, `POST /register` — autenticazione
- `POST /hotels/{hotel_id}/reviews` — aggiungi recensione
- `POST /hotels/{hotel_id}/like` — toggle like
- `POST /chatbot` — interazione chatbot

Database e dati

- DB SQLite di default: `hotel_io.db` (creato nella cartella `backend`).
- FAQ statiche: `backend/faqs.json`.

Contribuire

- Fork/branch -> commit descrittivi -> pull request verso `main`.
- Aggiungere test e aggiornare la documentazione.
