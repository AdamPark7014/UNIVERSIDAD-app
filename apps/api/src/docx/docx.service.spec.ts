import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { DocxService, TipoBloque } from './docx.service';

const docx = new DocxService();
let carpeta: string;

const escribirYLeer = async (
  bloques: { tipo: TipoBloque; texto: string }[],
  nombre = 'prueba.docx',
) => {
  const ruta = path.join(carpeta, nombre);
  await docx.escribir(ruta, bloques);
  return docx.leer(ruta);
};

beforeAll(async () => {
  carpeta = await fs.mkdtemp(path.join(os.tmpdir(), 'universidad-docx-'));
});

afterAll(async () => {
  await fs.rm(carpeta, { recursive: true, force: true });
});

describe('DocxService · clasificación', () => {
  it('distingue título, subtítulo y tema por tamaño y posición', async () => {
    const leido = await escribirYLeer([
      { tipo: 'TITULO', texto: 'GUÍA 19-08-26 Teoría de la Computación' },
      { tipo: 'SUBTITULO', texto: 'NE111  ·  miércoles 19/08/2026  ·  16:00-17:15' },
      { tipo: 'TEMA', texto: 'Máquinas de Turing: definición' },
    ]);

    expect(leido.bloques.map((b) => b.tipo)).toEqual(['TITULO', 'SUBTITULO', 'TEMA']);
  });

  it('reconoce el bloque TAREA PROPIA aunque venga sin formato especial', async () => {
    const leido = await escribirYLeer([
      { tipo: 'TITULO', texto: 'NOTAS 17-08-26 Teoría de la Computación' },
      { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
      { tipo: 'PARRAFO', texto: 'Programar un autómata' },
    ]);

    expect(leido.bloques[1].tipo).toBe('TAREA_PROPIA_TITULO');
    expect(leido.bloques[2].tipo).toBe('PARRAFO');
  });

  it('separa las líneas en blanco de las líneas separadoras', async () => {
    const leido = await escribirYLeer([
      { tipo: 'PARRAFO', texto: 'antes' },
      { tipo: 'ESPACIO', texto: '' },
      { tipo: 'SEPARADOR', texto: '' },
      { tipo: 'PARRAFO', texto: 'después' },
    ]);

    expect(leido.bloques.map((b) => b.tipo)).toEqual([
      'PARRAFO',
      'ESPACIO',
      'SEPARADOR',
      'PARRAFO',
    ]);
  });

  it('conserva las viñetas como lista y no como párrafos', async () => {
    const leido = await escribirYLeer([
      { tipo: 'ENCABEZADO', texto: 'LAS TRES ÁREAS' },
      { tipo: 'VINETA', texto: 'Autómatas — reconocen patrones.' },
      { tipo: 'VINETA', texto: 'Computabilidad — ¿existe algoritmo?' },
    ]);

    expect(leido.bloques[0].tipo).toBe('ENCABEZADO');
    expect(leido.bloques.slice(1).every((b) => b.tipo === 'VINETA')).toBe(true);
  });

  it('detecta las listas numeradas por su prefijo', async () => {
    const leido = await escribirYLeer([
      { tipo: 'NUMERADA', texto: '1. Apilar el símbolo inicial.' },
      { tipo: 'NUMERADA', texto: '2. Reemplazar la variable del tope.' },
    ]);

    expect(leido.bloques.every((b) => b.tipo === 'NUMERADA')).toBe(true);
  });
});

describe('DocxService · viaje redondo', () => {
  const documento: { tipo: TipoBloque; texto: string }[] = [
    { tipo: 'TITULO', texto: 'GUÍA 21-10-26 Teoría de la Computación' },
    { tipo: 'SUBTITULO', texto: 'NE111  ·  miércoles 21/10/2026  ·  16:00-17:15  ·  Sesión 21' },
    { tipo: 'TEMA', texto: 'Propiedades de clausura, lema del bombeo y minimización' },
    { tipo: 'SEPARADOR', texto: '' },
    { tipo: 'ENCABEZADO', texto: 'EL LEMA DEL BOMBEO' },
    {
      tipo: 'PARRAFO',
      texto:
        'Si L es regular, existe p ≥ 1 tal que toda w ∈ L con |w| ≥ p puede escribirse w = xyz.',
    },
    { tipo: 'VINETA', texto: '|y| ≥ 1 — la parte bombeable no es vacía.' },
    { tipo: 'VINETA', texto: '|xy| ≤ p — está dentro de los primeros p símbolos.' },
    { tipo: 'NUMERADA', texto: '1. El adversario elige p, que no conoces.' },
    { tipo: 'ESPACIO', texto: '' },
    { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
    { tipo: 'PARRAFO', texto: '1.- Probar que {ww} no es regular' },
  ];

  it('no pierde ni altera el texto al reescribir', async () => {
    const leido = await escribirYLeer(documento, 'redondo.docx');
    const original = documento.map((b) => b.texto).filter(Boolean);
    const recuperado = leido.bloques.map((b) => b.texto).filter(Boolean);

    expect(recuperado).toEqual(original);
  });

  it('conserva los tipos de bloque', async () => {
    const leido = await escribirYLeer(documento, 'redondo2.docx');
    expect(leido.bloques.map((b) => b.tipo)).toEqual(documento.map((b) => b.tipo));
  });

  it('es estable: dos vueltas dan el mismo resultado', async () => {
    const primera = await escribirYLeer(documento, 'estable1.docx');
    const segunda = await escribirYLeer(
      primera.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto })),
      'estable2.docx',
    );

    expect(segunda.bloques).toEqual(primera.bloques);
    expect(segunda.hash).toBeTypeOf('string');
  });

  it('respeta acentos, eñes y símbolos matemáticos', async () => {
    const raros = 'Σ Γ δ q₀ ε ∈ ≤ ⇒ ñ á é í ó ú ü «comillas» — guion';
    const leido = await escribirYLeer([{ tipo: 'PARRAFO', texto: raros }], 'unicode.docx');
    expect(leido.bloques[0].texto).toBe(raros);
  });

  it('cuenta las palabras del documento', async () => {
    const leido = await escribirYLeer(
      [{ tipo: 'PARRAFO', texto: 'una dos tres cuatro cinco' }],
      'palabras.docx',
    );
    expect(leido.palabras).toBe(5);
  });

  it('el hash identifica el archivo en disco, no el contenido lógico', async () => {
    // El paquete .docx lleva metadatos propios, así que dos escrituras del mismo
    // texto no dan bytes idénticos. Lo que importa para la sincronización es que
    // releer el MISMO archivo devuelva siempre el mismo hash.
    const ruta = path.join(carpeta, 'hash.docx');
    await docx.escribir(ruta, [{ tipo: 'PARRAFO', texto: 'igual' }]);

    const primera = await docx.leer(ruta);
    const segunda = await docx.leer(ruta);
    expect(segunda.hash).toBe(primera.hash);

    await docx.escribir(ruta, [{ tipo: 'PARRAFO', texto: 'distinto' }]);
    const tercera = await docx.leer(ruta);
    expect(tercera.hash).not.toBe(primera.hash);
  });
});

