import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

export interface ChatRequest {
    message: string;
    temperature?: number; // opzionale, controlla la creatività della risposta
    max_new_tokens?: number; //controlla la lunghezza massima della risposta
}

export interface ChatResponse {
    answer: string;
    source: "faq" | "local-llm" 
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = 'http://localhost:8000/chat'; // URL del backend

    constructor(private http: HttpClient) {}

    sendMessage(request: ChatRequest): Observable<ChatResponse> {
        return this.http.post<ChatResponse>(this.apiUrl, request).pipe(catchError(this.handleError)); 
    }

    private handleError(error: HttpErrorResponse) {
        const msg = error.error?.detail || error.message || 'An unknown error occurred';
        console.error('ChatService error:', msg);
        return throwError(() => new Error(msg));
    }
}