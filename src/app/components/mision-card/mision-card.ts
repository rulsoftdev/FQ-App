import { Component, inject, Input } from '@angular/core';
import { Mision } from '../../core/models/fetenquest.interface';
import { UiService } from '../../core/services/ui.service';
import { MisionService } from '../../core/services/mision.service';
import { PersistenceService } from '../../core/services/persistence.service';

@Component({
  selector: 'app-mision-card',
  imports: [],
  templateUrl: './mision-card.html',
  styleUrl: './mision-card.scss',
})
export class MisionCard {

  @Input({ required: true }) mision!: Mision;

  private misionService = inject(MisionService);
  private uiService = inject(UiService);
  private persistenceService = inject(PersistenceService);

  /**
   * Gestiona la selección de la misión y el modo de juego
   * @param modo 'TABLERO' o 'LOSETAS'
   */
  onSeleccionar(modo: 'TABLERO' | 'LOSETAS') {
    console.log(`Cargando misión: ${this.mision.nombre} en modo ${modo}`);
    this.persistenceService.clearSave(); // Borramos lo anterior

    // 1. Configuramos la misión en el servicio (esto dispara la creación de mazos)
    this.misionService.configurarMision(this.mision);
    this.misionService.seleccionarMision(this.mision.id);

    // 2. Guardamos el modo visual en el UiService para saber qué canvas pintar
    this.uiService.setModoVisualizacion(modo);

    // 3. Cambiamos la vista principal para entrar en el modo juego (Héroes/Tablero)
    this.uiService.cambiaVista('VIEW_HEROES');
  }

  /**
   * Genera un array para iterar las estrellas en el template
   */
  get estrellas() {
    return Array(5).fill(0).map((_, i) => i + 1);
  }
}
