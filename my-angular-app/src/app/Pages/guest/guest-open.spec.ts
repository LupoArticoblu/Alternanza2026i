import { TestBed } from '@angular/core/testing';

import { GuestOpen } from './guest-open';

describe('GuestOpen', () => {
  let service: GuestOpen;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuestOpen);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
