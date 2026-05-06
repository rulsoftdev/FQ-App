import { Component, EventEmitter, inject,  Input, Output } from '@angular/core';
import { DeckService } from '../../core/services/deck';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  @Input() currentView: 'HEROES' | 'MB' = 'HEROES';
  @Output() viewChanged = new EventEmitter<'HEROES' | 'MB'>();
  private deckServive = inject(DeckService);

  changeView(view: 'HEROES' | 'MB') {
    this.deckServive.cambiarFase(view);
    this.viewChanged.emit(view);
  }
}
