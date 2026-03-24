import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
// Import ChatService from the root services folder (src/services)
import { ChatService } from '../services/chat.service';

/**
 * Simple chatbot UI component.
 * Inline template and styles as requested.
 */
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [ChatService],
  template: `
    <div style="display: flex; flex-direction: column; height: 100%; max-width: 600px; margin: 0 auto; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background: #fafafa;">
       <div *ngFor="let msg of messages"
         [ngStyle]="{'padding':'0.5rem 1rem','margin':'0.3rem 0','border-radius':'4px','background':msg.fromUser ? '#cfe9ff' : '#e0e0e0','align-self':msg.fromUser ? 'flex-end' : 'auto'}">
        {{ msg.text }}
      </div>

      <form (ngSubmit)="send()" style="display: flex; margin-top: auto;">
        <input [(ngModel)]="userInput" name="userInput" placeholder="Scrivi un messaggio..." required 
               style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px 0 0 4px;" />
        <button type="submit" style="padding: 0.5rem 1rem; border: none; background: #1976d2; color: white; border-radius: 0 4px 4px 0; cursor: pointer;">Invia</button>
      </form>
      
    </div>
  `,

  styles: ``
})
export class ChatbotComponent {
  messages: { text: string; fromUser: boolean }[] = [];
  userInput = '';

  constructor(private chatService: ChatService) {}

  send() {
    if (!this.userInput.trim()) return;
    const query = this.userInput;
    this.messages.push({ text: query, fromUser: true });
    this.chatService.sendMessage({ message: query }).subscribe({
      next: (response) => this.messages.push({ text: response.answer, fromUser: false }),
      error: (err) => console.error('Chat error', err)
    });
    this.userInput = '';
  }
}
