import { Injectable, signal, computed } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface Review {
  id: string;
  user: string;
  comment: string;
  rating: number;
  date: string;
}

export interface AIAnalysis {
  summary: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  price: number;
  imageUrl: string;
  likes: number;
  isLiked: boolean;
  reviews: Review[];
  aiAnalysis?: AIAnalysis;
  isAnalyzing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private hotelsSignal = signal<Hotel[]>([
    {
      id: '1',
      name: 'Grand Plaza Resort',
      location: 'Florence, Italy',
      description: 'Experience luxury in the heart of Tuscany with breathtaking views and world-class amenities.',
      price: 350,
      imageUrl: 'https://picsum.photos/id/10/800/600',
      likes: 124,
      isLiked: false,
      reviews: [
        { id: 'r1', user: 'Alice M.', comment: 'Absolutely stunning views, but the wifi was a bit slow.', rating: 4, date: '2023-10-12' },
        { id: 'r2', user: 'John D.', comment: 'Service was impeccable. Best breakfast I have ever had.', rating: 5, date: '2023-11-01' },
        { id: 'r3', user: 'Sarah K.', comment: 'Too expensive for what it offers. Room was smaller than expected.', rating: 3, date: '2023-11-15' }
      ]
    },
    {
      id: '2',
      name: 'Seaside Paradise Inn',
      location: 'Amalfi Coast, Italy',
      description: 'A cozy retreat steps away from the crystal clear waters of the Mediterranean.',
      price: 220,
      imageUrl: 'https://picsum.photos/id/11/800/600',
      likes: 89,
      isLiked: false,
      reviews: [
        { id: 'r4', user: 'Mike R.', comment: 'Location is unbeatable. Access to the beach is direct.', rating: 5, date: '2023-09-20' },
        { id: 'r5', user: 'Emily W.', comment: 'A bit noisy at night due to the nearby bar.', rating: 4, date: '2023-09-25' }
      ]
    },
    {
      id: '3',
      name: 'Mountain View Lodge',
      location: 'Aspen, USA',
      description: 'Perfect for ski lovers. Warm fireplaces and hot cocoa included.',
      price: 450,
      imageUrl: 'https://picsum.photos/id/29/800/600',
      likes: 210,
      isLiked: true,
      reviews: []
    }
  ]);

  hotels = computed(() => this.hotelsSignal());

  constructor() {}

  addHotel(hotel: Omit<Hotel, 'id' | 'likes' | 'isLiked' | 'reviews'>) {
    const newHotel: Hotel = {
      ...hotel,
      id: crypto.randomUUID(),
      likes: 0,
      isLiked: false,
      reviews: []
    };
    this.hotelsSignal.update(hotels => [newHotel, ...hotels]);
  }

  toggleLike(hotelId: string) {
    this.hotelsSignal.update(hotels =>
      hotels.map(h => {
        if (h.id === hotelId) {
          const isLiked = !h.isLiked;
          return { ...h, isLiked, likes: h.likes + (isLiked ? 1 : -1) };
        }
        return h;
      })
    );
  }

  addReview(hotelId: string, review: Omit<Review, 'id' | 'date'>) {
    const newReview: Review = {
      ...review,
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0]
    };

    this.hotelsSignal.update(hotels =>
      hotels.map(h => {
        if (h.id === hotelId) {
          // Invalidate AI analysis if new review is added
          return { ...h, reviews: [newReview, ...h.reviews], aiAnalysis: undefined };
        }
        return h;
      })
    );
  }

  async analyzeReviews(hotelId: string) {
    const hotel = this.hotelsSignal().find(h => h.id === hotelId);
    if (!hotel || hotel.reviews.length === 0) return;

    // Set loading state
    this.hotelsSignal.update(hotels =>
      hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: true } : h)
    );

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const reviewsText = hotel.reviews.map(r => `"${r.comment}" (Rating: ${r.rating}/5)`).join('\n');
      
      const prompt = `
        You are an expert travel critic. Analyze the following reviews for the hotel "${hotel.name}".
        Provide a concise summary, a calculated overall score out of 10 based on sentiment, 
        a list of key strengths, and a list of key weaknesses.
        
        Reviews:
        ${reviewsText}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              score: { type: Type.NUMBER },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["summary", "score", "strengths", "weaknesses"]
          }
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        const analysis: AIAnalysis = JSON.parse(jsonText);
        
        this.hotelsSignal.update(hotels =>
          hotels.map(h => h.id === hotelId ? { ...h, aiAnalysis: analysis, isAnalyzing: false } : h)
        );
      } else {
        throw new Error('No response from AI');
      }

    } catch (error) {
      console.error('AI Analysis failed', error);
      this.hotelsSignal.update(hotels =>
        hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: false } : h)
      );
    }
  }
}