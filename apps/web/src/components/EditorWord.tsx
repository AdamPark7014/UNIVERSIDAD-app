'use client';

import { useEffect, useRef } from 'react';

/** Área editable con aspecto de hoja Word (Arial, papel blanco). */
export function EditorWord({
  value,
  onChange,
  compacta = false,
  placeholder,
}: {
  value: string;
  onChange: (texto: string) => void;
  compacta?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const valorRef = useRef(value);

  useEffect(() => {
    valorRef.current = value;
    const el = ref.current;
    if (!el || el.innerText === value) return;
    el.innerText = value;
  }, [value]);

  return (
    <div
      ref={ref}
      className={`hoja editor-word${compacta ? ' compacta' : ''}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Editor de notas"
      data-placeholder={placeholder}
      onInput={() => {
        const t = ref.current?.innerText ?? '';
        valorRef.current = t;
        onChange(t);
      }}
      onPaste={(e) => {
        // Pega texto plano para no meter HTML raro en el .docx.
        e.preventDefault();
        const texto = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, texto);
      }}
    />
  );
}
