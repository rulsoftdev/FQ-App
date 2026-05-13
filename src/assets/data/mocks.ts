import { Mazo, Carta, Mision, PartidaEnCurso, EstadoMazoMision } from '../../app/core/models/fetenquest.model';

// --- MAZOS DISPONIBLES ---
export const MOCK_MAZOS: Mazo[] = [
  { id: 'M-SAL', nombre: 'Salas', dorso: 'salas/dorso_sala.png' },
  { id: 'M-ATR', nombre: 'Atrezos', dorso: 'atrezos/dorso_atrezo.png' },
  { id: 'M-TRA', nombre: 'Trampas', dorso: 'trampas/dorso_trampa.jpg' },
  { id: 'M-MAZ', nombre: 'Mazmorras', dorso: 'mazmorras/dorso_mazmorra.png' },
  { id: 'M-ESP', nombre: 'Salas especiales', dorso: 'salasEspeciales/dorso_sala_especial.png' },
  { id: 'M-EVI', nombre: 'Eventos interiores', dorso: 'eventosInteriores/dorso_eventos.png' },
  { id: 'M-EVE', nombre: 'Eventos exteriores', dorso: 'eventosExteriores/dorso_eventos.png' }
];

// --- LIBRERÍA DE CARTAS ---
export const MOCK_CARTAS: Carta[] = [
  // Salas
  { idCarta: 'C-SAL-01', nombre: 'Sala Normal con 1 Puerta', idMazo: 'M-SAL', imagen: 'salas/sala_normal_1P.png', tipo: 'Normal', oficial: true, juego: 'FetenQuest', numeroCopias: 8 },
  { idCarta: 'C-SAL-SP1', nombre: 'Sala Especial con 1 Puerta', idMazo: 'M-SAL', imagen: 'salas/sala_especial_1P.png', tipo: 'Especial', oficial: true, juego: 'FetenQuest', numeroCopias: 3 },
  // Atrezos (Incluyendo el Armario y Cofres)
  { idCarta: 'C-ATR-01', nombre: 'Armario', idMazo: 'M-ATR', imagen: 'atrezos/armario_1.png', tipo: 'Armario', oficial: true, juego: 'FetenQuest', numeroCopias: 1 },
  { idCarta: 'C-ATR-CF1', nombre: 'Cofre', idMazo: 'M-ATR', imagen: 'atrezos/cofre_1.png', tipo: 'Cofre', oficial: true, juego: 'FetenQuest', numeroCopias: 1 },
  { idCarta: 'C-ATR-SIN', nombre: 'Sin atrezo', idMazo: 'M-ATR', imagen: 'atrezos/sin_atrezo.png', tipo: 'Sin Atrezo', oficial: true, juego: 'FetenQuest', numeroCopias: 12 },
  
  // Pasillos (Para misiones de exterior/mazmorra)
  { idCarta: 'C-MAZ-P1', nombre: 'Pasillo', idMazo: 'M-MAZ', imagen: 'mazmorras/pasillo.png', tipo: 'Pasillo', oficial: true, juego: 'FetenQuest', numeroCopias: 2 },

// Pasillos (Para misiones de exterior/mazmorra)
  { idCarta: 'C-TRA-01', nombre: 'Trampa foso', idMazo: 'M-TRA', imagen: 'trampas/foso_1.png', tipo: 'Foso', oficial: true, juego: 'FetenQuest', numeroCopias: 1 },

  // Salas Especiales
  { idCarta: 'C-ESP-01', nombre: 'Guarida Menor', idMazo: 'M-ESP', imagen: 'salasEspeciales/guarida_menor_1.png', tipo: 'Sala Especial', oficial: true, juego: 'FetenQuest', numeroCopias: 1 },
  { idCarta: 'C-ESP-02', nombre: 'Circulo de Invocacion', idMazo: 'M-ESP', imagen: 'salasEspeciales/circulo_invocacion.png', tipo: 'Sala Especial', oficial: true, juego: 'FetenQuest', numeroCopias: 1 },
  { idCarta: 'C-ESP-03', nombre: 'Cripta', idMazo: 'M-ESP', imagen: 'salasEspeciales/cripta_1.png', tipo: 'Sala Especial', oficial: true, juego: 'FetenQuest', numeroCopias: 1 },
  
];

