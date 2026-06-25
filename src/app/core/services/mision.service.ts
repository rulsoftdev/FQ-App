import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { stringToBoolean, parseFullCsv, splitMultipleIds } from '../utils'; // Importamos las utils
import { forkJoin, Observable } from 'rxjs';
import { Mision, PartidaEnCurso, RutaExploracion } from '../models/fetenquest.interface';
import { MOCK_PARTIDA_ACTIVA } from '../../../assets/data/mocks';
import { DeckService } from './deck.service';

const ESCALA_DADOS_TRAMPA = ['1D12', '1D10', '1D8', '1D6', '1D4'];

@Injectable({
  providedIn: 'root',
})
export class MisionService {

  private http = inject(HttpClient);
  private readonly URL_MISIONES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=798576792&single=true&output=csv';
  
  private _misiones = signal<Mision[]>([]);
  public readonly misiones = this._misiones.asReadonly();
  private _partida = signal<PartidaEnCurso>(MOCK_PARTIDA_ACTIVA);
  public readonly partida = this._partida.asReadonly();
  
  private deckService = inject(DeckService);
  public misionActual = signal<Mision | null>(null);
  // core/services/mision.service.ts
  campanyas = computed(() => {
    const misiones = this.misiones();
    const grupos = misiones.reduce((acc, mision) => {
      const nombre = mision.campanya || 'Misiones Independientes';
      if (!acc[nombre]) acc[nombre] = [];
      acc[nombre].push(mision);
      return acc;
    }, {} as Record<string, Mision[]>);

    return Object.entries(grupos).map(([nombre, lista]) => ({ nombre, misiones: lista }));
  });
  

  inicializarDatos(): Observable<any> {    
    return forkJoin({
      misiones: this.http.get(this.URL_MISIONES, { responseType: 'text' }).pipe(map(csv => this.parseMisiones(csv)))
    }).pipe(
      tap(res => {
        // Guardamos en los signals internos
        this._misiones.set(res.misiones);
      })
    );
  }

  public cargarMision(mision: Mision){
    this.misionActual.set(mision);
  }

  public cargarPartida(partida: PartidaEnCurso){
    this._partida.set(partida);
  }

  inicializarPartida(mision: Mision) {
    if (mision) {
      this._partida.update(actual => {
        // Si 'actual' es null (estado inicial), creamos un objeto base
        // Si ya existía, preservamos sus campos y solo cambiamos los de la misión
        return {
          ...actual, // Mantiene id, exito, botin, etc. (si existen)
          idMision: mision.id,
          nivelPeligroActual: mision.nivelPeligroInicial,
          dadoTrampa: mision.dadoTrampa,
          fechaGuardado: new Date()
        } as PartidaEnCurso; 
      });
    }
  }
  
  /**
   * MÉTODO PRINCIPAL: Configura todos los mazos según las reglas de la misión
   */
  configurarMision(mision: Mision) {
    // --- PASO 1: TRAMPAS Y PASILLOS (COMPLETOS) ---
    this.deckService.generarMazo('M-TRA');
    this.deckService.generarMazo('M-PAS');
    this.deckService.generarMazo('M-SUC');
    
    // --- PASO 2: MAZO DE ATREZO (CON LOGICA DE COFRES Y FILTROS) ---
    this.deckService.generarMazoAtrezo(mision);

    // --- PASO 3: MAZO DE SALAS (LÓGICA CLÍMAX / BOSS) ---
    this.deckService.generarMazoSalas(mision);

    // --- PASO 4: MAZMORRAS (OPCIONAL/RESTO) ---
    let cartasMazmorraIds = this.deckService.generarMazoLosetas(mision);
    this.inicializarRutasDesdeCero(cartasMazmorraIds);

    // --- PASO 5: MAZO DE ATREZO (CON LOGICA DE COFRES Y FILTROS) ---
    this.deckService.generarMazoSalasEspeciales(mision);

    console.log('MAZO CONFIGURADO', this.deckService.cartasEnPartida());
  }

  /**
   * Inicializa la primera ruta ('MAZMORRA') metiendo todas las losetas en el botón base
   */
  public inicializarRutasDesdeCero(todasCartasIds: string[]) {
    this._partida.update(actual => {
      if (!actual) return actual;
      return {
        ...actual,
        rutasLosetas: [{ id: 1, nombre: 'MAZMORRA', cartasIds: todasCartasIds }]
      };
    });
  }

  /**
   * Actualiza el listado de rutas activas y bifurcadas desde el componente de acciones
   */
  public actualizarRutasLosetas(nuevasRutas: RutaExploracion[]) {
    this._partida.update(actual => {
      if (!actual) return actual;
      return {
        ...actual,
        rutasLosetas: nuevasRutas
      };
    });
  }

