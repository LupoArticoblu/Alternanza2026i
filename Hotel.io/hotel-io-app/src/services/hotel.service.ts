import { Injectable, signal, computed, inject, model } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { hasSubscribers } from 'diagnostics_channel';

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
  aiAnalysis?: AIAnalysis;
  isAnalyzing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HotelService {

  currentUser = signal<any>(null);//memorizza utente loggato
  private http = inject(HttpClient);
  private apiUrl = 'http://hotel.local:8000'; //indirizzo backend locale
  
  private hotelsSignal = signal<Hotel[]>([]); //dove andranno segnati/inseriti i vari hotel
  //metodo login
  login(email: string, password: string, role: string){
    return this.http.post(`${this.apiUrl}/login`, {email, password, role: role});
  }
  //metodo registrazione
  register(email: string, password: string, role: string){
    //chiamata all'endpoint register del backend e crea utente
    return this.http.post(`${this.apiUrl}/register`, {email, password, role: role});
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

    // Set loading state
    this.hotelsSignal.update(hotels =>
      hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: true } : h)
    );

    // try {
    //   const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    //   const reviewsText = hotel.reviews.map(r => `"${r.comment}" (Rating: ${r.rating}/5)`).join('\n');
      
    //   const prompt = `
    //     You are an expert travel critic. Analyze the following reviews for the hotel "${hotel.name}".
    //     Provide a concise summary, a calculated overall score out of 10 based on sentiment, 
    //     a list of key strengths, and a list of key weaknesses.
        
    //     Reviews:
    //     ${reviewsText}
    //   `;

    //   const response = await ai.models.generateContent({
    //     model: 'gemini-2.5-flash',
    //     contents: prompt,
    //     config: {
    //       responseMimeType: 'application/json',
    //       responseSchema: {
    //         type: Type.OBJECT,
    //         properties: {
    //           summary: { type: Type.STRING },
    //           score: { type: Type.NUMBER },
    //           strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    //           weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    //         },
    //         required: ["summary", "score", "strengths", "weaknesses"]
    //       }
    //     }
    //   });

    //   const jsonText = response.text;
    //   if (jsonText) {
    //     const analysis: AIAnalysis = JSON.parse(jsonText);
        
    //     this.hotelsSignal.update(hotels =>
    //       hotels.map(h => h.id === hotelId ? { ...h, aiAnalysis: analysis, isAnalyzing: false } : h)
    //     );
    //   } else {
    //     throw new Error('No response from AI');
    //   }

    // } catch (error) {
    //   console.error('AI Analysis failed', error);
    //   this.hotelsSignal.update(hotels =>
    //     hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: false } : h)
    //   );
    // }

    /*usiamo ollama per la logica del tasto summary*/
    try{
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
        model: "mistral",
        prompt: prompt,
        stream: false,
        format: "json"
       };
       this.http.post("http://localhost:11434/api/generate", body).subscribe({
        next: (res: any) => {
          //trasforma la stringa di ollama in oggetto
          const analysis: AIAnalysis = JSON.parse(res.response);
          //trova l'hotel e aggiorna analisi
          this.hotelsSignal.update(hotels => hotels.map(h => h.id === hotelId ? { ...h, aiAnalysis: analysis, isAnalyzing: false}: h));
        },
        error: (err) =>{
          console.error("Error analyzing reviews:", err);
          //in caso di errore, imposta isAnalyzing a false
          this.hotelsSignal.update(hotels => hotels.map(h => h.id === hotelId ? { ...h, isAnalyzing: false}: h));
        }
       })
    }
    catch(error){

    }
  }
} 