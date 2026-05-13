import { Component, inject } from '@angular/core';
import { DeckService } from '../../core/services/deck.service';
import { MisionService } from '../../core/services/mision.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private misionService = inject(MisionService);
  public misionActual = this.misionService.misionActual;
  public partida = this.misionService.partida;

  public cambiarPeligro(delta: number) {
    this.misionService.actualizarNivelPeligro(delta);
  }
}
