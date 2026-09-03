// Tipos compartidos entre la API y el front.
// Se mantienen a mano (no generados) para que el front no dependa de Prisma.

export type TipoDocumento = 'GUIA' | 'NOTAS';
export type OrigenDocumento = 'GENERADO' | 'IMPORTADO' | 'EDITADO';
export type EstadoSesion = 'PENDIENTE' | 'CURSADA' | 'REVISADA';
export type EstadoTarea = 'ABIERTA' | 'EN_PROGRESO' | 'HECHA' | 'DESCARTADA';

export type TipoBloque =
  | 'TITULO'
  | 'SUBTITULO'
  | 'TEMA'
  | 'ENCABEZADO'
  | 'PARRAFO'
  | 'VINETA'
  | 'NUMERADA'
  | 'SEPARADOR'
  | 'ESPACIO'
  | 'TAREA_PROPIA_TITULO';

export type TipoEvaluacion =
  | 'PARCIAL'
  | 'FINAL'
  | 'QUIZ'
  | 'ENTREGA'
  | 'PROYECTO'
  | 'PRACTICA'
  | 'EXPOSICION'
  | 'REPORTE';

export type EstadoEvaluacion =
  | 'PENDIENTE'
  | 'EN_PROGRESO'
  | 'ENTREGADA'
  | 'CALIFICADA';

export interface BloqueDTO {
  id: string;
  orden: number;
  tipo: TipoBloque;
  texto: string;
}

export interface DocumentoDTO {
  id: string;
  tipo: TipoDocumento;
  archivo: string;
  ruta: string;
  origen: OrigenDocumento;
  palabras: number;
  pendienteDeEscribir: boolean;
  actualizadoEn: string;
  bloques?: BloqueDTO[];
}

export interface SesionDTO {
  id: string;
  numero: number;
  fecha: string;
  semana: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  tema: string;
  estado: EstadoSesion;
  destacada: boolean;
  asistio: boolean | null;
  materia?: MateriaResumenDTO;
  documentos?: DocumentoDTO[];
  tareas?: TareaDTO[];
  evaluaciones?: EvaluacionDTO[];
}

export interface MateriaResumenDTO {
  id: string;
  codigo: string;
  clave: string;
  nombre: string;
  color: string;
  carpeta: string;
  esLaboratorio: boolean;
}

export interface MateriaDTO extends MateriaResumenDTO {
  claveOficial: string | null;
  profesor: string | null;
  aula: string | null;
  orden: number;
  notas: string | null;
  horarios: BloqueHorarioDTO[];
  criterios: CriterioDTO[];
  _count?: { sesiones: number; evaluaciones: number; libros: number };
}

export interface BloqueHorarioDTO {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  aula: string | null;
}

export interface CriterioDTO {
  id: string;
  concepto: string;
  porcentaje: string;
  notas: string | null;
}

export interface TareaDTO {
  id: string;
  texto: string;
  estado: EstadoTarea;
  orden: number;
  resultado: string | null;
  fechaLimite: string | null;
  completadaEn: string | null;
  sesion?: {
    id: string;
    fecha: string;
    numero: number;
    materia: MateriaResumenDTO;
  };
}

export interface EvaluacionDTO {
  id: string;
  tipo: TipoEvaluacion;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  peso: string | null;
  estado: EstadoEvaluacion;
  calificacion: string | null;
  materia?: MateriaResumenDTO;
}

export interface LibroDTO {
  id: string;
  titulo: string;
  autor: string | null;
  anio: number | null;
  isbn: string | null;
  editorial: string | null;
  ruta: string | null;
  esPrincipal: boolean;
  soloReferencia: boolean;
  url: string | null;
  notas: string | null;
}

export interface ResumenDashboard {
  semestre: {
    codigo: string;
    nombre: string;
    inicio: string;
    fin: string;
    semanaActual: number;
    totalSemanas: number;
    avance: number;
  };
  totales: {
    materias: number;
    sesiones: number;
    documentos: number;
    sesionesCursadas: number;
    notasVacias: number;
    tareasAbiertas: number;
    pendientesDeEscribir: number;
  };
  proximasSesiones: SesionDTO[];
  proximasEvaluaciones: EvaluacionDTO[];
  tareasAbiertas: TareaDTO[];
}

export const DIAS_SEMANA = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
] as const;

export const ETIQUETA_TIPO_EVALUACION: Record<TipoEvaluacion, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  QUIZ: 'Quiz',
  ENTREGA: 'Entrega',
  PROYECTO: 'Proyecto',
  PRACTICA: 'Práctica',
  EXPOSICION: 'Exposición',
  REPORTE: 'Reporte',
};

export const ETIQUETA_TIPO_BLOQUE: Record<TipoBloque, string> = {
  TITULO: 'Título',
  SUBTITULO: 'Subtítulo',
  TEMA: 'Tema',
  ENCABEZADO: 'Encabezado',
  PARRAFO: 'Párrafo',
  VINETA: 'Viñeta',
  NUMERADA: 'Numerada',
  SEPARADOR: 'Separador',
  ESPACIO: 'Espacio',
  TAREA_PROPIA_TITULO: 'Tarea propia',
};
