import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            '@': new URL('./src', import.meta.url).pathname,
        },
    },
    server: {
        proxy: {
            // Dev only: the admin panel and status queries hit the backend API.
            "/api": {
                target: "https://broadcast.bakatrouble.me",
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "build",
        sourcemap: true,
    }
});
