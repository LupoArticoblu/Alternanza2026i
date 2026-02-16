import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewHotel } from './review-hotel';

describe('ReviewHotel', () => {
  let component: ReviewHotel;
  let fixture: ComponentFixture<ReviewHotel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewHotel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewHotel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
