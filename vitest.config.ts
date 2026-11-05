import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  // Mismo alias que tsconfig: los componentes importan con «@/» y las pruebas de UI los necesitan.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Los worktrees de agentes viven dentro de .claude/ y repiten las pruebas del repositorio.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
    // Cada prueba de base crea una base PGlite completa con todas las migraciones; con la suite en
    // paralelo, la creación puede tardar más que el límite por defecto.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Las pruebas de base crean PGlite con todas las migraciones; con 8 workers el arranque supera 30 s.
    maxWorkers: 4,
  },
});
