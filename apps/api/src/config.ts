import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  puerto: parseInt(process.env.PORT ?? '4180', 10),
  origenWeb: process.env.WEB_ORIGIN ?? 'http://localhost:3180',
  /** Carpeta que contiene 01-…, 02-…, etc. */
  raizDocumentos:
    process.env.DOCS_ROOT ??
    'C:\\Users\\adpoz\\OneDrive\\Documentos\\Universidad\\2026-Semestre-5',
  semestreActivo: process.env.SEMESTRE_ACTIVO ?? '2026-OTO',
  respaldarAlEscribir: (process.env.BACKUP_ON_WRITE ?? 'true') === 'true',
  /** Reimporta solo cuando Word guarda un .docx. */
  vigilarDisco: (process.env.VIGILAR_DISCO ?? 'true') === 'true',
  /**
   * Palabras minimas para dar por hechas las notas de una clase. Por debajo de
   * esto la sesion se marca como incompleta: un titulo y dos renglones no son
   * apuntes de los que se pueda estudiar despues.
   */
  umbralNotas: parseInt(process.env.UMBRAL_NOTAS ?? '50', 10),
}));
