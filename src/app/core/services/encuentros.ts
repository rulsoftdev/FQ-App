import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Encuentro, Monstruo } from '../models/fetenquest.model';
import { map, tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { parseFullCsv } from '../utils';
import { DeckService } from './deck';
import { TurnoMBService } from './turno-mb';


@Injectable({
  providedIn: 'root',
})
export class EncuentrosService {

  private http = inject(HttpClient);
  private readonly URL_ENCUENTROS_PIELES_VERDES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=193859404&single=true&output=csv';
  private deckService =  inject(DeckService);
  private turnoMBService = inject(TurnoMBService);

  // Signal para almacenar todas las cartas de la base de datos
  private _encuentros = signal<Encuentro[]>([]);
  public readonly encuentros = this._encuentros.asReadonly();
  private _encuentro = signal<Encuentro | null>(null);  
  public readonly encuentro = this._encuentro.asReadonly();
  private _monstruos = signal<Monstruo[]>([]);
  public readonly monstruos = this._monstruos.asReadonly();

  public resultadoTirada = signal<number>(0);

  public cargarEncuentros(): Observable<any> {      
    return forkJoin({
      encuentros: this.http.get(this.URL_ENCUENTROS_PIELES_VERDES, { responseType: 'text' }).pipe(map(csv => this.parseEncuentros(csv, 'PIELES_VERDES')))
    }).pipe(
      tap(res => {
        // Guardamos en los signals internos
        this._encuentros.set(res.encuentros);
        console.log(this.encuentros());
      })
    );
  }

  public tirarEncuentros(nivelPeligro: number, resultadoDado: number | null) {
    let dado = resultadoDado? resultadoDado: (Math.floor(Math.random() * 20) + 1) + nivelPeligro;
    this.resultadoTirada.set(dado);
    const hardEncuentro = this.encuentros()[this.encuentros().length-1];
    if(dado <= 10){
      this.deckService.actualizarNivelPeligro(1);
    } else if (dado >= Number.parseInt(hardEncuentro.resultado)) {
      this._encuentro.set(hardEncuentro);
    } else {
      const encuentro = this.encuentros().filter(encuentro => dado === Number.parseInt(encuentro.resultado));
      this._encuentro.set(encuentro[0]);
    } 
    if(this.encuentro()){
      this._monstruos.set(this.turnoMBService.obtenerMonstruosDeEncuentro(this.encuentro()?.monstruos!, this.encuentro()?.alternativa ?? ""));
      console.log("MONSTRUOS", this.monstruos());
    }
  }

  /**
   * Parsea la hoja de Encuentros usando el nuevo motor PapaParse
   */
  private parseEncuentros(csv: string, tipoEncuentro: string): Encuentro[] {
    // 1. Obtenemos el array de objetos basado en las cabeceras del CSV
    const filas = parseFullCsv(csv);
    
    // 2. Mapeamos cada fila a la interfaz Mazo
    return filas.map(fila => {
      return { 
        tipoEncuentro: tipoEncuentro,
        resultado: fila.resultado,
        monstruos: fila.monstruos,
        heroes3o4: fila.heroes3o4,
        heroes2: fila.heroes2,
        heroe1: fila.heroe1,
        alternativa: fila.alternativa 
      } as Encuentro;
    });
  }
}
