'use client';

import { useCallback, useEffect, useState } from 'react';

/** Pronuncia texto en alemán con la voz del navegador (Web Speech API). */
export function BotonPronunciar({
  texto,
  etiqueta = 'Escuchar',
  chico = false,
}: {
  texto: string;
  etiqueta?: string;
  chico?: boolean;
}) {
  const [hablando, setHablando] = useState(false);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    setOk(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const hablar = useCallback(() => {
    if (!texto.trim() || !ok) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'de-DE';
    u.rate = 0.9;
    const voces = window.speechSynthesis.getVoices();
    const de =
      voces.find((v) => v.lang.toLowerCase().startsWith('de') && /google|microsoft|anna|hedda|stefan/i.test(v.name)) ||
      voces.find((v) => v.lang.toLowerCase().startsWith('de'));
    if (de) u.voice = de;
    u.onstart = () => setHablando(true);
    u.onend = () => setHablando(false);
    u.onerror = () => setHablando(false);
    window.speechSynthesis.speak(u);
  }, [texto, ok]);

  if (!ok) return null;

  return (
    <button
      type="button"
      className={`boton-pronunciar${chico ? ' chico' : ''}${hablando ? ' activo' : ''}`}
      onClick={hablar}
      title={`Pronunciar en alemán: ${texto}`}
      aria-label={`Pronunciar: ${texto}`}
    >
      {hablando ? '…' : '🔊'} {etiqueta}
    </button>
  );
}
