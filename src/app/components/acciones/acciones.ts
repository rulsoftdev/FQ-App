import { Component, computed, inject, signal } from '@angular/core';
import { DeckService } from '../../core/services/deck.service';
import { EncuentrosService } from '../../core/services/encuentros.service';
import { TurnoMBService } from '../../core/services/turno-mb.service';
import { Carta, FaseTurnoHeroes, VistaJuego } from '../../core/models/fetenquest.interface';
import { UiService } from '../../core/services/ui.service';
import { MisionService } from '../../core/services/mision.service';

interface RutaExploracion {
  id: number;
  nombre: string;
  cartasIds: string[]; // Guardamos los IDs únicos de instancia asignados a esta ruta
}

@Component({
  selector: 'app-acciones',
  imports: [],
  templateUrl: './acciones.html',
  styleUrl: './acciones.scss',
})
export class Acciones {

  public misionService =  inject(MisionService);
  public deckService =  inject(DeckService);
  public encuentrosService =  inject(EncuentrosService);
  public turnoMBService = inject(TurnoMBService);
  public uiService = inject(UiService);

  public cartaActiva = this.deckService.cartaActiva;
  public faseTurnoHeroe = this.deckService.faseTurnoHeroes;
  public partida = this.misionService.partida;
  public vistaActual = this.uiService.vistaActual;
  public misionActual = this.misionService.misionActual;

  // Detectamos el modo de juego desde tu UI Service
  modoJuego = this.uiService.modoJuego; // 'TABLERO' o 'LOSETAS' (asumo que 'TABLERO' equivale a tus "mazmorras fijas actuales")

  // Estado de las rutas dinámicas para el modo LOSETA
  public rutas = computed(() => this.partida()?.rutasLosetas || []);

  // Variables de estado
  cartasSeleccion: any[] = [];
  mostrarSelectorSecreto: boolean = false;
  indiceSeleccion: number = 0;

  constructor() {
    // Inicialización al cargar el modo LOSETAS
    if (this.modoJuego() === 'LOSETAS' && this.rutas().length === 0) {
      this.inicializarRutaInicial();
    }
  }

  private inicializarRutaInicial() {
    // Obtenemos todas las instancias del mazo M-MAZ que están listas para robar
    const todasCartasMazmorra = this.deckService.cartasEnPartida()
      .filter(c => c.idMazo === 'M-MAZ' && c.pila === 'Robo')
      .sort((a, b) => a.posicion - b.posicion)
      .map(c => c.id); // Guardamos solo sus IDs únicos de instancia

    this.misionService.inicializarRutasDesdeCero(todasCartasMazmorra);
  }

  /**
   * Contadores computados: 
   * Estos se actualizarán solos cada vez que el estado de las cartas cambie en el servicio.
   * Los usaremos mañana para los badges de los botones.
   */
  public contadores = computed(() => {
    const estados = this.deckService.cartasEnPartida; // Método que devuelve el signal de estados
    
    return {
      salasRobo: estados().filter(c => c.idMazo === 'M-SAL' && c.pila === 'Robo').length,
      salasDescarte: estados().filter(c => c.idMazo === 'M-SAL' && c.pila === 'Descarte').length,
      
      trampasRobo: estados().filter(c => c.idMazo === 'M-TRA' && c.pila === 'Robo').length,
      trampasDescarte: estados().filter(c => c.idMazo === 'M-TRA' && c.pila === 'Descarte').length,
      
      atrezosRobo: estados().filter(c => c.idMazo === 'M-ATR' && c.pila === 'Robo').length,
      atrezosDescarte: estados().filter(c => c.idMazo === 'M-ATR' && c.pila === 'Descarte').length,

      salasEspecialesRobo: estados().filter(c => c.idMazo === 'M-ESP' && c.pila === 'Robo').length,
      salasEspecialesDescarte: estados().filter(c => c.idMazo === 'M-ESP' && c.pila === 'Descarte').length,

      pasillosRobo: estados().filter(c => c.idMazo === 'M-PAS' && c.pila === 'Robo').length,
      pasillosDescarte: estados().filter(c => c.idMazo === 'M-PAS' && c.pila === 'Descarte').length,

    };
  });
  
  abrirGestionMazo(idMazo: string) {
    this.deckService.cargarMazoAGestionar(idMazo);
    this.uiService.cambiaVista('VIEW_MAZO');
  }

  explorarRuta(rutaId: number) {
    const listaRutas = this.rutas();
    const rutaActual = listaRutas.find(r => r.id === rutaId);
    
    if (!rutaActual || rutaActual.cartasIds.length === 0) {
      this.deckService.robarCartaMazmorra(null, 'M-MAZ');
      return;
    }

    const idInstanciaARobar = rutaActual.cartasIds[0];
    const cartaReal = this.deckService.cartasEnPartida().find(c => c.id === idInstanciaARobar);
    if (!cartaReal) return;

    const infoBiblioteca = this.deckService.biblioteca().find(c => c.idCarta === cartaReal.idCarta);
    if (!infoBiblioteca) return;
    
    const rutasActualizadas = listaRutas.map(r => 
      r.id === rutaId ? { ...r, cartasIds: r.cartasIds.slice(1) } : r
    );
    this.misionService.actualizarRutasLosetas(rutasActualizadas);
    
    this.deckService.robarCartaMazmorra(cartaReal, 'M-MAZ');
    
    // ---- LÓGICA DE BIFURCACIÓN ----
    if ((
      infoBiblioteca.nombre.toLowerCase().includes('bifurcado') ||  
      infoBiblioteca.nombre.toLowerCase().includes('2 puertas')) 
      && rutasActualizadas.length < 3) {

      this.procesarBifurcacion(rutaId, rutasActualizadas);
    }
  }

