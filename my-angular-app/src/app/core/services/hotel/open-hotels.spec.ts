import { TestBed } from '@angular/core/testing';

import { OpenHotels } from './open-hotels';

describe('OpenHotels', () => {
  let service: OpenHotels;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenHotels);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
