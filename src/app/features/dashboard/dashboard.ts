import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeckService, FaseTurno } from '../../core/services/deck';
import { EncuentrosService } from '../../core/services/encuentros';
import { Acciones } from "../../components/acciones/acciones";
import { Monstruo } from '../../core/models/fetenquest.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Acciones],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit{
  // Inyectamos el servicio que maneja la lógica de los mazos
  private deckService = inject(DeckService);
  private encuentrosService = inject(EncuentrosService);

  // Exponemos la carta activa como un Signal para el HTML
  public cartaActiva = this.deckService.cartaActiva;
  public faseActual = this.deckService.faseActual;
  public faseTurnoHeroes = this.deckService.faseTurnoHeroes
  // Seleccionamos los datos directamente del servicio
  public partida = this.deckService.partida;
  // Inyectamos la señal del mensaje
  public mensajeAlerta = this.deckService.mensajeAlerta;
  // Accedemos al signal del servicio
  public mision = this.deckService.misionActual;
  public tiradaEncuentro = this.encuentrosService.resultadoTirada;
  public encuentro = this.encuentrosService.encuentro;
  public monstruosEncuentro = this.encuentrosService.monstruos;

  // Estado local para la UI
  public cargando = signal<boolean>(true);

  ngOnInit(): void {
    this.encuentrosService.cargarEncuentros().subscribe({
      next: () => {
        const encuentros =  this.encuentrosService.encuentros();
        if(encuentros.length > 0) {
          console.log(`🎮 Tabla de encuentros de ${encuentros[0].tipoEncuentro} cargada`);
        } else {
          console.error('La tabla está vacía')
        }
      },
      error: (err) => {
        console.error('Error crítico al cargar la tabla de encuentros', err);
        this.cargando.set(false);
      }
    });
  }

  /**
   * Este método se llamará, por ejemplo, al elegir una misión en la lista
   */
  cargarNuevaAventura(id: string) {
    this.deckService.seleccionarMision(id);
  }

  public cerrarAlerta() {
    this.deckService.cerrarAlerta();
  }
}