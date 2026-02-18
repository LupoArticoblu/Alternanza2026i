import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hotel, HotelService } from '../services/hotel.service';
import { StarRatingComponent } from './star-rating.component';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent],
  template: `
    <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <!-- Header Image Area -->
      <div class="relative h-64 md:h-80 w-full overflow-hidden">
        <img [src]="hotel().imageUrl" [alt]="hotel().name" class="w-full h-full object-cover">
        <button 
          (click)="close.emit()"
          class="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all text-gray-700 hover:text-gray-900 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
          <h2 class="text-3xl font-bold">{{ hotel().name }}</h2>
          <p class="text-white/90 flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {{ hotel().location }}
          </p>
        </div>
      </div>

      <div class="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Details & Reviews -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Description -->
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-3">About this property</h3>
            <p class="text-gray-600 leading-relaxed">{{ hotel().description }}</p>
            <div class="mt-4 flex items-center gap-4">
              <span class="text-2xl font-bold text-blue-600">\${{ hotel().price }} <span class="text-sm font-normal text-gray-500">/ night</span></span>
              <button 
                (click)="onToggleLike()"
                class="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                [class.bg-pink-50]="hotel().isLiked"
                [class.border-pink-200]="hotel().isLiked"
                [class.text-pink-600]="hotel().isLiked"
                [class.bg-gray-50]="!hotel().isLiked"
                [class.border-gray-200]="!hotel().isLiked"
                [class.text-gray-600]="!hotel().isLiked"
              >
                <svg xmlns="http://www.w3.org/2000/svg" [class.fill-current]="hotel().isLiked" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {{ hotel().likes }} Likes
              </button>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Reviews Section -->
          <div>
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-gray-800">Guest Reviews ({{ hotel().reviews.length }})</h3>
              
              <!-- AI Analyze Button -->
               @if (hotel().reviews.length > 0) {
                 <button 
                  (click)="analyzeWithAI()"
                  [disabled]="hotel().isAnalyzing"
                  class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium">
                  @if (hotel().isAnalyzing) {
                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    AI Summary
                  }
                </button>
               }
            </div>

            <!-- AI Result Card -->
            @if (hotel().aiAnalysis) {
              <div class="mb-8 bg-indigo-50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-32 h-32">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                
                <div class="relative z-10">
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="text-indigo-900 font-bold text-lg flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-indigo-600">
                          <path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clip-rule="evenodd" />
                       </svg>
                      AI Verdict
                    </h4>
                    <div class="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {{ hotel().aiAnalysis?.score }}/10
                    </div>
                  </div>
                  
                  <p class="text-indigo-800 mb-6 italic">"{{ hotel().aiAnalysis?.summary }}"</p>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="bg-white/60 rounded-lg p-3">
                      <h5 class="text-green-700 font-semibold text-sm mb-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                        </svg>
                        Strengths
                      </h5>
                      <ul class="list-none space-y-1">
                        @for (strength of hotel().aiAnalysis?.strengths; track strength) {
                          <li class="text-sm text-gray-700 pl-2 border-l-2 border-green-300">{{ strength }}</li>
                        }
                      </ul>
                    </div>
                    <div class="bg-white/60 rounded-lg p-3">
                      <h5 class="text-red-700 font-semibold text-sm mb-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                        Weaknesses
                      </h5>
                      <ul class="list-none space-y-1">
                        @for (weakness of hotel().aiAnalysis?.weaknesses; track weakness) {
                          <li class="text-sm text-gray-700 pl-2 border-l-2 border-red-300">{{ weakness }}</li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Review List -->
            @if (hotel().reviews.length === 0) {
              <div class="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p class="text-gray-500">No reviews yet. Be the first to share your experience!</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (review of hotel().reviews; track review.id) {
                  <div class="border-b border-gray-100 last:border-0 pb-4">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {{ review.user.charAt(0) }}
                        </div>
                        <span class="font-medium text-gray-800">{{ review.user }}</span>
                      </div>
                      <span class="text-xs text-gray-400">{{ review.date }}</span>
                    </div>
                    <div class="flex mb-2">
                       <app-star-rating [rating]="review.rating" />
                    </div>
                    <p class="text-gray-600 text-sm">{{ review.comment }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Right Column: Add Review Form -->
        <div class="lg:col-span-1">
          <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-4">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Write a Review</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="newReview.user"
                  placeholder="e.g. John Doe"
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div class="flex gap-2">
                  @for (star of [1,2,3,4,5]; track star) {
                    <button 
                      type="button"
                      (click)="newReview.rating = star"
                      class="focus:outline-none transition-transform hover:scale-110">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        [class.text-yellow-400]="star <= newReview.rating"
                        [class.text-gray-300]="star > newReview.rating"
                        class="w-8 h-8">
                        <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  }
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Review</label>
                <textarea 
                  [(ngModel)]="newReview.comment"
                  rows="4"
                  placeholder="Share your experience..."
                  class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
                ></textarea>
              </div>

              <button 
                (click)="onSubmitReview()"
                [disabled]="!isValidReview()"
                class="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Submit Review
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: ``
})
export class HotelDetailComponent {
  hotel = input.required<Hotel>();
  close = output<void>();

  newReview = {
    user: '',
    rating: 5,
    comment: ''
  };

  constructor(private hotelService: HotelService) {}

  onToggleLike() {
    this.hotelService.toggleLike(this.hotel().id);
  }

  analyzeWithAI() {
    this.hotelService.analyzeReviews(this.hotel().id);
  }

  isValidReview(): boolean {
    return this.newReview.user.trim().length > 0 && this.newReview.comment.trim().length > 0;
  }

  onSubmitReview() {
    if (this.isValidReview()) {
      this.hotelService.addReview(this.hotel().id, {
        user: this.newReview.user,
        rating: this.newReview.rating,
        comment: this.newReview.comment
      });
      // Reset form
      this.newReview = { user: '', rating: 5, comment: '' };
    }
  }
}