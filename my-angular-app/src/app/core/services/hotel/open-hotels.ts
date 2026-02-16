import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../../../environments/environment';
import { GlobalConstant } from '../../constants/global.constant';

@Injectable({
  providedIn: 'root',
})
export class OpenHotels {
  http = inject(HttpClient);
  
  getHotels() {
    return this.http.get(environment.API_URL + GlobalConstant.API_END_POINT.HOTEL);
  }
}
 