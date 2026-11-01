# 💞 Nuestras cuentas

Web sencilla para anotar ingresos y gastos de pareja, con pestañas para la **cuenta conjunta** y las **cuentas individuales**, más un **resumen** del ahorro anual.

## Qué hace

- Pestañas: cuenta conjunta, persona 1, persona 2 (se pueden renombrar) y resumen.
- Gastos e ingresos con categorías con emoji, como en Monefy (puedes añadir las tuyas).
- Gráfico circular de gastos por categoría, por mes o por año completo.
- Tabla mensual con ingresos, gastos, ahorro y ahorro acumulado del año.
- Exportar e importar copia de seguridad en JSON.

No necesita servidor ni instalar nada: son tres archivos estáticos (`index.html`, `style.css`, `app.js`).

## Publicarla en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `nuestras-cuentas`).
2. Sube los archivos `index.html`, `style.css`, `app.js` y este `README.md`.
3. Ve a **Settings → Pages**.
4. En *Build and deployment*, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
5. En un minuto tendréis la web en `https://TU-USUARIO.github.io/nuestras-cuentas/`.

> Si el repositorio es público, cualquiera podría abrir la web, pero **vuestros datos no se suben a GitHub**: se guardan en el navegador de cada dispositivo.

## Importante: dónde se guardan los datos

Los datos viven en el `localStorage` de cada navegador. Eso significa que **no se sincronizan solos** entre vuestros móviles u ordenadores. Para pasar los datos de un dispositivo a otro:

1. En uno, pulsa **Exportar copia** (descarga un `.json`).
2. En el otro, pulsa **Importar copia** y elige ese archivo.

Si más adelante queréis sincronización automática, se puede añadir con Firebase o Supabase.
