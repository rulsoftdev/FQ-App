import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnoMB } from './turno-mb';

describe('TurnoMB', () => {
  let component: TurnoMB;
  let fixture: ComponentFixture<TurnoMB>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnoMB],
    }).compileComponents();

    fixture = TestBed.createComponent(TurnoMB);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
