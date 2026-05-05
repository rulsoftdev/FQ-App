// Enumeraciones para consistencia
export type JuegoBase = 'FetenQuest' | 'ChaoQuest' | 'Heroquest' | 'Otro';
export type TipoPila = 'Robo' | 'Descarte' | 'Tablero' | 'Mano' | 'Fuera'; // Añadimos Tablero y Mano para la UI
export type TipoMazo = 'Salas' | 'Atrezos' | 'Salas especiales' | 'Pasillos' | 'Mazmorras' | 'Trampas' | 'Eventos interiores' | 'Eventos exteriores';

export interface Mazo {
  id: string;
  nombre: TipoMazo;
  dorso: string; // Path a la imagen
}

export interface Carta {
  id: string;
  nombre: string;
  idMazo: string;
  imagen: string;
  tipo: string;    // "Normal", "Especial", "Sin Atrezo", "Cofre", etc.
  oficial: boolean;
  juego: JuegoBase;
  numeroCopias: number;
  descripcion?: string; // Para el texto épico en el pergamino del Dashboard
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
  nombre: string;
  lore: string;
  nivelPeligroInicial: number;
  dadoTrampa: string; 
  tablaEncuentros: string;
  monstruoErrante: string;
  monstruoErranteSuperior: string;
  reglasEspeciales: string;
  salaObjetivo: string;
  finMision: string;
  configuracion?: {
    salasNormales: number;
    salasEspeciales: number;
    mazmorraSalasNormales: number;
    mazmorraSalasEspeciales: number;
    mazmorraPasillos: number; 
    incluyeJefe: boolean;
    atrezoSinAtrezo: number;
    atrezoAzar: number;
    atrezoCofre: number;  
    idsSalasEspeciales: string[]; 
    idsAtrezoFijos: string[]; 
    idsAtrezoExcluido: string[];
  };
}

export interface PartidaEnCurso {
  id: string;
  idMision: string;
  nivelPeligroActual: number; // Nivel 5 y 9 activan lógica de cofres extra
  exito: boolean | null;
  botin: string;
  dadoTrampa: string;
  fechaGuardado: Date;
}

export interface Encuentro {
  tipoEncuentro: string;
  resultado: string;
  monstruos: string;
  heroes3o4: String;
  heroes2: String;
  heroe1: String;
  alternativa: String; 
}