import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  @if (minimized) {
    <div class="open-chat-floating" (click)="openFromFloating()" role="button" aria-label="Apri chat">Apri Chat</div>
  }
  @if (!minimized) {
    <div class="chat-root flex flex-col bg-white shadow-lg border rounded-lg" role="region" aria-label="Assistente di viaggio">
      <header class="chat-header flex items-center justify-between px-3 py-2 border-b">
        <div class="flex items-center space-x-2">
          <div class="avatar w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center">H</div>
          <div>
            <div class="font-semibold">Hotello</div>
            <div class="text-xs text-gray-500">Chiedimi informazioni su hotel, destinazioni e consigli</div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button aria-label="Chiudi" (click)="closeChat()" class="text-sm text-gray-600">x</button>
        </div>
      </header>

      @if (!minimized) {
        <main class="messages flex-1 p-3 overflow-y-auto" tabindex="0">
          @for (msg of messages; track msg.id) {
            <div class="msg-row mb-2" [ngClass]="{'justify-end': msg.fromUser}">
              <div class="msg-bubble" [ngClass]="msg.fromUser ? 'user' : 'bot'">
                <div class="flex items-start justify-between">
                  <div class="msg-text">{{ msg.text }}</div>
                  <!-- badge sorgente per i messaggi del bot -->
                  @if (msg.source && !msg.fromUser) {
                    <div class="source-badge text-xs ml-2 text-white px-2 py-0.5 rounded">
                      {{ msg.source }}
                    </div>
                  }
                </div>
                <div class="msg-meta text-xs text-gray-400 mt-1 flex items-center space-x-2">
                  <span>{{ msg.time }}</span>
                  @if (msg.status === 'error') {
                    <button (click)="retry(msg)" class="text-blue-500 text-xs">Riprova</button>
                  }
                </div>
              </div>
            </div>
          }
          @if (typing) {
            <div class="flex gap-1 items-center py-2">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
            </div>
          }
        </main>
      }

      <footer class="input-area p-3 border-t">
        <form (submit)="onSubmit($event)" class="flex items-center space-x-2">
          <input [(ngModel)]="userInput" name="userInput" [disabled]="sending" (keydown.enter)="onSubmit($event)" placeholder="Chiedi qualcosa sull'organizzazione del viaggio..." class="flex-1 border rounded px-3 py-2" aria-label="Messaggio" />
          <button type="submit" [disabled]="sending || !userInput.trim()" class="bg-blue-600 text-white px-4 py-2 rounded">{{ sending ? 'Attendi' : 'Invia' }}</button>
        </form>
      </footer>
    </div>
  }
  `,

  styles: `
    .chat-root { position: fixed; right: 20px; bottom: 20px; width: 360px; max-height: 70vh; display: flex; flex-direction: column; z-index: 9998; }
    .chat-header { background: #f8fafc; }
    .avatar { font-weight: 700; }
    .messages { background: linear-gradient(180deg, #ffffff, #f7fbff); padding-bottom: 88px; }
    .context-box { max-height: 120px; overflow: auto; }
    .source-badge { background: #64748b; }
    .msg-row { display: flex; }
    .msg-row.justify-end { justify-content: flex-end; }
    .msg-bubble { max-width: 78%; padding: 0.6rem 0.75rem; border-radius: 0.6rem; }
    .msg-bubble.bot { background: #eef2ff; color: #0f172a; align-self: flex-start; }
    .msg-bubble.user { background: #dbeafe; color: #022c43; align-self: flex-end; }
    .msg-meta { opacity: 0.9; }
    .typing-indicator { font-style: italic; }
    .dots { animation: blink 1s steps(3, end) infinite; }
    @keyframes blink { 0% { opacity: 0.2 } 50% { opacity: 1 } 100% { opacity: 0.2 } }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-8px); }
    }
    .animate-bounce {
      animation: bounce 1.4s infinite;
    }
    .hidden { display: none; }
    .input-area { position: sticky; bottom: 0; background: rgba(255,255,255,0.95); }
    .open-chat-floating { position: fixed; right: 20px; bottom: 20px; background: #0ea5e9; color: #fff; padding: 8px 12px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(2,6,23,0.2); cursor: pointer; z-index: 9999; font-weight: 600; }

    /* semplificazione: rendiamo più visibile l'header e riduciamo padding inutili */
    .chat-header { padding: 10px; }
    .msg-bubble { word-wrap: break-word; }
  `
})
export class ChatbotComponent implements OnInit {
  // messages: aggiunta campo `source` per visualizzare badge (faq/local-llm/fallback)
  messages: { id: string; text: string; fromUser: boolean; time: string; status?: 'sent'|'received'|'loading'|'error'; source?: string }[] = [];
  userInput = '';
  sending = false;
  typing = false;
  // Apri minimizzato per default per non occupare spazio all'avvio
  minimized = true;
  // Le righe di contesto fornite dal backend per essere mostrate sopra la conversazione
  contextLines: string[] = [];

  private storageKey = 'hotelio_chat_history';

  constructor(private chatService: ChatService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // restore conversation from localStorage
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
          const parsed = JSON.parse(raw);
          // restored messages possono contenere campi `source` precedenti
          this.messages = parsed;
      }
    } catch (e) {
      console.warn('Could not restore chat history', e);
      this.messages = [];
    }
    // scroll to bottom on init
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages.slice(-200)));
    } catch (e) {
      console.warn('Could not persist chat history', e);
    }
  }

  onSubmit(e: Event) {
    e.preventDefault();
    this.send();
  }

  send() {
    const txt = (this.userInput || '').trim();
    if (!txt) return;

    console.log('--- [FE] Invio messaggio al backend ---');
    console.log('Payload:', { message: txt });

    const id = Date.now().toString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // push user message
    this.messages.push({ id: id + '_u', text: txt, fromUser: true, time, status: 'sent' });
    this.userInput = '';
    this.persist();
    this.scrollToBottom();

    this.sending = true;
    this.typing = true; // Show spinner, no loading message in array
    const request = { message: txt } as any;
    this.chatService.sendMessage(request).subscribe({
      next: (resp) => {
        console.log('--- [FE] Risposta ricevuta con successo ---');
        console.log('Dati ricevuti:', resp);
        const receivedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const answerText = resp.answer || 'Mi dispiace, non ho una risposta.';
        if (resp.context && Array.isArray(resp.context)) {
          this.contextLines = resp.context;
        }
        this.messages.push({ id: id + '_b', text: answerText, fromUser: false, time: receivedTime, status: 'received', source: resp.source });
        this.sending = false;
        this.typing = false;
        this.persist();
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (err) => {
        console.error('--- [FE] ERRORE nella richiesta ---');
        console.error('Chat error', err);
        const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const errMsg = 'Errore nel recuperare la risposta. Riprova.';
        this.messages.push({ id: id + '_e', text: errMsg, fromUser: false, time: errTime, status: 'error', source: 'error' });
        this.sending = false;
        this.typing = false;
        this.persist();
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  retry(msg: any) {
    // find the previous user message to resend
    const idx = this.messages.findIndex(m => m.id === msg.id);
    // find prior user message
    const prior = this.messages[idx - 1];
    if (!prior || !prior.fromUser) return;
    // remove error message
    this.messages.splice(idx, 1);
    this.userInput = prior.text;
    // small timeout to allow UI update
    setTimeout(() => this.send(), 50);
  }

  closeChat() {
    // minimize as default close behavior; parent can still toggle visibility
    this.minimized = true;
  }

  openFromFloating() {
    // quando apro dalla bubble fissiamo focus sull'input e scroll in fondo
    this.minimized = false;
    setTimeout(() => this.scrollToBottom(), 50);
    setTimeout(() => {
      const input = document.querySelector('input[name="userInput"]') as HTMLInputElement | null;
      if (input) input.focus();
    }, 100);
  }

  private scrollToBottom() {
    const container = document.querySelector('.messages');
    if (container) {
      // Scroll to absolute bottom per mostrare sempre l'ultima risposta
      container.scrollTop = container.scrollHeight;
    }
  }
}
