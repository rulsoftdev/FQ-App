import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { stringToBoolean, parseFullCsv } from '../utils'; // Importamos las utils
import { Carta, EstadoMazoMision, TipoPila, PartidaEnCurso, Mision, Mazo, FaseTurnoHeroes } from '../models/fetenquest.model'; // Ajusta rutas
import { MOCK_CARTAS, MOCK_ESTADO_PARTIDA, MOCK_MAZOS, MOCK_PARTIDA_ACTIVA, MOCK_MISION_AVENTURA } from '../../../assets/data/mocks';
import { forkJoin, Observable } from 'rxjs';
export type FaseTurno = 'HEROES' | 'SALA_ABIERTA' | 'EVENTO' | 'PASILLO' | 'MB';
// En deck.service.ts o en tus constantes
const ESCALA_DADOS_TRAMPA = ['1D12', '1D10', '1D8', '1D6', '1D4'];

@Injectable({
  providedIn: 'root'
})
export class DeckService {

  private http = inject(HttpClient);
  private readonly URL_MAZOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=1724494956&single=true&output=csv';
  private readonly URL_CARTAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=0&single=true&output=csv';
  private readonly URL_MISIONES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=798576792&single=true&output=csv';
  
  // Signal para almacenar todas las cartas de la base de datos
  private _biblioteca = signal<Carta[]>([]);
  public readonly biblioteca = this._biblioteca.asReadonly();
  private _mazosCargados = signal<Mazo[]>([]);
  public readonly mazosCargados = this._mazosCargados.asReadonly();
  private _misiones = signal<Mision[]>([]);
  public readonly misiones = this._misiones.asReadonly();

  // Estado de la partida (Nivel de peligro, misión, etc.)
  // En lugar de | null, inicializamos con valores base
  private _partida = signal<PartidaEnCurso>(MOCK_PARTIDA_ACTIVA);
  public readonly partida = this._partida.asReadonly();

  // 1. Estado privado de las cartas (Signal)
  // Inicializamos con el mock de la partida activa
  private _cartasEnPartida = signal<EstadoMazoMision[]>(MOCK_ESTADO_PARTIDA);
  public faseActual = signal<FaseTurno>('HEROES');
  public faseTurnoHeroes = signal<FaseTurnoHeroes>('INICIO_HEROES')

  public misionActual = signal<Mision | null>(null);
  // 2. Carta que se está mostrando actualmente en el Dashboard
  private _cartaActiva = signal<Carta | null>(null);
  // Signal para el mensaje de la alerta
  public mensajeAlerta = signal<{titulo: string, cuerpo: string} | null>(null);

  // Exponemos los signals como solo lectura para los componentes
  public readonly estados = this._cartasEnPartida.asReadonly();
  public readonly cartaActiva = this._cartaActiva.asReadonly();

  constructor() {
    // Opcional: Podrías inicializar la carta activa con la última del descarte
    // o dejarla en null hasta que el usuario pulse un mazo.
  }

  /**
   * Ahora devuelve el Observable para que el Dashboard pueda "enterarse" de cuándo acaba
   */
  inicializarDatos(): Observable<any> {
    
    return forkJoin({
      mazos: this.http.get(this.URL_MAZOS, { responseType: 'text' }).pipe(map(csv => this.parseMazos(csv))),
      cartas: this.http.get(this.URL_CARTAS, { responseType: 'text' }).pipe(map(csv => this.parseCartas(csv))),
      misiones: this.http.get(this.URL_MISIONES, { responseType: 'text' }).pipe(map(csv => this.parseMisiones(csv)))
    }).pipe(
      tap(res => {
        // Guardamos en los signals internos
        this._mazosCargados.set(res.mazos);
        this._biblioteca.set(res.cartas);
        this._misiones.set(res.misiones);
      })
    );
  }

