# Rendimiento de la Fase 5

Fecha de revisión: 2026-11-10.

El presupuesto objetivo para laboratorio móvil (375 px) es LCP ≤ 2.5 s y CLS ≤ 0.1, sin recursos de terceros que bloqueen el render.

La verificación funcional de enlaces internos se ejecuta con `tests/e2e/internal-links.spec.ts`. La medición Lighthouse queda pendiente de ejecutarse en un entorno con el binario `lighthouse` disponible y el servidor local accesible; no se inventan valores de rendimiento. Antes de activar indexación se debe ejecutar:

```text
npx lighthouse http://localhost:3000/ --preset=perf --form-factor=mobile
npx lighthouse http://localhost:3000/congresos/ --preset=perf --form-factor=mobile
npx lighthouse http://localhost:3000/congresos/ciberseguridad/congreso-demo-ciberseguridad/ --preset=perf --form-factor=mobile
```

Si alguno supera el presupuesto, registrar la causa y abrir una tarea antes de activar el interruptor de indexación.
