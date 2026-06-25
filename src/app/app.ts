import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { Header } from "./components/header/header";
import { Navbar } from "./components/navbar/navbar";
import { DeckService } from './core/services/deck.service';
import { TurnoMBService } from './core/services/turno-mb.service';
import { VistaJuego } from './core/models/fetenquest.interface';
import { UiService } from './core/services/ui.service';
import { MisionService } from './core/services/mision.service';
import { forkJoin } from 'rxjs';
import { EncuentrosService } from './core/services/encuentros.service';
import { RouterOutlet } from '@angular/router';
import { Acciones } from './components/acciones/acciones';

@Component({
  selector: 'app-root',
  imports: [Header, Navbar, Acciones, RouterOutlet],
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
  public misionActual = this.misionService.misionActual;
  public cargando = signal<boolean>(true);

  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

// 1. Detecta si físicamente la pantalla es grande
  private esPantallaGrandeFisica = toSignal(
    this.breakpointObserver.observe([
      '(min-width: 768px) and (orientation: landscape)', 
      '(min-width: 1024px)'
    ]).pipe(map(result => result.matches)),
    { initialValue: false }
  );

  // 2. Detecta en tiempo real si el usuario está en la ruta restringida
  public esRutaForjaAventura = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url.includes('/forjar-aventura'))
    ),
    { initialValue: false }
  );

  // 3. SIGNAL DEFINITIVO: Une ambas condiciones
  // Solo permite el modo PC si la pantalla acompaña Y NO estamos en la forja
  mostrarLayoutDesktop = computed(() => {
    return this.esPantallaGrandeFisica() && !this.esRutaForjaAventura();
  });

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
    console.log(this.breakpointObserver);
    this.cargando.set(true);

    // Agrupamos todas las cargas iniciales
    forkJoin({
      mazos: this.deckService.inicializarDatos(),
      bestiario: this.turnoMBService.inicializarDatos(),
      misiones: this.misionService.inicializarDatos(),
      encuentros: this.encuentrosService.inicializarDatos()
    }).subscribe({
      next: (resultado) => {
        this.activarPantallaCompleta();
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

  private activarPantallaCompleta() {
    const elem = document.documentElement; // Selecciona toda la app Angular
    
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) { /* Safari / iOS */
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) { /* IE / Edge */
      (elem as any).msRequestFullscreen();
    }
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
