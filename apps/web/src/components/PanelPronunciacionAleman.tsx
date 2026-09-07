'use client';

import { BotonPronunciar } from './BotonPronunciar';

/** Frases Kapitel 1–2: alemán + español (para quien empieza de cero). */
const FRASES: { de: string; es: string; grupo: string }[] = [
  { grupo: 'Saludos', de: 'Hallo', es: 'Hola' },
  { grupo: 'Saludos', de: 'Guten Morgen', es: 'Buenos días' },
  { grupo: 'Saludos', de: 'Guten Tag', es: 'Buenas tardes / hola (de día)' },
  { grupo: 'Saludos', de: 'Guten Abend', es: 'Buenas noches (al llegar)' },
  { grupo: 'Saludos', de: 'Auf Wiedersehen', es: 'Adiós (formal)' },
  { grupo: 'Saludos', de: 'Tschüss', es: 'Chao' },
  { grupo: 'Saludos', de: 'Bis bald', es: 'Hasta pronto' },
  { grupo: 'Presentarse', de: 'Ich heiße Ada', es: 'Me llamo Ada' },
  { grupo: 'Presentarse', de: 'Ich bin Student', es: 'Soy estudiante (hombre)' },
  { grupo: 'Presentarse', de: 'Ich bin Studentin', es: 'Soy estudiante (mujer)' },
  { grupo: 'Presentarse', de: 'Ich komme aus Mexiko', es: 'Vengo de México' },
  { grupo: 'Presentarse', de: 'Ich wohne in Puebla', es: 'Vivo en Puebla' },
  { grupo: 'Presentarse', de: 'Ich studiere Informatik', es: 'Estudio informática' },
  { grupo: 'Presentarse', de: 'Ich spreche Spanisch', es: 'Hablo español' },
  { grupo: 'Preguntas', de: 'Wie heißt du?', es: '¿Cómo te llamas?' },
  { grupo: 'Preguntas', de: 'Woher kommst du?', es: '¿De dónde vienes?' },
  { grupo: 'Preguntas', de: 'Wo wohnst du?', es: '¿Dónde vives?' },
  { grupo: 'Preguntas', de: 'Was machst du?', es: '¿Qué haces?' },
  { grupo: 'Preguntas', de: 'Bist du Student?', es: '¿Eres estudiante?' },
  { grupo: 'Preguntas', de: 'Hast du Geschwister?', es: '¿Tienes hermanos?' },
  { grupo: 'sein = ser/estar', de: 'ich bin', es: 'yo soy / estoy' },
  { grupo: 'sein = ser/estar', de: 'du bist', es: 'tú eres / estás' },
  { grupo: 'sein = ser/estar', de: 'er ist, sie ist', es: 'él es, ella es' },
  { grupo: 'sein = ser/estar', de: 'wir sind', es: 'nosotros somos / estamos' },
  { grupo: 'haben = tener', de: 'ich habe', es: 'yo tengo' },
  { grupo: 'haben = tener', de: 'du hast', es: 'tú tienes' },
  { grupo: 'haben = tener', de: 'er hat, sie hat', es: 'él tiene, ella tiene' },
  { grupo: 'haben = tener', de: 'wir haben', es: 'nosotros tenemos' },
  { grupo: 'Familia', de: 'die Mutter', es: 'la madre' },
  { grupo: 'Familia', de: 'der Vater', es: 'el padre' },
  { grupo: 'Familia', de: 'meine Eltern', es: 'mis padres' },
  { grupo: 'Familia', de: 'meine Schwester', es: 'mi hermana' },
  { grupo: 'Familia', de: 'mein Bruder', es: 'mi hermano' },
  { grupo: 'Familia', de: 'keine Geschwister', es: 'ningún hermano / no tengo hermanos' },
  { grupo: 'Profesiones', de: 'Ich bin Ingenieurin', es: 'Soy ingeniera' },
  { grupo: 'Profesiones', de: 'Er ist Arzt', es: 'Él es médico' },
  { grupo: 'Profesiones', de: 'Sie ist Ärztin', es: 'Ella es médica' },
  { grupo: 'Números', de: 'eins zwei drei vier fünf', es: 'uno dos tres cuatro cinco' },
  { grupo: 'Números', de: 'sechs sieben acht neun zehn', es: 'seis siete ocho nueve diez' },
  { grupo: 'Números', de: 'einundzwanzig', es: 'veintiuno (literal: uno-y-veinte)' },
  { grupo: 'Negación', de: 'Ich bin nicht müde', es: 'No estoy cansado/a' },
  { grupo: 'Negación', de: 'Ich habe keine Geschwister', es: 'No tengo hermanos' },
  { grupo: 'Negación', de: 'Doch!', es: '¡Sí que sí! (cuando contradices un «no»)' },
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
            Arriba el alemán, abajo el español. Pulsa 🔊 para oír (voz de-DE).
            Ideal si aún no sabes alemán: escucha, lee la traducción, repite.
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
