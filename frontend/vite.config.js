import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// La página llama a la API en /api (misma dirección que la página), así la
// cookie de sesión funciona. En la compu, Vite pasa esos pedidos al backend.
const proxyApi = {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: { proxy: proxyApi },
  preview: { proxy: proxyApi },
})
