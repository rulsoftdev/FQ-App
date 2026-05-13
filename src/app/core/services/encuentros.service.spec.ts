import { TestBed } from '@angular/core/testing';

import { EncuentrosService } from './encuentros.service';

describe('EncuentrosService', () => {
  let service: EncuentrosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EncuentrosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
