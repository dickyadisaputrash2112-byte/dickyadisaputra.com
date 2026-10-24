import{defineConfig}from'vite';
import react from'@vitejs/plugin-react';
import{fileURLToPath,URL}from'node:url';
export default defineConfig({base:'/ruang-tumbuh/',plugins:[react()],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},build:{outDir:'../ruang-tumbuh',emptyOutDir:true},server:{port:4181,host:'127.0.0.1'}});