  private procesarBifurcacion(rutaOrigenId: number, listaRutasActuales: RutaExploracion[]) {
    const rutaOrigen = listaRutasActuales.find(r => r.id === rutaOrigenId);

    if (!rutaOrigen || rutaOrigen.cartasIds.length < 2) {
      console.log("No hay suficientes losetas para dividir el mazo o la ruta no existe.");
      return;
    }

    const cartasRestantes = rutaOrigen.cartasIds;
    const mazos: string[][] = [[], []]; 

    let mazoDestino = 0;
    for (let i = cartasRestantes.length - 1; i >= 0; i--) {
      mazos[mazoDestino].unshift(cartasRestantes[i]);
      mazoDestino = 1 - mazoDestino;
    }

    const random0o1 = Math.floor(Math.random() * 2);
    const mazoOrigen = mazos[random0o1];
    const mazoNuevo = mazos[1 - random0o1];

    const maxId = listaRutasActuales.reduce((max, r) => r.id > max ? r.id : max, 0);
    const nuevoId = maxId + 1;

    const limpias = listaRutasActuales.map(r => 
      r.id === rutaOrigenId ? { ...r, cartasIds: mazoOrigen } : r
    );
    const estadoFinalRutas = [...limpias, { id: nuevoId, nombre: `MAZMORRA ${nuevoId}`, cartasIds: mazoNuevo }];
    
    this.misionService.actualizarRutasLosetas(estadoFinalRutas);
    console.log(`¡Bifurcación activada! Mazo repartido desde abajo. Creada Ruta ${nuevoId}`);
  }
  
  /**
   * Método para robar una carta.
   * Llama al servicio y este actualiza el Signal 'cartaActiva'.
   */
  public robarCarta(idMazo: string): void {
    this.deckService.robarCarta(idMazo);
    if(this.cartaActiva()?.idMazo === 'M-SAL' && this.cartaActiva()?.tipo === "Especial"){
      this.misionService.actualizarNivelPeligro(1);
    }
  }

  public cambiarATurnoHeroes(vista: VistaJuego, faseTurno: FaseTurnoHeroes) {
    this.uiService.cambiaVista(vista);
    this.deckService.cambiarFaseTurno(faseTurno);
  }

  public iniciarSalaSecreta() {
    // Robamos 3 del mazo de Atrezzo usando tu DeckService
    this.cartasSeleccion = this.deckService.drawMultiple('M-ATR', 3);
    this.mostrarSelectorSecreto = true;
  }

  cambiarIndice(delta: number) {
    this.indiceSeleccion += delta;
  }

  confirmarSeleccion(carta: Carta) {
    this.deckService.seleccionarAtrezoSalaSecreta(carta);
    this.cerrarSelector();
  }

  cerrarSelector() {
    this.mostrarSelectorSecreto = false;
    this.indiceSeleccion = 0;
    this.cartasSeleccion = [];
  }

  public tiradaEncuentros(){
    this.deckService.cambiarFaseTurno('ENCUENTRO');
    this.encuentrosService.tirarEncuentros(this.partida().nivelPeligroActual, null);
  }

  public tiradaPeligro() {
    const dado = Math.floor(Math.random() * 6) + 1;
    let resultado = "";

    if (dado <= 3) {
      resultado = "💀 CALAVERA: Realiza Tirada de Evento (1D10). Si es ≤ Nivel de Peligro, tira en Tabla de Eventos.";
    } else if (dado <= 5) {
      resultado = "🛡️ ESCUDO BLANCO: La suerte os es propicia, no ocurre nada.";
    } else {
      // Escudo Negro
      this.misionService.actualizarNivelPeligro(1);
      resultado = "🌑 ESCUDO NEGRO: El mal acecha... ¡El Nivel de Peligro aumenta en 1!";
    }

    this.turnoMBService.cambiarFaseTurnoMB('MENSAJE');
    this.turnoMBService.actualizarMensaje(dado, resultado);
  }

  public tiradaErrantes() {
    const dado = Math.floor(Math.random() * 6) + 1;
    let resultado = "";
    let mision =  this.misionActual();

    if(mision) {
      if (dado === 1 || dado === 2) {
        resultado = `2 Monstruos Errantes (${mision.monstruoErrante}) a 1D6 casillas.`;
      } else if (dado === 3) {
        resultado = `1 Monstruo Errante Superior (${mision.monstruoErranteSuperior}) a 1D6 casillas.`;
      } else {
        resultado = `1 Monstruo Errante (${mision.monstruoErrante}) a 1D6 casillas.`;
      }
  
      this.turnoMBService.cambiarFaseTurnoMB('MENSAJE');
      this.turnoMBService.actualizarMensaje(dado, resultado);
    }
  }

  public verBestiario(){
    this.turnoMBService.cambiarFaseTurnoMB('BESTIARIO');
  }

  public tiradaEventos(){
    const dado = Math.floor(Math.random() * 20) + 1;    
    const evento = this.turnoMBService.obtenerEvento(dado, this.uiService.modoJuego()!);
    if(dado === 4){
      this.misionService.degradarDadoTrampa();
    }
    if(evento){
      this.turnoMBService.cambiarFaseTurnoMB('MENSAJE');
      this.turnoMBService.actualizarMensaje(dado, evento.texto);
    }
  }

}
