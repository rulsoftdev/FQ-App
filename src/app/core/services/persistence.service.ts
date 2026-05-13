// core/services/persistence.service.ts
import { Injectable, effect, inject } from '@angular/core';
import { DeckService } from './deck.service';
import { MisionService } from './mision.service';
import { UiService } from './ui.service';


@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private deckService = inject(DeckService);
  private misionService = inject(MisionService);
  private uiService = inject(UiService);

  constructor() {
    // Este efecto vigila los signals y guarda automáticamente
    effect(() => {
      const misionActual = this.misionService.misionActual();
      
      if (misionActual) {
        const snapshot = {
          mision: misionActual,
          cartaActiva: this.deckService.cartaActiva(),
          cartas: this.deckService.cartasEnPartida(),
          partida: this.misionService.partida(),
          modo: this.uiService.modoJuego(),
          vistaActual: this.uiService.vistaActual(),
          fecha: new Date().getTime()
        };
        localStorage.setItem('FQ_SAVE_SLOT', JSON.stringify(snapshot));
      }
    });
  }

  getSavedGame() {
    const data = localStorage.getItem('FQ_SAVE_SLOT');
    return data ? JSON.parse(data) : null;
  }

  clearSave() {
    localStorage.removeItem('FQ_SAVE_SLOT');
  }
}