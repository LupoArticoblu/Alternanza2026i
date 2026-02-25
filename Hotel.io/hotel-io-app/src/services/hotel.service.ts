import { Injectable, signal, computed, inject } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { HttpClient } from '@angular/common/http';

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

  currentUser = signal<any>(null);//memorizza utente loggato
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000'; //indirizzo fast api backend

  private hotelsSignal = signal<Hotel[]>([]); //dove andranno segnati/inseriti i vari hotel

  login(email: string, password: string, role: string){
    return this.http.post(`${this.apiUrl}/login`, {email, password, role: role});
  }

  fetchHotels(){
    this.http.get<Hotel[]>(`${this.apiUrl}/hotels`).subscribe(data => {
      this.hotelsSignal.set(data);
    });
  }

  hotels = computed(() => this.hotelsSignal());

  constructor() {
    this.fetchHotels(); //carica gli hotel dal db all'avvio
  }

  // addHotel(hotel: Omit<Hotel, 'id' | 'likes' | 'isLiked' | 'reviews'>) {
  //   const newHotel: Hotel = {
  //     ...hotel,
  //     id: crypto.randomUUID(),
  //     likes: 0,
  //     isLiked: false,
  //     reviews: []
  //   };
  //   this.hotelsSignal.update(hotels => [newHotel, ...hotels]);
  // }

  addHotel(hotelData: any, ownerId: string) {
  // Inviamo i dati al backend. 
  // Nota: usiamo i parametri per passare l'owner_id
  this.http.post<Hotel>(`${this.apiUrl}/hotels?owner_id=${ownerId}`, hotelData)
    .subscribe({
      next: () => {
        // Dopo aver salvato, ricarichiamo la lista
        this.fetchHotels();
      },
      error: (err) => console.error('Errore durante il salvataggio:', err)
    });
}

  // updateHotel(updateHotel:Hotel){
  //   this.hotelsSignal.update(hotels => hotels.map(h => h.id === updateHotel.id ? updateHotel : h));
  // }

  updateHotel(hotel:Hotel){
    this.http.put<Hotel>(`${this.apiUrl}/hotels/${hotel.id}`,hotel).subscribe(() => this.fetchHotels());
  }

  // deleteHotel(id:string){
  //   this.hotelsSignal.update(hotels => hotels.filter(h => h.id !== id));
  // }

  deleteHotel(id:string){
    if(confirm("Are you sure want to delete this hotel?")){
      this.http.delete(`${this.apiUrl}/hotels/${id}`).subscribe(() => this.fetchHotels());
    }
  }

  toggleLike(hotelId: string, user_id: string) {
    this.http.post(`${this.apiUrl}/hotels/${hotelId}/like?user_id=${user_id}`,
      {}).subscribe(() => this.fetchHotels());
  }

  addReview(hotelId: string, reviewData: any, userId: string) {
    this.http.post(`${this.apiUrl}/hotels/${hotelId}/reviews?user_id=${userId}`, reviewData).subscribe(() => this.fetchHotels());
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