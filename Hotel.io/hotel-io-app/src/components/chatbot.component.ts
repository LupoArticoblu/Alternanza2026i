import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Import ChatService from the root services folder (src/services)
import { ChatService } from '../services/chat.service';

/**
 * Simple chatbot UI component.
 * Inline template and styles as requested.
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <!-- Chatbot UI -->
    <div class="max-h-50vh flex flex-col h-full w-80 bg-white shadow-lg border-t border-l">

    <!-- Chat messaggi scrollabili -->
      <div class="messages flex-1 p-2 overflow-y-auto space-y-2">
        <div *ngFor="let msg of messages"
             [ngClass]="{'msg-user': msg.fromUser, 'msg-bot': !msg.fromUser}">
          <ng-container *ngIf="!msg.loading">{{ msg.text }}</ng-container>
          <ng-container *ngIf="msg.loading">
            <span class="loading">Sto pensando</span>
          </ng-container>
        </div>
      </div>
      <!-- Input e invio -->
      <div class="input-area flex p-2 border-t">
        <input [(ngModel)]="userInput" (keydown.enter)="send()" placeholder="Chiedi a Hotello" class="flex-1 border rounded px-2 py-1" />
        <button (click)="send()" class="ml-2 bg-blue-500 text-white px-4 py-1 rounded">Invia</button>
      </div>
    </div>
  `,

  styles: `
    .loading {
      display: inline-block;
      color: #444;
      font-style: italic;
      position: relative;
      padding-right: 1.2em;
    }
    .loading::after {
      content: '...';
      position: absolute;
      right: 0;
      top: 0;
      animation: dots 1s steps(3, end) infinite;
    }

    .msg-user {
      align-self: flex-end;
      background: #cfe9ff;
      color: #000;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      max-width: 90%;
      word-break: break-word;
    }

    .msg-bot {
      align-self: flex-start;
      background: #e0e0e0;
      color: #000;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      max-width: 90%;
      word-break: break-word;
    }

    @keyframes dots {
      0% { opacity: 0.2 }
      20% { opacity: 1 }
      100% { opacity: 0.2 }
    }
  `
})
export class ChatbotComponent {
  //lista msg mostrati in conversazione
  // Ogni messaggio può avere un flag `loading` per l'animazione "..."
  messages: { text: string; fromUser: boolean; loading?: boolean }[] = [];

  //Testo utente
  userInput = '';

  constructor(private chatService: ChatService) {}

  // Invia il messaggio dell'utente e gestisce la risposta del chatbot
  send() {
    if (!this.userInput.trim()) return;
    const query = this.userInput;
    // Mostra il messaggio dell'utente
    this.messages.push({ text: query, fromUser: true });

    // Inserisci un placeholder di caricamento animato
    const loadingMsg = { text: '...', fromUser: false, loading: true } as any;
    this.messages.push(loadingMsg);

    // Chiama la funzione sendMessage del ChatService
    const request = { message: query } as any; // ChatRequest interface
    this.chatService.sendMessage(request).subscribe({
      next: (resp) => {
        // Sostituisci il placeholder con la risposta reale
        const idx = this.messages.findIndex(m => m.loading);
        if (idx !== -1) {
          this.messages.splice(idx, 1, { text: resp.answer, fromUser: false });
        } else {
          this.messages.push({ text: resp.answer, fromUser: false });
        }
        // scrolla automaticamente verso il basso
        setTimeout(() => {
          const container = document.querySelector('.messages');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 0);
      },
      error: (err) => {
        console.error('Chat error', err);
        // Replace loading placeholder with an error message
        const idx = this.messages.findIndex(m => m.loading);
        if (idx !== -1) {
          this.messages.splice(idx, 1, { text: 'Errore nella risposta', fromUser: false });
        } else {
          this.messages.push({ text: 'Errore nella risposta', fromUser: false });
        }
        // scroll to bottom even on error
        setTimeout(() => {
          const container = document.querySelector('.messages');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 0);
      }
    });
    // Pulisce l'input dopo l'invio
    this.userInput = '';
  }
}
