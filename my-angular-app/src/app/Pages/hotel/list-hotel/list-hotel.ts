import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Hotel } from '../../../core/models/hotel.model';
import { HotelService } from '../../../core/services/hotel/hotel.service';

@Component({
  selector: 'app-list-hotel',
  imports: [CommonModule, RouterLink],
  template: `
    <section @if="hotels().length > 0; else loading">
      <article *ngFor="let hotel of hotels()">
        <a [routerLink]="['/hotel', hotel.id]">{{ hotel.name }}</a>
        <div>{{ hotel.city ?? 'City not available' }} - €{{ hotel.priceFrom }}</div>
      </article>
    </section>
  `,
  styleUrl: './list-hotel.scss',
})
export class ListHotel {
  
  hotels$: Observable<Hotel[]>;
  constructor(private hotelSvc: HotelService) {
    this.hotels$ = this.hotelSvc.list();
  }
}
