import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewHotel } from './new-hotel';

describe('NewHotel', () => {
  let component: NewHotel;
  let fixture: ComponentFixture<NewHotel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewHotel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewHotel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
