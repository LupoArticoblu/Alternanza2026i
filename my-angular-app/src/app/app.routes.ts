import { Routes } from '@angular/router';
import { ListHotel } from './Pages/hotel/list/list-hotel';


export const routes: Routes = [
  { path: '', component: ListHotel },
  { path: 'hotels', component: ListHotel },
  { path: '**', redirectTo: '' }
];
