import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatbotComponent } from '../components/chatbot.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  // Import the router outlet and the Chatbot component (standalone)
  // Import RouterOutlet, CommonModule (for *ngIf) and the Chatbot component
  // RouterOutlet, CommonModule (for *ngIf), and the Chatbot component
  // Import RouterModule (provides RouterOutlet directive) and CommonModule for *ngIf
  imports: [RouterModule, CommonModule, ChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hotel-io-app');
  // Signal to control the visibility of the side‑panel chatbot
  // Set to true by default so the chatbot is visible when the app loads
  protected readonly showChat = signal(true);

  toggleChat() {
    this.showChat.set(!this.showChat());
  }
}
