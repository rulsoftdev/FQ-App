import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { forkJoin, Observable } from 'rxjs';
import { parseFullCsv } from '../utils';
import { FaseTurnoMB, MensajeTurnoMB, Monstruo } from '../models/fetenquest.model';

@Injectable({
  providedIn: 'root',
})
export class TurnoMBService {

  private http = inject(HttpClient);
  private readonly URL_BESTIARIO_PV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=191859337&single=true&output=csv";
    // Usaremos un signal para guardar todos los monstruos categorizados
  private _bestiario = signal<Monstruo[]>([]);
  public readonly bestiario = this._bestiario.asReadonly();
  private _mensajeTurnoMB = signal<MensajeTurnoMB>({
    resultadoDado: 0, 
    texto: "Escoge la acción que deseas realizar hereje."
  });
  public readonly mensajeTurnoMB = this._mensajeTurnoMB.asReadonly();
  public faseActualMB = signal<FaseTurnoMB>('INICIO_MB');

  inicializarDatos(): Observable<any> {
    return forkJoin({
      bestiario_pv: this.http.get(this.URL_BESTIARIO_PV, { responseType: 'text' }).pipe(map(csv => this.parseBestiario(csv))),
    }).pipe(
      tap(res => {
        // Guardamos en los signals internos
        this._bestiario.set(res.bestiario_pv);
        console.log("BESTIARIO", this.bestiario());
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

  public obtenerMonstruosDeEncuentro(textoEncuentro: string, textoAlternativas: string): any[] {
    // 1. Extraemos y unimos
    const combinados = [
      ...this.extraerNombresBase(textoEncuentro), 
      ...this.extraerNombresBase(textoAlternativas)
    ];

    // 2. Quitamos duplicados y nombres vacíos por si acaso
    const nombresUnicos = [...new Set(combinados)];
    
    console.log("Nombres únicos a buscar", nombresUnicos);
    
    // 3. Mapeo al bestiario (tu lógica de búsqueda exacta)
    return nombresUnicos.map(nBusq => {
      const nBusqLimpio = this.normalizarTexto(nBusq);

      return this.bestiario().find(m => {
        const nombreBestiarioLimpio = this.normalizarTexto(m.nombre);
        return nombreBestiarioLimpio === nBusqLimpio;
      });
    }).filter(m => m !== undefined);
  }

  /**
   * Normaliza un texto para poder comparar nombres de monstruos de forma segura.
   * Quita saltos de línea, espacios extra, tildes y lo pasa a minúsculas.
   */
  private normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto
      .replace(/\r?\n|\r/g, ' ') // Cambia saltos de línea por un espacio normal
      .replace(/\s+/g, ' ')      // Colapsa múltiples espacios en uno solo
      .trim()                    // Quita espacios al inicio y al final
      .toLowerCase()             // Todo a minúsculas
      .normalize("NFD")          // Separa las tildes de las letras (ej: ó -> o´)
      .replace(/[\u0300-\u036f]/g, ""); // Elimina las tildes por completo
  }

  /**
   * Toma una cadena como "2 Goblins y 1 Orco" y devuelve ['Goblin', 'Orco']
   */
  private extraerNombresBase(texto: string): string[] {
    return texto
      .split(/,| y /) // Separa por comas o por la letra "y"
      .map(fragmento => {
        return fragmento
          .replace(/[0-9]/g, '') // Elimina números (el "2" de "2 Goblins")
          .trim()
          // Eliminación básica de plurales en español
          .replace(/es$/i, '')   // Quita "es" (Goblins -> Goblin) *asumiendo inglés/esp*
          .replace(/s$/i, '')    // Quita "s" (Orcos -> Orco)
          .trim();
      })
      .filter(n => n.length > 2); // Evita fragmentos vacíos o conectores sueltos
  }

  private parseBestiario(csv: string) {
    const filas = parseFullCsv(csv); // Usamos PapaParse
    return filas.map(f => ({
      id: crypto.randomUUID(), 
      categoria: f.categoria,
      nombre: f.nombre,
      mv: f.mv,
      at: f.at,
      df: f.df,
      pc: f.pc,
      pm: f.pm,
      especial: f.especial
    } as Monstruo));
  }
}
