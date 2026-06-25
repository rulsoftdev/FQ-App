import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Campanyas } from './campanyas';

describe('Campanyas', () => {
  let component: Campanyas;
  let fixture: ComponentFixture<Campanyas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Campanyas],
    }).compileComponents();

    fixture = TestBed.createComponent(Campanyas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