describe('DocxService · fidelidad con las notas escritas a mano', () => {
  it('un párrafo que empieza con "1.-" sigue siendo párrafo, no lista numerada', async () => {
    // El alumno numera a mano dentro de párrafos normales. Clasificarlos como
    // NUMERADA les metería una sangría que él nunca puso.
    const leido = await escribirYLeer(
      [
        { tipo: 'PARRAFO', texto: '1.-Qué es tiempo discreto?' },
        { tipo: 'PARRAFO', texto: '2.-Qué es tiempo continuo?' },
      ],
      'numeracion-a-mano.docx',
    );

    expect(leido.bloques.every((b) => b.tipo === 'PARRAFO')).toBe(true);
  });

  it('reconstruye unas notas reales sin cambiar un solo bloque', async () => {
    const notasReales: { tipo: TipoBloque; texto: string }[] = [
      { tipo: 'TITULO', texto: 'NOTAS 17-08-26 Teoría de la Computación' },
      { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
      { tipo: 'PARRAFO', texto: 'Programar un autómata' },
      {
        tipo: 'PARRAFO',
        texto:
          '¿Qué es un algoritmo? Es un conjunto de datos finitos, no debe ser una instrucción vaga',
      },
      { tipo: 'PARRAFO', texto: 'Tres áreas principales:' },
      { tipo: 'PARRAFO', texto: 'Autómata: Reconoce patrones' },
    ];

    const leido = await escribirYLeer(notasReales, 'notas-reales.docx');
    expect(leido.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto }))).toEqual(notasReales);
  });
});