// --- PLANTILLA DE MISIÓN ---
export const MOCK_MISION_AVENTURA: Mision = {
  id: 'MIS-001',
  imagen: '/misiones/Graok.png',
  campanya: 'Marrones a montones',
  nombre: 'El Resurgir del Nigromante',
  autor: '@Rul',
  lore: 'Habéis encontrado la entrada a las catacumbas donde se oculta el antiguo mago...',
  dificultad: 1,
  nivelPeligroInicial: 0,
  dadoTrampa: '1D10',
  tablaEncuentros: 'No-Muertos',
  monstruoErrante: 'Esqueleto',
  monstruoErranteSuperior: 'Momia',
  reglasEspeciales: 'La visibilidad es reducida. Las tiradas de búsqueda tienen -1.',
  salaObjetivo: 'Cámara del Trono',
  finMision: 'Derrotar al Nigromante y recuperar el cetro.',
  configuracion: {
    salasNormales: 7,
    salasEspeciales: 2,
    mazmorraSalasNormales: 6,
    mazmorraSalasEspeciales: 2,
    mazmorraPasillos: 3,
    incluyeJefe: true,
    atrezoSinAtrezo: 10,
    atrezoAzar: 9,
    atrezoCofre: 1, // Empezamos con 1 cofre
    tiposSalasEsp: [],
    idsSalasEspeciales: ['C-ESP-01', 'C-ESP-02', 'C-ESP-03'],
    idsAtrezoFijos: [], // tipos obligatorios, pero aleatorio por ejemplo un armario, pero si no hay nada definido es al azar
    idsAtrezoExcluido: []
  }
};

// --- ESTADO DE UNA PARTIDA REAL ---
export const MOCK_PARTIDA_ACTIVA: PartidaEnCurso = {
  id: 'GAME-999',
  idMision: 'MIS-001',
  nivelPeligroActual: 0, // Al llegar a 5, el servicio debería meter un cofre extra
  dadoTrampa: '1D1',
  exito: null,
  botin: '',
  fechaGuardado: new Date(),
  hitosReclamados: []
};

export const MOCK_ESTADO_PARTIDA: EstadoMazoMision[] = [
  // Mazo de Salas (Configurado con 7 normales y 2 especiales según la misión)
  { id: 'EM-001', idPartida: 'GAME-999', idMazo: 'M-SAL', idCarta: 'C-SAL-01', posicion: 1, pila: 'Robo', reciclable: false },
  { id: 'EM-002', idPartida: 'GAME-999', idMazo: 'M-SAL', idCarta: 'C-SAL-01', posicion: 2, pila: 'Robo', reciclable: false },
  { id: 'EM-003', idPartida: 'GAME-999', idMazo: 'M-SAL', idCarta: 'C-SAL-SP1', posicion: 3, pila: 'Robo', reciclable: false },
  
  // Mazo de Trampas (Mazo completo barajado)
  { id: 'EM-101', idPartida: 'GAME-999', idMazo: 'M-TRA', idCarta: 'C-TRA-01', posicion: 1, pila: 'Robo', reciclable: true },
  { id: 'EM-102', idPartida: 'GAME-999', idMazo: 'M-TRA', idCarta: 'C-TRA-01', posicion: 1, pila: 'Robo', reciclable: true },
  { id: 'EM-103', idPartida: 'GAME-999', idMazo: 'M-TRA', idCarta: 'C-TRA-01', posicion: 1, pila: 'Robo', reciclable: true },
  
  // Mazo de Atrezos (Configurado con Armario fijo, Sin Atrezo y Azar)
  { id: 'EM-201', idPartida: 'GAME-999', idMazo: 'M-ATR', idCarta: 'C-ATR-01', posicion: 1, pila: 'Robo', reciclable: false }, // Armario
  { id: 'EM-202', idPartida: 'GAME-999', idMazo: 'M-ATR', idCarta: 'C-ATR-SIN', posicion: 2, pila: 'Robo', reciclable: false },
  { id: 'EM-203', idPartida: 'GAME-999', idMazo: 'M-ATR', idCarta: 'C-ATR-CF1', posicion: 3, pila: 'Robo', reciclable: false } // Cofre inicial
];