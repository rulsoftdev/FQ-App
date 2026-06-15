import { Component, inject, OnInit, signal } from '@angular/core';
import { TurnoMB } from '../turno-mb/turno-mb';
import { Mision } from '../mision/mision';
import { Mazo } from '../mazo/mazo';
import { MisionService } from '../../core/services/mision.service';
import { UiService } from '../../core/services/ui.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-juego-container',
  imports: [TurnoMB, Mision, Mazo],
  templateUrl: './juego-container.html',
  styleUrl: './juego-container.scss',
})
export class JuegoContainer implements OnInit {
  private misionService = inject(MisionService);
  private uiService = inject(UiService);
  private router = inject(Router);
  
  // Estados de la aplicación
  public vistaActual = this.uiService.vistaActual;
  public misionActual = this.misionService.misionActual;
  public cargando = signal<boolean>(true);
  
  ngOnInit(): void {
    this.cargando.set(true);
    console.log('Arrancando partida para la misión:', this.misionActual()?.nombre);
    console.log('Vista inicial establecida en:', this.vistaActual());
    if (!this.misionActual()) {
      this.router.navigate(['/la-taberna']);
      return;
    }

    // Forzamos que la vista empiece siempre en héroes por seguridad si no venía del dash
    if (!this.vistaActual()) {
      this.uiService.cambiaVista('VIEW_HEROES');
    }

    // Efecto inmersivo: Mantenemos el cargador 2 segundos simulando la generación de la mazmorra
    setTimeout(() => {
      this.cargando.set(false);
    }, 2000);
  }
  
}
