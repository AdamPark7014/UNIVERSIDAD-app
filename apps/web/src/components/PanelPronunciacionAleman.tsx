'use client';

import { BotonPronunciar } from './BotonPronunciar';

/** Frases y vocabulario de Kapitel 1–2 para practicar a oído. */
const FRASES: { de: string; es: string; grupo: string }[] = [
  { grupo: 'Saludos', de: 'Guten Morgen', es: 'Buenos días' },
  { grupo: 'Saludos', de: 'Guten Tag', es: 'Buenas tardes / hola' },
  { grupo: 'Saludos', de: 'Guten Abend', es: 'Buenas noches (al llegar)' },
  { grupo: 'Saludos', de: 'Auf Wiedersehen', es: 'Hasta luego (formal)' },
  { grupo: 'Saludos', de: 'Tschüss', es: 'Chao' },
  { grupo: 'Presentarse', de: 'Ich heiße Ada', es: 'Me llamo Ada' },
  { grupo: 'Presentarse', de: 'Ich bin Student', es: 'Soy estudiante' },
  { grupo: 'Presentarse', de: 'Ich komme aus Mexiko', es: 'Vengo de México' },
  { grupo: 'Presentarse', de: 'Ich wohne in Puebla', es: 'Vivo en Puebla' },
  { grupo: 'Presentarse', de: 'Ich studiere Informatik', es: 'Estudio informática' },
  { grupo: 'Preguntas', de: 'Wie heißt du?', es: '¿Cómo te llamas?' },
  { grupo: 'Preguntas', de: 'Woher kommst du?', es: '¿De dónde vienes?' },
  { grupo: 'Preguntas', de: 'Wo wohnst du?', es: '¿Dónde vives?' },
  { grupo: 'Preguntas', de: 'Was machst du?', es: '¿Qué haces?' },
  { grupo: 'Preguntas', de: 'Bist du Student?', es: '¿Eres estudiante?' },
  { grupo: 'sein / haben', de: 'ich bin, du bist, er ist, wir sind', es: 'conjugación sein' },
  { grupo: 'sein / haben', de: 'ich habe, du hast, er hat, wir haben', es: 'conjugación haben' },
  { grupo: 'Familia', de: 'meine Mutter', es: 'mi madre' },
  { grupo: 'Familia', de: 'mein Vater', es: 'mi padre' },
  { grupo: 'Familia', de: 'meine Eltern', es: 'mis padres' },
  { grupo: 'Familia', de: 'meine Schwester', es: 'mi hermana' },
  { grupo: 'Familia', de: 'mein Bruder', es: 'mi hermano' },
  { grupo: 'Profesiones', de: 'Ich bin Ingenieurin', es: 'Soy ingeniera' },
  { grupo: 'Profesiones', de: 'Er ist Arzt', es: 'Él es médico' },
  { grupo: 'Números', de: 'eins zwei drei vier fünf', es: '1–5' },
  { grupo: 'Números', de: 'sechs sieben acht neun zehn', es: '6–10' },
  { grupo: 'Números', de: 'einundzwanzig', es: '21' },
];

export function PanelPronunciacionAleman() {
  const grupos = [...new Set(FRASES.map((f) => f.grupo))];

  return (
    <section className="panel-pronunciacion">
      <div className="fila entre" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Alemán · oído</div>
          <h2 style={{ fontSize: 22 }}>Pronunciación</h2>
          <p className="mini silencio" style={{ margin: '6px 0 0' }}>
            Pulsa 🔊 para oír cada frase en alemán (voz del navegador, idioma de-DE).
            Ideal con auriculares. Si no suena, instala una voz alemana en Windows.
          </p>
        </div>
      </div>

      {grupos.map((g) => (
        <div key={g} className="grupo-pronunciacion">
          <h3>{g}</h3>
          <div className="rejilla-frases">
            {FRASES.filter((f) => f.grupo === g).map((f) => (
              <div key={f.de} className="tarjeta-frase">
                <div className="frase-de">{f.de}</div>
                <div className="frase-es silencio">{f.es}</div>
                <BotonPronunciar texto={f.de} etiqueta="Oír" chico />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
