import {Component, EventEmitter, inject, Output, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { HotelService, Hotel } from '../services/hotel.service';

@Component({
  selector: 'app-login-host',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template:`
    <div class ="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 animate-fade-in">
      <!-- se non è loggato mostra il form di login/registrazione -->
      @if (!isLogged()) {
      
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
          {{ isRegistering() ? "Host Registration" : "Host Login" }}
        </h2>
        <p class="text-gray-600 mb-6 text-center">
          {{ isRegistering() ? "Create an account to manage your properties" : "Manage your properties and bookings" }}
        </p>

        <div class= "space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" [(ngModel)]="loginEmail" (keydown.enter)="passwordInput.focus()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="latua@mail.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" [(ngModel)]="loginPassword" (keydown.enter)="isRegistering() ? register() : login()" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border" placeholder="••••••••">
          </div>
          <button (click)="isRegistering() ? register() : login()" class="w-full bg-[#003580] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors">
            {{ isRegistering() ? "Register as Host" : "Login as Host" }}
          </button>
          
          <p class="text-center text-sm text-gray-600 mt-4">
            {{ isRegistering() ? "Already have an account?" : "Don't have an account?" }}
            <button (click)="toggleMode()" class="text-blue-600 font-bold hover:underline ml-1">
               {{ isRegistering() ? "Login" : "Sign up" }}
            </button>
          </p>
        </div>
        <div class="mt-6 text-center">
          <button (click)="close.emit()" class="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            &larr; Back to Home
          </button>
        </div>
        <!-- se è loggato mostra dashboard -->
      } @else {
        <div class="space-y-6">
          <div class="flex justify-between items-center pb-4 border-b border-gray-100">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Dashboard Host</h2>
              <p class="text-xs text-gray-500">{{loggedEmail}}</p>
            </div>
            <button (click)="logout()" class="text-sm font-medium text-red-500 hover:text-red-700 transition-colors px-3 py-1 rounded-md hover:bg-red-50">
              Logout
            </button>
          </div>

          @if(!showForm){
            <div class="py-4 text-center">
              <p class="text-gray-600 mb-6">Manage your properties and reach more customers.</p>
              <button (click)="showForm = true; resetForm()" class="w-full bg-[#003580] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                <span class="text-xl">+</span> Add New Hotel
              </button>
            </div>
          } @else {
            <div class="space-y-5 animate-fade-in">
              <h3 class="text-lg font-bold text-gray-800 mb-4 border-l-4 border-[#003580] pl-3">
                {{editingId ? 'Edit Hotel' : 'Create New Hotel'}}
              </h3>
              
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Hotel Name</label>
                  <input type="text" [(ngModel)]="hotelForm.name" placeholder="Grand Hotel" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</label>
                  <input type="text" [(ngModel)]="hotelForm.location" placeholder="City, Country" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Price / Night</label>
                    <input type="number" [(ngModel)]="hotelForm.price" placeholder="€" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Hotel Images</label>
                    <div class="flex flex-col gap-3">
                      @if (hotelForm.images.length > 0) {
                        <div class="flex gap-2 flex-wrap">
                          @for (img of hotelForm.images; track $index) {
                            <div class="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group shadow-sm">
                              <img [src]="img" class="w-full h-full object-cover" alt="Preview">
                              @if ($index === 0) {
                                <span class="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[9px] text-center py-0.5">Cover</span>
                              }
                              <button (click)="removeImage($index)" class="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          }
                        </div>
                      }
                      <label class="flex items-center justify-center gap-2 w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        <span class="text-sm text-gray-600">Add Images</span>
                        <input type="file" class="hidden" accept="image/*" multiple (change)="onFilesSelected($event)">
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea rows="3" [(ngModel)]="hotelForm.description" placeholder="A brief description of your property..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                </div>
              </div>

              <div class="flex gap-2 pt-2">
                <button (click)="showForm = false; resetForm()" class="flex-1 px-4 py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                  Cancel
                </button>
                <button (click)="saveHotel()" class="flex-[2] bg-[#003580] text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition-all disabled:opacity-50 shadow-md" [disabled]="!isValid()">
                  {{ editingId ? 'Save Changes' : 'Publish Hotel'}}
                </button>
              </div>
            </div>
          }
          <!-- lista hotel -->
          @if(!showForm){
            <div class="pt-4 mt-4 border-t border-gray-100">
              <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Your Properties</h3>
              <div class="space-y-3">
                @for(hotel of hotels(); track hotel.id){
                  @if(hotel.owner_id === loggedEmail){
                    <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
                      <div class="flex items-center gap-3">
                        <img [src]="hotel.imageUrl" class="w-12 h-12 object-cover rounded-lg shadow-sm" alt="Hotel image">
                        <div>
                          <h4 class="font-bold text-gray-800 text-sm leading-tight">{{hotel.name}}</h4>
                          <p class="text-gray-400 text-xs">{{hotel.location}}</p>
                        </div>
                      </div>
                      <div class="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" (click)="editHotel(hotel)" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" (click)="deleteHotel(hotel.id)" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  }
                } @empty {
                   <div class="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                     <p class="text-gray-400 text-sm italic">No properties yet.</p>
                   </div>
                }
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
  isRegistering = signal(false);

  showForm = false;
  editingId: string | null = null;

  // Campi per il login
  loginEmail = '';
  loginPassword = '';
  loggedEmail = '';

  //modello form
  hotelForm={
    name: '',
    location: '',
    description:'',
    price: null as number | null,
    imageUrl: '',
    images: [] as string[],
  };

  toggleMode() {
    this.isRegistering.update(val => !val);
  }

  //login e logout
  login(){
    if (this.loginEmail && this.loginPassword) {
      this.hotelService.login(this.loginEmail, this.loginPassword, "host").subscribe({
        next:(res: any) =>{
          //login ok? segna email e password come loggati
          this.loggedEmail = this.loginEmail;
          this.hotelService.currentUser.set({email: this.loginEmail, role: 'host'});
          this.isLogged.set(true);
          // fetch hotels to get liked status
          this.hotelService.fetchHotels();
        }, 
        error:(err) =>{
          console.error('Host login error:', err);
          const detail = err.error?.detail ? (typeof err.error.detail === 'string' ? err.error.detail : JSON.stringify(err.error.detail)) : 'Unknown Error';
          alert(`Login Error (Status ${err.status}): ${detail}`);
        }
      });
    }else{
      alert('Insert email and password');
    }
  }

  register() {
    if (this.loginEmail && this.loginPassword) {
      this.hotelService.register(this.loginEmail, this.loginPassword, "host").subscribe({
        next: (res: any) => {
          alert('Host registered successfully! Now you can login.');
          this.isRegistering.set(false);
        },
        error: (err) => {
          console.error('Host registration error:', err);
          const detail = err.error?.detail ? (typeof err.error.detail === 'string' ? err.error.detail : JSON.stringify(err.error.detail)) : 'Unknown Error';
          alert(`Registration Error (Status ${err.status}): ${detail}`);
        }
      });
    } else {
      alert('Insert email and password to register');
    }
  }

  logout(){
    this.isLogged.set(false);
    this.hotelService.currentUser.set(null); //rimuovi l'utente loggato
    this.loggedEmail = '';
    this.loginEmail = '';
    this.loginPassword = '';
    this.hotelService.fetchHotels(); // ricarica tutto senza filtro utente
  }

  toggleLike(hotelId: string) {
    if (this.loggedEmail) {
      this.hotelService.toggleLike(hotelId, this.loggedEmail);
    }
  }

  // modifica
  editHotel(hotel: Hotel){
    this.editingId = hotel.id;
    this.hotelForm = {
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
      price: hotel.price,
      imageUrl: hotel.imageUrl,
      images: hotel.images ? [...hotel.images] : (hotel.imageUrl ? [hotel.imageUrl] : [])
    };
    //scroll in cima
    this.showForm = true;
    window.scrollTo(0,0);
  }

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.hotelForm.images.push(e.target.result);
          // La prima immagine diventa la cover (imageUrl)
          if (this.hotelForm.images.length === 1) {
            this.hotelForm.imageUrl = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // reset input so the same file can be re-selected
    event.target.value = '';
  }

  removeImage(index: number) {
    this.hotelForm.images.splice(index, 1);
    this.hotelForm.imageUrl = this.hotelForm.images[0] ?? '';
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
      images:[],
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

    const fallbackUrl = `https://picsum.photos/800/600?random=${Math.floor(Math.random()*1000)}`;
    const images = this.hotelForm.images.length > 0 ? this.hotelForm.images : [fallbackUrl];
    const hotelData = {
      name: this.hotelForm.name,
      location: this.hotelForm.location,
      description: this.hotelForm.description,
      price: this.hotelForm.price,
      imageUrl: images[0],
      images: images
    };

    if(this.editingId){
      //se modifichiamo cerchiamo l'originale per mantenere id e recensioni
      const existing = this.hotels().find(h => h.id === this.editingId);

      if (existing){
        this.hotelService.updateHotel({ ...existing, ...hotelData});
      }
    } else {
      //ne creiamo uno
      this.hotelService.addHotel(hotelData, this.loggedEmail);
    }
    this.showForm = false; //nascondiamo i form
    this.resetForm(); //puliamo i campi
  }
}