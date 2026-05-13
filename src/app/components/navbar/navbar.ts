import { Component, inject } from '@angular/core';
import { VistaJuego } from '../../core/models/fetenquest.model';
import { UiService } from '../../core/services/ui.service';
import { TurnoMBService } from '../../core/services/turno-mb.service';
import { MisionService } from '../../core/services/mision.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private uiService = inject(UiService);
  private turnoMBService =  inject(TurnoMBService);
  private misionService = inject(MisionService);
  
  public misionActual = this.misionService.misionActual;
  public vistaActual = this.uiService.vistaActual;

  cambiaVista(vista: VistaJuego) {
    if (vista === 'VIEW_MB') {
      this.turnoMBService.cambiarFaseTurnoMB('INICIO_MB');
    }
    this.uiService.cambiaVista(vista);
  }
}
