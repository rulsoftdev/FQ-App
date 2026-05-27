import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreadorMision } from './creador-mision';

describe('CrearMision', () => {
  let component: CreadorMision;
  let fixture: ComponentFixture<CreadorMision>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreadorMision],
    }).compileComponents();

    fixture = TestBed.createComponent(CreadorMision);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
