import { Component, inject, signal } from '@angular/core';
import { UiService } from '../../core/services/ui.service';
import { PersistenceService } from '../../core/services/persistence.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { Mision } from '../../core/models/fetenquest.interface';
import { MisionService } from '../../core/services/mision.service';
import { DeckService } from '../../core/services/deck.service';

@Component({
  selector: 'app-campanyas',
  imports: [],
  templateUrl: './campanyas.html',
  styleUrl: './campanyas.scss',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0px', opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: '0px', opacity: 0 }))
      ])
    ])
  ]
})
export class Campanyas {

  private router = inject(Router);
  private uiService = inject(UiService);
  private misionService =  inject(MisionService);
  private deckService =  inject(DeckService);
  private persistenceService = inject(PersistenceService);

    // Detectamos el modo de juego desde tu UI Service
  public modoJuego = this.uiService.modoJuego; // 'TABLERO' o 'LOSETAS' (asumo que 'TABLERO' equivale a tus "mazmorras fijas actuales")
  public campanyas = this.misionService.campanyas;
  
  expanded = signal<string | null>(null);
  misionSeleccionadaId = signal<string | null>(null);

  toggleCampanya(nombre: string) {
    this.expanded.update(prev => prev === nombre ? null : nombre);
  }

  prepararSeleccion(id: string) {
    // Si toca la misma, se cierra; si toca otra, se abre la nueva
    this.misionSeleccionadaId.update(current => current === id ? null : id);
  }

  confirmarMision(mision: Mision, modo: 'TABLERO' | 'LOSETAS') {
    // Limpiamos persistencia antigua si existiera
    this.persistenceService.clearSave(); 
    
    // Seteamos la misión y el modo en los servicios correspondientes
    this.misionService.seleccionarMision(mision.id);
    this.uiService.setModoVisualizacion(modo);

    // Cambiamos a la vista de juego
    this.uiService.cambiaVista('VIEW_HEROES');
    this.deckService.cambiarFaseTurno('INICIO_HEROES');

    
    // Cerramos el selector por si acaso volvemos atrás
    this.misionSeleccionadaId.set(null);
    this.deckService.resetearCartaActiva();

    this.router.navigate(['/la-mazmorra']);
  }
}

