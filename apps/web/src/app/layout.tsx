import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { BarraLateral } from '@/components/BarraLateral';
import { obtenerSeguro } from '@/lib/api';
import '@/styles/globals.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--fuente-display',
  display: 'swap',
});

const cuerpo = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--fuente-cuerpo',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--fuente-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Universidad — Otoño 2026',
  description: 'Gestión de materias, sesiones, notas y entregas del semestre',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [materias, sync, alertas, proximas] = await Promise.all([
    obtenerSeguro<any[]>('/materias'),
    obtenerSeguro<any>('/sync/estado'),
    obtenerSeguro<any>('/alertas'),
    obtenerSeguro<any[]>('/evaluaciones/proximas?dias=14'),
  ]);

  const examenesCerca = (proximas ?? []).filter((e) =>
    ['PARCIAL', 'FINAL', 'QUIZ'].includes(e.tipo),
  ).length;
  const entregasCerca = (proximas ?? []).filter(
    (e) => !['PARCIAL', 'FINAL', 'QUIZ'].includes(e.tipo),
  ).length;

  const sidebar = (
    <BarraLateral
      materias={materias ?? []}
      pendientes={sync?.pendientesDeEscribir ?? 0}
      notasPendientes={alertas?.notas?.pendientes ?? 0}
      examenesCerca={examenesCerca}
      entregasCerca={entregasCerca}
    />
  );

  return (
    <html lang="es-MX" className={`${display.variable} ${cuerpo.variable} ${mono.variable}`}>
      <body>
        <AppShell sidebar={sidebar}>{children}</AppShell>
      </body>
    </html>
  );
}
