import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Sem componentes com lógica própria ainda nesta sprint — evita falhar o CI por "0 testes".
    passWithNoTests: true,
  },
});
