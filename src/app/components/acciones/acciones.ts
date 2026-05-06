import { Component, computed, inject } from '@angular/core';
import { DeckService, FaseTurno } from '../../core/services/deck';
import { EncuentrosService } from '../../core/services/encuentros';
import { TurnoMBService } from '../../core/services/turno-mb';

@Component({
  selector: 'app-acciones',
  imports: [],
  templateUrl: './acciones.html',
  styleUrl: './acciones.scss',
})
export class Acciones {

  public deckService =  inject(DeckService)
  public encuentrosService =  inject(EncuentrosService)
  public turnoMBService = inject(TurnoMBService)

  public cartaActiva = this.deckService.cartaActiva;
  public partida = this.deckService.partida;
  public faseActual = this.deckService.faseActual;
  public misionActual = this.deckService.misionActual;

  /**
   * Contadores computados: 
   * Estos se actualizarán solos cada vez que el estado de las cartas cambie en el servicio.
   * Los usaremos mañana para los badges de los botones.
   */
  public contadores = computed(() => {
    const estados = this.deckService.obtenerEstados(); // Método que devuelve el signal de estados
    
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
  
  /**
   * Método para robar una carta.
   * Llama al servicio y este actualiza el Signal 'cartaActiva'.
   */
  public robarCarta(idMazo: string): void {
    this.deckService.robarCarta(idMazo);
  }

  public cambiarFase(fase: FaseTurno) {
    this.deckService.cambiarFase(fase);
  }

  public tiradaEncuentros(){
    this.deckService.cambiarFaseTurnoMB('ENCUENTRO');
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
      this.deckService.actualizarNivelPeligro(1);
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

  }
}
