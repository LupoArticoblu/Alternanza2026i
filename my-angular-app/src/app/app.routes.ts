import { Routes } from '@angular/router';
import { ListHotel } from './Pages/hotel/list/list-hotel';


export const routes: Routes = [
  { path: '', component: Main },
  { path: 'hotels', component: ListHotel },
  { path: 'hotels/:id', component: DetailHotel },
  { path: '**', redirectTo: '' }
];
