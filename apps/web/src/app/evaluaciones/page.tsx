import { redirect } from 'next/navigation';

/** Ruta antigua: redirige al módulo de exámenes. */
export default function Pagina() {
  redirect('/examenes');
}
