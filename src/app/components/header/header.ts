import { Component, inject } from '@angular/core';
import { DeckService } from '../../core/services/deck';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  ds = inject(DeckService);

  public cambiarPeligro(delta: number) {
    this.ds.actualizarNivelPeligro(delta);
  }
}
