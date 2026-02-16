import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './../../../../environments/environment';
import { GlobalConstant } from '../../constants/global.constant';
@Injectable({
  providedIn: 'root',
})
export class MasterService {
  
  http = inject(HttpClient);

  getHotels() {
    /* inserire il link al "genitore" di hotel*/
    return this.http.get(environment.API_URL + GlobalConstant.API_END_POINT.PARENT);
  }
}
