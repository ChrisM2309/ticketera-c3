import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Los worktrees de agentes viven dentro de .claude/ y repiten las pruebas del repositorio.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
    // Cada prueba de base crea una base PGlite completa con todas las migraciones; con la suite en
    // paralelo, la creación puede tardar más que el límite por defecto.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
