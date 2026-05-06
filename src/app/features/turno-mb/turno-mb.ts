import { Component, inject, OnInit, signal } from '@angular/core';
import { DeckService } from '../../core/services/deck';
import { MensajeTurnoMB, Monstruo } from '../../core/models/fetenquest.model';
import { Acciones } from "../../components/acciones/acciones";
import { TurnoMBService } from '../../core/services/turno-mb';



@Component({
  selector: 'app-turno-mb',
  imports: [Acciones],
  templateUrl: './turno-mb.html',
  styleUrl: './turno-mb.scss',
})
export class TurnoMB implements OnInit{

    // Inyectamos el servicio que maneja la lógica de los mazos
  private deckService = inject(DeckService);
  private turnoMBService = inject(TurnoMBService);
  public misionActual = this.deckService.misionActual;
  public partida = this.deckService.partida;
  
  public faseActualMB = this.turnoMBService.faseActualMB;
  public mensajeActual = signal<string>("Escoge la acción que deseas realizar hereje.");
  public mensajeEscrito = this.turnoMBService.mensajeTurnoMB;
  public monstruosSeleccionados = this.turnoMBService.bestiario;

  ngOnInit() {
  }

  // Lógica para el efecto "máquina de escribir"
  /*private escribirMensaje(texto: string) {
    this.mensajeEscrito.set("");
    let i = 0;
    const speed = 40; // milisegundos por letra

    const interval = setInterval(() => {
      this.mensajeEscrito.update(v => v + texto.charAt(i));
      i++;
      if (i >= texto.length) clearInterval(interval);
    }, speed);
  }*/

  public seleccionarTabla(event: Event){}

}
