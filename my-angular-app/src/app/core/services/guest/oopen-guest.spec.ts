import { TestBed } from '@angular/core/testing';

import { OopenGuest } from './oopen-guest';

describe('OopenGuest', () => {
  let service: OopenGuest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OopenGuest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
