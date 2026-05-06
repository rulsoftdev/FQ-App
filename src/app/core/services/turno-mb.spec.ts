import { TestBed } from '@angular/core/testing';

import { TurnoMB } from './turno-mb';

describe('TurnoMB', () => {
  let service: TurnoMB;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TurnoMB);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
