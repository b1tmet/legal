# Informe de la prueba de carga B1TMET (noviembre 2026)

Página estática, sin compilación. Se sirve tal cual desde GitHub Pages o cualquier hosting.

## Contenido

- `index.html`: la página del informe.
- `app.js`: los gráficos y las tablas.
- `dash-shim.js`: carga los CSV de `data/` y le pasa los datos a `app.js`.
- `vendor/`: D3 v7.9.0 y las fuentes Inter y Source Serif 4 (subconjunto latino), con sus licencias.
- `data/*.csv`: los datos de la prueba, que salen de k6 y del colector del VPS.
- `Prueba_de_carga_B1TMET_nov2026.pdf`: la versión en PDF.

## Publicar en GitHub Pages

1. Copia la carpeta `informe-carga/` completa en la raíz del repositorio de Pages, junto a las páginas legales.
2. Haz commit y push.
3. La página queda en `https://<tu-dominio-de-pages>/informe-carga/`.

## Probar en local

Abrir `index.html` con doble clic no funciona, porque el navegador bloquea la lectura de los CSV desde `file://`. Sírvela con un servidor local:

```bash
cd informe-carga
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Notas

- La página lleva `<meta name="robots" content="noindex">`, así que los buscadores no deberían indexarla. Aun así, cualquiera que tenga el enlace puede verla.
- No depende de ningún servicio externo: D3 y las fuentes van dentro de `vendor/`.
