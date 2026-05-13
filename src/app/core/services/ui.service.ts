import { Injectable, signal } from '@angular/core';
import { VistaJuego } from '../models/fetenquest.model';


type ModoJuego = 'TABLERO' | 'LOSETAS' | null;

@Injectable({
  providedIn: 'root',
})
export class UiService {
  
  private _vistaActual = signal<VistaJuego>('VIEW_HEROES');
  public readonly vistaActual = this._vistaActual.asReadonly();
  private _modoJuego = signal<ModoJuego>(null);
  public readonly modoJuego = this._modoJuego.asReadonly();
  
  public cambiaVista(vista: VistaJuego){
    this._vistaActual.set(vista);
  }

  setModoVisualizacion(modo: ModoJuego) {
    this._modoJuego.set(modo);
  }

}
