import { TestBed } from '@angular/core/testing';

import { OpenSharedHotels } from './open-shared-hotels';

describe('OpenSharedHotels', () => {
  let service: OpenSharedHotels;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenSharedHotels);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
