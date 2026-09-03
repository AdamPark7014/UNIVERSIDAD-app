export const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4180';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** GET desde un server component. Siempre fresco: los datos cambian en disco. */
export async function obtener<T>(ruta: string): Promise<T> {
  const res = await fetch(`${API}/api${ruta}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new ApiError(`GET ${ruta} → ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

/** Igual que obtener, pero devuelve null si la API no responde. */
export async function obtenerSeguro<T>(ruta: string): Promise<T | null> {
  try {
    return await obtener<T>(ruta);
  } catch {
    return null;
  }
}

/** Mutaciones desde componentes de cliente. */
export async function enviar<T>(
  ruta: string,
  opciones: { metodo?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'; cuerpo?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${API}/api${ruta}`, {
    method: opciones.metodo ?? 'POST',
    headers: opciones.cuerpo ? { 'Content-Type': 'application/json' } : undefined,
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    throw new ApiError(texto || `${opciones.metodo ?? 'POST'} ${ruta} → ${res.status}`, res.status);
  }
  return res.status === 204 ? (null as T) : ((await res.json()) as T);
}

export const urlArchivo = (documentoId: string) =>
  `${API}/api/documentos/${documentoId}/archivo`;
