import { Injectable, signal } from '@angular/core';
import { VistaJuego } from '../models/fetenquest.interface';


export type ModoJuego = 'TABLERO' | 'LOSETAS' | null;

@Injectable({
  providedIn: 'root',
})
export class UiService {
  
  private _vistaActual = signal<VistaJuego>('VIEW_HEROES');
  public readonly vistaActual = this._vistaActual.asReadonly();
  private _modoJuego = signal<ModoJuego>(null);
  public readonly modoJuego = this._modoJuego.asReadonly();
  private _origenNav = signal<VistaJuego>('VIEW_HEROES');
  public readonly origenNav = this._origenNav.asReadonly();
  
  public cambiaVista(vista: VistaJuego){
    this._vistaActual.set(vista);
  }

  public setModoVisualizacion(modo: ModoJuego) {
    this._modoJuego.set(modo);
  }

  public setOrigenNav(vista: VistaJuego) {
    this._origenNav.set(vista);
  }

}
