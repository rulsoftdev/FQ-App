import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeckService, } from '../../core/services/deck.service';
import { EncuentrosService } from '../../core/services/encuentros.service';
import { UiService } from '../../core/services/ui.service';
import { MisionService } from '../../core/services/mision.service';

@Component({
  selector: 'app-mision',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mision.html',
  styleUrl: './mision.scss'
})
export class Mision implements OnInit{
  // Inyectamos el servicio que maneja la lógica de los mazos
  private misionService = inject(MisionService);
  private deckService = inject(DeckService);
  private encuentrosService = inject(EncuentrosService);
  private uiService = inject(UiService);

  // Exponemos la carta activa como un Signal para el HTML
  public cartaActiva = this.deckService.cartaActiva;
  public vistaActual = this.uiService.vistaActual;
  public faseTurnoHeroes = this.deckService.faseTurnoHeroes;
  // Seleccionamos los datos directamente del servicio
  public partida = this.misionService.partida;
  // Inyectamos la señal del mensaje
  public mensajeAlerta = this.deckService.mensajeAlerta;
  // Accedemos al signal del servicio
  public mision = this.misionService.misionActual;
  public tiradaEncuentro = this.encuentrosService.resultadoTirada;
  public encuentro = this.encuentrosService.encuentro;
  public monstruosEncuentro = this.encuentrosService.monstruos;
  public encuentrosMision = this.encuentrosService.encuentrosMision;

  // Estado local para la UI
  public cargando = signal<boolean>(true);

  ngOnInit(): void {
    this.encuentrosService.cargarEncuentrosMision(this.mision()?.tablaEncuentros!);
    console.log(this.uiService.modoJuego());
    console.log("Entramos en la misión");
    console.log("CARTA ACTIVA", this.deckService.cartaActiva());
  }

  /**
   * Este método se llamará, por ejemplo, al elegir una misión en la lista
   */
  cargarNuevaAventura(id: string) {
    this.misionService.seleccionarMision(id);
  }

  public cerrarAlerta() {
    this.deckService.cerrarAlerta();
  }
}