  private testDeCargaMazos() {
    let estadoAtrezoFull =  this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-ATR'));
    console.log('Todos los Atrezos', estadoAtrezoFull);
    let estadoAtrezo =  this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-ATR' && !['Cofre', 'Sin Atrezo'].includes(c.tipo)));
    console.log('Atrezos', estadoAtrezo);
    let estadoAtrezoCofres =  this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-ATR' && c.tipo === 'Cofre'));
    console.log('Cofres', estadoAtrezoCofres);
    let estadoSinAtrezo =  this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-ATR' && c.tipo === 'Sin Atrezo'));
    console.log('Sin Atrezo', estadoSinAtrezo);
    let estadoSalasFull = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-SAL'));
    console.log('Todas las Salas', estadoSalasFull);
    let estadoSalasNormales = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-SAL' && c.tipo === 'Normal'));
    console.log('Salas normales', estadoSalasNormales);
    let estadoSalasEspeciales = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-SAL' && c.tipo === 'Especial'));
    console.log('Salas especiales', estadoSalasEspeciales);
    let estadoSalaObjetivo = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-SAL' && c.tipo === 'Objetivo'));
    console.log('Salas objetivo', estadoSalaObjetivo);
    let estadoSalaEscalera = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-SAL' && c.tipo === 'Escalera'));
    console.log('Salas escalera', estadoSalaEscalera);
    let estadoPasillos = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-PAS'));
    console.log('Pasillos', estadoPasillos);
    let estadoEspeciales = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-ESP'));
    console.log('Salas Especiales', estadoEspeciales);
    let estadoTrampas = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-TRA'));
    console.log('Trampas', estadoTrampas);
    let estadoMazmorras = this.crearEstadoMazo(this.biblioteca().filter(c => c.idMazo === 'M-MAZ'));
    console.log('Mazmorras', estadoMazmorras);
    this._cartasEnPartida.set([...estadoAtrezoFull, ...estadoAtrezoCofres, ...estadoSalasFull, ...estadoPasillos, 
      ...estadoEspeciales, ...estadoTrampas, ...estadoMazmorras]);
    console.log(this._cartasEnPartida());
  }
  // deck.service.ts

  // Mazo auxiliar para los cofres que entrarán más tarde (Peligro 5 y 9)
  private _reservaCofres = signal<EstadoMazoMision[]>([]);

  /**
   * MÉTODO PRINCIPAL: Configura todos los mazos según las reglas de la misión
   */
  configurarMision(mision: Mision) {
    const biblioteca = this.biblioteca();
    let todosLosMazosConfigurados: EstadoMazoMision[] = [];

    // --- PASO 1: TRAMPAS Y PASILLOS (COMPLETOS) ---
    const trampas = this.crearEstadoMazo(biblioteca.filter(c => c.idMazo === 'M-TRA'));
    const pasillos = this.crearEstadoMazo(biblioteca.filter(c => c.idMazo === 'M-PAS'));
    
    todosLosMazosConfigurados.push(...trampas, ...pasillos);

    // --- PASO 2: MAZO DE ATREZO (CON LOGICA DE COFRES Y FILTROS) ---
    const mazoAtrezo = this.generarMazoAtrezo(mision, biblioteca);
    todosLosMazosConfigurados.push(...mazoAtrezo);

    // --- PASO 3: MAZO DE SALAS (LÓGICA CLÍMAX / BOSS) ---
    const mazoSalas = this.generarMazoSalas(mision, biblioteca);
    todosLosMazosConfigurados.push(...mazoSalas);

    // --- PASO 4: MAZMORRAS (OPCIONAL/RESTO) ---
    const mazmorras = this.crearEstadoMazo(biblioteca.filter(c => c.idMazo === 'M-MAZ'));
    todosLosMazosConfigurados.push(...mazmorras);

    // Guardamos el estado final de la partida
    this._cartasEnPartida.set(todosLosMazosConfigurados);
    console.log(todosLosMazosConfigurados);
  }

