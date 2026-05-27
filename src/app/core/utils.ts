import * as Papa from 'papaparse';

/**
 * Parsea un string CSV completo respetando comillas y saltos de línea internos.
 */
export const parseFullCsv = (csv: string): any[] => {
  const result = Papa.parse(csv, {
    header: true,         // Usa la primera fila como llaves del objeto
    skipEmptyLines: true, // Ignora líneas vacías al final
    dynamicTyping: true,   // Convierte automáticamente números y booleanos (opcional)
    transformHeader: (h) => h.trim() // Limpia espacios en los nombres de las columnas
  });
  return result.data;
};

/**
 * Convierte diversos valores de texto a booleano de forma robusta.
 * Acepta: 'true', 'yes', '1', 'si' (en cualquier combinación de mayúsculas/minúsculas)
 */
export const stringToBoolean = (valor: any): boolean => {
  if (valor === null || valor === undefined) return false;
  
  const str = String(valor).trim().toLowerCase();
  return ['true', 'yes', '1', 'si'].includes(str);
};

export const convertirAStringFormateadoConCantidad = (arrayDinamico: any[] | undefined | null): string => {
  if (!arrayDinamico || !Array.isArray(arrayDinamico) || arrayDinamico.length === 0) {
    return '';
  }

  return arrayDinamico
    .filter(item => item && item.tipo && item.cantidad > 0) // Evitamos datos vacíos o cantidades a 0
    .map(item => `${item.cantidad}-${item.tipo}`)           // Mapeamos a "Cantidad-Tipo"
    .join(', ');                                            // Unimos con coma y espacio
};

export const convertirAStringFormateado = (arrayDinamico: any[] | undefined | null): string => {
  if (!arrayDinamico || !Array.isArray(arrayDinamico) || arrayDinamico.length === 0) {
    return '';
  }

  return arrayDinamico
    .map(item => `${item.tipo}`)       
    .join(', ');                       // Unimos con coma y espacio
};

export const splitMultipleIds = (valor: any): string[] => {
  if (!valor) return [];
  // Aceptamos tanto comas como punto y coma por si el usuario se equivoca
  const separador = String(valor).includes(';') ? ';' : ',';
  return String(valor).split(separador).map(id => id.trim()).filter(id => id !== '');
};