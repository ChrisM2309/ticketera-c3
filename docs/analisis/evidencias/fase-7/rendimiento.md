# Rendimiento Lighthouse — Fase 7.2

Fecha: 10 de noviembre de 2026 (America/El_Salvador). Sitio: [demo.ticketera.c3.com.sv](https://demo.ticketera.c3.com.sv/).

## Método

Lighthouse CLI 13.6.0, auditoría móvil de laboratorio con emulación Moto G Power 2022 (412 × 823), throttling simulado y Chromium de Playwright. Se inspeccionaron las URL públicas de producción en modo DEMO; no se modificó el sitio. PSI no pudo usarse porque el proyecto disponible tenía cuota diaria 0, así que se ejecutó Lighthouse local. Los informes JSON temporales no se incluyeron en el repositorio; las cifras siguientes se transcribieron de los resultados de cada corrida. Son mediciones de laboratorio, no Core Web Vitals de usuarios reales.

## Resultados

| Página | URL inspeccionada | Performance | LCP | CLS | TBT | Evaluación frente al presupuesto |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Home | `/` | 0.64 | 2.9 s | 0 | 2830 ms | LCP supera 2.5 s |
| Categoría | `/congresos/` | 0.71 | 0.9 s | 0 | 1720 ms | Dentro de LCP ≤ 2.5 s y CLS ≤ 0.1 |
| Ficha | `/congresos/inteligencia-artificial/congreso-demo-ia/` | 0.64 | 2.8 s | 0 | 4110 ms | LCP supera 2.5 s |
| Checkout | `/checkout/` | 0.73 | 0.9 s | 0 | 1650 ms | Dentro de LCP ≤ 2.5 s y CLS ≤ 0.1 |

FCP fue 1.0 s en Home, 0.9 s en categoría, 1.1 s en ficha y 0.9 s en checkout. Home y ficha exceden el presupuesto de LCP; TBT también fue elevado en las cuatro páginas, especialmente en ficha. Estas mediciones registran oportunidades de mejora, no evidencian por sí solas un defecto funcional.

## Observaciones y limitaciones

Lighthouse estimó aproximadamente 34 KiB de ahorro potencial por entrega de imágenes, principalmente el logo solicitado a 3840 px para una visualización aproximada de 36 px. También reportó JavaScript no usado y tareas largas de hilo principal. No se cambió código en respuesta a estas mediciones; conviene priorizar la carga del logo y el trabajo de JavaScript en un ciclo de rendimiento separado y volver a medir.

CrUX no mostró datos suficientes de usuarios reales. No se interpretan métricas de laboratorio como experiencia real, ni se afirma que estas cuatro URLs representen todas las rutas. La auditoría no cambió la indexación ni realizó transacciones.