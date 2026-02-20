import {Component, EventEmitter, inject, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { HotelService, Hotel } from '../services/hotel.service';

@Component({
  selector: 'app-login-host',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template:`
    <div class ="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-fade-in">
      @if (!isLogged()) {
      
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
          Host login
        </h2>
        <p class="text-gray-600 mb-6 text-center">
          manage your properties and bookings
        </p>

        <div class= "space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="latua@mail.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border" placeholder="••••••••">
          </div>
          <button (click)="login()" class="w-full bg-[#003580] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors">
            Accedi come Host
          </button>
        </div>
        <div class="mt-6 text-center">
          <button (click)="close.emit()" class="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            &larr; Torna alla Home
          </button>
        </div>
      }@else {
        <div class="space-y-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class ="text-2xl font-bold text-grey-900">Dashboard Host</h2>
            <button (click)="logout()" class ="text-sm text-red-500 hover:underline">Exit</button>
          </div>

          <p class="text-gray-600 mb-4">Welcome! Manage your properties here.</p>
          <button (click)="logout()" class="text-red-500 hover:underline font-medium">Logout</button>
        </div>

        <!-- aggiunta nuovi hotel -->
        <button (click)="showForm = true; resetForm()" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">+ Add New Hotel</button>

        @if(showForm){
          <div class="bg-gray-100 p-6 rounded-xl border border-gray-200 mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4">{{editingId ? 'Edit Hotel' : 'Add New Hotel'}}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" [(ngModel)]="hotelForm.name" placeholder="Hotel Name" class="p-2 border rounded">
              <input type="text" [(ngModel)]="hotelForm.location" placeholder="Location" class="p-2 border rounded">
              <input type="number" [(ngModel)]="hotelForm.price" placeholder="Price per night($)" class="p-2 border rounded">
              <input type="text" [(ngModel)]="hotelForm.imageUrl" placeholder="Image URL" class="p-2 border rounded">
              <textarea type="text" [(ngModel)]="hotelForm.description" placeholder="Description" class="p-2 border rounded md:col-span-2"></textarea>
            </div>
            <div class="mt-4 flex gap-2 justify-end">
              <button (click)="showForm = false;resetForm()" class="px-4 py-2 text-gray-500">Cancel</button>
              <button (click)="saveHotel()" class="bg-blue-600 text-white px-6 py-2 rounded font-bold disabled:opacity-50" [disabled]="!isValid()">
                {{ editingId ? 'Update Hotel' : 'Add Hotel'}}
              </button>
            </div>
          </div>
        }
        <!-- lista hotel -->
        <div class="grid gap-4">
          @for(hotel of hotels(); track hotel.id){
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
              <div class="flex items-center gap-4">
                <img [src]="hotel.imageUrl" class="w-12 h-12 object-cover rounded-lg shadow-sm" alt="null">
                <div>
                  <h4 class="font-bold text-gray-800">{{hotel.name}}</h4>
                  <p class="text-gray-500 text-xs">{{hotel.location}}</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button class="text-blue-600 hover:bg-50-blue rounded-lg transition-colors" (click)="editHotel(hotel)">Edit</button>
                <button class="text-red-600 hover:bg-50-blue rounded-lg transition-colors" (click)="deleteHotel(hotel.id)">Delete</button>
              </div>
            </div>

          }
        </div>
      }
    </div>
      `,

})      
export class LoginHostComponent {
  @Output() close = new EventEmitter<void>();

  private hotelService = inject(HotelService);
  hotels = this.hotelService.hotels;

  isLogged = signal(false);
  showForm = false;
  editingId: string | null = null;

  //modello form
  hotelForm={
    name: '',
    location: '',
    description:'',
    price: null as number | null,
    imageUrl: '',
  };

  //login e logout simulati
  login(){
    this.isLogged.set(true);
  }
  logout(){
    this.isLogged.set(false);
  }

  // modifica
  editHotel(hotel: Hotel){
    this.editingId = hotel.id;
    this.hotelForm = {
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
      price: hotel.price,
      imageUrl: hotel.imageUrl
    };
    //scroll in cima
    this.showForm = true;
    window.scrollTo(0,0);
  }
  //cancella hotel
  deleteHotel(id: string){
    if(confirm('Are you sure?')){
      this.hotelService.deleteHotel(id);
    }
  }
  //resetta il form
  resetForm(){
    this.hotelForm ={
      name:'',
      location:'',
      description:'',
      price:null,
      imageUrl:'',
    };
    this.editingId = null;
  }
  //Verifica dei campi obbligatori
  isValid(){
    return this.hotelForm.name && this.hotelForm.location && this.hotelForm.price;
  }
  //salva l'hotel o aggiorna
  saveHotel(){
    if(!this.isValid()) return;

    const hotelData = {
      name: this.hotelForm.name,
      location: this.hotelForm.location,
      description: this.hotelForm.description,
      price: this.hotelForm.price,
      imageUrl: this.hotelForm.imageUrl || `https://picsum.photos/800/600?random=${Math.floor(Math.random()*1000)}`
    };

    if(this.editingId){
      //se modifichiamo cerchiamo l'originale per mantenere id e recensioni
      const existing = this.hotels().find(h => h.id === this.editingId);

      if (existing){
        this.hotelService.updateHotel({ ...existing, ...hotelData});
      }
    } else {
      //ne creiamo uno
      this.hotelService.addHotel(hotelData);
    }
    this.showForm = false; //nascondiamo i form
    this.resetForm(); //puliamo i campi
  }
}