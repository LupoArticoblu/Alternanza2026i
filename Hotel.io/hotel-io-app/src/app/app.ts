import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatbotComponent } from '../components/chatbot.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  // Import the router outlet and the Chatbot component (standalone)
  // Import RouterOutlet, CommonModule (for *ngIf) and the Chatbot component
  // RouterOutlet, CommonModule (for *ngIf), and the Chatbot component
  imports: [RouterOutlet, CommonModule, ChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hotel-io-app');
  // Signal to control the visibility of the side‑panel chatbot
  protected readonly showChat = signal(false);

  toggleChat() {
    this.showChat.set(!this.showChat());
  }
}
