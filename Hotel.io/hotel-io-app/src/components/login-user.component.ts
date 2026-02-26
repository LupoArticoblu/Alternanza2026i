import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../services/hotel.service';


@Component({
  selector: 'app-login-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-fade-in">
      <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
        {{ isRegistering() ? "Sign in" : "Login" }} User
      </h2>
      
      <div class="space-y-4">
        <!-- mostriamo questa parte solo nel login e non nella registrazione -->
        @if (!isRegistering()){
          
          <button class="w-full border border-gray-300 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <img src="https://www.google.com/favicon.ico" class="w-4 h-4">
            Login with Google
          </button>
          
          <div class="relative flex items-center py-3">
            <div class="flex-grow border-t border-gray-200"></div>
            <span class="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or</span>
            <div class="flex-grow border-t border-gray-200"></div>
          </div>
        }

        <input type="email" [(ngModel)]="email" class="w-full rounded-lg border-gray-300 py-2 px-3 border" placeholder="Email">
        <input type="password" [(ngModel)]="password" class="w-full rounded-lg border-gray-300 py-2 px-3 border" placeholder="Password">
        
        <button (click)="isRegistering() ? register() : login()" ="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
          {{ isRegistering() ? "Sign in" : "Login" }}
        </button>
        
        <!-- per cambiare modalità -->
        <p class= "text-center text-sm text-gray-600 mt-4">
          {{isRegistering() ? "Already have an account?" : "Don't have an account?"}}
          <button (click)="toggleMode()" class="text-blue-600 font-bold hover:underline ml-1">{{isRegistering() ? "Login" : "Sign up"}}</button>
        </p>
      </div>
        
      <div class="mt-6 text-center">
        <button (click)="close.emit()" class="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          &larr; Return to Home
        </button>
      </div>
    </div>
  `
})
export class LoginUserComponent {
  @Output() close = new EventEmitter<void>();
  private hotelService = inject(HotelService);

  email ="";
  password="";

  isRegistering = signal(false);

  toggleMode(){
    this.isRegistering.update(value => !value);
  }

  register(){
    this.hotelService.register(this.email, this.password, "user").subscribe({
      next: (res:any) => {
        alert("You are in! welcome to Hotel.io");
        this.isRegistering.set(false); //torna al form per il login
      },
      error:(err) => {
        alert("Error:" + (err.error?.detail || "Unknown Error"));
      }
    })
  }

  login(){
    this.hotelService.login(this.email, this.password, "user").subscribe({
      next: (res: any) => {
        this.hotelService.currentUser.set({email: this.email, role:"user"});
        this.close.emit(); //torna alla home
      },
      error:(err) => {
        alert("Error:" + (err.error?.detail || "Unknown Error"));
      }
    });
  }
}
