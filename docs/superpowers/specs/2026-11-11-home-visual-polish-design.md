# Diseño: pulido visual del Home

## Intención

Corregir la primera impresión del Home después de la implementación buyer-first: los atajos deben sentirse como controles rápidos y el destacado debe leerse como una sola pieza editorial, no como una card dentro de otra.

## Alcance

- Compactar los cuatro atajos sin eliminar sus enlaces, etiquetas ni descripciones accesibles.
- Mantener una cuadrícula estable en escritorio y móvil, evitando que un texto largo deforme una tarjeta.
- Simplificar el contenedor del destacado para que tenga una sola superficie, una jerarquía clara y controles integrados.
- Reducir el peso visual de la fecha del destacado sin perder fecha, hora, precio, imagen ni enlace.
- Conservar el estilo C3, los tokens existentes, el carrusel sin autoplay y la navegación por teclado/touch.

## No alcance

- No cambiar filtros, URLs, datos, consultas ni reglas de catálogo.
- No sustituir las imágenes ni modificar las ilustraciones de emergencia.
- No añadir gradientes, animaciones nuevas, geolocalización ni métricas.

## Enfoques considerados

1. **Pulido conservador:** mantener la card actual, acortar textos y ajustar tamaños. Es de bajo riesgo, pero conserva la sensación de capas y controles desconectados.
2. **Panel editorial único (elegido):** convertir el destacado en una sola superficie con imagen dominante, información inferior equilibrada y controles en la misma banda; convertir los atajos en controles compactos de descubrimiento. Es el mejor equilibrio entre claridad, identidad C3 y reutilización del carrusel.

## Decisiones visuales

- Los atajos mostrarán icono + etiqueta en la primera línea y una descripción breve en una segunda línea; todas las celdas tendrán altura estable.
- La imagen del destacado será la entrada visual principal; el contenido tendrá separación y contraste suficientes sin añadir otra card exterior pesada.
- La fecha destacada usará una escala menor que el título y mantendrá la metáfora de boleto sin dominar el panel.
- Los controles seguirán midiendo al menos 44 px, con foco visible y contraste AA en reposo.

## Criterios de aceptación

- A 375 px los atajos no generan desborde horizontal ni tarjetas con alturas excesivamente distintas.
- A 1280 px los cuatro atajos se leen como una fila compacta y el destacado tiene una sola lectura visual.
- La card destacada conserva enlace, imagen ilustrativa cuando corresponda, fecha/hora, modalidad y precio.
- El carrusel conserva navegación por teclado, touch y controles accesibles.
