/**
 * Seed — carga el semestre Otoño 2026 con los datos reales de los syllabus.
 *
 * No toca los .docx: solo deja la estructura lista para que `POST /api/sync/importar`
 * lea el disco y cuelgue las sesiones y documentos de estas materias.
 *
 *   pnpm --filter @universidad/api db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Fecha UTC sin hora, para que no se recorra por zona horaria. */
const f = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const RAIZ =
  process.env.DOCS_ROOT ??
  'C:\\Users\\adpoz\\OneDrive\\Documentos\\Universidad\\2026-Semestre-5';

// ---------------------------------------------------------------- materias

interface DefMateria {
  codigo: string;
  clave: string;
  nombre: string;
  claveOficial?: string;
  profesor?: string;
  aula?: string;
  carpeta: string;
  color: string;
  orden: number;
  esLaboratorio?: boolean;
  /** [diaSemana 0=lunes, horaInicio, horaFin] */
  horarios: [number, string, string][];
  criterios: [string, number, string?][];
  libros?: {
    titulo: string;
    autor?: string;
    anio?: number;
    editorial?: string;
    isbn?: string;
    esPrincipal?: boolean;
    soloReferencia?: boolean;
  }[];
}

const MATERIAS: DefMateria[] = [
  {
    codigo: 'ihc',
    clave: 'CN220',
    nombre: 'Interacción Humano-Computadora',
    claveOficial: 'LIS3032',
    profesor: 'Dra. Ingrid Kirschning Albers',
    aula: 'CN 220',
    carpeta: '01-Interaccion-Humano-Computadora-CN220',
    color: '#38A3C9',
    orden: 1,
    horarios: [[0, '10:00', '11:40']],
    criterios: [
      ['Tareas', 50],
      ['Examen final', 10],
      ['Proyecto final', 10],
      ['Presentación oral', 10],
      ['Exámenes parciales', 10],
      ['Asistencia y participación', 10],
    ],
    libros: [
      { titulo: 'Introduction to Human-Computer Interaction', autor: 'Hornbæk, Kristensson & Oulasvirta', anio: 2025, editorial: 'Oxford University Press', esPrincipal: true },
      { titulo: 'Digital Futures in HCI', esPrincipal: true },
      { titulo: 'HCI and Emerging Technologies', esPrincipal: true },
      { titulo: 'Human-Computer Interaction: An Empirical Research Perspective', autor: 'I. Scott MacKenzie', anio: 2013, editorial: 'Morgan Kaufmann', soloReferencia: true },
      { titulo: 'The Design of Everyday Things', autor: 'Donald A. Norman', editorial: 'Basic Books', soloReferencia: true },
      { titulo: 'Laws of UX', autor: 'Jon Yablonski', anio: 2020, editorial: "O'Reilly Media", soloReferencia: true },
    ],
  },
  {
    codigo: 'edd',
    clave: 'CN122',
    nombre: 'Estructuras de Datos',
    claveOficial: 'LIS-2032',
    profesor: 'Dr. José Luis Zechinelli Martini',
    aula: 'CN 122',
    carpeta: '02-Estructuras-de-Datos-CN122',
    color: '#D9A62E',
    orden: 2,
    horarios: [
      [0, '13:00', '14:15'],
      [2, '13:00', '14:15'],
    ],
    criterios: [
      ['Actividades y ejercicios', 40],
      ['Primer parcial', 15],
      ['Segundo parcial', 15],
      ['Tercer parcial', 15],
      ['Examen final', 15],
    ],
    libros: [
      { titulo: 'Open Data Structures', autor: 'Pat Morin', esPrincipal: true },
      { titulo: 'Algorithms', autor: 'Jeff Erickson', esPrincipal: true },
      { titulo: 'Data Structures and Algorithm Analysis', autor: 'Clifford A. Shaffer', esPrincipal: true },
      { titulo: 'Introduction to Algorithms', autor: 'Cormen, Leiserson, Rivest & Stein', anio: 2009, editorial: 'MIT Press', soloReferencia: true },
      { titulo: 'Data structures using C', autor: 'Reema Thareja', anio: 2011, editorial: 'Oxford University Press', soloReferencia: true },
    ],
  },
  {
    codigo: 'teo',
    clave: 'NE111',
    nombre: 'Teoría de la Computación',
    aula: 'NE 111',
    carpeta: '03-Teoria-de-la-Computacion-NE111',
    color: '#C2185B',
    orden: 3,
    horarios: [
      [0, '16:00', '17:15'],
      [2, '16:00', '17:15'],
    ],
    criterios: [
      ['Tareas y actividades', 0, 'Ponderación por confirmar con el profesor'],
      ['Evaluaciones parciales', 0, 'Ponderación por confirmar'],
      ['Proyecto final', 0, 'Ponderación por confirmar'],
    ],
    libros: [
      { titulo: 'Theory of Computation', autor: 'Maheshwari & Smid', esPrincipal: true },
      { titulo: 'Foundations of Computation', autor: 'Critchlow & Eck', esPrincipal: true },
      { titulo: 'Introduction to Theoretical Computer Science', autor: 'Boaz Barak', esPrincipal: true },
      { titulo: 'Introduction to the Theory of Computation', autor: 'Michael Sipser', editorial: 'Cengage', soloReferencia: true },
    ],
  },
  {
    codigo: 'emb',
    clave: 'LA207',
    nombre: 'Sistemas Embebidos',
    claveOficial: 'LRT3032',
    profesor: 'Dr. Gerardo Ulises Díaz Arango',
    aula: 'LA-207',
    carpeta: '04-Sistemas-Embebidos-LA207',
    color: '#2E9E5B',
    orden: 4,
    horarios: [[0, '18:00', '19:40']],
    criterios: [
      ['Tareas y participación en clase', 15],
      ['Exámenes', 30, 'Tres exámenes de 10% cada uno'],
      ['Prácticas de laboratorio', 30, 'Cinco prácticas de 6% cada una'],
      ['Proyecto final', 25, 'Funciona como cuarto parcial'],
    ],
    libros: [
      { titulo: 'Introduction to Embedded Systems', autor: 'Lee & Seshia', esPrincipal: true },
      { titulo: 'Discovering the STM32 Microcontroller', autor: 'Geoffrey Brown', esPrincipal: true },
      { titulo: 'Mastering the FreeRTOS Real Time Kernel', autor: 'Richard Barry', esPrincipal: true },
      { titulo: 'Digital Design', autor: 'M. Morris Mano & M. D. Ciletti', anio: 2018, editorial: 'Pearson', soloReferencia: true },
      { titulo: 'FPGA Prototyping by VHDL Examples', autor: 'Pong P. Chu', anio: 2008, editorial: 'Wiley', soloReferencia: true },
    ],
  },
  {
    codigo: 'esc',
    clave: 'HU109',
    nombre: 'Escritura Académica',
    profesor: 'Dr. Jesús Emmanuel Navarro Stefanón',
    aula: 'HU 109',
    carpeta: '05-Escritura-Academica-HU109',
    color: '#7CB342',
    orden: 5,
    horarios: [
      [1, '08:30', '09:45'],
      [3, '08:30', '09:45'],
    ],
    criterios: [
      ['Primera evaluación parcial', 20],
      ['Segunda evaluación parcial', 20],
      ['Tercera evaluación parcial', 20],
      ['Exposición oral', 10],
      ['Artículo de revisión', 30],
    ],
    libros: [
      { titulo: 'Todo lo de cristal', autor: 'Rafael Pérez Gay', anio: 2023, editorial: 'Seix Barral', esPrincipal: true, soloReferencia: true },
      { titulo: 'Manual de escritura para carreras de humanidades', autor: 'Federico Navarro (coord.)', editorial: 'FILO:UBA', esPrincipal: true },
      { titulo: 'Lectura, escritura y oralidad', editorial: 'Universidad Nacional de Córdoba', esPrincipal: true },
    ],
  },
  {
    codigo: 'ale',
    clave: 'CS109',
    nombre: 'Alemán I',
    profesor: 'Laura Zendejas, M.A.',
    aula: 'CS 109',
    carpeta: '06-Aleman-I-CS109',
    color: '#0F8A4D',
    orden: 6,
    horarios: [
      [1, '11:00', '12:40'],
      [3, '11:00', '12:40'],
    ],
    criterios: [
      ['Capítulos 1 a 6', 60, '10% cada capítulo'],
      ['Plataformas 1 y 2', 10, '5% cada una'],
      ['Examen 1, Examen 2 y Endexamen', 30, '10% cada uno'],
    ],
    libros: [
      { titulo: 'Willkommen: Deutsch für alle Anfänger 1', editorial: 'University of Alberta', esPrincipal: true },
      { titulo: 'Willkommen: Deutsch für alle Anfänger 2', editorial: 'University of Alberta', esPrincipal: true },
      { titulo: 'Deutsch im Blick', autor: 'Zsuzsanna Abrams', editorial: 'UT Austin (COERLL)', esPrincipal: true },
      { titulo: 'Libro de texto del curso (Klett)', isbn: '978-3-12-607154-3', soloReferencia: true, editorial: 'Klett' },
    ],
  },
  {
    codigo: 'ecu',
    clave: 'HU325',
    nombre: 'Ecuaciones Diferenciales Ordinarias',
    claveOficial: 'MAT2052',
    aula: 'HU 325',
    carpeta: '07-Ecuaciones-Diferenciales-HU325',
    color: '#A64FBF',
    orden: 7,
    horarios: [
      [1, '13:00', '14:15'],
      [3, '13:00', '14:15'],
    ],
    criterios: [
      ['Examen 1', 20],
      ['Examen 2', 20],
      ['Examen 3', 20],
      ['Examen 4', 20],
      ['Tareas', 20],
    ],
    libros: [
      { titulo: 'Notes on Diffy Qs', autor: 'Jiří Lebl', esPrincipal: true },
      { titulo: 'Elementary Differential Equations with Boundary Value Problems', autor: 'William F. Trench', esPrincipal: true },
      { titulo: 'Differential Equations for Engineers', autor: 'Jeffrey R. Chasnov', esPrincipal: true },
      { titulo: 'Ecuaciones Diferenciales con aplicaciones de modelado', autor: 'Dennis G. Zill', anio: 2018, editorial: 'Cengage', isbn: '9786075266312', soloReferencia: true },
    ],
  },
  {
    codigo: 'arq',
    clave: 'HU413',
    nombre: 'Arquitecturas Computacionales',
    claveOficial: 'LIS2022',
    profesor: 'Dr. Omar Guillén-Fernández',
    aula: 'HU413',
    carpeta: '08-Arquitecturas-Computacionales-HU413',
    color: '#2563EB',
    orden: 8,
    horarios: [[3, '16:00', '17:40']],
    criterios: [
      ['Tareas y participación en clase', 15],
      ['Exámenes', 30, 'Tres exámenes de 10% cada uno'],
      ['Prácticas de laboratorio', 30, 'Seis prácticas de 5% cada una'],
      ['Proyecto final', 25, 'Funciona como cuarto parcial'],
    ],
    libros: [
      { titulo: 'Computer Organization and Design Fundamentals', autor: 'David Tarnoff', esPrincipal: true },
      { titulo: 'Computer Science from the Bottom Up', autor: 'Ian Wienand', esPrincipal: true },
      { titulo: 'Programming from the Ground Up', autor: 'Jonathan Bartlett', esPrincipal: true },
      { titulo: 'Computer Organization and Design: The Hardware/Software Interface (RISC-V)', autor: 'Patterson & Hennessy', soloReferencia: true },
      { titulo: 'Digital Design and Computer Architecture', autor: 'Harris & Harris', soloReferencia: true },
    ],
  },
  {
    codigo: 'arq_lab',
    clave: 'LA116',
    nombre: 'Laboratorio de Arquitecturas Computacionales',
    claveOficial: 'LIS2022',
    profesor: 'Dr. Omar Guillén-Fernández',
    aula: 'LA116',
    carpeta: '09-Lab-Arquitecturas-LA116',
    color: '#1D4ED8',
    orden: 9,
    esLaboratorio: true,
    horarios: [[4, '16:00', '17:40']],
    criterios: [['Seis prácticas', 30, '5% cada una, dentro de la calificación de Arquitecturas']],
    libros: [
      { titulo: 'x86-64 Assembly Language Programming with Ubuntu', autor: 'Ed Jorgensen', esPrincipal: true, notas: 'El laboratorio trabaja en Verilog sobre RISC-V; este libro es de x86-64.' } as any,
      { titulo: 'The RISC-V Instruction Set Manual, Volume I: Unprivileged ISA', autor: 'RISC-V International', esPrincipal: true },
    ],
  },
  {
    codigo: 'ihc_lab',
    clave: 'CN220',
    nombre: 'Laboratorio de Interacción Humano-Computadora',
    claveOficial: 'LIS3032',
    profesor: 'Dra. Ingrid Kirschning Albers',
    aula: 'CN 220',
    carpeta: '10-Lab-Interaccion-Humano-Computadora-CN220',
    color: '#2A87A8',
    orden: 10,
    esLaboratorio: true,
    horarios: [[2, '10:00', '11:40']],
    criterios: [['Entregables de laboratorio', 0, 'Cuentan dentro de Tareas (50%) de IHC']],
  },
  {
    codigo: 'emb_lab',
    clave: 'CN113',
    nombre: 'Laboratorio de Sistemas Embebidos',
    claveOficial: 'LRT3032',
    profesor: 'Dr. Gerardo Ulises Díaz Arango',
    aula: 'CN-113',
    carpeta: '11-Lab-Sistemas-Embebidos-CN113',
    color: '#227A46',
    orden: 11,
    esLaboratorio: true,
    horarios: [[2, '18:00', '19:40']],
    criterios: [['Cinco prácticas', 30, '6% cada una, dentro de la calificación de Sistemas Embebidos']],
  },
];

