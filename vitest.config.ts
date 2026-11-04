import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Los worktrees de agentes viven dentro de .claude/ y repiten las pruebas del repositorio.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
  },
});
