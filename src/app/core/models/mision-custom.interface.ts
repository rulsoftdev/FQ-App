export interface AtrezoFijo {
  tipo: string; // Ej: 'ALTAR', 'ESTATUA'
  cantidad: number;
}

export interface SalaEspecialFija {
  tipo: string; // Ej: 'ARMERIA', 'ALQUIMISTA'
}

export interface MisionCustom {
  id: 'CUSTOM_SANDBOX';
  nombre: string;
  introduccion: string;
  
  // Configuración de Peligro y Encuentros
  peligroInicial: number;
  dadoTrampa: '1D4' | '1D6' | '1D8' | '1D10' | '1D12';
  tablaEncuentros: string; 
  errante: string;         
  erranteSuperior: string; 

  // Configuración de Mazos según Modo de Juego
  cantidadesMazo: {
    // Solo TABLERO
    salasNormales?: number;
    salasEspeciales?: number;
    // Solo LOSETAS
    mazmorraSalasNormales?: number;
    mazmorraSalasEspeciales?: number;
    mazmorraPasillos?: number;
    
    // Checkboxes mecánicos
    incluyeEscalera: boolean;
    incluyeSalaObjetivo: boolean;
    incluyeJefe: boolean;
  };

  // Gestión de Atrezzo
  atrezo: {
    sinAtrezo: number;
    azar: number;
    cofre: number;
    tiposAtrezoFijos: string;
    tiposAtrezoExcluidos: string[];
  };

  // Selección de Salas Especiales avanzadas (Mutuamente excluyentes)
  salasEspecialesAvanzadas: {
    modoSeleccion: 'POR_TIPOS' | 'POR_IDS';
    tiposSalasEsp?: string;
    idsSalasEspeciales?: string[];
  };
}