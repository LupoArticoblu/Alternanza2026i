/*
    Servizio per comunicare con l'endpoint chatbot del backend.
    Espone `sendMessage` che invia la richiesta e restituisce la risposta.
*/
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface FAQEntry {
    question: string;
    answer: string;
}

export interface ChatRequest {
    message: string;
    temperature?: number;
    max_new_tokens?: number;
}

export interface ChatResponse {
    answer: string;
    source: string;
    context?: string[];
    faq_suggestions?: FAQEntry[];
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = 'http://localhost:8000/chatbot';

    constructor(private http: HttpClient) {}

    sendMessage(request: ChatRequest): Observable<ChatResponse> {
        return this.http.post<ChatResponse>(this.apiUrl, request).pipe(
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
        let msg = 'An unknown error occurred';
        if (error.error?.detail) {
            msg = typeof error.error.detail === 'string' 
                ? error.error.detail 
                : JSON.stringify(error.error.detail);
        } else if (error.message) {
            msg = error.message;
        }
        console.error('ChatService error:', msg);
        return throwError(() => new Error(msg));
    }
}
