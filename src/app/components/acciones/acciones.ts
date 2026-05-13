import { Component, computed, inject, signal } from '@angular/core';
import { DeckService } from '../../core/services/deck.service';
import { EncuentrosService } from '../../core/services/encuentros.service';
import { TurnoMBService } from '../../core/services/turno-mb.service';
import { Carta, FaseTurnoHeroes, VistaJuego } from '../../core/models/fetenquest.model';
import { UiService } from '../../core/services/ui.service';
import { MisionService } from '../../core/services/mision.service';

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

  // Variables de estado
  cartasSeleccion: any[] = [];
  mostrarSelectorSecreto: boolean = false;
  indiceSeleccion: number = 0;

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
    const evento = this.turnoMBService.obtenerEvento(dado);
    if(dado === 4){
      this.misionService.degradarDadoTrampa();
    }
    if(evento){
      this.turnoMBService.cambiarFaseTurnoMB('MENSAJE');
      this.turnoMBService.actualizarMensaje(dado, evento.texto);
    }
  }

}
