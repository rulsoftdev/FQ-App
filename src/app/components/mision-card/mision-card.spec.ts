import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisionCard } from './mision-card';

describe('MisionCard', () => {
  let component: MisionCard;
  let fixture: ComponentFixture<MisionCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisionCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MisionCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
