import { Component, computed, inject, Input, signal } from '@angular/core';
import { DeckService } from '../../core/services/deck.service';
import { UiService } from '../../core/services/ui.service';
import { Carta, EstadoMazoMision } from '../../core/models/fetenquest.model';

@Component({
  selector: 'app-mazo',
  imports: [],
  templateUrl: './mazo.html',
  styleUrl: './mazo.scss',
})
export class Mazo {
  private deckService = inject(DeckService);
  private uiService = inject(UiService);

  // Índice para navegar por los descartes
  indiceDescarte = signal(0);

  // Derivamos los datos del servicio mediante computed para que sea reactivo
  mazo = this.deckService.biblioteca();
  cartasMazo = computed(() => this.deckService.mazoAGestionar());
  pilaRobo = computed(() => this.cartasMazo().filter(c => c.pila === 'Robo'));  
  pilaDescarte = computed(() => {
      let pilaDescartadas = this.cartasMazo()
        .filter(c => c.pila === 'Descarte')
        .sort((a, b) => b.posicion - a.posicion);
      let cartasDescartadas: Carta[] = [];
      for (let i = 0; i < pilaDescartadas.length; i++) {
        const proxima = pilaDescartadas[i];
      
        // BÚSQUEDA EFICIENTE: Buscamos en la biblioteca cargada de Drive
        const infoCarta = this.mazo.find(c => c.idCarta === proxima.idCarta);
        if(infoCarta) {
          cartasDescartadas.push(infoCarta);
        }
    }
    return cartasDescartadas;
    /*this.cartasMazo().filter(c => 
    c.pila === 'Descarte').sort((a, b) => b.posicion - a.posicion)*/
  });

  // Navegación del visor de descartes
  cambiarIndice(delta: number) {
    const nuevoIndice = this.indiceDescarte() + delta;
    if (nuevoIndice >= 0 && nuevoIndice < this.pilaDescarte().length) {
      this.indiceDescarte.set(nuevoIndice);
    }
  }

  // Acciones
  barajarRobo() {
    this.deckService.barajarPilaRobo(this.pilaRobo());
  }

  reciclarMazo() {
    let idMazo = this.cartasMazo()[0].idMazo;
    let cartaActiva = this.deckService.cartaActiva();
    if(cartaActiva?.idMazo === idMazo) {
      this.deckService.resetearCartaActiva();
    }
    this.deckService.barajarMazo(idMazo);
    this.deckService.cargarMazoAGestionar(idMazo);
    this.indiceDescarte.set(0);
  }

  salir() {
    if(!this.deckService.cartaActiva()) {
      this.deckService.cambiarFaseTurno('INICIO_HEROES');
    }
    this.uiService.cambiaVista('VIEW_HEROES');
  }
}
