import { Component, inject, signal } from '@angular/core';
import { MisionService } from '../../core/services/mision.service';
import { PersistenceService } from '../../core/services/persistence.service';
import { UiService } from '../../core/services/ui.service';
import { DeckService } from '../../core/services/deck.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  private router = inject(Router);
  private misionService =  inject(MisionService);
  private uiService = inject(UiService);
  private deckService =  inject(DeckService);
  private persistenceService = inject(PersistenceService);

  public misiones = this.misionService.misiones();

  // features/dashboard/dashboard.ts
  partidaGuardada = signal<any>(null);

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
    this.router.navigate(['/la-mazmorra']);
  }

  public descartarGuardado(){
    this.persistenceService.clearSave(); // Borramos lo anterior
    this.partidaGuardada.set(null);
  }

}
