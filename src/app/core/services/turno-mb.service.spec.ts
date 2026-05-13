import { TestBed } from '@angular/core/testing';

import { TurnoMBService } from './turno-mb.service';

describe('TurnoMBService', () => {
  let service: TurnoMBService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TurnoMBService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
