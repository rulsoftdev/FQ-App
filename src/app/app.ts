import { Component, OnInit, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Mision } from './features/mision/mision';
import { Header } from "./components/header/header";
import { Navbar } from "./components/navbar/navbar";
import { TurnoMB } from "./features/turno-mb/turno-mb";
import { DeckService } from './core/services/deck.service';
import { TurnoMBService } from './core/services/turno-mb.service';
import { Mazo } from './features/mazo/mazo';
import { VistaJuego } from './core/models/fetenquest.model';
import { UiService } from './core/services/ui.service';
import { MisionService } from './core/services/mision.service';
import { forkJoin } from 'rxjs';
import { Dashboard } from './features/dashboard/dashboard';
import { EncuentrosService } from './core/services/encuentros.service';

@Component({
  selector: 'app-root',
  imports: [Mision, Header, Navbar, TurnoMB, Mazo, Dashboard],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App  implements OnInit {
  protected readonly title = signal('FAI');
  private uiService = inject(UiService);

  // Inyectamos el servicio de datos
  private misionService = inject(MisionService);
  private deckService = inject(DeckService);
  private turnoMBService = inject(TurnoMBService);
  private encuentrosService = inject(EncuentrosService);

  // Estados de la aplicación
  public vistaActual = this.uiService.vistaActual;
  public misionActual = this.misionService.misionActual;
  public cargando = signal<boolean>(true);

  constructor(swUpdate: SwUpdate) {
    if (swUpdate.isEnabled) {
      swUpdate.versionUpdates.subscribe(evt => {
        // Solo actuamos cuando la versión está realmente descargada y lista
        if (evt.type === 'VERSION_READY') {
          if (confirm('¡Nueva versión de FetenQuest disponible! ¿Actualizar?')) {
            // 1. Avisamos al Service Worker que active la nueva versión
            swUpdate.activateUpdate().then(() => {
              // 2. Solo entonces recargamos la página
              window.location.reload();
            });
          }
        }
      });
    }
  }

ngOnInit() {
  this.cargando.set(true);

  // Agrupamos todas las cargas iniciales
  forkJoin({
    mazos: this.deckService.inicializarDatos(),
    bestiario: this.turnoMBService.inicializarDatos(),
    misiones: this.misionService.inicializarDatos(),
    encuentros: this.encuentrosService.inicializarDatos()
  }).subscribe({
    next: (resultado) => {
      console.log('✅ Todo el contenido de FetenQuest cargado');
      
      // AHORA SÍ: La biblioteca ya existe, podemos configurar la misión
      //const misionInicial = this.misionService.misiones()[0];
      /*if (misionInicial) {
        // Primero configuramos la misión (que asumo que lee de la biblioteca de mazos)
        this.misionService.configurarMision(misionInicial);
        this.misionService.seleccionarMision(misionInicial.id);
      }*/

      this.cargando.set(false);
    },
    error: (err) => {
      console.error('❌ Error crítico en la carga inicial:', err);
      this.cargando.set(false);
    }
  });
}

  /**
   * Cambia la vista entre Héroes y Malvado Brujo
   */
  cambiarVista(nuevaVista: VistaJuego) {
    this.uiService.cambiaVista(nuevaVista);
    
    // Aquí podrías añadir lógica extra, como guardar el estado
    // o disparar sonidos ambientales específicos.
  }
}
