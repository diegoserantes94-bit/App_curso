# CLAUDE.md — Contexto del proyecto App_curso

## Descripción general

Plataforma web de un curso universitario: **Neurociencia – Facultad de Medicina BCC3 (UdelaR)**.  
Sitio estático (HTML/CSS/JS puro), sin backend. Alojado en **GitHub Pages**.

- **URL pública:** https://diegoserantes94-bit.github.io/App_curso/
- **Repo:** https://github.com/diegoserantes94-bit/App_curso
- **Archivo principal:** `index.html` (todo el sitio está en este único archivo)
- **Propietario:** Diego Serantes — diegoserantes94@gmail.com

---

## Stack técnico

- HTML + CSS + JS vanilla (sin frameworks)
- Fuente: Inter (Google Fonts)
- Contenido dinámico: `data.json` en el repo (videos + materiales por módulo)
- Persistencia local: `localStorage` con clave `neurociencia_data_v2`
- Archivos subidos por el admin: carpeta `materiales/` en el repo
- GitHub API (PUT /repos/.../contents/) para publicar cambios y subir archivos
- Token de GitHub guardado en `localStorage` con clave `gh_token`

---

## Archivos importantes

| Archivo | Descripción |
|---|---|
| `index.html` | Todo el sitio: login, videos, modales, admin, JS |
| `data.json` | Contenido dinámico: videos y materiales por módulo |
| `cerebro-byn.png` | Imagen cerebro B&N usada en login y sidebar |
| `logo-fmed.png` | Logo Facultad de Medicina UdelaR |
| `materiales/` | PDFs y archivos subidos por el admin desde la web |
| `server.ps1` | Servidor HTTP local para desarrollo (puerto 3456) |

---

## Usuarios del sistema

```
estudiante1 / pass123
estudiante2 / pass456
maria       / maria123
admin       / admin123   ← usuario administrador
```

El objeto `USERS` está hardcodeado en el JS dentro de `index.html`.

---

## Estructura del JS (dentro de index.html)

### Constantes clave
```js
const REPO = { owner:'diegoserantes94-bit', name:'App_curso', branch:'main', file:'data.json' };
const LOCAL_KEY = 'neurociencia_data_v2';
```

### Funciones principales
- `loadData()` — carga data.json desde GitHub, fallback a localStorage, fallback a defaults
- `saveLocal()` — guarda en localStorage
- `buildSidebar()` — construye el menú lateral de módulos
- `selectModule(id, btn)` — filtra videos y materiales por módulo
- `renderVideos(moduleId)` — renderiza tarjetas de video
- `playVideo(id)` — abre modal con iframe de YouTube
- `renderMaterials(moduleId)` — renderiza tarjetas de material bibliográfico
- `openModal(id)` / `closeModal(id)` — maneja modales con `style.display`
- `saveMaterial()` — async, guarda material (upload o URL)
- `uploadFileToGitHub(file, token)` — sube archivo a `materiales/` vía API
- `readFileAsBase64(file)` — FileReader como Promise
- `doPublish()` — publica data.json a GitHub vía API

### Estado global relevante
```js
let amMode = 'upload'; // 'upload' | 'url'  (modo del modal agregar material)
let amFile = null;     // archivo seleccionado para subir
```

---

## Modales (IDs)

| ID | Descripción |
|---|---|
| `modal-video` | Reproductor de video (YouTube iframe) |
| `modal-add-video` | Admin: agregar nuevo video |
| `modal-add-material` | Admin: agregar material bibliográfico (upload o URL) |
| `modal-publish` | Admin: publicar cambios a GitHub |

---

## Panel de administrador

Solo visible para el usuario `admin`. Botones en el sidebar:
- `btn-open-add-video` — abre modal agregar video
- `btn-open-add-material` — abre modal agregar material
- `btn-open-publish` — abre modal publicar cambios
- `sb-admin-wrap` — contenedor del bloque admin en sidebar

---

## Upload de archivos (admin)

El modal "Agregar material" tiene dos pestañas:
1. **Subir archivo** — drag & drop o click, sube a `materiales/` vía GitHub API
2. **Enlace externo** — pegar URL de Drive, web, etc.

El token de GitHub se pide una vez y se guarda en localStorage (`gh_token`). Debe tener scope `repo`.

Después de agregar materiales hay que usar **"Publicar cambios"** para que los estudiantes vean el contenido nuevo.

---

## Colores / diseño

| Variable | Valor | Uso |
|---|---|---|
| Azul oscuro | `#1E3A5F` | Sidebar, header |
| Azul medio | `#2E5C9E` | Botones, acentos |
| Fondo | `#FFFFFF` | Contenido principal |
| Fondo tarjetas | `#F4F6F9` | Cards de video/material |

Estilo sobrio académico-médico, similar a Amboss/Osmosis.

---

## Decisiones técnicas importantes

1. **Sin onclick en HTML** — todo el JS usa `addEventListener` dentro de `DOMContentLoaded`. Esto fue necesario porque Netlify (y GitHub Pages) aplican CSP headers que bloquean handlers inline. Si en algún momento un botón no funciona, verificar que no tenga `onclick="..."` en el HTML.

2. **Modales con style.display** — se usa `style.display = 'flex'/'none'` directamente, sin clases CSS ni transiciones en los overlays. Esto evitó un bug donde el modal quedaba bloqueando interacciones durante la transición.

3. **data.json como CMS** — el contenido del curso (videos y materiales) se almacena en `data.json` en el repo. El admin lo edita desde la web y lo publica vía GitHub API. Los estudiantes siempre ven la versión más reciente al cargar la página.

4. **Hosting migrado de Netlify a GitHub Pages** — migrado para evitar el límite de 300 minutos de build/mes de Netlify. GitHub Pages no tiene ese límite para sitios estáticos puros.

---

## Historial de cambios principales

- Rediseño completo: estética académica médica (Amboss/Osmosis style)
- Panel de admin: agregar/eliminar videos y materiales, publicar a GitHub
- Fix modales: reescritura completa del JS para usar addEventListener (eliminó bug de freeze)
- Upload de PDFs: subida directa desde la web sin pasar por GitHub UI
- Migración Netlify → GitHub Pages

---

## Desarrollo local

Para servir el sitio localmente (necesario para ver las imágenes):

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\diego\App_curso\server.ps1
```

Luego abrir: http://localhost:3456/

El archivo `server.ps1` es un TcpListener básico que sirve archivos estáticos.
