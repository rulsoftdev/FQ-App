import { Component, inject } from '@angular/core';
import { VistaJuego } from '../../core/models/fetenquest.interface';
import { UiService } from '../../core/services/ui.service';
import { TurnoMBService } from '../../core/services/turno-mb.service';
import { MisionService } from '../../core/services/mision.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private router = inject(Router);
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

  public volverALaTaberna() {
    // 1. Limpiamos la misión actual del estado global para que la app sepa que no estamos jugando
    // Ajusta este método según cómo limpies tu Signal en el servicio (ej: .set(null) o un método limpiar())
    this.misionService.misionActual.set(null); 
    
    // 2. Teletransporte de vuelta al Dashboard
    this.router.navigate(['/la-taberna']);
  }
}
