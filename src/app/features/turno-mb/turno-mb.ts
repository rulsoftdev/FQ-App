import { Component, inject, OnInit, signal } from '@angular/core';
import { DeckService } from '../../core/services/deck.service';
import { Monstruo } from '../../core/models/fetenquest.interface';
import { Acciones } from "../../components/acciones/acciones";
import { TurnoMBService } from '../../core/services/turno-mb.service';
import { MisionService } from '../../core/services/mision.service';



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
  private misionService = inject(MisionService);
  public misionActual = this.misionService.misionActual;
  public partida = this.misionService.partida;
  
  public faseActualMB = this.turnoMBService.faseActualMB;
  public mensajeActual = signal<string>("Escoge la acción que deseas realizar hereje.");
  public mensajeEscrito = this.turnoMBService.mensajeTurnoMB;
  public monstruosSeleccionados = signal<Monstruo[]>([]);

  ngOnInit() {
    // Disparamos la lógica por defecto con el valor de la primera opción
    this.ejecutarSeleccionInicial("Pieles Verdes");
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

  private ejecutarSeleccionInicial(valor: string) {
    this.monstruosSeleccionados.set(this.turnoMBService.seleccionarFamilia(valor));
  }

  public seleccionarTabla(event: Event){
    const elemento = event.target as HTMLSelectElement;
    const valor = elemento.value;
    this.monstruosSeleccionados.set(this.turnoMBService.seleccionarFamilia(valor));
  }

}
