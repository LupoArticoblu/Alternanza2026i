import { Injectable, signal, computed, inject, model } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  images?: string[];
  likes: number;
  isLiked: boolean;
  reviews: Review[];
  distanceFromCenter?: number;
  aiAnalysis?: AIAnalysis;
  isAnalyzing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HotelService {

  currentUser = signal<any>(null);//memorizza utente loggato
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000'; // backend API endpoint
  
  private hotelsSignal = signal<Hotel[]>([]); //dove andranno segnati/inseriti i vari hotel
  //metodo login
  login(email: string, password: string, role: string){
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    return this.http.post(`${this.apiUrl}/login`, {email: cleanEmail, password: cleanPassword, role: role});
  }
  //metodo registrazione
  register(email: string, password: string, role: string){
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    //chiamata all'endpoint register del backend e crea utente
    return this.http.post(`${this.apiUrl}/register`, {email: cleanEmail, password: cleanPassword, role: role});
  }
  // metodo per recuperare gli hotel, usando automaticamente l'utente loggato se presente
  fetchHotels(){
    const user = this.currentUser();
    let url = `${this.apiUrl}/hotels`;
    if (user?.email) {
      url += `?user_id=${encodeURIComponent(user.email)}`;
    }
    this.http.get<Hotel[]>(url).subscribe({
      next: (data) => this.hotelsSignal.set(data),
      error: (err) => console.error('Error fetching hotels:', err)
    });
  }

  hotels = computed(() => this.hotelsSignal());

  constructor() {
    this.fetchHotels();
  }

  addHotel(hotelData: any, ownerId: string) {
    this.http.post<Hotel>(`${this.apiUrl}/hotels?owner_id=${ownerId}`, hotelData)
      .subscribe({
        next: () => {
          this.fetchHotels();
        },
        error: (err) => console.error('Errore durante il salvataggio:', err)
      });
  }

  updateHotel(hotel:Hotel){
    this.http.put<Hotel>(`${this.apiUrl}/hotels/${hotel.id}`,hotel).subscribe(() => this.fetchHotels());
  }

  deleteHotel(id:string){
    if(confirm("Are you sure want to delete this hotel?")){
      this.http.delete(`${this.apiUrl}/hotels/${id}`).subscribe(() => this.fetchHotels());
    }
  }

  toggleLike(hotelId: string, user_id: string) {
    const url = `${this.apiUrl}/hotels/${hotelId}/like?user_id=${encodeURIComponent(user_id)}`;
    this.http.post(url, {}).subscribe({
      next: () => this.fetchHotels(),
      error: (err) => {
        console.error('Like error:', err);
        const detail = err.error?.detail || 'Unknown error';
        alert(`Error: ${detail}`);
      }
    });
  }

  addReview(hotelId: string, reviewData: any, userId: string) {
    this.http.post(`${this.apiUrl}/hotels/${hotelId}/reviews?user_id=${userId}`, reviewData).subscribe(() => this.fetchHotels());
  }

  async analyzeReviews(hotelId: string) {
    const hotel = this.hotelsSignal().find(h => h.id === hotelId);
    if (!hotel || hotel.reviews.length === 0) return;
    
    if (hotel.aiAnalysis) return; 

    this.hotelsSignal.update(hotels =>
      hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: true } : h)
    );

    try {
      const reviewsText = hotel.reviews.map(r => `${r.user}: ${r.comment}: ${r.rating}`).join('\n');
      const prompt = `
        you are an expert travel critic. Analyze the following reviews for the hotel "${hotel.name}".
        Provide a concise summary, a calculated overall score out of 10 based on sentiment, 
        a list of key strengths, and a list of key weaknesses.
        WARNING! answer only in json format:
        {
          "summary": "concise summary",
          "score": 10,
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"]
        }
        Reviews:
        ${reviewsText}
      `; 
      const body = {
        model: "phi3",
        prompt: prompt,
        stream: false,
        format: "json"
       };
       this.http.post("http://localhost:11434/api/generate", body).subscribe({
        next: (res: any) => {
          const analysis: AIAnalysis = JSON.parse(res.response);
          this.hotelsSignal.update(hotels => hotels.map(h => h.id === hotelId ? { ...h, aiAnalysis: analysis, isAnalyzing: false}: h));
          this.http.post(`${this.apiUrl}/hotels/${hotelId}/ai_summary`, analysis).subscribe();
        },
        error: (err) =>{
          console.error("Error analyzing reviews:", err);
          this.hotelsSignal.update(hotels => hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: false}: h));
        }
       });
    }
    catch(error){
      console.error("Error analyzing reviews:", error);
      this.hotelsSignal.update(hotels =>
        hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: false}: h)
      );
    }
  }
}
