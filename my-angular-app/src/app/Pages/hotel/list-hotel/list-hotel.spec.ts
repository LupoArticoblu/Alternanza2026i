import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListHotel } from './list-hotel';

describe('ListHotel', () => {
  let component: ListHotel;
  let fixture: ComponentFixture<ListHotel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListHotel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListHotel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
