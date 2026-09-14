# Digest local — 120 archivos
Generado 2026-09-09T17:02:32.664Z por qwen2.5-coder:7b (worker local, 0 tokens de frontier)

**Cobertura parcial: 120 de 123 archivos** (muestra repartida por carpeta). Lo que no esté aquí no significa que no exista — sube `--max` para indexar más.

| Archivo | Para qué sirve | Exporta |
|---------|----------------|---------|
| `apps/api/prisma/migrations/20260818145107_inicial/migration.sql` | Define estructuras de datos para un sistema educativo | semestres, dias_no_lectivos, materias, bloques_horario |
| `apps/api/prisma/migrations/20260818150000_palabras_contenido/migration.sql` | Añade una columna 'palabrasContenido' a la tabla 'documentos' |  |
| `apps/api/prisma/migrations/20260818160000_libros_archivo/migration.sql` | Añade columnas 'archivo', 'tamanoBytes' y 'agregadoEn' a la tabla 'libros' |  |
| `apps/api/prisma/schema.prisma` | Modelo de datos para la aplicación de la Universidad | Semestre, DiaNoLectivo, Materia, BloqueHorario |
| `apps/api/prisma/seed.ts` | Carga el semestre Otoño 2026 con los datos reales de los syllabus. | RAIZ, MATERIAS |
| `apps/api/scripts/generar-guias-estudio.ts` | Genera guías MEGA de estudio a partir de datos en la base de datos. |  |
| `apps/api/scripts/generar-notas-pendientes.ts` | Genera apuntes para sesiones pendientes en dev. |  |
| `apps/api/src/alertas/alertas.controller.ts` | Controlador para manejar las alertas, proporcionando resúmenes y notas pendientes. | AlertasController |
| `apps/api/src/alertas/alertas.module.ts` | Define el módulo de alertas para el servicio de alertas | AlertasService |
| `apps/api/src/alertas/alertas.service.ts` | Servicio para gestionar y generar alertas basadas en sesiones, notas y evaluaciones. | AlertasService |
| `apps/api/src/app.module.ts` | Define el módulo principal de la aplicación NestJS |  |
| `apps/api/src/automatizacion/automatizacion.controller.ts` | Controlador para gestionar automatizaciones en el sistema. | AutomatizacionController |
| `apps/api/src/automatizacion/automatizacion.module.ts` | Define el módulo de automatización en NestJS | AutomatizacionService, PrepararSesionesService |
| `apps/api/src/automatizacion/automatizacion.service.ts` | Servicio de automatización para el caso de uso personal, gestionando escritos, notas, plantillas y guías de estudio. | AutomatizacionService |
| `apps/api/src/automatizacion/preparar-sesiones.service.ts` | Servicio para preparar sesiones de clases con plantillas de guía y notas. | PrepararSesionesService |
| `apps/api/src/busqueda/busqueda.controller.ts` | Controlador para manejar solicitudes de búsqueda | BusquedaController |
| `apps/api/src/busqueda/busqueda.module.ts` | Define un módulo global para la funcionalidad de búsqueda en la aplicación. | BusquedaService |
| `apps/api/src/busqueda/busqueda.service.ts` | Servicio de búsqueda para documentos con soporte para fechas y tildes | BusquedaService |
| `apps/api/src/busqueda/fechas.spec.ts` | Pruebas unitarias para la función interpretarFecha en el módulo fechas.ts | interpretarFecha |
| `apps/api/src/busqueda/fechas.ts` | Interpreta fechas escritas como las escribe una persona y devuelve un rango de fechas. | interpretarFecha, RangoFechas |
| `apps/api/src/calendario/calendario.controller.ts` | Controlador para manejar operaciones relacionadas con el calendario académico. | CalendarioController |
| `apps/api/src/calendario/calendario.module.ts` | Define el módulo de Calendario para NestJS |  |
| `apps/api/src/comun/filtro-excepciones.ts` | Filtro de excepciones para manejar errores en una aplicación NestJS | FiltroExcepciones |
| `apps/api/src/comun/interceptor-registro.ts` | Intercepta peticiones HTTP para registrar su duración. | InterceptorRegistro |
| `apps/api/src/config.ts` | Configuración del servidor API | default |
| `apps/api/src/dashboard/dashboard.controller.ts` | Controlador para el resumen del dashboard, incluyendo estadísticas y datos relevantes. | DashboardController |
| `apps/api/src/dashboard/dashboard.module.ts` | Define el módulo de la interfaz de usuario del panel de control | DashboardModule |
| `apps/api/src/documentos/documentos.controller.ts` | Controlador para gestionar documentos | DocumentosController |
| `apps/api/src/documentos/documentos.module.ts` | Define el módulo de documentos para la aplicación API | DocumentosService |
| `apps/api/src/documentos/documentos.service.ts` | Servicio para gestionar documentos, incluyendo contar palabras y aplicar bloques de texto. | DocumentosService |
| `apps/api/src/docx/docx.module.ts` | Define un módulo global para el servicio de documentos DOCX en NestJS. | DocxService |
| `apps/api/src/docx/docx.service.spec.ts` | Pruebas unitarias para el servicio DocxService |  |
| `apps/api/src/docx/docx.service.ts` | Servicio para leer y procesar documentos DOCX | DocxService |
| `apps/api/src/evaluaciones/evaluaciones.controller.ts` | Controlador para gestionar evaluaciones | EvaluacionesController |
| `apps/api/src/evaluaciones/evaluaciones.module.ts` | Define el módulo para las evaluaciones |  |
| `apps/api/src/exportar/exportar.controller.ts` | Controlador para exportar materiales en formato .docx | ExportarController |
| `apps/api/src/exportar/exportar.module.ts` | Define un módulo para controladores de exportación | ExportarModule |
| `apps/api/src/guias-examen/formularios-examen.logic.ts` | Funciones para generar formularios de práctica y claves en formato DOCX | formAlemanKap12 |
| `apps/api/src/guias-examen/generar-guias.logic.ts` | Lógica para generar guías MEGA en formato DOCX | megaAleman |
| `apps/api/src/guias-examen/guias-estudio.service.ts` | Servicio para generar guías de estudio | GuiasEstudioService |
| `apps/api/src/guias-examen/guias-examen.controller.ts` | Controlador para gestionar las guías de examen | GuiasExamenController |
| `apps/api/src/guias-examen/guias-examen.module.ts` | Define el módulo para el manejo de guías de examen | GuiasEstudioService |
| `apps/api/src/lib/rutas-docs.ts` | Funciones para manejar rutas de archivos y carpetas en un proyecto de documentos. | remapearARaiz, primeraExistente, carpetaLibros |
| `apps/api/src/libros/libros.controller.ts` | Controlador para gestionar libros, incluyendo listar, importar, obtener, subir, adjuntar y eliminar libros. | LibrosController |
| `apps/api/src/libros/libros.module.ts` | Define el módulo de libros para la aplicación NestJS | LibrosService |
| `apps/api/src/libros/libros.service.ts` | Servicio para gestionar libros en la aplicación. | LibrosService |
| `apps/api/src/main.ts` | Inicializa una aplicación NestJS con configuraciones globales y filtros. |  |
| `apps/api/src/materias/materias.controller.ts` | Controlador para gestionar materias en una API | MateriasController |
| `apps/api/src/materias/materias.module.ts` | Define el módulo para el controlador de materias | MateriasModule |
| `apps/api/src/notas/generador-cuerpo.ts` | Genera el cuerpo de notas a partir de la guía del maestro, con atajos de estudio específicos para ciertas materias. | BloqueSimple, ContextoSesion, contarPalabrasCuerpo, generarCuerpoDesdeGuia |
| `apps/api/src/notas/notas-generador.service.ts` | Servicio para generar notas automáticamente basadas en sesiones y guías. | NotasGeneradorService |
| `apps/api/src/notas/notas.controller.ts` | Controlador para gestionar notas de sesiones y generar apuntes. | NotasController |
| `apps/api/src/notas/notas.module.ts` | Define el módulo de notas en una aplicación NestJS | NotasGeneradorService |
| `apps/api/src/prisma/prisma.module.ts` | Define un módulo global para Prisma en NestJS | PrismaService |
| `apps/api/src/prisma/prisma.service.ts` | Servicio Prisma para manejar la conexión y desconexión del cliente Prisma en NestJS | PrismaService |
| `apps/api/src/salud/salud.controller.ts` | Controlador para verificar el estado de la aplicación de salud | SaludController |
| `apps/api/src/scripts/probar-docx.ts` | Prueba del lector/escritor de .docx contra archivos reales, sin base de datos. |  |
| `apps/api/src/scripts/sync-cli.ts` | Script de sincronización desde la terminal para la API de la Universidad. |  |
| `apps/api/src/sesiones/sesiones.controller.ts` | Controlador para gestionar sesiones académicas | SesionesController |
| `apps/api/src/sync/sync.controller.ts` | Controlador para operaciones de sincronización | SyncController |
| `apps/api/src/sync/sync.module.ts` | Define el módulo de sincronización con servicios y controladores | SyncService |
| `apps/api/src/sync/sync.service.ts` | Servicio para sincronizar archivos .docx de notas y guías desde el disco hacia la base de datos. | SyncService |
| `apps/api/src/sync/vigilante.service.ts` | Servicio que vigila cambios en archivos .docx y los reimporta. | VigilanteService |
| `apps/api/src/tareas/tareas.controller.ts` | Controlador para gestionar tareas propias, incluyendo listar, crear, actualizar y eliminar. | TareasController |
| `apps/api/temp-count.js` | Cuenta los registros de materias, sesiones y bloques en la base de datos y los imprime en formato JSON. |  |
| `apps/api/vitest.config.ts` | Configuración de Vitest para pruebas unitarias | default |
| `apps/web/next-env.d.ts` | Define tipos para Next.js y Next.js Image |  |
| `apps/web/next.config.js` | Configuración de Next.js para un proyecto de universidad | nextConfig |
| `apps/web/src/app/buscar/page.tsx` | Componente de página de búsqueda con un buscador y un encabezado | Pagina |
| `apps/web/src/app/calendario/page.tsx` | Componente de página para mostrar un calendario académico con opciones para navegar entre semanas y ver días no lectivos. | Pagina |
| `apps/web/src/app/entregas/page.tsx` | Componente de página para mostrar las entregas de evaluaciones, filtradas por estado y tipo. | Pagina |
| `apps/web/src/app/error.tsx` | Componente de error para mostrar mensajes de error en la aplicación web | Error |
| `apps/web/src/app/estadisticas/page.tsx` | Componente de página estadísticas que muestra avances y datos de seguridad. | Pagina |
| `apps/web/src/app/evaluaciones/page.tsx` | Redirige a la página de exámenes | Pagina |
| `apps/web/src/app/examenes/page.tsx` | Componente de página para mostrar exámenes y guías de examen | Pagina |
| `apps/web/src/app/horario/page.tsx` | Componente de página para mostrar el horario académico. | Pagina |
| `apps/web/src/app/layout.tsx` | Define la estructura y estilo de la aplicación web | RootLayout |
| `apps/web/src/app/libros/page.tsx` | Componente de página para mostrar una biblioteca de libros y materias. | Pagina |
| `apps/web/src/app/loading.tsx` | Componente de carga para una página web | Cargando |
| `apps/web/src/app/materias/[codigo]/page.tsx` | Componente de página para una materia, muestra detalles y recursos | Pagina |
| `apps/web/src/app/materias/page.tsx` | Componente React que muestra una lista de materias con detalles y avance | Pagina |
| `apps/web/src/app/not-found.tsx` | Componente de página 404 para mostrar cuando una ruta no existe | NoEncontrado |
| `apps/web/src/app/notas-pendientes/page.tsx` | Componente de página para mostrar notas pendientes de clases. | Pagina |
| `apps/web/src/app/page.tsx` | Componente de página web que muestra información sobre el semestre, sesiones, tareas y evaluaciones. | Pagina |
| `apps/web/src/app/sesiones/[id]/page.tsx` | Componente de página para mostrar detalles de una sesión | Pagina |
| `apps/web/src/app/sync/page.tsx` | Componente de página para la sincronización de documentos | Pagina |
| `apps/web/src/app/tareas/page.tsx` | Componente de página para mostrar y filtrar tareas propias | Pagina |
| `apps/web/src/components/AppShell.tsx` | Componente de shell para aplicaciones web con sidebar y menú desplegable. | AppShell |
| `apps/web/src/components/BandaAlertas.tsx` | Componente que muestra alertas y notas para una banda de clases. | BandaAlertas |
| `apps/web/src/components/BarraLateral.tsx` | Componente de barra lateral para una aplicación web educativa | BarraLateral |
| `apps/web/src/components/Biblioteca.tsx` | Componente React para visualizar y gestionar libros en una biblioteca digital. | Biblioteca |
| `apps/web/src/components/BotonPronunciar.tsx` | Componente React que permite pronunciar texto en alemán usando la Web Speech API. | BotonPronunciar |
| `apps/web/src/components/BotonRegenerarGuias.tsx` | Componente de botón para regenerar guías MEGA desde Exámenes. | BotonRegenerarGuias |
| `apps/web/src/components/Buscador.tsx` | Componente de búsqueda para una aplicación web | Buscador |
| `apps/web/src/components/CardClaseHoy.tsx` | Componente de tarjeta para una clase de hoy en el panel. | CardClaseHoy |
| `apps/web/src/components/ControlesSync.tsx` | Componente React para controlar la sincronización de documentos | ControlesSync |
| `apps/web/src/components/EditorBloques.tsx` | Componente de React para editar bloques de texto con opciones de tipo, texto, movimiento y eliminación. | EditorBloques |
| `apps/web/src/components/EditorWord.tsx` | Componente de editor de texto con aspecto de hoja Word | EditorWord |
| `apps/web/src/components/EtiquetaMateria.tsx` | Componente de etiqueta de materia con opciones para nombre, aula, clave, color y formato compacto. | EtiquetaMateria |
| `apps/web/src/components/FilaEvaluacion.tsx` | Componente React para mostrar y editar el estado de una evaluación. | FilaEvaluacion |
| `apps/web/src/components/FilaSesion.tsx` | Componente que muestra una fila de sesión con detalles y estado de notas. | FilaSesion |
| `apps/web/src/components/GenerarNotasPendientes.tsx` | Componente React para generar notas pendientes | GenerarNotasPendientes |
| `apps/web/src/components/HojaDocumento.tsx` | Renderiza bloques de texto con estilo .docx | HojaDocumento |
| `apps/web/src/components/Icono.tsx` | Componente React para renderizar iconos SVG | Icono |
| `apps/web/src/components/ListaTareas.tsx` | Componente React que muestra y gestiona una lista de tareas con opciones para cambiar estado, agregar notas y eliminar tareas. | ListaTareas |
| `apps/web/src/components/PanelAutomatizacion.tsx` | Componente React para controlar el motor automático de post-clase, plantillas y guías. | PanelAutomatizacion |
| `apps/web/src/components/PanelDocumentos.tsx` | Componente React para mostrar y editar documentos en formato de guía y notas. | PanelDocumentos |
| `apps/web/src/components/PanelGuiasExamen.tsx` | Componente React que muestra una lista de guías de examen con detalles y opciones de descarga. | PanelGuiasExamen |
| `apps/web/src/components/PanelPronunciacionAleman.tsx` | Componente React para mostrar frases de alemán con pronunciación. | PanelPronunciacionAleman |
| `apps/web/src/components/SeccionCabecera.tsx` | Componente de cabecera de sección con subtítulo y acción opcional. | SeccionCabecera |
| `apps/web/src/components/SelloOrigen.tsx` | Componente que muestra un sello de origen para notas | SelloOrigen |
| `apps/web/src/components/SinApi.tsx` | Componente React que muestra un mensaje de error cuando la API no responde. | SinApi |
| `apps/web/src/lib/api.ts` | Define funciones para interactuar con una API, incluyendo obtener y enviar datos. | API, ApiError, obtener, obtenerSeguro |
| `apps/web/src/lib/evaluaciones.ts` | Define tipos de evaluaciones y verifica si un tipo es un examen. | TIPOS_EXAMEN, esExamen |
| `apps/web/src/lib/formato.ts` | Funciones para formatear fechas y etiquetas | DIAS, MESES, fecha, fechaCorta |
| `apps/web/src/lib/texto.ts` | Conversión entre bloques de texto y texto plano, con soporte para encabezados, viñetas, separadores y tareas propias. | Bloque, CABECERA, AYUDA_SINTAXIS, separarCabecera |
| `packages/shared/src/index.ts` | {
  "purpose": "Tipos compartidos entre la API y el front",
  "exports": [
    "TipoDocumento",
    "OrigenDocumento", |  |
| `scripts/check-files.py` | Verifica si un directorio existe y lista sus archivos con detalles |  |
| `scripts/remap-rutas-prod.py` | Remapea rutas de OneDrive a rutas del contenedor en producción. | main |
| `scripts/verify-pdf.py` | Verifica la existencia y los metadatos de un archivo PDF en una base de datos y una API. |  |
