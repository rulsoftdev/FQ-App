import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { parseFullCsv } from '../utils';
import { Evento, FaseTurnoMB, MensajeTurnoMB, Monstruo } from '../models/fetenquest.model';

@Injectable({
  providedIn: 'root',
})
export class TurnoMBService {

  private http = inject(HttpClient);
  private readonly URL_BESTIARIO_PV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=191859337&single=true&output=csv";
  private readonly URL_EVENTOS_INTERNOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=1071286455&single=true&output=csv";
  // Usaremos un signal para guardar todos los monstruos categorizados
  private _bestiario = signal<Monstruo[]>([]);
  public readonly bestiario = this._bestiario.asReadonly();
  private _eventosInt = signal<Evento[]>([]);
  public readonly eventosInt = this._eventosInt.asReadonly();

  private _mensajeTurnoMB = signal<MensajeTurnoMB>({
    resultadoDado: 0, 
    texto: "Escoge la acción que deseas realizar hereje."
  });

  public readonly mensajeTurnoMB = this._mensajeTurnoMB.asReadonly();
  public faseActualMB = signal<FaseTurnoMB>('INICIO_MB');

  inicializarDatos(): Observable<any> {
    return forkJoin({
      bestiario_pv: this.http.get(this.URL_BESTIARIO_PV, { responseType: 'text' }).pipe(map(csv => this.parseBestiario(csv))),
      eventos_internos: this.http.get(this.URL_EVENTOS_INTERNOS, { responseType: 'text'}).pipe(map(csv => this.parseEvento(csv)))
    }).pipe(
      tap(res => {
        // Guardamos en los signals internos
        this._bestiario.set(res.bestiario_pv);
        this._eventosInt.set(res.eventos_internos);
      })
    );
  }

    // Al iniciar o al cambiar de acción
  actualizarTexto(nuevoTexto: string) {
    this._mensajeTurnoMB.update(actual => {
      return {
        ...actual, 
        texto: nuevoTexto
      }
    });
  }

  actualizarMensaje(resultadoDado: number, nuevoTexto: string) {
    this._mensajeTurnoMB.update(actual => {
      return {
        ...actual,
        resultadoDado: resultadoDado, 
        texto: nuevoTexto
      }
    });
  }

  cambiarFaseTurnoMB(fase: FaseTurnoMB){
    this.faseActualMB.set(fase);
  }

  public obtenerMonstruosDeEncuentro(idsBestiario: string): Monstruo[] {
    // 1. Limpiamos espacios por si el string viene como "CD-14, BE-11"
    const aIdsBestiario = idsBestiario.split(",").map(id => id.trim());

    // 2. Filtramos comparando contra el ARRAY para búsqueda exacta
    return this.bestiario().filter(b => aIdsBestiario.includes(b.id));
  }

  public seleccionarFamilia(familia: string){
    return this.bestiario().filter(b => b.familia === familia);
  }

  public obtenerEvento(resultadoDado: number): Evento | null{
    console.log(resultadoDado);
    console.log("EVENTOS", this._eventosInt());
    const eventoEncontrado =  this.eventosInt().find(e => e.resultadoDado === resultadoDado);
    return eventoEncontrado ?? null;
  }

  private parseBestiario(csv: string) {
    const filas = parseFullCsv(csv); // Usamos PapaParse
    return filas.map(f => ({
      id: f.id, 
      categoria: f.categoria,
      nombre: f.nombre,
      familia: f.familia,
      mv: f.mv,
      at: f.at,
      df: f.df,
      pc: f.pc,
      pm: f.pm,
      especial: f.especial
    } as Monstruo));
  }

  private parseEvento(csv: string) {
    const filas = parseFullCsv(csv);
    return filas.map(f => ({
      resultadoDado: f.resultado,
      texto: f.evento
    }))
  }
}
