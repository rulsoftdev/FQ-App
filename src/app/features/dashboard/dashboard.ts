import { Component, inject, signal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MisionService } from '../../core/services/mision.service';
import { PersistenceService } from '../../core/services/persistence.service';
import { UiService } from '../../core/services/ui.service';
import { DeckService } from '../../core/services/deck.service';
import { Mision } from '../../core/models/fetenquest.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
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
export class Dashboard {

  private misionService =  inject(MisionService);
  private uiService = inject(UiService);
  private deckService =  inject(DeckService);
  private persistenceService = inject(PersistenceService);

  public misiones = this.misionService.misiones();
  public campanyas = this.misionService.campanyas;

  // features/dashboard/dashboard.ts
  partidaGuardada = signal<any>(null);
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
    
    // Cerramos el selector por si acaso volvemos atrás
    this.misionSeleccionadaId.set(null);
  }

  ngOnInit() {
    this.partidaGuardada.set(this.persistenceService.getSavedGame());
  }

  recuperarPartida() {
    const save = this.partidaGuardada();
    // Restauramos los signals uno a uno
    this.misionService.cargarMision(save.mision);
    this.deckService.cargarCartaActiva(save.cartaActiva); 
    this.deckService.cargarCartasEnPartida(save.cartas);
    this.misionService.cargarPartida(save.partida);
    this.uiService.setModoVisualizacion(save.modo);
    this.uiService.cambiaVista('VIEW_HEROES');
  }

  public descartarGuardado(){
    this.persistenceService.clearSave(); // Borramos lo anterior
    this.partidaGuardada.set(null);
  }

}
