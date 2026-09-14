import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

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

export interface BloqueLeido {
  orden: number;
  tipo: TipoBloque;
  texto: string;
}

export interface DocumentoLeido {
  bloques: BloqueLeido[];
  palabras: number;
  /** Solo lo que escribió el alumno: sin encabezados ni plantilla. */
  palabrasContenido: number;
  hash: string;
  tamanoBytes: number;
  modificadoEn: Date;
}

/** Formato de los Word del alumno, medido sobre sus propios archivos. */
const FORMATO = {
  fuente: 'Arial',
  /** medias-puntos: 20 = 10pt */
  cuerpo: 20,
  titulo: 24,
  /** el tema de la guía va a 11 pt, un escalón abajo del título */
  tema: 22,
  subtitulo: 18,
  /** Carta, en twips */
  ancho: 12240,
  alto: 15840,
  margenVertical: 1417, // 2.5 cm
  margenHorizontal: 1701, // 3 cm
  /** Espaciado de párrafo por defecto (twips) */
  after: 160,
  line: 276,
  encabezadoBefore: 160,
  encabezadoAfter: 60,
  listaAfter: 60,
  sepBefore: 120,
  sepAfter: 120,
  gris: '595959',
  lineaSeparador: 'BFBFBF',
} as const;

/** Formularios de práctica: más contenido por hoja (letra ~8 pt, márgenes ~1.3 cm). */
const FORMATO_COMPACTO = {
  ...FORMATO,
  cuerpo: 16,
  titulo: 18,
  tema: 15,
  subtitulo: 14,
  margenVertical: 720,
  margenHorizontal: 720,
  after: 40,
  line: 220,
  encabezadoBefore: 80,
  encabezadoAfter: 20,
  listaAfter: 20,
  sepBefore: 40,
  sepAfter: 40,
} as const;

type FormatoActivo = typeof FORMATO | typeof FORMATO_COMPACTO;

/** Sangría izquierda, en twips, con la que se escribe una lista numerada. */
const SANGRIA_NUMERADA = 340;

const contarPalabras = (bs: { texto: string }[]) =>
  bs.reduce((n, b) => n + (b.texto.trim() ? b.texto.trim().split(/\s+/).length : 0), 0);

/** Andamiaje: existe en la hoja aunque nadie haya escrito una palabra. */
const ANDAMIAJE = ['TITULO', 'SUBTITULO', 'TEMA', 'SEPARADOR', 'ESPACIO', 'TAREA_PROPIA_TITULO'];

