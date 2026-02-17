import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { GlobalConstant } from '../../constants/global.constant';
import { Observable } from 'rxjs';
import { Hotel } from '../../models/hotel.model'; 

@Injectable({
  providedIn: 'root',
})
export class HotelService {
  //passo readonly per indicare che questa proprietà non deve essere modificata dopo l'inizializzazione
 private readonly http = inject(HttpClient);
 private readonly base = environment.API_URL + GlobalConstant.API_END_POINT.HOTEL;
  //metodo per ottenere tutti gli hotel
  getHotels() {
    return this.http.get(this.base);
  }
  //metodo per ottenere la lista degli hotel con parametri di filtro
  list(params?: Record<string, any>): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(this.base, { params });
  }
  //metodo per ottenere gli hotel tramite id
  getById(id: string): Observable<Hotel>{
    return this.http.get<Hotel>(`${this.base}/${id}`)
  }
  
}
 