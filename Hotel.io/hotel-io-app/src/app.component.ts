import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hotel, HotelService } from './services/hotel.service';
import { HotelDetailComponent } from './components/hotel-detail.component';

type ViewMode = 'list' | 'create' | 'detail';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HotelDetailComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Navbar -->
      <nav class="bg-[#003580] text-white p-4 shadow-md sticky top-0 z-50">
        <div class="container mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2 cursor-pointer" (click)="setView('list')">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
            <span class="text-xl font-bold tracking-tight">BookGenius</span>
          </div>
          <button 
            (click)="setView('create')"
            class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            List Your Property
          </button>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-grow container mx-auto p-4 md:p-6">
        
        <!-- View: List Hotels -->
        @if (currentView() === 'list') {
          <div class="space-y-6 animate-fade-in">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 class="text-3xl font-bold text-gray-900">Find your next stay</h1>
              <div class="text-gray-500">{{ hotels().length }} properties found</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (hotel of hotels(); track hotel.id) {
                <div 
                  class="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden flex flex-col group cursor-pointer"
                  (click)="selectHotel(hotel)">
                  <div class="relative h-48 overflow-hidden">
                    <img 
                      [src]="hotel.imageUrl" 
                      [alt]="hotel.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    >
                    <div class="absolute top-3 right-3">
                       <button 
                        (click)="$event.stopPropagation(); toggleLike(hotel.id)"
                        class="p-2 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          [class.fill-red-500]="hotel.isLiked"
                          [class.text-red-500]="hotel.isLiked"
                          [class.text-gray-400]="!hotel.isLiked"
                          viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 transition-colors">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                      </button>
                    </div>
                    @if (hotel.reviews.length > 0) {
                      <div class="absolute bottom-3 left-3 bg-white px-2 py-1 rounded-md text-xs font-bold shadow text-gray-800 flex items-center gap-1">
                        <span>{{ getAverageRating(hotel) }}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3 text-yellow-400">
                          <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    }
                  </div>
                  <div class="p-5 flex flex-col flex-grow">
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{{ hotel.name }}</h3>
                    </div>
                    <p class="text-sm text-gray-500 mb-4 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {{ hotel.location }}
                    </p>
                    <p class="text-gray-600 text-sm line-clamp-2 mb-4 flex-grow">{{ hotel.description }}</p>
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <span class="text-lg font-bold text-gray-900">\${{ hotel.price }}</span>
                      <span class="text-sm text-blue-600 font-medium group-hover:underline">See availability ></span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- View: Create Hotel -->
        @if (currentView() === 'create') {
          <div class="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div class="flex items-center justify-between mb-8">
              <h2 class="text-2xl font-bold text-gray-800">List Your Property</h2>
              <button (click)="setView('list')" class="text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
            
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="newHotel.name"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                  placeholder="e.g. Sunset Villa"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                  type="text" 
                  [(ngModel)]="newHotel.location"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                  placeholder="e.g. Paris, France"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Price per Night ($)</label>
                <input 
                  type="number" 
                  [(ngModel)]="newHotel.price"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                  placeholder="100"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows="3"
                  [(ngModel)]="newHotel.description"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                  placeholder="Describe what makes your property special..."
                ></textarea>
              </div>

               <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input 
                  type="text" 
                  [(ngModel)]="newHotel.imageUrl"
                  class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
                  placeholder="https://..."
                >
                <p class="text-xs text-gray-500 mt-1">Leave empty for a random image.</p>
              </div>

              <div class="pt-4">
                <button 
                  (click)="createHotel()"
                  [disabled]="!isValidHotel()"
                  class="w-full bg-[#003580] text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                  Create Listing
                </button>
              </div>
            </div>
          </div>
        }

        <!-- View: Detail -->
        @if (currentView() === 'detail' && selectedHotel()) {
           <app-hotel-detail 
             [hotel]="selectedHotel()!" 
             (close)="setView('list')" 
           />
        }
      </main>

      <footer class="bg-gray-100 border-t border-gray-200 mt-12 py-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 BookGenius. Powered by Google Gemini.</p>
      </footer>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out forwards;
    }
  `]
})
export class AppComponent {
  hotels = this.hotelService.hotels;
  
  currentView = signal<ViewMode>('list');
  selectedHotelId = signal<string | null>(null);
  
  selectedHotel = computed(() => 
    this.hotels().find(h => h.id === this.selectedHotelId()) || null
  );

  newHotel = {
    name: '',
    location: '',
    description: '',
    price: null as number | null,
    imageUrl: ''
  };

  constructor(private hotelService: HotelService) {}

  setView(view: ViewMode) {
    this.currentView.set(view);
    if (view === 'list') {
      this.selectedHotelId.set(null);
    }
    window.scrollTo(0, 0);
  }

  selectHotel(hotel: Hotel) {
    this.selectedHotelId.set(hotel.id);
    this.setView('detail');
  }

  toggleLike(id: string) {
    this.hotelService.toggleLike(id);
  }

  getAverageRating(hotel: Hotel): string {
    if (hotel.reviews.length === 0) return 'New';
    const sum = hotel.reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / hotel.reviews.length).toFixed(1);
  }

  isValidHotel(): boolean {
    return !!(
      this.newHotel.name &&
      this.newHotel.location &&
      this.newHotel.description &&
      this.newHotel.price
    );
  }

  createHotel() {
    if (!this.isValidHotel()) return;

    this.hotelService.addHotel({
      name: this.newHotel.name,
      location: this.newHotel.location,
      description: this.newHotel.description,
      price: this.newHotel.price || 0,
      imageUrl: this.newHotel.imageUrl || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`
    });

    this.newHotel = {
      name: '',
      location: '',
      description: '',
      price: null,
      imageUrl: ''
    };
    
    this.setView('list');
  }
}