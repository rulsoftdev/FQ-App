import { Component, OnInit, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Dashboard } from './features/dashboard/dashboard';
import { Header } from "./components/header/header";
import { Navbar } from "./components/navbar/navbar";
import { TurnoMB } from "./features/turno-mb/turno-mb";
import { DeckService } from './core/services/deck';
import { TurnoMBService } from './core/services/turno-mb';

// Definimos los tipos de vista para mayor seguridad
export type VistaJuego = 'HEROES' | 'MB';

@Component({
  selector: 'app-root',
  imports: [Dashboard, Header, Navbar, TurnoMB],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App  implements OnInit {
  protected readonly title = signal('FQ-App');

  // Inyectamos el servicio de datos
  private deckService = inject(DeckService);
  private turnoMBService = inject(TurnoMBService);

  // Estados de la aplicación
  vistaActual = signal<VistaJuego>('HEROES');
  cargando = signal<boolean>(true);

  constructor(swUpdate: SwUpdate) {
    if (swUpdate.isEnabled) {
      swUpdate.versionUpdates.subscribe(evt => {
        if (confirm('¡Nueva versión de FetenQuest disponible! ¿Actualizar?')) {
          window.location.reload();
        }
      });
    }
  }

  ngOnInit() {
    // Al arrancar, inicializamos los datos de Google Sheets
    this.deckService.inicializarDatos().subscribe({
      next: () => {
        console.log('✅ Mazos de FetenQuest cargados');
        
        // Opcional: Configurar la primera misión por defecto para pruebas
        const misionInicial = this.deckService.misiones()[0];
        if (misionInicial) {
          this.deckService.configurarMision(misionInicial);
          this.deckService.seleccionarMision(misionInicial.id);
        }
        
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar los mazos:', err);
        this.cargando.set(false);
      }
    });
    this.turnoMBService.inicializarDatos().subscribe({
      next: () => {
        console.log('✅ Bestiario de misión cargado');
        
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar el bestiario:', err);
        this.cargando.set(false);
      }
    });
  }

  /**
   * Cambia la vista entre Héroes y Malvado Brujo
   */
  cambiarVista(nuevaVista: VistaJuego) {
    this.vistaActual.set(nuevaVista);
    
    // Aquí podrías añadir lógica extra, como guardar el estado
    // o disparar sonidos ambientales específicos.
  }
}
