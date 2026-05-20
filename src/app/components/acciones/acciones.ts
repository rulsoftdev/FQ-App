import { Component, computed, inject, signal } from '@angular/core';
import { DeckService } from '../../core/services/deck.service';
import { EncuentrosService } from '../../core/services/encuentros.service';
import { TurnoMBService } from '../../core/services/turno-mb.service';
import { Carta, FaseTurnoHeroes, VistaJuego } from '../../core/models/fetenquest.model';
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
  rutas = signal<RutaExploracion[]>([
    { id: 1, nombre: 'MAZMORRA', cartasIds: [] } // Empezamos con un único botón
  ]);

  // Variables de estado
  cartasSeleccion: any[] = [];
  mostrarSelectorSecreto: boolean = false;
  indiceSeleccion: number = 0;

  constructor() {
    // Inicialización al cargar el modo LOSETAS
    if (this.modoJuego() === 'LOSETAS') {
      this.inicializarRutaInicial();
    }
  }

  private inicializarRutaInicial() {
    // Obtenemos todas las instancias del mazo M-MAZ que están listas para robar
    const todasCartasMazmorra = this.deckService.cartasEnPartida()
      .filter(c => c.idMazo === 'M-MAZ' && c.pila === 'Robo')
      .sort((a, b) => a.posicion - b.posicion)
      .map(c => c.id); // Guardamos solo sus IDs únicos de instancia

    this.rutas.set([
      { id: 1, nombre: 'MAZMORRA', cartasIds: todasCartasMazmorra }
    ]);
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

    // 1. Sacamos la primera carta asignada a este botón (la que está arriba)
    const idInstanciaARobar = rutaActual.cartasIds[0];
    
    // Extraemos la información real de la carta desde el servicio
    const cartaReal = this.deckService.cartasEnPartida().find(c => c.id === idInstanciaARobar);
    if (!cartaReal) return;

    const infoBiblioteca = this.deckService.biblioteca().find(c => c.idCarta === cartaReal.idCarta);
    if (!infoBiblioteca) return;
    
    // 2. Quitamos la carta de la ruta en nuestro estado local
    this.rutas.update(actuales => actuales.map(r => 
      r.id === rutaId ? { ...r, cartasIds: r.cartasIds.slice(1) } : r
    ));
    
    this.deckService.robarCartaMazmorra(cartaReal, 'M-MAZ');
    // ---- LÓGICA DE BIFURCACIÓN ----
    if ((
      infoBiblioteca.nombre.toLowerCase().includes('bifurcado') ||  
      infoBiblioteca.nombre.toLowerCase().includes('2 puertas')) 
      && listaRutas.length < 3) {
      this.procesarBifurcacion(rutaId);
    }
  }

  private procesarBifurcacion(rutaOrigenId: number) {
    const listaRutas = this.rutas();
    const rutaOrigen = listaRutas.find(r => r.id === rutaOrigenId);

    if (!rutaOrigen || rutaOrigen.cartasIds.length < 2) {
      console.log("No hay suficientes losetas para dividir el mazo o la ruta no existe.");
      return;
    }

    const cartasRestantes = rutaOrigen.cartasIds; // [arriba, ..., abajo]
    const mazos: string[][] = [[], []]; 

    // Recorremos de abajo a arriba (desde el final del array hacia el principio)
    let mazoDestino = 0;
    for (let i = cartasRestantes.length - 1; i >= 0; i--) {
      const cartaId = cartasRestantes[i];

      // .unshift() añade la carta ARRIBA (índice 0), empujando las anteriores ABAJO
      mazos[mazoDestino].unshift(cartaId);

      // Alternamos el mazo de destino de forma limpia (0 -> 1 -> 0 -> 1...)
      mazoDestino = 1 - mazoDestino;
    }

    // Tu lógica del random eficiente para decidir qué montón se queda en el origen
    const random0o1 = Math.floor(Math.random() * 2);
    const mazoOrigen = mazos[random0o1];
    const mazoNuevo = mazos[1 - random0o1];

    // Buscamos el ID más alto existente para asegurar un ID único
    const maxId = listaRutas.reduce((max, r) => r.id > max ? r.id : max, 0);
    const nuevoId = maxId + 1;

    this.rutas.update(actuales => {
      // 1. Modificamos la ruta de origen para que se quede con su mitad
      const limpias = actuales.map(r => 
        r.id === rutaOrigenId ? { ...r, cartasIds: mazoOrigen } : r
      );
      // 2. Añadimos la nueva ruta con la otra mitad
      return [...limpias, { id: nuevoId, nombre: `MAZMORRA ${nuevoId}`, cartasIds: mazoNuevo }];
    });

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
