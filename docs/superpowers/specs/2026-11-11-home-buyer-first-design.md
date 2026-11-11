# Diseño: Home buyer-first para Ticketera C3

## Intención

Hacer que la portada funcione primero como una herramienta para descubrir y elegir eventos tecnológicos. La persona compradora debe entender en segundos qué puede encontrar, cómo filtrarlo y cuál es el siguiente clic; publicar eventos queda como una acción secundaria para organizadores.

## Alcance

- Quitar “Publicar evento” de la navegación principal y conservarlo como CTA secundario en un bloque inferior para organizadores.
- Reforzar el hero con una jerarquía clara: mensaje de descubrimiento, búsqueda/atajos y un evento destacado visual al lado.
- Mantener el evento destacado como contenido principal, pero con más contraste entre imagen, título, fecha, modalidad y CTA.
- Agregar atajos visibles: “Este fin de semana”, “Gratis”, “En línea” y “Cerca de mí”. Cada atajo debe llevar a una búsqueda o filtro útil; “Cerca de mí” se resolverá con las ubicaciones disponibles, sin pedir geolocalización del navegador.
- Mostrar “Próximos eventos” inmediatamente después del hero.
- Simplificar tarjetas: mantener título, fecha, modalidad y precio como datos prioritarios; reducir metadata secundaria para mejorar lectura y escaneo.
- Mantener las 12 categorías y el estilo C3. No cambiar rutas SEO, catálogo, checkout ni permisos.

## No alcance

- No convertir “Cerca de mí” en geolocalización automática.
- No ocultar el CTA de organizadores: seguirá disponible en la sección inferior y en las rutas de publicación.
- No crear un nuevo sistema de filtros ni reordenar las categorías SEO.
- No añadir promociones, métricas o claims sin datos reales.

## Enfoques considerados

1. **Pulido superficial:** ajustar copy, tamaños y metadata manteniendo la composición actual. Es de bajo riesgo, pero no resuelve del todo la prioridad buyer-first.
2. **Buyer-first con hero de descubrimiento (elegido):** reducir la competencia entre acciones, poner búsqueda/atajos y evento destacado sobre el primer pliegue, y mover publicar a un bloque inferior. Es el mejor equilibrio entre cambio visible, reutilización de componentes y claridad de marketplace.
3. **Home editorial de marca:** convertir la portada en una experiencia más narrativa alrededor de Compite, Crea y Conecta. Se descarta por ahora porque retrasa el acceso al catálogo.

## Decisiones de interacción

- CTA primario del hero: buscar/explorar eventos.
- CTA secundario del hero: ver el evento destacado o abrir una categoría útil, según el estado real del catálogo.
- “Publicar evento” no aparece como acción principal en el navbar; el bloque inferior dirá “¿Organizás un evento?” y llevará al formulario vigente.
- Los atajos serán enlaces normales, accesibles por teclado y compatibles con el filtro actual.
- La información prioritaria de una card será: nombre, fecha/hora, modalidad/ubicación resumida y precio.
- El destacado usará una composición con imagen dominante, velo navy si hace falta para legibilidad y CTA visible sin competir con el hero.

## Criterios de aceptación

- En escritorio y móvil, el primer bloque comunica descubrimiento y no presenta “Publicar evento” como acción equivalente al catálogo.
- Los cuatro atajos llevan a estados útiles y no a páginas vacías sin explicación.
- “Próximos eventos” aparece inmediatamente después del hero.
- Las cards muestran menos ruido visual y mantienen fecha/precio legibles.
- El bloque inferior de organizadores conserva el acceso a publicar.
- No hay scroll horizontal en 375 px, los controles tienen foco visible y las áreas táctiles principales alcanzan 44 px.
