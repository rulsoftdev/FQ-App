import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuegoContainer } from './juego-container';

describe('JuegoContainer', () => {
  let component: JuegoContainer;
  let fixture: ComponentFixture<JuegoContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuegoContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(JuegoContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
