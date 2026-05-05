import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Encuentro } from '../models/fetenquest.model';
import { map, tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { parseFullCsv } from '../utils';


@Injectable({
  providedIn: 'root',
})
export class EncuentrosService {

  private http = inject(HttpClient);
  private readonly URL_ENCUENTROS_PIELES_VERDES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=193859404&single=true&output=csv';
  
  // Signal para almacenar todas las cartas de la base de datos
  private _encuentros = signal<Encuentro[]>([]);
  public readonly encuentros = this._encuentros.asReadonly();
  private _encuentro = signal<Encuentro | null>(null);
  
  public readonly encuentro = this._encuentro.asReadonly();

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
    let monstruos = [];
    let nMonstruos = [];
    let alternativas = [];
    const hardEncuentro = this.encuentros()[this.encuentros().length-1];
    if(dado <= 10){
      console.log("Sube el peligro");
    } else if (dado >= Number.parseInt(hardEncuentro.resultado)) {
      this._encuentro.set(hardEncuentro);
    } else {
      const encuentro = this.encuentros().filter(encuentro => dado === Number.parseInt(encuentro.resultado));
      this._encuentro.set(encuentro[0])
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
