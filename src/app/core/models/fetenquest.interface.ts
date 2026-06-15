// Enumeraciones para consistencia
export type JuegoBase = 'FetenQuest' | 'ChaoQuest' | 'Heroquest' | 'Otro';
export type TipoPila = 'Robo' | 'Descarte' | 'Tablero' | 'Mano' | 'Fuera'; // Añadimos Tablero y Mano para la UI
export type TipoMazo = 'Salas' | 'Atrezos' | 'Salas especiales' | 'Pasillos' | 'Mazmorras' | 'Trampas' | 'Eventos interiores' | 'Eventos exteriores';
// Fases de la vista de los Heroes
export type FaseTurnoHeroes = 'INICIO_HEROES' | 'SALA_ABIERTA' | 'ENCUENTRO';
// Fases de la vista del MB
export type FaseTurnoMB = 'INICIO_MB' | 'MENSAJE' | 'BESTIARIO';
//Define la pantalla que está visible
export type VistaJuego = 'VIEW_HEROES' | 'VIEW_MB' | 'VIEW_MAZO';

export interface Mazo {
  id: string;
  nombre: TipoMazo;
  dorso: string; // Path a la imagen
}

export interface Carta {
  idCarta: string;
  nombre: string;
  idMazo: string;
  imagen: string;
  tipo: string;    // "Normal", "Especial", "Sin Atrezo", "Cofre", etc.
  oficial: boolean;
  juego: JuegoBase;
  subePeligro: boolean;
  descripcion?: string; // Para el texto épico en el pergamino del Mision
}

/**
 * ESTADO DE LA CARTA EN LA MISIÓN
 * Esta es la pieza clave que gestiona el ciclo de vida de cada carta
 * en la partida actual. Reemplaza lo que antes llamábamos 'EstadoCarta'.
 */
export interface EstadoMazoMision {
  id: string;         // Identificador único de la instancia física (ej: 'INST-001')
  idPartida: string;  // Vinculación con la PartidaEnCurso
  idMazo: string;     // M-SAL, M-TRP, etc. Facilita los filtros rápidos
  idCarta: string;    // El ID de la carta en el MOCK_CARTAS (ej: 'C-SAL-01')
  posicion: number;   // Su lugar en la pila (0 es la carta que se va a robar)
  pila: TipoPila;     // 'Robo', 'Descarte' o 'Fuera'
  reciclable: boolean; // Indica si tras usarse vuelve al mazo o se elimina para siempre
}

export interface Mision {
  id: string;
  imagen?: string;
  campanya?: string;
  nombre: string;
  autor?: string;
  lore: string;
  dificultad: number; // 1 a 5
  nivelPeligroInicial: number;
  dadoTrampa: string; 
  tablaEncuentros: string;
  monstruoErrante: string;
  monstruoErranteSuperior: string;
  reglasEspeciales?: string;
  salaObjetivo?: string;
  finMision?: string;
  configuracion?: {
    salasNormales: number;
    salasEspeciales: number;
    mazmorraSalasNormales: number;
    mazmorraSalasEspeciales: number;
    mazmorraPasillos: number; 
    incluyeEscalera: boolean;
    incluyeSalaObjetivo: boolean;
    incluyeJefe: boolean;
    atrezoSinAtrezo: number;
    atrezoAzar: number;
    atrezoCofre: number; 
    tiposAtrezoFijos: string; 
    tiposAtrezoExcluido: string;
    tiposSalasEsp: string; 
    idsSalasEspeciales: string[]; 
    salasEspecialesAzar: number;
  };
}

// Añade esta interfaz si no la tenías declarada de forma global
export interface RutaExploracion {
  id: number;
  nombre: string;
  cartasIds: string[]; // IDs únicos de instancia asignados a esta ruta
}

export interface PartidaEnCurso {
  id: string;
  idMision: string;
  nivelPeligroActual: number; // Nivel 5 y 9 activan lógica de cofres extra
  exito: boolean | null;
  botin: string;
  dadoTrampa: string;
  fechaGuardado: Date;
  hitosReclamados: number[];
  rutasLosetas?: RutaExploracion[];
}

export interface Encuentro {
  resultado: string;
  tipoLista: string;
  familia: string;
  idsBestiario: string;
  monstruos: string;
  heroes3o4: String;
  heroes2: string;
  heroe1: string;
  alternativa: string; 
}

export interface Monstruo {
  id: string;
  categoria: number;
  familia: string;
  nombre: string;
  rango: string;
  mv: string;
  at: string;
  df: string;
  pc: string;
  pm: string;
  especial: number;
}

export interface MensajeTurnoMB {
  resultadoDado: number;
  texto: string;
  tipoTirada: string;
}

export interface Evento {
  resultadoDado: number;
  tipo: string;
  texto: string;
  nivelPeligro: number;
}