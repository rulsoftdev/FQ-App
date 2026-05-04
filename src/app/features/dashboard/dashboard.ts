import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeckService, FaseTurno } from '../../core/services/deck';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit{
  // Inyectamos el servicio que maneja la lógica de los mazos
  private deckService = inject(DeckService);

  // Exponemos la carta activa como un Signal para el HTML
  public cartaActiva = this.deckService.cartaActiva;
  public faseActual = this.deckService.faseActual;
  // Seleccionamos los datos directamente del servicio
  public partida = this.deckService.partida;
  // Inyectamos la señal del mensaje
  public mensajeAlerta = this.deckService.mensajeAlerta;
  // Accedemos al signal del servicio
  public mision = this.deckService.misionActual;

  // Estado local para la UI
  public cargando = signal<boolean>(true);

  ngOnInit(): void {
    // 1. Iniciamos la carga de todas las hojas
    this.deckService.inicializarDatos().subscribe({
      next: () => {
        // 2. Una vez que todo está en memoria, seleccionamos la misión
        // Podrías sacar este ID de la URL o dejar uno fijo por ahora
        const idMisionInicial = 'MIS-001';
        this.deckService.seleccionarMision(idMisionInicial);
        
        // 3. Quitamos el estado de carga
        this.cargando.set(false);
        console.log('🎮 Dashboard listo y misión cargada');
      },
      error: (err) => {
        console.error('Error crítico al iniciar el juego', err);
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

  public cambiarPeligro(delta: number) {
    this.deckService.actualizarNivelPeligro(delta);
  }
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

  public ejecutarTiradaPeligro() {
    this.deckService.tirarPeligro();
  }

  public ejecutarTiradaErrantes() {
    // Pasamos el objeto misión que ya tienes cargado
    this.deckService.tirarErrantes(this.mision()!);
  }

  public cerrarAlerta() {
    this.deckService.cerrarAlerta();
  }
}