  private generarMazoAtrezo(mision: Mision, biblioteca: Carta[]): EstadoMazoMision[] {
    const todasAtrezo = biblioteca.filter(c => c.idMazo === 'M-ATR');
    let mazoFinal: EstadoMazoMision[] = [];

    // 1. COFRES: Barajar pool completo antes de extraer
    const poolCofres = this.crearEstadoMazo(todasAtrezo.filter(c => c.tipo === 'Cofre'));
    const cofresBarajados = this.barajar(poolCofres);
    
    const cofreInicial = cofresBarajados.slice(0, 1);
    this._reservaCofres.set(cofresBarajados.slice(1, 5)); // Reserva para peligro 5 y 9
    mazoFinal.push(...cofreInicial);

    // 2. SIN ATREZO: Barajar pool completo antes de extraer
    const poolSinAtrezo = this.crearEstadoMazo(todasAtrezo.filter(c => c.tipo === 'Sin Atrezo'));
    const sinAtrezoSeleccionados = this.barajar(poolSinAtrezo)
      .slice(0, mision.configuracion!.atrezoSinAtrezo);
    mazoFinal.push(...sinAtrezoSeleccionados);

    // 3. OBLIGATORIOS (Ej: "2-Libreria")
    mision.configuracion!.idsAtrezoFijos.forEach(item => {
      const [cantStr, tipoBusqueda] = item.includes('-') ? item.split('-') : ['1', item];
      const cantidad = Number(cantStr) || 1;

      // Buscamos variantes y las barajamos para que no salga siempre la misma librería
      const variantes = this.crearEstadoMazo(todasAtrezo.filter(c => c.tipo === tipoBusqueda.trim()));
      const variantesAleatorias = this.barajar(variantes);
      
      for (let i = 0; i < cantidad; i++) {
        if (variantesAleatorias.length > 0) {
          // Usamos el módulo para rotar si piden más de las que existen, pero ya barajadas
          const seleccionada = variantesAleatorias[i % variantesAleatorias.length];
          mazoFinal.push(seleccionada);
        }
      }
    });

    // 4. ATREZOS AL AZAR (Rellenar con lo restante)
    const tiposExcluidos = mision.configuracion!.idsAtrezoExcluido;
    
    const poolCandidatos = todasAtrezo.filter(c => 
      c.tipo !== 'Cofre' && 
      c.tipo !== 'Sin Atrezo' && 
      !tiposExcluidos.includes(c.tipo) &&
      // Evitamos duplicar cartas que ya han sido seleccionadas como fijas/obligatorias
      !mazoFinal.some(yaEnMazo => yaEnMazo.idCarta === c.id)
    );

    // Barajamos el pool de candidatos sobrantes antes de elegir los necesarios
    const azarSeleccionados = this.barajar(this.crearEstadoMazo(poolCandidatos))
      .slice(0, mision.configuracion!.atrezoAzar);

    mazoFinal.push(...azarSeleccionados);

    // Mezcla final de todo el mazo de Atrezo y asignación de posiciones
    return this.barajar(mazoFinal).map((carta, index) => ({
      ...carta,
      posicion: index
    }));
  }

  private generarMazoSalas(mision: Mision, biblioteca: Carta[]): EstadoMazoMision[] {
    const todasSalas = biblioteca.filter(c => c.idMazo === 'M-SAL');

    // 1. SALAS NORMALES: Barajamos todas y luego cogemos las N que pide la misión
    const poolNormales = todasSalas.filter(c => c.tipo === 'Normal');
    const normalesSeleccionadas = this.barajar(this.crearEstadoMazo(poolNormales))
      .slice(0, mision.configuracion!.salasNormales);

    // 2. SALAS ESPECIALES: Barajamos todas y luego cogemos las N que pide la misión
    const poolEspeciales = todasSalas.filter(c => c.tipo === 'Especial');
    const especialesSeleccionadas = this.barajar(this.crearEstadoMazo(poolEspeciales))
      .slice(0, mision.configuracion!.salasEspeciales);

    // 3. MEZCLA INICIAL: Juntamos las seleccionadas y barajamos el grupo completo
    let mazoMezclado = this.barajar([...normalesSeleccionadas, ...especialesSeleccionadas]);

    // 4. EL CLÍMAX: Extraemos 2 cartas al azar del mazo ya mezclado
    const dosParaElFinal = mazoMezclado.splice(0, 2);
    
    // 5. SALA OBJETIVO: La buscamos y la juntamos con las dos anteriores
    const salaObjetivoBase = todasSalas.find(c => c.tipo === 'Objetivo');
    let bloqueFinal: EstadoMazoMision[] = [...dosParaElFinal];
    
    if (salaObjetivoBase) {
      bloqueFinal.push(this.mapearACartaEstado(salaObjetivoBase));
    }

    // Barajamos el bloque de 3 para que el Boss no sepa ni él dónde está
    const bloqueFinalBarajado = this.barajar(bloqueFinal);

    // 6. ENSAMBLAJE: Resto del mazo + Bloque final de 3
    const mazoFinal = [...mazoMezclado, ...bloqueFinalBarajado];

    // Asignamos posiciones finales (0 arriba ... X abajo)
    return mazoFinal.map((c, i) => ({ ...c, posicion: i }));
  }