// ---------------------------------------------------------------- evaluaciones

type DefEval = [string, string, string, string, string, number | null];
// [materia, tipo, titulo, fechaISO, descripcion, peso]

const EVALUACIONES: DefEval[] = [
  // Arquitecturas Computacionales
  ['arq', 'PARCIAL', 'Primer parcial', '2026-09-10', 'Unidades 1 y 2. En el horario y aula de la clase.', 10],
  ['arq', 'PARCIAL', 'Segundo parcial', '2026-10-08', 'Unidades 2 y 3.', 10],
  ['arq', 'PARCIAL', 'Tercer parcial', '2026-11-05', 'Unidades 3 y 4.', 10],
  ['arq', 'PROYECTO', 'Proyecto final', '2026-11-27', 'Aplicación real para un procesador RISC-V de 32 bits. Entrega del 23 al 27 de noviembre.', 25],

  // Laboratorio de Arquitecturas
  ['arq_lab', 'PRACTICA', 'Práctica 1 — bloques combinacionales y secuenciales', '2026-09-04', 'Verilog + FPGA.', 5],
  ['arq_lab', 'PRACTICA', 'Práctica 2 — ALU de 4 bits', '2026-09-18', 'Descripción e implementación en FPGA.', 5],
  ['arq_lab', 'PRACTICA', 'Práctica 3 — ALU para RISC-V de 32 bits', '2026-10-02', 'Descripción y simulación.', 5],
  ['arq_lab', 'PRACTICA', 'Práctica 4 — memoria ROM y RAM', '2026-10-16', 'Manejo de memoria.', 5],
  ['arq_lab', 'PRACTICA', 'Práctica 5 — Unidad de Control RISC-V', '2026-10-30', 'Decodificación y señales de control.', 5],
  ['arq_lab', 'PRACTICA', 'Práctica 6 — integración del procesador', '2026-11-13', 'Aplicación del procesador en FPGA.', 5],

  // Sistemas Embebidos
  ['emb', 'PARCIAL', 'Evaluación 1', '2026-09-07', 'Unidad 1: lenguajes de descripción de hardware.', 10],
  ['emb', 'PARCIAL', 'Evaluación 2', '2026-10-05', 'Unidades 2 y 3.', 10],
  ['emb', 'PARCIAL', 'Evaluación 3', '2026-11-02', 'Unidades 3 y 4.', 10],
  ['emb', 'PROYECTO', 'Proyecto final', '2026-11-23', 'Problemática tecnológica resuelta con un sistema digital. Entrega a partir del 23 de noviembre.', 25],

  // Laboratorio de Sistemas Embebidos
  ['emb_lab', 'PRACTICA', 'Práctica 1 — bloques combinacionales y secuenciales', '2026-09-02', null as any, 6],
  ['emb_lab', 'PRACTICA', 'Práctica 2 — sumadores y decodificadores', '2026-09-23', null as any, 6],
  ['emb_lab', 'PRACTICA', 'Práctica 3 — multiplicación y división', '2026-10-07', null as any, 6],
  ['emb_lab', 'PRACTICA', 'Práctica 4 — máquinas de estado Mealy y Moore', '2026-10-21', null as any, 6],
  ['emb_lab', 'PRACTICA', 'Práctica 5 — sistemas reconfigurables (CORDIC, FIR/IIR, PID)', '2026-11-11', null as any, 6],

  // Ecuaciones Diferenciales
  ['ecu', 'PARCIAL', 'Examen 1', '2026-09-10', 'Ecuaciones diferenciales de primer orden.', 20],
  ['ecu', 'PARCIAL', 'Examen 2', '2026-10-08', 'Ecuaciones lineales de orden superior.', 20],
  ['ecu', 'PARCIAL', 'Examen 3', '2026-11-05', 'Transformada de Laplace.', 20],
  ['ecu', 'FINAL', 'Examen 4 (final)', '2026-12-08', 'Coincide con el examen final. Sin reposición posible.', 20],

  // Escritura Académica
  ['esc', 'ENTREGA', 'Actividad 0 — prueba de diagnóstico', '2026-08-13', 'En Forms, en el salón. 10% del primer parcial.', null],
  ['esc', 'ENTREGA', 'Actividad 1 — preselección de tema', '2026-08-21', '30% del primer parcial. Blackboard.', null],
  ['esc', 'ENTREGA', 'Actividad 2 — selección del tema de investigación', '2026-09-02', '50% del primer parcial. Blackboard.', null],
  ['esc', 'REPORTE', 'Reporte 1 — primera parte del libro', '2026-09-09', '10% del primer parcial.', null],
  ['esc', 'PARCIAL', 'Primer parcial', '2026-09-10', 'Unidades 0, 1 y 2.', 20],
  ['esc', 'ENTREGA', 'Actividad 3 — borrador del protocolo y estado de la cuestión', '2026-09-23', '40% del segundo parcial.', null],
  ['esc', 'ENTREGA', 'Actividad 4 — protocolo y estado de la cuestión', '2026-10-02', '50% del segundo parcial.', null],
  ['esc', 'REPORTE', 'Reporte 2 — segunda parte del libro', '2026-10-08', '10% del segundo parcial.', null],
  ['esc', 'PARCIAL', 'Segundo parcial', '2026-10-08', 'Unidades 3 y 4.', 20],
  ['esc', 'ENTREGA', 'Actividad 5 — borrador del artículo de revisión', '2026-10-30', '90% del tercer parcial.', null],
  ['esc', 'REPORTE', 'Reporte 3 — última parte del libro', '2026-11-05', '10% del tercer parcial.', null],
  ['esc', 'PARCIAL', 'Tercer parcial', '2026-11-05', 'Unidades 4 y 5.', 20],
  ['esc', 'EXPOSICION', 'Exposición oral', '2026-11-24', 'Del 10 al 24 de noviembre.', 10],
  ['esc', 'ENTREGA', 'Versión final del artículo de revisión', '2026-11-25', 'Blackboard, Unidad 6.', 30],

  // Alemán I
  ['ale', 'QUIZ', 'Quiz 1 + Übungsbuch Kapitel 1', '2026-08-25', 'Hasta las 11:00 AM. No hay prórroga.', null],
  ['ale', 'QUIZ', 'Quiz 2 + Übungsbuch Kapitel 2', '2026-09-08', 'Hasta las 11:00 AM.', null],
  ['ale', 'PARCIAL', 'Examen 1', '2026-09-08', 'Kapitel 1 y 2. De 11:00 a 12:15.', 10],
  ['ale', 'QUIZ', 'Quiz 3 + Übungsbuch Kapitel 3', '2026-09-24', 'Hasta las 11:00 AM.', null],
  ['ale', 'ENTREGA', 'Plataforma 1 — Schreibtraining', '2026-09-24', 'De 11:00 a 12:15.', 5],
  ['ale', 'QUIZ', 'Quiz 4 + Übungsbuch Kapitel 4', '2026-10-13', 'Hasta las 11:00 AM.', null],
  ['ale', 'PARCIAL', 'Examen 2', '2026-10-13', 'Kapitel 3 y 4. De 11:00 a 12:15.', 10],
  ['ale', 'QUIZ', 'Quiz 5 + Übungsbuch Kapitel 5', '2026-11-03', 'Hasta las 11:00 AM.', null],
  ['ale', 'QUIZ', 'Quiz 6 + Übungsbuch Kapitel 6', '2026-11-19', 'Hasta las 11:00 AM. Última entrega de Übungsbuch.', null],
  ['ale', 'ENTREGA', 'Plataforma 2 — Schreibtraining', '2026-11-24', 'Sesiones del 19 y 24 de noviembre.', 5],
  ['ale', 'FINAL', 'Endexamen', '2026-11-26', 'Kapitel 1 a 6. De 11:00 a 12:40.', 10],
  ['ale', 'ENTREGA', 'Límite para puntos extra (actividades autónomas)', '2026-11-10', 'Avisar por correo antes de esta fecha.', null],
];

