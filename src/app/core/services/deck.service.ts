import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { stringToBoolean, parseFullCsv, splitMultipleIds } from '../utils'; // Importamos las utils
import { Carta, EstadoMazoMision, TipoPila, Mazo, FaseTurnoHeroes } from '../models/fetenquest.interface'; // Ajusta rutas
import { forkJoin, Observable } from 'rxjs';
import { Mision } from '../models/fetenquest.interface';
import { MisionService } from './mision.service';


@Injectable({
  providedIn: 'root'
})
export class DeckService {

  private http = inject(HttpClient);
  private readonly URL_MAZOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=1724494956&single=true&output=csv';
  private readonly URL_CARTAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwXIcmss9e8t-N5qdhH8NZfuYr4UxEQrxsEbaRxrAjOFOCIzGEDrBbsdHROgMgLvv0uSwajUfFuRJk/pub?gid=0&single=true&output=csv';

  // Signal para almacenar todas las cartas de la base de datos
  private _biblioteca = signal<Carta[]>([]);
  public readonly biblioteca = this._biblioteca.asReadonly();
  private _mazosCargados = signal<Mazo[]>([]);
  public readonly mazosCargados = this._mazosCargados.asReadonly();

  // 1. Estado privado de las cartas (Signal)
  // Inicializamos con el mock de la partida activa
  private _cartasEnPartida = signal<EstadoMazoMision[]>([]);
  private _mazoAGestionar = signal<EstadoMazoMision[]>([])
  public faseTurnoHeroes = signal<FaseTurnoHeroes>('INICIO_HEROES')

  // 2. Carta que se está mostrando actualmente en el Mision
  private _cartaActiva = signal<Carta | null>(null);
  // Signal para el mensaje de la alerta
  public mensajeAlerta = signal<{titulo: string, cuerpo: string} | null>(null);
  // Mazo auxiliar para los cofres que entrarán más tarde (Peligro 5 y 9)
  private _reservaCofres = signal<EstadoMazoMision[]>([]);

  // Exponemos los signals como solo lectura para los componentes
  public readonly cartasEnPartida = this._cartasEnPartida.asReadonly();
  public readonly cartaActiva = this._cartaActiva.asReadonly();
  public readonly mazoAGestionar = this._mazoAGestionar.asReadonly();

  constructor() {
    // Opcional: Podrías inicializar la carta activa con la última del descarte
    // o dejarla en null hasta que el usuario pulse un mazo.
  }

  public cargarCartasEnPartida(cartas: EstadoMazoMision[]) {
    this._cartasEnPartida.set(cartas);
  }

  public cargarCartaActiva(carta: Carta){
    this._cartaActiva.set(carta);
  }
  /**
   * Ahora devuelve el Observable para que el Mision pueda "enterarse" de cuándo acaba
   */
  inicializarDatos(): Observable<any> {    
    return forkJoin({
      mazos: this.http.get(this.URL_MAZOS, { responseType: 'text' }).pipe(map(csv => this.parseMazos(csv))),
      cartas: this.http.get(this.URL_CARTAS, { responseType: 'text' }).pipe(map(csv => this.parseCartas(csv)))
    }).pipe(
      tap(res => {
        // Guardamos en los signals internos
        this._mazosCargados.set(res.mazos);
        this._biblioteca.set(res.cartas);
      })
    );
  }



