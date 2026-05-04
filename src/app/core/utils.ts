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