  /**
   * Selecciona una misión por ID y la prepara para el Dashboard
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
   * Devuelve el signal de estados (útil para los computed del componente)
   */
  obtenerEstados() {
    return this._cartasEnPartida;
  }

  /**
   * Lógica principal para robar una carta de un mazo específico
   */
  robarCarta(idMazo: string) {
    // 1. Obtener estado actual de los signals (Snapshot)
    const cartasEnPartida = this._cartasEnPartida();
    const biblioteca = this.biblioteca(); // Nuestra nueva fuente desde Google Sheets
    const mazos = this.mazosCargados();

    // 2. Filtrar cartas disponibles en el mazo de robo
    const cartasDisponibles = cartasEnPartida
      .filter(c => c.idMazo === idMazo && c.pila === 'Robo')
      .sort((a, b) => a.posicion - b.posicion);

    // 3. Gestión de Fases
    this.actualizarFaseSegunMazo(idMazo, cartasDisponibles.length);
    this.resetearFase();

    // 4. Lógica de reciclaje si no hay cartas
    if (cartasDisponibles.length === 0) {
      const tieneReciclables = cartasEnPartida.some(c => 
        c.idMazo === idMazo && c.pila === 'Descarte' && c.reciclable
      );
      
      if (tieneReciclables) {
        this.reciclarDescarte(idMazo);
        this.robarCarta(idMazo); // Reintentar tras reciclar
        return;
      }
    }

    // 5. Ejecución del robo
    if (cartasDisponibles.length > 0) {
      const proxima = cartasDisponibles[0];
      
      // BÚSQUEDA EFICIENTE: Buscamos en la biblioteca cargada de Drive
      const infoCarta = biblioteca.find(c => c.id === proxima.idCarta);

      if (infoCarta) {
        this.procesarMovimientoPila(proxima);
        this._cartaActiva.set(infoCarta);
      }
    } else {
      // 6. Caso: Mazo totalmente agotado
      this.mostrarMazoAgotado(idMazo, mazos);
    }

  }

  /**
   * Métodos de apoyo para mantener el código limpio y eficiente
   */
  private actualizarFaseSegunMazo(idMazo: string, cantidad: number) {
    if (idMazo === 'M-SAL' && cantidad > 0) {
      this.faseActual.set('SALA_ABIERTA');
    } else if (['M-TRP', 'M-MAZ', 'M-EVE', 'M-EVI', 'M-ATR'].includes(idMazo)) {
      this.faseActual.set('HEROES');
    }
  }

  // Método para resetear el turno manualmente si es necesario
  resetearFase() {
    this.faseTurnoHeroes.set('INICIO_HEROES');
  }

  cambiarFase(fase: FaseTurno) {
    if(fase === 'MB') {
      this._cartaActiva.set(null);
    }
    this.faseActual.set(fase);
  }

  cambiarFaseTurnoMB(fase: FaseTurnoHeroes){
      this.faseTurnoHeroes.set(fase);
  }

  private procesarMovimientoPila(proxima: any) {
    // Si es un evento, solemos reciclar inmediatamente según tu lógica
    if (['M-EVI', 'M-EVE'].includes(proxima.idMazo)) {
      this.reciclarDescarte(proxima.idMazo);
    } else {
      // Pasamos a descarte
      this._cartasEnPartida.update(lista =>
        lista.map(est => est.id === proxima.id ? { ...est, pila: 'Descarte' } : est)
      );
    }
  }

  private mostrarMazoAgotado(idMazo: string, mazos: Mazo[]) {
    const mazoInfo = mazos.find(m => m.id === idMazo);
    
    this._cartaActiva.set({
      id: 'DORSO',
      nombre: `Mazo de ${mazoInfo?.nombre || 'Desconocido'} Agotado`,
      idMazo: idMazo,
      imagen: mazoInfo?.dorso || 'mazmorras/dorso_mazmorra.png',
      tipo: 'Especial',
      oficial: true,
      juego: 'FetenQuest',
      numeroCopias: 0
    });
  }