// ---------------------------------------------------------------- ejecución

async function main() {
  console.log('Seed — Otoño 2026\n');

  const semestre = await prisma.semestre.upsert({
    where: { codigo: '2026-OTO' },
    update: {
      nombre: 'Otoño 2026',
      inicio: f('2026-08-10'),
      fin: f('2026-11-27'),
      finalesDesde: f('2026-12-01'),
      finalesHasta: f('2026-12-08'),
      raizDocumentos: RAIZ,
    },
    create: {
      codigo: '2026-OTO',
      nombre: 'Otoño 2026',
      inicio: f('2026-08-10'),
      fin: f('2026-11-27'),
      finalesDesde: f('2026-12-01'),
      finalesHasta: f('2026-12-08'),
      raizDocumentos: RAIZ,
    },
  });
  console.log(`  semestre ${semestre.codigo} (${semestre.nombre})`);

  // días sin clase
  const feriados: [string, string][] = [
    ['2026-09-16', 'Día de la Independencia'],
    ['2026-11-16', 'Día de la Revolución (tercer lunes)'],
  ];
  for (const [fecha, motivo] of feriados) {
    await prisma.diaNoLectivo.upsert({
      where: { semestreId_fecha: { semestreId: semestre.id, fecha: f(fecha) } },
      update: { motivo },
      create: { semestreId: semestre.id, fecha: f(fecha), motivo },
    });
  }
  console.log(`  ${feriados.length} días no lectivos`);

  // materias
  const porCodigo = new Map<string, string>();
  for (const m of MATERIAS) {
    const materia = await prisma.materia.upsert({
      where: { semestreId_codigo: { semestreId: semestre.id, codigo: m.codigo } },
      update: {
        clave: m.clave,
        nombre: m.nombre,
        claveOficial: m.claveOficial ?? null,
        profesor: m.profesor ?? null,
        aula: m.aula ?? null,
        carpeta: m.carpeta,
        color: m.color,
        orden: m.orden,
        esLaboratorio: m.esLaboratorio ?? false,
      },
      create: {
        semestreId: semestre.id,
        codigo: m.codigo,
        clave: m.clave,
        nombre: m.nombre,
        claveOficial: m.claveOficial ?? null,
        profesor: m.profesor ?? null,
        aula: m.aula ?? null,
        carpeta: m.carpeta,
        color: m.color,
        orden: m.orden,
        esLaboratorio: m.esLaboratorio ?? false,
      },
    });
    porCodigo.set(m.codigo, materia.id);

    await prisma.bloqueHorario.deleteMany({ where: { materiaId: materia.id } });
    await prisma.bloqueHorario.createMany({
      data: m.horarios.map(([dia, ini, fin]) => ({
        materiaId: materia.id,
        diaSemana: dia,
        horaInicio: ini,
        horaFin: fin,
        aula: m.aula ?? null,
      })),
    });

    await prisma.criterioEvaluacion.deleteMany({ where: { materiaId: materia.id } });
    await prisma.criterioEvaluacion.createMany({
      data: m.criterios.map(([concepto, porcentaje, notas]) => ({
        materiaId: materia.id,
        concepto,
        porcentaje,
        notas: notas ?? null,
      })),
    });

    if (m.libros?.length) {
      await prisma.libro.deleteMany({ where: { materiaId: materia.id } });
      await prisma.libro.createMany({
        data: m.libros.map((l) => ({
          materiaId: materia.id,
          titulo: l.titulo,
          autor: l.autor ?? null,
          anio: l.anio ?? null,
          editorial: l.editorial ?? null,
          isbn: l.isbn ?? null,
          esPrincipal: l.esPrincipal ?? false,
          soloReferencia: l.soloReferencia ?? false,
        })),
      });
    }
  }
  console.log(`  ${MATERIAS.length} materias con horario, criterios y libros`);

  // evaluaciones
  await prisma.evaluacion.deleteMany({
    where: { materia: { semestreId: semestre.id } },
  });
  let n = 0;
  for (const [codigo, tipo, titulo, fecha, descripcion, peso] of EVALUACIONES) {
    const materiaId = porCodigo.get(codigo);
    if (!materiaId) continue;
    await prisma.evaluacion.create({
      data: {
        materiaId,
        tipo: tipo as any,
        titulo,
        fecha: f(fecha),
        descripcion: descripcion ?? null,
        peso: peso ?? null,
      },
    });
    n++;
  }
  console.log(`  ${n} evaluaciones`);

  console.log('\nListo. Ahora importa los documentos:');
  console.log('  curl -X POST http://localhost:4180/api/sync/importar');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