describe('DocxService · respaldo', () => {
  it('deja un .bak antes de sobrescribir', async () => {
    const ruta = path.join(carpeta, 'con-respaldo.docx');
    await docx.escribir(ruta, [{ tipo: 'PARRAFO', texto: 'versión uno' }]);
    await docx.escribir(ruta, [{ tipo: 'PARRAFO', texto: 'versión dos' }], {
      respaldar: true,
    });

    const respaldo = await docx.leer(`${ruta}.bak`);
    const actual = await docx.leer(ruta);

    expect(respaldo.bloques[0].texto).toBe('versión uno');
    expect(actual.bloques[0].texto).toBe('versión dos');
  });

  it('no falla al respaldar un archivo que todavía no existe', async () => {
    const ruta = path.join(carpeta, 'nuevo.docx');
    await expect(
      docx.escribir(ruta, [{ tipo: 'PARRAFO', texto: 'primero' }], { respaldar: true }),
    ).resolves.toBeDefined();
  });
});

describe('DocxService · HTML de vista previa', () => {
  it('agrupa viñetas consecutivas en una sola lista', () => {
    const html = docx.aHtml([
      { tipo: 'VINETA', texto: 'uno' },
      { tipo: 'VINETA', texto: 'dos' },
      { tipo: 'PARRAFO', texto: 'corta' },
      { tipo: 'VINETA', texto: 'tres' },
    ]);

    expect(html.match(/<ul/g)).toHaveLength(2);
    expect(html.match(/<li>/g)).toHaveLength(3);
  });

  it('escapa el HTML del contenido', () => {
    const html = docx.aHtml([{ tipo: 'PARRAFO', texto: '<script>alert(1)</script>' }]);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('DocxService · palabras de contenido', () => {
  it('una hoja en blanco no cuenta ninguna palabra escrita', async () => {
    const leido = await escribirYLeer(
      [
        { tipo: 'TITULO', texto: 'NOTAS 26-11-26 Alemán I' },
        { tipo: 'SUBTITULO', texto: 'CS109  ·  jueves 26/11/2026  ·  11:00-12:40' },
        { tipo: 'ESPACIO', texto: '' },
        { tipo: 'ESPACIO', texto: '' },
        { tipo: 'SEPARADOR', texto: '' },
        { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
        {
          tipo: 'PARRAFO',
          texto: '(ideas que se me ocurren en clase para investigar por mi cuenta)',
        },
        { tipo: 'ESPACIO', texto: '' },
      ],
      'plantilla-vacia.docx',
    );

    expect(leido.palabras).toBeGreaterThan(10); // el andamiaje sí pesa
    expect(leido.palabrasContenido).toBe(0); // pero nadie ha escrito nada
  });

  it('cuenta los apuntes aunque TAREA PROPIA venga arriba, como los escribe a mano', async () => {
    const leido = await escribirYLeer(
      [
        { tipo: 'TITULO', texto: 'NOTAS 17-08-26 Teoría de la Computación' },
        { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
        { tipo: 'PARRAFO', texto: 'Programar un autómata' },
        { tipo: 'PARRAFO', texto: 'Tres áreas principales:' },
        { tipo: 'PARRAFO', texto: 'Autómata: Reconoce patrones' },
      ],
      'tarea-arriba.docx',
    );

    expect(leido.palabrasContenido).toBeGreaterThan(8);
  });
});