  /**
   * Paso 4 de la planificación: Cambiar la carta fija (Endpoint futuro)
   * Por ahora, simplemente actualizamos el estado localmente
   */
  actualizarCartaFija(idEstado: string, nuevaPila: 'Mano' | 'Tablero' | 'Descarte') {
    this._cartasEnPartida.update(lista =>
      lista.map(est => est.id === idEstado ? { ...est, pila: nuevaPila } : est)
    );
  }

    /**
   * Toma las cartas del descarte, las baraja y las devuelve a la pila de robo
   */
  private reciclarDescarte(idMazo: string) {
    const descarte = this._cartasEnPartida().filter(c => c.idMazo === idMazo && c.pila === 'Descarte' && c.reciclable);
    
    if (descarte.length === 0) return;

    // Barajamos el array
    const nuevoOrden = this.shuffleArray([...descarte]);

    this._cartasEnPartida.update(estados => {
      return estados.map(est => {
        const indiceEnNuevoOrden = nuevoOrden.findIndex(n => n.id === est.id);
        if (indiceEnNuevoOrden !== -1) {
          return { ...est, pila: 'Robo' as TipoPila, posicion: indiceEnNuevoOrden + 1 };
        }
        return est;
      });
    });
  }

  
  /**
   * Algoritmo de barajado Fisher-Yates
   */
  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Modifica el nivel de peligro actual de la partida activa
   */
  actualizarNivelPeligro(delta: number) {
    // Asumiendo que tienes un signal para la partida o accedes al estado de PartidaEnCurso
    // Por ahora, si lo manejas como un valor simple o dentro de un objeto:
    const nuevoNivel = this.partida().nivelPeligroActual + delta;
    
    // Evitamos que baje de 0
    if (nuevoNivel >= 0 && nuevoNivel <= 9) {
      this._partida.update(p => ({ ...p, nivelPeligroActual: nuevoNivel }));
    }
  }

  cerrarAlerta() {
    this.mensajeAlerta.set(null);
  }

  /**
   * Transforma una Carta de la biblioteca en un objeto de estado para la partida.
   * Genera un ID único para cada "instancia" física de la carta.
   */
  private mapearACartaEstado(carta: Carta): EstadoMazoMision {
    return {
      // ID único de esta instancia (para que no colisionen cartas iguales)
      id: crypto.randomUUID(), 
      idPartida: crypto.randomUUID(), 
      // Referencia al ID original de la biblioteca (ej: 'SAL-01')
      idCarta: carta.id,
      
      // El mazo al que pertenece en esta partida
      idMazo: carta.idMazo,
      
      // Estado inicial de la carta en el tablero
      posicion: 0, // Se sobreescribirá al barajar el mazo final
      pila: 'Robo',
      reciclable: ['M-TRA', 'M-EVI', 'M-EVE', 'M-PAS'].includes(carta.idMazo)
    };
  }

  /**
   * Parsea la hoja de Mazos usando el nuevo motor PapaParse
   */
  parseMazos(csv: string): Mazo[] {
    // 1. Obtenemos el array de objetos basado en las cabeceras del CSV
    const filas = parseFullCsv(csv);
    
    // 2. Mapeamos cada fila a la interfaz Mazo
    return filas.map(fila => {
      return { 
        // Usamos los nombres exactos de las columnas de tu Google Sheet
        id: fila.id, 
        nombre: fila.nombre, 
        // PapaParse ya maneja las comas, solo nos aseguramos de limpiar espacios
        dorso: fila.dorso ? String(fila.dorso).trim() : 'mazmorras/dorso_defecto.png' 
      } as Mazo;
    });
  }

  parseCartas(csv: string): Carta[] {
    // 1. Convertimos el CSV completo en un array de objetos
    const filas = parseFullCsv(csv);
    
    // 2. Mapeamos cada objeto a nuestra interfaz Carta
    return filas.map(fila => {
      return { 
        // Accedemos por el nombre exacto de la cabecera en tu Excel
        id: fila.id, 
        nombre: fila.nombre, 
        idMazo: fila.idMazo, 
        imagen: fila.imagen ? String(fila.imagen).trim() : '', 
        tipo: fila.tipo, 
        // Usamos nuestra util para el booleano
        oficial: stringToBoolean(fila.oficial), 
        juego: fila.juego, 
        // PapaParse con dynamicTyping: true ya suele darte el número, 
        // pero asegurar con Number() no está de más
        numeroCopias: Number(fila.numeroCopias) || 1 
      } as Carta;
    });
  }

