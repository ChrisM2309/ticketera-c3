# Accesos a paneles desde Mi cuenta y mejora visual del panel

## Intención

Permitir que organizadores y administradores encuentren sus paneles desde **Mi cuenta**, y mejorar la lectura de las filas de eventos en el panel actual sin rehacer su estructura.

## Alcance

- En `src/app/cuenta/page.tsx`, permitir acceso de comprador autenticado y renderizar enlaces según el rol verificado en servidor: `organizer` muestra «Panel del organizador» hacia `/panel/`; `admin` muestra tanto `/admin/` como `/panel/`; `buyer` conserva «Mis boletos». Los enlaces usan iconos y estilos de botón existentes.
- En `src/app/panel/page.tsx`, conservar la lista actual agrupada por organizador. Ajustar espaciado, jerarquía visual y disposición de acciones existentes; añadir iconos a editar, archivar, check-in, reporte y destacar, con etiqueta visible o nombre accesible. Mantener los enlaces, textos de estado, flujo de archivo y comportamiento móvil. No migrar a tabla ni cambiar consultas.

## No incluye

- Cambios de roles, permisos, navegación lateral ni endpoints.
- Rediseñar el panel, sustituir la lista por una tabla, añadir CRUD o cambiar acciones.
- Dar a compradores acceso a `/panel/` o a organizadores acceso a `/admin/`.

## Enfoques considerados

1. Rehacer el panel como tabla adaptable: ofrece orden consistente, pero amplía el cambio y contradice la petición de no rehacer.
2. Mantener la lista actual y compactar filas/acciones, con iconos accesibles; es la opción elegida por el responsable.

El acceso a paneles se controla con el rol ya leído en servidor mediante `requireRole`; la jerarquía actual permite que administradores accedan a `/panel/`. Se reutilizan `buttonVariants`, `Icon` y componentes presentes.

## Criterios de aceptación

- Un comprador ve sus boletos y cerrar sesión, sin acceso a paneles.
- Un organizador ve el enlace a su panel; un administrador ve enlaces a administración y organización.
- El panel conserva sus grupos/filas, estados y acciones; los botones quedan más compactos y cada acción tiene icono con nombre accesible.
- La vista móvil conserva acciones utilizables sin desbordamiento horizontal.
- Las pruebas cubren render por rol y navegación visual; `lint`, `typecheck` y pruebas enfocadas pasan.