  /**
  * Selecciona una misión por ID y la prepara para el Mision
  */
  seleccionarMision(idMision: string) {
    const mision = this.misiones().find(m => m.id === idMision);
    
    if (mision) {
      this.misionActual.set(mision);
      this.inicializarPartida(mision);
      // this.testDeCargaMazos();
      this.configurarMision(mision);
      // Aquí podrías disparar la lógica de "Generar Mazos" 
      // basada en la configuración de esta misión.
      //this.prepararMazosPartida(mision); 
      console.log(`🏰 Misión cargada: ${mision.nombre}`);
    } else {
      console.error(`La misión ${idMision} no existe en la biblioteca.`);
    }
  }

  /**
   * Reduce el número de caras del dado de trampa de la misión actual.
   * Ejemplo: De 1D10 pasa a 1D8.
   */
  degradarDadoTrampa() {
    const partida = this.partida();
    if (!partida) return;

    const dadoActual = partida.dadoTrampa;
    const indexActual = ESCALA_DADOS_TRAMPA.indexOf(dadoActual);

    // Si el dado existe y no es ya el más bajo (1D4)
    if (indexActual !== -1 && indexActual < ESCALA_DADOS_TRAMPA.length - 1) {
      const nuevoDado = ESCALA_DADOS_TRAMPA[indexActual + 1];
      
      // Actualizamos el signal de la misión conservando el resto de datos
      this._partida.set({
        ...partida,
        dadoTrampa: nuevoDado
      });

      console.log(`⚠️ ¡Peligro aumentado! El dado de trampa ahora es ${nuevoDado}`);
    } else {
      console.log("ℹ️ El dado de trampa ya está en su nivel de máxima criticidad (1D4).");
    }
  }

  /**
   * Modifica el nivel de peligro actual de la partida activa
   */
  actualizarNivelPeligro(delta: number) {
    const nivelAnterior = this.partida().nivelPeligroActual;
    const nuevoNivel = nivelAnterior + delta;
    // 1. Validamos rangos (0 a 10)
    if (nuevoNivel < 0 || nuevoNivel > 10) return;
    
    // 2. Actualizamos el nivel en el estado
    this._partida.update(p => ({ ...p, nivelPeligroActual: nuevoNivel }));
    
    // 3. Control de cofres (Solo si subimos de nivel y no se ha reclamado antes)
    // Comprobamos si estamos subiendo (delta > 0) y si el nuevo nivel es un hito
    if (delta > 0 && (nuevoNivel === 5 || nuevoNivel === 9)) {      
      // Marcamos este nivel como "ya reclamado" para esta misión
      if (!this.partida().hitosReclamados?.includes(nuevoNivel)) {
        this.deckService.anyadirCofre();
      }
      this._partida.update(p => ({
        ...p,
        hitosReclamados: [...(p.hitosReclamados || []), nuevoNivel]
      }));
    }
  }

  parseMisiones(csv: string): Mision[] {
    const filas = parseFullCsv(csv);
    
    return filas.map(fila => {
      const mision: Mision = {
        id: fila.id,
        imagen: fila.imagen,
        campanya: fila.campanya,
        nombre: fila.nombre,
        autor: fila.autor,
        lore: fila.lore, // PapaParse ya te da el texto limpio sin comillas
        dificultad: fila.dificultad,
        nivelPeligroInicial: Number(fila.peligroInicial) || 0,
        dadoTrampa: fila.dadoTrampa,
        tablaEncuentros: fila.tablaEncuentros,
        nivelMaximoEncuentro: Number(fila.nivelMaximoEncuentro) || 0,
        monstruoErrante: fila.errante,
        monstruoErranteSuperior: fila.erranteSuperior,
        reglasEspeciales: fila.reglasEspeciales,
        salaObjetivo: fila.salaObjetivo,
        finMision: fila.finMision,
        configuracion: {
          salasNormales: Number(fila.conf_salas_normales) || 0,
          salasEspeciales: Number(fila.conf_salas_especiales) || 0,
          mazmorraSalasNormales: Number(fila.conf_mazmorra_normales) || 0,
          mazmorraSalasEspeciales: Number(fila.conf_mazmorra_especiales) || 0,
          mazmorraPasillos: Number(fila.conf_mazmorra_pasillos) || 0,
          incluyeEscalera: String(fila.conf_incluye_escalera).toUpperCase() === 'TRUE',
          incluyeSalaObjetivo: String(fila.conf_incluye_sala_objetivo).toUpperCase() === 'TRUE',
          salaObjetivoAlFinal: String(fila.conf_sala_objetivo_al_final).toUpperCase() === 'TRUE',
          incluyeJefe: String(fila.conf_incluye_jefe).toUpperCase() === 'TRUE',
          atrezoSinAtrezo: Number(fila.conf_sin_atrezo) || 0,
          atrezoAzar: Number(fila.conf_atrezo_azar) || 0,
          atrezoCofre: Number(fila.conf_cofres) || 0,
          tiposAtrezoFijos: fila.conf_tipos_atrezos_fijo,
          tiposAtrezoExcluido: fila.conf_tipos_atrezo_excluido,
          tiposSalasEsp: fila.conf_tipos_salas_especiales,
          idsSalasEspeciales: splitMultipleIds(fila.conf_ids_salas_especiales),
          salasEspecialesAzar: fila.conf_salas_especiales_azar
        }
      };
      return mision;
    });
  }


}
