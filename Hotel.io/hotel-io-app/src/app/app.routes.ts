import { Routes } from '@angular/router';
// Import the standalone Chatbot component
// Updated import to reflect new location of ChatbotComponent
// Import the Chatbot component located in the top‑level components folder
import { ChatbotComponent } from '../components/chatbot.component';

export const routes: Routes = [
	// Add a route for the chatbot UI
	{
		path: 'chat',
		component: ChatbotComponent,
		
	}
];