  parseMisiones(csv: string) {
    const filas = parseFullCsv(csv);
    
    return filas.map(fila => {
      const mision: Mision = {
        id: fila.id,
        nombre: fila.nombre,
        lore: fila.lore, // PapaParse ya te da el texto limpio sin comillas
        nivelPeligroInicial: Number(fila.peligroInicial) || 0,
        dadoTrampa: fila.dadoTrampa,
        tablaEncuentros: fila.tablaEncuentros,
        monstruoErrante: fila.errante,
        monstruoErranteSuperior: fila.erranteSuperior,
        reglasEspeciales: fila.reglasEspeciales,
        salaObjetivo: fila.salaObjetivo,
        finMision: fila.finMision,
        configuracion: {
          salasNormales: Number(fila.conf_salasNorm) || 0,
          salasEspeciales: Number(fila.conf_salasEsp) || 0,
          mazmorraSalasNormales: Number(fila.conf_mazNorm) || 0,
          mazmorraSalasEspeciales: Number(fila.conf_mazEsp) || 0,
          mazmorraPasillos: Number(fila.conf_mazPas) || 0,
          incluyeJefe: String(fila.conf_jefe).toUpperCase() === 'TRUE',
          atrezoSinAtrezo: Number(fila.conf_sinAtrezo) || 0,
          atrezoAzar: Number(fila.conf_azarAtrezo) || 0,
          atrezoCofre: Number(fila.conf_cofres) || 0,
          // Limpiamos los IDs que vienen separados por coma o punto y coma
          idsSalasEspeciales: this.splitMultipleIds(fila.conf_idsSalasEsp),
          idsAtrezoFijos: this.splitMultipleIds(fila.conf_idsAtrezoFijos),
          idsAtrezoExcluido: this.splitMultipleIds(fila.conf_idsAtrezoExcluido)
        }
      };
      return mision;
    });
  }

  /**
   * Helper para manejar las listas de IDs dentro de una celda
   */
  private splitMultipleIds(valor: any): string[] {
    if (!valor) return [];
    // Aceptamos tanto comas como punto y coma por si el usuario se equivoca
    const separador = String(valor).includes(';') ? ';' : ',';
    return String(valor).split(separador).map(id => id.trim()).filter(id => id !== '');
  }

  private crearEstadoMazo(cartas: Carta[]): EstadoMazoMision[] {
    const estados = cartas.flatMap(carta => {
      // Si la carta tiene numeroCopias, creamos tantas instancias como diga
      const copias = Array(carta.numeroCopias || 1).fill(null).map(() => (this.mapearACartaEstado(carta)));
      return copias;
    });

    return this.barajar(estados as EstadoMazoMision[]);
  }

  private barajar(lista: EstadoMazoMision[]): EstadoMazoMision[] {
    const barajada = [...lista].sort(() => Math.random() - 0.5);
    return barajada.map((c, index) => ({ ...c, posicion: index }));
  }

  /**
   * Reduce el número de caras del dado de trampa de la misión actual.
   * Ejemplo: De 1D10 pasa a 1D8.
   */
  degradarDadoTrampa() {
    const mision = this.misionActual();
    if (!mision) return;

    const dadoActual = mision.dadoTrampa;
    const indexActual = ESCALA_DADOS_TRAMPA.indexOf(dadoActual);

    // Si el dado existe y no es ya el más bajo (1D4)
    if (indexActual !== -1 && indexActual < ESCALA_DADOS_TRAMPA.length - 1) {
      const nuevoDado = ESCALA_DADOS_TRAMPA[indexActual + 1];
      
      // Actualizamos el signal de la misión conservando el resto de datos
      this.misionActual.set({
        ...mision,
        dadoTrampa: nuevoDado
      });

      console.log(`⚠️ ¡Peligro aumentado! El dado de trampa ahora es ${nuevoDado}`);
    } else {
      console.log("ℹ️ El dado de trampa ya está en su nivel de máxima criticidad (1D4).");
    }
  }

}