/** El texto de ayuda que trae la plantilla en blanco bajo TAREA PROPIA. */
const PISTA_PLANTILLA = /^\(ideas que se me ocurren/i;

/**
 * Deja solo lo que de verdad escribió el alumno, para distinguir una hoja en
 * blanco de una con apuntes.
 *
 * No se corta en TAREA PROPIA: sus notas a mano ponen ese bloque ARRIBA y los
 * apuntes de clase debajo, mientras que la plantilla generada lo pone al final.
 * Cortar ahí descartaría justo lo que se quiere contar. Se descuenta el
 * andamiaje y la línea de ayuda, y todo lo demás cuenta —las tareas propias
 * también las escribió él—.
 */
function soloContenido(bs: BloqueLeido[]): BloqueLeido[] {
  return bs.filter(
    (b) => !ANDAMIAJE.includes(b.tipo) && b.texto && !PISTA_PLANTILLA.test(b.texto),
  );
}

@Injectable()
export class DocxService {
  private readonly log = new Logger(DocxService.name);

  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: false,
    trimValues: false,
    isArray: (name) => ['w:p', 'w:r', 'w:t'].includes(name),
  });

  // ------------------------------------------------------------------ lectura

  async leer(ruta: string): Promise<DocumentoLeido> {
    const buffer = await fs.readFile(ruta);
    const stat = await fs.stat(ruta);
    const zip = await JSZip.loadAsync(buffer);
    const entrada = zip.file('word/document.xml');
    if (!entrada) {
      throw new Error(`El archivo no trae word/document.xml: ${ruta}`);
    }
    const xml = await entrada.async('string');
    const bloques = this.parsearDocumento(xml);

    return {
      bloques,
      palabras: contarPalabras(bloques),
      palabrasContenido: contarPalabras(soloContenido(bloques)),
      hash: createHash('sha256').update(buffer).digest('hex'),
      tamanoBytes: stat.size,
      modificadoEn: stat.mtime,
    };
  }

  private parsearDocumento(xml: string): BloqueLeido[] {
    const raiz = this.parser.parse(xml);
    const cuerpo = raiz?.['w:document']?.['w:body'];
    if (!cuerpo) return [];

    const parrafos: any[] = Array.isArray(cuerpo['w:p']) ? cuerpo['w:p'] : [];
    const bloques: BloqueLeido[] = [];

    parrafos.forEach((p, i) => {
      const { texto, negrita, italica, tamano } = this.extraerRuns(p);
      const pPr = p['w:pPr'] ?? {};
      const centrado = pPr['w:jc']?.['@_w:val'] === 'center';
      const estilo: string = pPr['w:pStyle']?.['@_w:val'] ?? '';
      const tieneBorde = Boolean(pPr['w:pBdr']);
      const enLista = Boolean(pPr['w:numPr']);
      const sangria = Number(pPr['w:ind']?.['@_w:left'] ?? 0);
      const limpio = texto.trim();

      bloques.push({
        orden: i,
        tipo: this.clasificar({
          texto: limpio,
          centrado,
          negrita,
          italica,
          tamano,
          estilo,
          tieneBorde,
          enLista,
          sangria,
          esPrimero: i === 0,
        }),
        texto: limpio,
      });
    });

    return bloques;
  }

  private extraerRuns(p: any) {
    const runs: any[] = Array.isArray(p['w:r']) ? p['w:r'] : [];
    let texto = '';
    let negrita = false;
    let italica = false;
    let tamano: number | null = null;

    for (const r of runs) {
      const rPr = r['w:rPr'] ?? {};
      if ('w:b' in rPr && rPr['w:b']?.['@_w:val'] !== '0') negrita = true;
      if ('w:i' in rPr && rPr['w:i']?.['@_w:val'] !== '0') italica = true;
      const sz = rPr['w:sz']?.['@_w:val'];
      if (sz && tamano === null) tamano = Number(sz);

      const ts = Array.isArray(r['w:t']) ? r['w:t'] : [];
      for (const t of ts) {
        texto += typeof t === 'object' ? (t['#text'] ?? '') : String(t ?? '');
      }
      if ('w:tab' in r) texto += '\t';
      if ('w:br' in r) texto += '\n';
    }

    return { texto, negrita, italica, tamano };
  }

  /**
   * Clasifica por formato, nunca por el texto. Es deliberado: el alumno escribe
   * párrafos que empiezan con "1.-" y no son listas numeradas, así que mirar el
   * prefijo le metería una sangría que él no puso.
   */
  private clasificar(ctx: {
    texto: string;
    centrado: boolean;
    negrita: boolean;
    italica: boolean;
    tamano: number | null;
    estilo: string;
    tieneBorde: boolean;
    enLista: boolean;
    sangria: number;
    esPrimero: boolean;
  }): TipoBloque {
    const { texto, centrado, negrita, italica, tamano, estilo, tieneBorde } = ctx;

    if (!texto) return tieneBorde ? 'SEPARADOR' : 'ESPACIO';
    if (/^TAREA\s+PROPIA$/i.test(texto)) return 'TAREA_PROPIA_TITULO';

    if (ctx.enLista || /^List\s?(Bullet|Paragraph)$/i.test(estilo)) {
      return 'VINETA';
    }

    if (centrado && italica) return 'SUBTITULO';

    // El título es el primer párrafo: centrado, en negrita y a 12 pt. Cualquier
    // otro centrado y en negrita es el tema de la sesión, que va a 11 pt.
    if (centrado && negrita) {
      if (ctx.esPrimero) return 'TITULO';
      return tamano !== null && tamano >= FORMATO.titulo ? 'TITULO' : 'TEMA';
    }
    if (negrita) return 'ENCABEZADO';

    // La sangría izquierda es la firma de una numerada; el texto no dice nada.
    if (ctx.sangria >= SANGRIA_NUMERADA) return 'NUMERADA';

    return 'PARRAFO';
  }

  // ------------------------------------------------------------------ escritura

  /**
   * Reescribe el .docx a partir de los bloques. Conserva el formato del alumno:
   * Carta, márgenes 2.5/3 cm, Arial 10 de cuerpo y título Arial 12 negrita centrado.
   * Con `compacto: true` (formularios de práctica): ~8 pt y márgenes estrechos.
   */
  async escribir(
    ruta: string,
    bloques: { tipo: TipoBloque; texto: string }[],
    opciones: { respaldar?: boolean; compacto?: boolean } = {},
  ): Promise<{ bytes: number; hash: string }> {
    if (opciones.respaldar) await this.respaldar(ruta);

    const buffer = await this.aBuffer(bloques, { compacto: opciones.compacto });
    await fs.mkdir(path.dirname(ruta), { recursive: true });
    await fs.writeFile(ruta, buffer);

    return {
      bytes: buffer.byteLength,
      hash: createHash('sha256').update(buffer).digest('hex'),
    };
  }

  /** Genera el .docx en memoria, para descargarlo sin tocar el disco. */
  async aBuffer(
    bloques: { tipo: TipoBloque; texto: string }[],
    opciones: { compacto?: boolean } = {},
  ): Promise<Buffer> {
    const F: FormatoActivo = opciones.compacto ? FORMATO_COMPACTO : FORMATO;
    const doc = new Document({
      creator: 'UNIVERSIDAD-app',
      description: 'Generado desde UNIVERSIDAD-app',
      styles: {
        default: {
          document: {
            run: { font: F.fuente, size: F.cuerpo, language: { value: 'es-MX' } },
            paragraph: { spacing: { after: F.after, line: F.line, lineRule: 'auto' } },
          },
        },
      },
      numbering: {
        config: [
          {
            reference: 'vinetas',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '•',
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: {
                      left: opciones.compacto ? 360 : 567,
                      hanging: opciones.compacto ? 180 : 283,
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: F.ancho, height: F.alto },
              margin: {
                top: F.margenVertical,
                bottom: F.margenVertical,
                left: F.margenHorizontal,
                right: F.margenHorizontal,
              },
            },
          },
          children: bloques.map((b) => this.construirParrafo(b, F)),
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  private construirParrafo(
    b: { tipo: TipoBloque; texto: string },
    F: FormatoActivo = FORMATO,
  ): Paragraph {
    const texto = b.texto ?? '';

    switch (b.tipo) {
      case 'TITULO':
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: F.after },
          children: [new TextRun({ text: texto, bold: true, size: F.titulo })],
        });

      case 'TEMA':
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: F.after },
          children: [new TextRun({ text: texto, bold: true, size: F.tema })],
        });

      case 'SUBTITULO':
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: F.after },
          children: [
            new TextRun({
              text: texto,
              italics: true,
              size: F.subtitulo,
              color: F.gris,
            }),
          ],
        });

      case 'ENCABEZADO':
      case 'TAREA_PROPIA_TITULO':
        return new Paragraph({
          spacing: { before: F.encabezadoBefore, after: F.encabezadoAfter },
          children: [new TextRun({ text: texto, bold: true, size: F.cuerpo })],
        });

      case 'VINETA':
        return new Paragraph({
          numbering: { reference: 'vinetas', level: 0 },
          spacing: { after: F.listaAfter },
          children: [new TextRun({ text: texto, size: F.cuerpo })],
        });

      case 'NUMERADA':
        return new Paragraph({
          indent: { left: SANGRIA_NUMERADA },
          spacing: { after: F.listaAfter },
          children: [new TextRun({ text: texto, size: F.cuerpo })],
        });

      case 'SEPARADOR':
        return new Paragraph({
          spacing: { before: F.sepBefore, after: F.sepAfter },
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              space: 1,
              color: F.lineaSeparador,
            },
          },
          children: [],
        });

      case 'ESPACIO':
        return new Paragraph({
          spacing: { after: F.after },
          children: [],
        });

      case 'PARRAFO':
      default:
        return new Paragraph({
          spacing: { after: F.after },
          children: [new TextRun({ text: texto, size: F.cuerpo })],
        });
    }
  }

  private async respaldar(ruta: string) {
    try {
      await fs.access(ruta);
      await fs.copyFile(ruta, `${ruta}.bak`);
    } catch {
      /* el archivo aún no existe: no hay nada que respaldar */
    }
  }

  // ------------------------------------------------------------------ util

  /** Render HTML del documento, para la vista previa embebida del front. */
  aHtml(bloques: { tipo: TipoBloque; texto: string }[]): string {
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const partes: string[] = [];
    let enLista = false;

    const cerrarLista = () => {
      if (enLista) {
        partes.push('</ul>');
        enLista = false;
      }
    };

    for (const b of bloques) {
      if (b.tipo === 'VINETA') {
        if (!enLista) {
          partes.push('<ul class="docx-lista">');
          enLista = true;
        }
        partes.push(`<li>${esc(b.texto)}</li>`);
        continue;
      }
      cerrarLista();

      switch (b.tipo) {
        case 'TITULO':
          partes.push(`<h1 class="docx-titulo">${esc(b.texto)}</h1>`);
          break;
        case 'SUBTITULO':
          partes.push(`<p class="docx-subtitulo">${esc(b.texto)}</p>`);
          break;
        case 'TEMA':
          partes.push(`<p class="docx-tema">${esc(b.texto)}</p>`);
          break;
        case 'ENCABEZADO':
        case 'TAREA_PROPIA_TITULO':
          partes.push(`<h2 class="docx-encabezado">${esc(b.texto)}</h2>`);
          break;
        case 'NUMERADA':
          partes.push(`<p class="docx-numerada">${esc(b.texto)}</p>`);
          break;
        case 'SEPARADOR':
          partes.push('<hr class="docx-separador" />');
          break;
        case 'ESPACIO':
          partes.push('<p class="docx-espacio">&nbsp;</p>');
          break;
        default:
          partes.push(`<p class="docx-parrafo">${esc(b.texto)}</p>`);
      }
    }
    cerrarLista();

    return partes.join('\n');
  }

  async hashDeArchivo(ruta: string): Promise<string> {
    const buffer = await fs.readFile(ruta);
    return createHash('sha256').update(buffer).digest('hex');
  }
}
