# CLAUDE.md — Contexto del proyecto App_curso

## Descripción general

Plataforma web de un curso universitario: **Neurociencia – Facultad de Medicina BCC3 (UdelaR)**.  
Sitio estático (HTML/CSS/JS puro), sin backend. Alojado en **GitHub Pages**.

- **URL pública:** https://diegoserantes94-bit.github.io/App_curso/
- **Repo:** https://github.com/diegoserantes94-bit/App_curso
- **Archivo principal:** `index.html` (todo el sitio está en este único archivo)
- **Propietario:** Diego Serantes — diegoserantes94@gmail.com (cuenta personal / login admin en Firebase). El contacto público que figura en la web es academiamemento@gmail.com.

---

## Stack técnico

- HTML + CSS + JS vanilla (sin frameworks)
- Fuente: Inter (Google Fonts)
- **Firebase Authentication** — login con email/contraseña
- **Firebase Firestore** — base de datos de usuarios (nombre, email, rol)
- Firebase proyecto: `app-curso-8392a`
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

## Sistema de usuarios (Firebase)

**Autenticación:** Firebase Auth con email/contraseña.  
**Perfiles:** Firestore, colección `users`, documento por UID.

### Roles en Firestore

| Rol | Descripción |
|---|---|
| `pending` | Recién registrado, esperando aprobación del admin |
| `student` | Aprobado, puede acceder al curso |
| `admin` | Acceso completo + panel de administración |

### Flujo de acceso (curso pago)
1. Estudiante paga (MercadoPago externo, fuera de la plataforma)
2. Estudiante se registra → queda con rol `pending`
3. Admin verifica el pago y aprueba desde el panel → rol cambia a `student`
4. Estudiante puede iniciar sesión y ver el curso

### Cuenta admin
Diego Serantes — `diegoserantes94@gmail.com`  
Para crear un nuevo admin: registrarlo en la app → ir a Firestore → cambiar `role` a `"admin"` manualmente.

### App secundaria de Firebase
Se usa `firebase.initializeApp(firebaseConfig, 'secondary')` para que el admin pueda crear cuentas sin perder su propia sesión.

---

## Estructura del JS (dentro de index.html)

### Constantes clave
```js
const REPO = { owner:'diegoserantes94-bit', name:'App_curso', branch:'main', file:'data.json' };
const LOCAL_KEY = 'neurociencia_data_v2';
const auth = firebase.auth();
const db   = firebase.firestore();
```

### Funciones principales
- `doLogin()` — async, verifica Firebase Auth + rol en Firestore (bloquea pending)
- `doRegister()` — async, crea cuenta con rol `pending`, muestra pantalla de éxito
- `doLogout()` — async, cierra sesión en Firebase
- `showMain()` — transición login → curso, carga datos y panel admin
- `loadData()` — carga data.json desde GitHub, fallback a localStorage
- `saveLocal()` — guarda en localStorage
- `buildSidebar()` — construye el menú lateral de módulos
- `renderVideos(moduleId)` — renderiza tarjetas de video
- `playVideo(id)` — abre modal con iframe de YouTube
- `renderMaterials(moduleId)` — renderiza tarjetas de material bibliográfico
- `loadPendingUsers()` — admin: carga solicitudes pendientes con botón Aprobar
- `loadFirestoreUsers()` — admin: carga estudiantes aprobados con botón Eliminar
- `approveUser` — integrado en loadPendingUsers, cambia role a `student`
- `openAddUser()` / `saveNewUser()` — admin crea usuario directamente
- `saveMaterial()` — async, guarda material (upload o URL)
- `uploadFileToGitHub(file, token)` — sube archivo a `materiales/` vía GitHub API
- `doPublish()` — publica data.json a GitHub vía API

---

## Modales (IDs)

| ID | Descripción |
|---|---|
| `modal-video` | Reproductor de video (YouTube iframe) |
| `modal-register` | Registro de nuevos estudiantes |
| `modal-add-video` | Admin: agregar nuevo video |
| `modal-add-material` | Admin: agregar material bibliográfico (upload o URL) |
| `modal-publish` | Admin: publicar cambios a GitHub |
| `modal-add-user` | Admin: crear usuario directamente |

---

## Panel de administrador

Solo visible para usuarios con `role === 'admin'`. Secciones:

**Sidebar — Gestión de contenido:**
- `btn-open-add-video` — agregar video
- `btn-open-add-material` — agregar material
- `btn-open-publish` — publicar cambios a GitHub

**Panel principal — Administración:**
- **Solicitudes pendientes** (`#pending-list`) — estudiantes con rol `pending`, botón Aprobar
- **Estudiantes inscriptos** (`#stu-list`) — estudiantes con rol `student`, botón Eliminar
- **Agregar usuario** (`#btn-add-user`) — el admin crea cuentas directamente

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

1. **Sin onclick en HTML** — todo el JS usa `addEventListener` dentro de `DOMContentLoaded`. Necesario por CSP headers de GitHub Pages que bloquean handlers inline.

2. **Modales con style.display** — `style.display = 'flex'/'none'` directamente, sin transiciones en overlays. Evita bug de freeze durante transición.

3. **data.json como CMS** — el contenido del curso se almacena en `data.json` en el repo. El admin lo edita desde la web y lo publica vía GitHub API.

4. **Firebase compat SDK** — se usa la versión compat (no modular) para compatibilidad con el script tag sin bundler: `firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`.

5. **App secundaria Firebase** — `firebase.initializeApp(firebaseConfig, 'secondary')` permite al admin crear usuarios sin desloguearse.

6. **Hosting migrado de Netlify a GitHub Pages** — para evitar el límite de 300 minutos de build/mes de Netlify.

---

## Reglas de Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Desarrollo local

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\diego\App_curso\server.ps1
```

Luego abrir: http://localhost:3456/

El archivo `server.ps1` es un TcpListener básico que sirve archivos estáticos.
