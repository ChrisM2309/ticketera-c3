# Rendimiento Lighthouse — Fase 7.2

Fecha del intento: 10 de noviembre de 2026  
Objetivo: Lighthouse móvil, categoría Performance  
Sitio inspeccionado: [demo.ticketera.c3.com.sv](https://demo.ticketera.c3.com.sv/)

## Resultados

| Página | URL inspeccionada | Lighthouse Performance | LCP | CLS | Estado |
| --- | --- | ---: | ---: | ---: | --- |
| Home | `/` | No disponible | No disponible | No disponible | No se obtuvo informe Lighthouse |
| Categoría | `/congresos/` | No disponible | No disponible | No disponible | No se obtuvo informe Lighthouse |
| Ficha | `/congresos/inteligencia-artificial/congreso-de-ia-2027-a8911c/` | No disponible | No disponible | No disponible | No se obtuvo informe Lighthouse |
| Checkout | `/checkout/` | No disponible | No disponible | No disponible | No se obtuvo informe Lighthouse |

No se sustituyen las mediciones por valores estimados ni por datos de campo. Los presupuestos de referencia del plan son LCP ≤ 2.5 s y CLS ≤ 0.1; no es posible evaluar su cumplimiento sin una corrida Lighthouse válida.

## Evidencia y limitación

- La inspección en vivo confirmó que Home, `/congresos/` y `/checkout/` respondieron desde el dominio DEMO. La Home enlaza a la ficha indicada arriba.
- Se intentó solicitar PSI móvil para las cuatro URL mediante la API oficial `pagespeedonline/v5/runPagespeed`. Las cuatro solicitudes devolvieron HTTP 429 `RESOURCE_EXHAUSTED`: el proyecto consumidor disponible tiene la cuota diaria configurada en `0` (`quota_limit_value: 0`). No se generó reporte ni valores para ninguna de las páginas.
- La interfaz web de PageSpeed Insights cargó sin un informe: mostró “Enter a valid URL” y estados `loading`; tampoco proporcionó resultados medidos.
- En este entorno no está instalado el ejecutable Lighthouse (`lighthouse`) ni el paquete local `lighthouse` en el proyecto. Por tanto no hay un segundo runner disponible para producir mediciones independientes.
- CrUX indicó que no hay suficientes datos reales de usuarios para la página. CrUX no reemplaza el informe Lighthouse de laboratorio.

## Cómo completar las mediciones

Cuando haya un runner Lighthouse disponible o PSI vuelva a aceptar consultas, ejecutar una medición móvil individual para cada URL de la tabla y registrar el informe de cada corrida, fecha/hora, Performance, LCP y CLS. Mantener los datos como pendientes hasta guardar esos resultados verificables.
