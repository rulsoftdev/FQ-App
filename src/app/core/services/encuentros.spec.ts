import { TestBed } from '@angular/core/testing';

import { Encuentros } from './encuentros';

describe('Encuentros', () => {
  let service: Encuentros;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Encuentros);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