  /**
   * MÉTODO PRINCIPAL: Configura todos los mazos según las reglas de la misión
   */
  public generarMazoAtrezo(mision: Mision) {
    const todasAtrezo = this.biblioteca().filter(c => c.idMazo === 'M-ATR');

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
    splitMultipleIds(mision.configuracion!.tiposAtrezoFijos).forEach(item => {
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
    const tiposExcluidos = mision.configuracion!.tiposAtrezoExcluido;
    let poolCandidatos: Carta [] = [];
    if (tiposExcluidos){
      poolCandidatos = todasAtrezo.filter(c => 
        c.tipo !== 'Cofre' && 
        c.tipo !== 'Sin Atrezo' && 
        !tiposExcluidos.includes(c.tipo) &&
        // Evitamos duplicar cartas que ya han sido seleccionadas como fijas/obligatorias
        !mazoFinal.some(yaEnMazo => yaEnMazo.idCarta === c.idCarta)
      );
    }

    // Barajamos el pool de candidatos sobrantes antes de elegir los necesarios
    const azarSeleccionados = this.barajar(this.crearEstadoMazo(poolCandidatos))
      .slice(0, mision.configuracion!.atrezoAzar);

    mazoFinal.push(...azarSeleccionados);

    // Mezcla final de todo el mazo de Atrezo y asignación de posiciones
    const mazoAtrezoListo = this.barajar(mazoFinal).map((carta, index) => ({
      ...carta,
      posicion: index
    }));

    this._cartasEnPartida.update(cartasActuales => {
      // Eliminamos las cartas antiguas de Atrezo si las hubiera
      const otrasCartas = cartasActuales.filter(c => c.idMazo !== 'M-ATR');
      
      // Insertamos el nuevo mazo configurado para la misión
      return [...otrasCartas, ...mazoAtrezoListo];
    });

  }

  /*public generarMazoSalasEspeciales(mision: Mision){
    let mazoSalasEspecialesListo: EstadoMazoMision[] = [];
    const todasSalasEspeciales = this.biblioteca().filter(c => c.idMazo === 'M-ESP');

    const idsSalasEsp = mision.configuracion!.idsSalasEspeciales;
    const tiposSalasEsp = mision.configuracion!.tiposSalasEsp;
    if(idsSalasEsp.length > 0) {
      const salasSeleccionadas = todasSalasEspeciales.filter(c => idsSalasEsp.includes(c.idCarta));
      mazoSalasEspecialesListo = this.barajar(this.crearEstadoMazo(salasSeleccionadas));
    } else if (tiposSalasEsp.length > 0) {
      tiposSalasEsp.forEach(item => {
        const [cantStr, tipoBusqueda] = item.includes('-') ? item.split('-') : ['1', item];
        console.log(`CANTIDAD: ${cantStr}, TIPO: ${tipoBusqueda}`)
        const cantidad = Number(cantStr) || 1;
        console.log(`CANTIDAD: ${cantidad}, TIPO: ${tipoBusqueda}`)
        // Buscamos variantes y las barajamos para que no salga siempre la misma librería
        const variantes = this.crearEstadoMazo(todasSalasEspeciales.filter(c => c.tipo === tipoBusqueda.trim()));
        const variantesAleatorias = this.barajar(variantes);
        
        for (let i = 0; i < cantidad; i++) {
          if (variantesAleatorias.length > 0) {
            // Usamos el módulo para rotar si piden más de las que existen, pero ya barajadas
            const seleccionada = variantesAleatorias[i % variantesAleatorias.length];
            mazoSalasEspecialesListo.push(seleccionada);
          }
        }
      });
    }else {
      mazoSalasEspecialesListo = this.barajar(this.crearEstadoMazo(todasSalasEspeciales))
      .slice(0, mision.configuracion!.salasEspeciales);
    }
    
    this._cartasEnPartida.update(cartasActuales => {
      // Eliminamos las cartas antiguas de Atrezo si las hubiera
      const otrasCartas = cartasActuales.filter(c => c.idMazo !== 'M-ESP');
      
      // Insertamos el nuevo mazo configurado para la misión
      return [...otrasCartas, ...mazoSalasEspecialesListo];
    });
  }*/

  public generarMazoSalasEspeciales(mision: Mision) {
    let mazoSalasEspecialesListo: EstadoMazoMision[] = [];
    const todasSalasEspeciales = this.biblioteca().filter(c => c.idMazo === 'M-ESP');

    const idsSalasEsp = mision.configuracion!.idsSalasEspeciales;
    const tiposSalasEsp = mision.configuracion!.tiposSalasEsp;

    if (idsSalasEsp && idsSalasEsp.length > 0) {
      // 1. Selección por ID directo (aquí confiamos en que la config de la misión sea correcta)
      const salasSeleccionadas = todasSalasEspeciales.filter(c => idsSalasEsp.includes(c.idCarta));
      mazoSalasEspecialesListo = this.barajar(this.crearEstadoMazo(salasSeleccionadas));

    }
    if (tiposSalasEsp && tiposSalasEsp.length > 0) {
      // 2. Selección por TIPO con control de duplicados
      splitMultipleIds(tiposSalasEsp).forEach(item => {
        const [cantStr, tipoBusqueda] = item.includes('-') ? item.split('-') : ['1', item];
        const cantidad = Number(cantStr) || 1;
        
        // Filtramos las variantes que coincidan con el tipo Y que NO hayan sido elegidas ya
        const variantesDisponibles = todasSalasEspeciales.filter(c => 
          c.tipo === tipoBusqueda.trim() && 
          !mazoSalasEspecialesListo.some(e => e.idCarta === c.idCarta) // <-- Control de duplicados
        );

        // Barajamos las variantes disponibles de este tipo
        const variantesAleatorias = this.barajar(this.crearEstadoMazo(variantesDisponibles));

        // Añadimos solo hasta el máximo disponible para no repetir IDs
        const aAnyadir = Math.min(cantidad, variantesAleatorias.length);
        
        for (let i = 0; i < aAnyadir; i++) {
          mazoSalasEspecialesListo.push(variantesAleatorias[i]);
        }

        if (cantidad > variantesAleatorias.length) {
          console.warn(`Se pidieron ${cantidad} de ${tipoBusqueda}, pero solo hay ${variantesAleatorias.length} únicas disponibles.`);
        }
      });
    }
    if ( mision.configuracion!.salasEspecialesAzar > 0) {
      // 3. Selección aleatoria general
      const restoDeCartas = todasSalasEspeciales.filter(c => 
          c.tipo !== 'Sala Especial' && 
          !mazoSalasEspecialesListo.some(e => e.idCarta === c.idCarta)
        );
      const salasAzar = this.barajar(this.crearEstadoMazo(restoDeCartas)
        .slice(0, mision.configuracion!.salasEspecialesAzar));
      for (let i = 0; i < salasAzar.length; i++) {
        mazoSalasEspecialesListo.push(salasAzar[i]);
      }
    }

    // Actualización del Signal
    this._cartasEnPartida.update(cartasActuales => {
      const otrasCartas = cartasActuales.filter(c => c.idMazo !== 'M-ESP');
      return [...otrasCartas, ...mazoSalasEspecialesListo];
    });
  }

  public generarMazoSalas(mision: Mision) {
    const todasSalas = this.biblioteca().filter(c => c.idMazo === 'M-SAL');

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
    const mazoSalasListo =  mazoFinal.map((c, i) => ({ ...c, posicion: i }));

    this._cartasEnPartida.update(cartasActuales => {
      // Eliminamos las cartas antiguas de Atrezo si las hubiera
      const otrasCartas = cartasActuales.filter(c => c.idMazo !== 'M-SAL');
      
      // Insertamos el nuevo mazo configurado para la misión
      return [...otrasCartas, ...mazoSalasListo];
    });
  }

  public generarMazoLosetas(mision: Mision) {
    // 1. Extraemos TODAS las cartas que pertenecen al mazo de Mazmorra
    const todasCartasMazmorra = this.biblioteca().filter(c => c.idMazo === 'M-MAZ');

    let bloqueCartasMision: EstadoMazoMision[] = [];

    // --- PASO A: Añadir Salas Normales al azar ---
    const salasNormales = todasCartasMazmorra.filter(c => c.tipo === 'Normal');
    const normalesCantidad = mision.configuracion!.mazmorraSalasNormales || 0;
    const normalesSeleccionadas = this.barajar(this.crearEstadoMazo(salasNormales)).slice(0, normalesCantidad);
    bloqueCartasMision.push(...normalesSeleccionadas);

    // --- PASO B: Añadir Pasillos de Mazmorra ---
    const pasillos = todasCartasMazmorra.filter(c => c.tipo === 'Pasillo');
    const pasillosCantidad = mision.configuracion!.mazmorraPasillos || 0;
    const pasillosSeleccionados = this.barajar(this.crearEstadoMazo(pasillos)).slice(0, pasillosCantidad);
    bloqueCartasMision.push(...pasillosSeleccionados);

    // --- PASO C: Añadir la Escalera ---
    const escaleras = todasCartasMazmorra.filter(c => c.tipo === 'Escalera');
    if (escaleras.length > 0 && mision.configuracion!.incluyeEscalera) {
      // Normalmente habrá una escalera por misión, la barajamos por si hay variantes
      const escaleraSeleccionada = this.barajar(this.crearEstadoMazo(escaleras)).slice(0, 1);
      bloqueCartasMision.push(...escaleraSeleccionada);
    }

    // --- PASO D: Añadir Salas Especiales ---
    const salasEspeciales = todasCartasMazmorra.filter(c => c.tipo === 'Especial');
    const salasEspecialesCantidad = mision.configuracion!.mazmorraSalasEspeciales || 0;
    const salasEspecialesSeleccionadas = this.barajar(this.crearEstadoMazo(salasEspeciales)).slice(0, salasEspecialesCantidad);
    bloqueCartasMision.push(...salasEspecialesSeleccionadas);
    
    // --- PASO E: Mezclar el bloque base completo ---
    let mazoMezcladoCompleto = this.barajar(bloqueCartasMision);

    if(mision.configuracion!.incluyeSalaObjetivo){
      // --- PASO F: El clímax del mazo (Sala Objetivo + 3 acompañantes al fondo) ---
      const salasObjetivo = todasCartasMazmorra.filter(c => c.tipo === 'Objetivo');
      
      if (mazoMezcladoCompleto.length >= 3) {
        // Extraemos 2 del mazo ya mezclado
        const dosCartasParaElFinal = mazoMezcladoCompleto.splice(0, 3);
  
        // Creamos el trío del fondo y lo barajamos
        const comboFinalMezclado = this.barajar([...dosCartasParaElFinal, ...this.crearEstadoMazo(salasObjetivo)]);
  
        // Lo inyectamos al final del mazo
        mazoMezcladoCompleto = [...mazoMezcladoCompleto, ...comboFinalMezclado];
      } else {
        console.error("Error crítico: No se pudo preparar el fondo del mazo. Revisa que existan cartas de tipo 'Objetivo' o que el mazo base tenga losetas suficientes.");
      }
    }

    // --- PASO G: Mapeo de posiciones e inserción en el Signal global de partida ---
    const mazoFinalListo: EstadoMazoMision[] = mazoMezcladoCompleto.map((carta, index) => ({
      ...carta,
      posicion: index + 1,
      pila: 'Robo',
      idMazo: 'M-MAZ' // Forzamos que se mantenga el ID del mazo unificado
    }));

    this._cartasEnPartida.update(cartasActuales => {
      // Purgamos cartas antiguas de mazmorras si las hubiera
      const otrasCartas = cartasActuales.filter(c => c.idMazo !== 'M-MAZ');
      return [...otrasCartas, ...mazoFinalListo];
    });
  }

  /**
   * Devuelve el signal de cartasEnPartida
    (útil para los computed del componente)
   */
  obtenercartasEnPartida() {
    return this._cartasEnPartida;
  }

  obtenerMazo (idMazo: string): EstadoMazoMision[]{
    return this._cartasEnPartida().filter(c => c.idMazo === idMazo);
  }

  getMazoFull(idMazo: string): Carta[] {
    return this._biblioteca().filter(c => c.idMazo === idMazo);
  }

  resetearCartaActiva() {
    this._cartaActiva.set(null);
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
    this.actualizarFaseSegunMazo(idMazo, cartasDisponibles.length, '');

    // 4. Lógica de reciclaje si no hay cartas
    if (cartasDisponibles.length === 0) {
      const tieneReciclables = cartasEnPartida.some(c => 
        c.idMazo === idMazo && c.pila === 'Descarte' && c.reciclable
      );
      
      if (tieneReciclables) {
        this.reciclarYBarajarTodo(idMazo);
        this.robarCarta(idMazo); // Reintentar tras reciclar
        return;
      }
    }

    // 5. Ejecución del robo
    if (cartasDisponibles.length > 0) {
      const proxima = cartasDisponibles[0];
      
      // BÚSQUEDA EFICIENTE: Buscamos en la biblioteca cargada de Drive
      const infoCarta = biblioteca.find(c => c.idCarta === proxima.idCarta);

      if (infoCarta) {
        this.procesarMovimientoPila(proxima);
        this._cartaActiva.set(infoCarta);
      }
    } else {
      // 6. Caso: Mazo totalmente agotado
      this.mostrarMazoAgotado(idMazo, mazos);
    }
  }

  public robarCartaMazmorra(cartaEstado: EstadoMazoMision | null, idMazo: string) {
    if(cartaEstado){
      const infoCarta = this.biblioteca().find(c => c.idCarta === cartaEstado.idCarta);

      if (infoCarta) {
        this.procesarMovimientoPila(cartaEstado);
        this._cartaActiva.set(infoCarta);
        this.actualizarFaseSegunMazo(idMazo, 0, infoCarta.tipo!);
      }
    } else {
      const mazos = this.mazosCargados();
      this.mostrarMazoAgotado(idMazo, mazos);
    }

  }

  public anyadirCofre(){
    let cofreExtra = this._reservaCofres().pop();
    console.log("COFRE", cofreExtra);
    if (cofreExtra) {
      this._cartasEnPartida().push(cofreExtra);
      this.barajarMazo('M-ATR');
    }
  }

  /**
   * Métodos de apoyo para mantener el código limpio y eficiente
   */
  private actualizarFaseSegunMazo(idMazo: string, cantidad: number, tipo: string) {
    if (idMazo === 'M-SAL' && cantidad > 0 || idMazo === 'M-ATR' || idMazo === 'M-ESP' 
      || (idMazo === 'M-MAZ' && tipo.toLowerCase() !== 'pasillo')){
      this.faseTurnoHeroes.set('SALA_ABIERTA');
    } else if (['M-TRP', 'M-EVE', 'M-EVI'].includes(idMazo)) {
      this.faseTurnoHeroes.set('INICIO_HEROES');
    }
  }

  cambiarFaseTurno(fase: FaseTurnoHeroes){
      this.faseTurnoHeroes.set(fase);
  }

  private procesarMovimientoPila(proxima: EstadoMazoMision) {
    if (['M-EVI', 'M-EVE', 'M-SUC'].includes(proxima.idMazo)) {
      this.reciclarYBarajarTodo(proxima.idMazo);
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
      idCarta: 'DORSO',
      nombre: `Mazo de ${mazoInfo?.nombre || 'Desconocido'} Agotado`,
      idMazo: idMazo,
      imagen: mazoInfo?.dorso || 'mazmorras/dorso_mazmorra.png',
      tipo: 'Especial',
      oficial: true,
      juego: 'FetenQuest',
      subePeligro: false
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
  private reciclarYBarajarTodo(idMazo: string) {
    this._cartasEnPartida.update(todasLasCartas => {
      // 1. Identificamos qué cartas pertenecen a este mazo y deben estar en la pila de Robo
      // (Incluimos las que ya estaban en Robo y las que vienen del Descarte)
      const cartasMazo = todasLasCartas.filter(c => 
        c.idMazo === idMazo && 
        (c.pila === 'Robo' || (c.pila === 'Descarte' && c.reciclable))
      );

      if (cartasMazo.length === 0) return todasLasCartas;

      // 2. Barajamos el conjunto completo
      const mazoBarajado = this.shuffleArray([...cartasMazo]);

      // 3. Mapeamos el estado general para actualizar solo este mazo
      return todasLasCartas.map(carta => {
        const nuevoIndice = mazoBarajado.findIndex(m => m.id === carta.id);

        if (nuevoIndice !== -1) {
          return { 
            ...carta, 
            pila: 'Robo' as TipoPila, 
            posicion: nuevoIndice + 1 
          };
        }
        return carta;
      });
    });

    console.log(`Mazo ${idMazo} reiniciado y barajado por completo.`);
  }

  public cargarMazoAGestionar(idMazo: string) {
    this._mazoAGestionar.set(this._cartasEnPartida().filter(c => c.idMazo === idMazo));
  }

  public barajarPilaRobo(pilaRobo: EstadoMazoMision[]): EstadoMazoMision[]{
    return this.shuffleArray([...pilaRobo]);
  }

  public barajarMazo(idMazo: string){
    const cartasMazo = this._cartasEnPartida().filter(c => c.idMazo === idMazo);
    this._cartasEnPartida.update(cartasEnPartida => {
      return cartasEnPartida
              .map(est => {
                const indiceEnNuevoOrden = cartasMazo.findIndex(n => n.id === est.id);
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

  cerrarAlerta() {
    this.mensajeAlerta.set(null);
  }

  /**
   * Transforma una Carta de la biblioteca en un objeto de estado para la partida.
   * Genera un ID único para cada "instancia" física de la carta.
   */
  private mapearACartaEstado(carta: Carta): EstadoMazoMision {

    const estadoMazoMision: EstadoMazoMision = {
      // ID único de esta instancia (para que no colisionen cartas iguales)
      id: crypto.randomUUID(), 
      idPartida: crypto.randomUUID(), 
      // Referencia al ID original de la biblioteca (ej: 'SAL-01')
      idCarta: carta.idCarta,
      
      // El mazo al que pertenece en esta partida
      idMazo: carta.idMazo,
      
      // Estado inicial de la carta en el tablero
      posicion: 0, // Se sobreescribirá al barajar el mazo final
      pila: 'Robo',
      reciclable: ['M-TRA', 'M-EVI', 'M-EVE', 'M-PAS', 'M-SUC'].includes(carta.idMazo)
    };
    return estadoMazoMision;
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
        idCarta: fila.idCarta, 
        nombre: fila.nombre, 
        idMazo: fila.idMazo, 
        imagen: fila.imagen ? String(fila.imagen).trim() : '', 
        tipo: fila.tipo, 
        // Usamos nuestra util para el booleano
        oficial: stringToBoolean(fila.oficial), 
        juego: fila.juego, 
        // PapaParse con dynamicTyping: true ya suele darte el número, 
        // pero asegurar con Number() no está de más
        subePeligro: Number(fila.subePeligro) || false
      } as Carta;
    });
  }

  public generarMazo(idMazo: string) {
    const cartas = this.biblioteca().filter(c => c.idMazo === idMazo);
    console.log(idMazo, cartas);
    const mazoBarajado = this.crearEstadoMazo(cartas);
        // 3. Actualizamos el Signal gestionando la sustitución
    this._cartasEnPartida.update(cartasActuales => {
      // Filtramos para ELIMINAR cualquier carta que ya pertenezca a este idMazo
      // Esto garantiza que si el mazo ya existía, lo "limpiamos" antes de meter el nuevo
      const otrasCartas = cartasActuales.filter(c => c.idMazo !== idMazo);

      // Retornamos la combinación de las cartas de otros mazos + el nuevo mazo barajado
      return [...otrasCartas, ...mazoBarajado];
    });
  }

  public crearEstadoMazo(cartas: Carta[]): EstadoMazoMision[] {
    // 1. Transformamos directamente cada carta en su estado inicial (relación 1 a 1)
    const nuevasCartasInstanciadas = cartas.map(carta => this.mapearACartaEstado(carta));

    // 2. Barajamos el grupo de cartas generado
    return this.barajar(nuevasCartasInstanciadas as EstadoMazoMision[]);
  }

  private barajar(lista: EstadoMazoMision[]): EstadoMazoMision[] {
    const barajada = [...lista].sort(() => Math.random() - 0.5);
    return barajada.map((c, index) => ({ ...c, posicion: index }));
  }



  /**
   * Roba varias cartas de un mazo específico.
   * Si el mazo se agota, recicla el descarte automáticamente.
   */
  drawMultiple(idMazo: string, cantidad: number): Carta[] {
    const cartasRobadasMultiples: Carta[] = [];
    const mazo =  this._biblioteca().filter(c => c.idMazo === idMazo);
    const cartasEnPartida = this._cartasEnPartida();
    
    // 1. Obtenemos las pilas correspondientes al tipo (M-ATR, M-SAL, etc.)
    let cartasDisponibles = cartasEnPartida.filter(c => c.idMazo === idMazo && c.pila === 'Robo')
      .sort((a, b) => a.posicion - b.posicion);

    // 4. Lógica de reciclaje si no hay cartas
    if (cartasDisponibles.length < cantidad) {
      const tieneReciclables = cartasEnPartida.some(c => 
        c.idMazo === idMazo && c.pila === 'Descarte' && c.reciclable
      );
      
      if (tieneReciclables) {
        this.reciclarYBarajarTodo(idMazo);
        cartasDisponibles = cartasEnPartida.filter(c => c.idMazo === idMazo)
          .sort((a, b) => a.posicion - b.posicion);
      }
    }

    for (let i = 0; i < cantidad; i++) {
      // 3. Robamos la carta (sacándola del array)
      const proxima = cartasDisponibles[i];
      
      // BÚSQUEDA EFICIENTE: Buscamos en la biblioteca cargada de Drive
      const infoCarta = mazo.find(c => c.idCarta === proxima.idCarta);
      if(infoCarta) {
        cartasRobadasMultiples.push(infoCarta);
      }
    }
    return cartasRobadasMultiples;
  }

  public seleccionarAtrezoSalaSecreta(carta: Carta) {
    this._cartasEnPartida.update((lista: EstadoMazoMision[]) => {
      // 1. Movemos la carta elegida al descarte usando "as TipoPila"
      const listaConDescarte = lista.map(est => 
        est.idCarta === carta.idCarta 
          ? { ...est, pila: 'Descarte' as TipoPila } // <-- La clave está aquí
          : est
      );
      console.log(listaConDescarte);

      // 2. Filtramos lo que queda en el mazo de Robo de Atrezzo
      const poolRobo = listaConDescarte.filter(c => 
        c.idMazo === 'M-ATR' && c.pila === 'Robo'
      );

      // 3. Barajamos ese pool
      const nuevoOrden = this.shuffleArray([...poolRobo]);

      // 4. Reasignamos las posiciones
      return listaConDescarte.map(est => {
        const indiceEnNuevoOrden = nuevoOrden.findIndex(n => n.id === est.id);
        if (indiceEnNuevoOrden !== -1) {
          return { ...est, posicion: indiceEnNuevoOrden + 1 };
        }
        return est;
      });
    });

    this._cartaActiva.set(carta);
    this.cambiarFaseTurno('SALA_ABIERTA');
  }

}