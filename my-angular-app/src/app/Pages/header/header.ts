import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  //tutte le funzioni o variabili che servono per header vanno qui dentro

  title = 'Hotel.lo';
  classHeader = 'header';


}
