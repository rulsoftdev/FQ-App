import { Component, computed, inject } from '@angular/core';
import { DeckService } from '../../core/services/deck.service';
import { MisionService } from '../../core/services/mision.service';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private router = inject(Router);
  
  private misionService = inject(MisionService);
  public misionActual = this.misionService.misionActual;
  public partida = this.misionService.partida;

  public cambiarPeligro(delta: number) {
    this.misionService.actualizarNivelPeligro(delta);
  }

  // 1. Escuchamos la URL activa y la convertimos a Signal
  private urlSignal = toSignal(
    this.router.events.pipe(map(() => this.router.url)),
    { initialValue: this.router.url }
  );

  public autor = computed(() => {
    const mision = this.misionActual();
    if (mision) {
      return mision.autor;
    } else {
      return null;
    }
  })
  
  // 2. Creamos un computed para el título dinámico fuera de partida
  public tituloDinamico = computed(() => {
    // Si ya hay una misión cargada en el tablero, respetamos su nombre original
    const mision = this.misionActual();
    if (mision) {
      return mision.nombre;
    }

    // Si no hay misión, miramos en qué zona del menú nos encontramos
    const url = this.urlSignal();
    if (url.includes('crear-mision')) {
      return 'FAI - La Forja de Aventuras';
    }
    
    // Por defecto (Dashboard / menú principal)
    return 'FAI - La Taberna';
  });
}
