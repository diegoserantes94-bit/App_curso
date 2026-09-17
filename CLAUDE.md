# CLAUDE.md — Contexto del proyecto App_curso / Academia Memento

> Este archivo es el contexto de continuidad del proyecto. Si estás retomando esto en una
> computadora nueva (por pérdida, robo o rotura de la anterior), leé esto completo antes de
> tocar nada — reemplaza cualquier memoria local que se haya perdido. Última actualización:
> **2026-09-17**.

---

## 0. Si estás arrancando de cero en una compu nueva

1. Cloná el repo: `git clone https://github.com/diegoserantes94-bit/App_curso.git`
2. Leé este archivo entero.
3. Confirmá el estado real del sitio en vivo antes de asumir nada de acá (puede haber cambiado):
   `https://academiamemento.com/` (landing) y `https://academiamemento.com/app.html` (la app).
4. Las credenciales (Firebase, dominio, GitHub) NO están en este archivo ni en el repo —
   viven en la cabeza de Diego / sus gestores de contraseñas. Este archivo es solo de
   **arquitectura y decisiones**, no de secretos.
5. El repo es **público** — nunca escribas acá datos personales sensibles, sean legales,
   de salud o similares. Si hay una instrucción de contenido delicada, se documenta como
   regla práctica sin el porqué (ver sección 10).

---

## 1. Identidad del proyecto

- **Nombre**: Academia Memento — "Recuerda tu potencial"
- **Qué es**: curso paralelo online de Neurociencia (UC10/ciclo BCC3) para estudiantes de
  la Facultad de Medicina, UdelaR — no afiliado oficialmente a la universidad, es un
  emprendimiento privado de Diego Serantes.
- **URL pública**: https://academiamemento.com (dominio propio comprado en Namecheap, DNS
  apunta a GitHub Pages vía `CNAME`)
- **Repo**: https://github.com/diegoserantes94-bit/App_curso (**público**)
- **Rama de trabajo**: `main` (ver sección 8 para el resto de las ramas)
- **Dueño**: Diego Serantes — diegoserantes94@gmail.com (cuenta personal / login admin de
  Firebase). El contacto público que figura en la web es **academiamemento@gmail.com**
  (son cuentas distintas a propósito, no confundir).

---

## 2. Estructura del sitio (LO MÁS IMPORTANTE — no confundir)

El sitio son **dos páginas HTML separadas**, cada una con un propósito distinto:

| Archivo | Qué es | Detalle |
|---|---|---|
| **`index.html`** | **Landing pública de marketing** | Lo que ve Google y cualquier visitante en `academiamemento.com/`. Sin Firebase, sin login. Optimizada para SEO/GEO (ver sección 6). Botón "Acceso alumnos" lleva a `app.html`. |
| **`app.html`** | **La aplicación real** | Login, registro, curso (videos, materiales, quiz, foro de consultas), panel de administrador. Vive en `academiamemento.com/app.html`. Tiene `<meta name="robots" content="noindex, follow">` para que Google indexe la landing y no esta página. |

Esto **no fue siempre así**: originalmente todo vivía en `index.html` (login + curso, sin
landing). En julio 2026 se separó: se creó la landing nueva en `index.html` y la app vieja
se renombró a `app.html`. Si en algún momento ves documentación o memoria vieja que dice
"todo está en index.html", está desactualizada.

---

## 3. Stack técnico

- HTML + CSS + JS vanilla (sin frameworks, sin bundler)
- Fuente: Inter (Google Fonts)
- **Firebase Authentication** — login con email/contraseña (solo en `app.html`)
- **Firebase Firestore** — usuarios y foro de consultas (ver sección 5)
- Firebase proyecto: `app-curso-8392a`
- **Vimeo** (plan Starter, "Domain-level privacy") — hosting de los videos del curso
- **GitHub Pages** — hosting del sitio estático (gratis, por eso se migró desde Netlify)
- **GitHub API** (PUT /repos/.../contents/) — el panel admin publica `data.json` y sube
  materiales directamente desde el navegador, sin backend propio
- Contenido dinámico del curso: `data.json` en el repo (videos, materiales, texto de la
  página principal, fecha de inicio del curso)
- PWA: `manifest.json` + `sw.js`, instalable en el celular, `start_url` apunta a `app.html`

---

## 4. Archivos importantes

| Archivo | Descripción |
|---|---|
| `index.html` | Landing pública de marketing |
| `app.html` | La aplicación: login, curso, admin |
| `data.json` | Contenido dinámico: videos, materiales, texto editable de la home, `courseStartDate` |
| `manifest.json` / `sw.js` | PWA — instalación en celular, caché offline |
| `robots.txt` / `sitemap.xml` | SEO — permiten explícitamente bots de IA (GPTBot, PerplexityBot, ClaudeBot, etc.) |
| `.nojekyll` | Evita que GitHub Pages procese el sitio con Jekyll (causaba fallos de deploy intermitentes) |
| `CNAME` | Dominio propio para GitHub Pages (`academiamemento.com`) |
| `logo-memento.jpg` | Logo en fondo blanco, usado en cajitas sobre fondos navy |
| `icon-512.png` | Logo completo en alta resolución (símbolo + "MEMENTO" + lema) |
| `diego-serantes.jpg` | Foto real del docente, sección "Quién lo dicta" de la landing |
| `logo-fmed.png`, `cerebro-byn.png` | Assets viejos, ya casi no se usan en la UI actual |
| `materiales/` | PDFs subidos por el admin vía GitHub API |
| `server.ps1` | Servidor HTTP local para desarrollo, puerto 3456 (ver sección 11 — tiene una limitación conocida) |
| `memento nodos.svg` *(sin trackear en git)* | Logo vectorizado por Diego en Inkscape — ver sección 9, integración pendiente |

---

## 5. Sistema de usuarios y datos (Firebase)

- Proyecto Firebase: `app-curso-8392a`
- Colección `users`: `uid → { name, email, role, sessionToken }`
- Colección `consultas` (foro): `{ text, moduleId, authorUid, authorName, anonymous, voters[], createdAt }`
- Roles: `pending` (recién registrado, esperando aprobación) → `student` (aprobado) → `admin`
- Cuenta admin: diegoserantes94@gmail.com (para dar de alta otro admin: registrarlo en la
  app y cambiarle `role` a `"admin"` manualmente desde la consola de Firestore)
- App secundaria de Firebase (`firebase.initializeApp(firebaseConfig, 'secondary')`) para
  que el admin pueda crear cuentas de estudiantes sin perder su propia sesión

### Reglas de Firestore — versión actual (endurecidas, julio 2026)

Estas reemplazaron una regla vieja demasiado abierta que permitía que cualquier usuario
autenticado se autoasignara `role: 'admin'`. Este es el texto que debería estar pegado en
Firebase Console → Firestore Database → Reglas (verificar que siga así, por si alguien lo
tocó):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }
    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();

      allow create: if (isOwner(userId) && request.resource.data.role == 'pending')
        || isAdmin();

      allow update: if isAdmin()
        || (isOwner(userId)
            && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['sessionToken']));

      allow delete: if isAdmin();
    }

    match /consultas/{consultaId} {
      allow read: if isSignedIn();

      allow create: if isSignedIn()
        && request.resource.data.authorUid == request.auth.uid;

      allow update: if isSignedIn()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['voters']);

      allow delete: if isSignedIn()
        && (resource.data.authorUid == request.auth.uid || isAdmin());
    }
  }
}
```

Lógica: nadie puede autoasignarse `admin`; cada quien solo puede tocar su propio
`sessionToken` (para la sesión única); en el foro, cualquiera vota (campo `voters`) pero
solo el autor o un admin borra una consulta.

### Flujo de acceso (curso pago)
1. Estudiante paga por fuera de la plataforma (transferencia bancaria o MercadoPago hasta
   12 cuotas — se coordina por WhatsApp/email, no hay pasarela de pago integrada)
2. Estudiante se registra en el sitio → queda con rol `pending`
3. Admin confirma el pago y aprueba desde el panel → rol pasa a `student`
4. Estudiante ya puede iniciar sesión y ver el curso

### GitHub token (para publicar contenido)
El panel admin pide un GitHub Personal Access Token (scope `repo`) para poder subir
`data.json` y archivos de `materiales/` directamente desde el navegador. Se guarda en
`localStorage` con la clave `gh_token`. Se obtiene en
`https://github.com/settings/tokens/new`. **Nunca hay un token real guardado en el
repo** — cada quien genera el suyo.

---

## 6. Funcionalidades implementadas (todas en `app.html`, LIVE en `main`)

1. **Login / Registro** — Firebase Auth. Registro deja al usuario en `pending`.
2. **Sesión única por cuenta** — token en Firestore, polling cada 45s; si alguien más
   inicia sesión con la misma cuenta, se desconecta la sesión anterior.
3. **Panel admin** — aprobar/eliminar usuarios, agregar videos (Vimeo), agregar
   materiales (subida de archivo o URL externa), publicar cambios a GitHub.
4. **Videos vía Vimeo** — domain-level privacy (solo se reproducen embebidos en este
   dominio), miniaturas automáticas vía oEmbed API.
5. **Bloqueo temporal de videos** — `courseStartDate` en `data.json`. Antes de esa fecha
   los estudiantes ven un candado; el admin siempre ve todo. Se edita desde "Editar
   página principal" en el panel admin. **Nota: al 2026-09-17 esta fecha sigue en
   `2026-07-27` (ya pasada), o sea el candado ya está desactivado para todos — revisar
   si hace falta actualizarla para una futura edición del curso.**
6. **Página Principal** — bienvenida personalizada, sección "Información General"
   (texto de bienvenida, criterios de evaluación, recordatorios) editable por el admin,
   tarjetas de acceso rápido a los módulos.
7. **Diseño responsivo** — sidebar tipo drawer en móvil con botón hamburguesa.
8. **Navegación con botón "atrás" del navegador** (History API) — `selectModule` hace
   `history.pushState`, un listener de `popstate` restaura la vista anterior en vez de
   sacar al usuario de la app. Al abrir un video también hace pushState, y "atrás" (o la
   X, o clic afuera, o Escape) lo cierra.
9. **Consultas (foro)** — sección para que los estudiantes dejen dudas (máx. 1000
   caracteres) por módulo, de cara a las clases de consulta semanales. Opción de
   preguntar anónimo (el admin ve el nombre real). Votación por duda, ordenadas por más
   votadas. Tiempo real vía `onSnapshot` de Firestore.
10. **Landing pública** (`index.html`) — SEO/GEO completo: metadatos con keywords, Open
    Graph, JSON-LD (`EducationalOrganization` + `Course` + `FAQPage`), FAQ, sección
    "Quién lo dicta" (ver nota de contenido en sección 10), botón flotante y CTAs de
    WhatsApp real, CTA a `app.html`.
11. **Seguridad — sanitización de HTML** — todo el contenido dinámico que se inserta vía
    `innerHTML` (nombres de usuario, textos editables del admin, títulos de videos/
    materiales, preguntas del quiz) pasa por una función `escapeHtml()` para prevenir
    XSS. Se agregó en julio 2026 tras encontrar y corregir una vulnerabilidad real (ver
    sección 7).

---

## 7. Historial de seguridad (ya resuelto, dejar como referencia)

En julio 2026 se hizo una auditoría y se encontraron y corrigieron dos problemas serios,
ambos ya arreglados y en producción desde entonces:

1. **XSS almacenado**: el nombre ingresado al registrarse se mostraba sin escapar en el
   panel admin, permitiendo que alguien se registrara con un "nombre" malicioso que
   ejecutara JS en el navegador del admin (y de ahí robara el `gh_token` de
   localStorage). Arreglado agregando `escapeHtml()` en todos los puntos de inserción.
2. **Reglas de Firestore abiertas**: la regla original (`allow read, write: if
   request.auth != null`) dejaba que cualquier usuario autenticado se autoasignara
   `role: 'admin'`. Reemplazada por las reglas de la sección 5.

---

## 8. Ramas de git

- **`main`** — producción, todo lo de este documento está acá.
- **`feature/landing-seo`** — ya fusionada a `main`, se puede dejar como historial.
- **`feature/quiz`** — **NO fusionada a propósito**. Contiene un Quiz estilo TikTok
  (~140 preguntas de los módulos 1 y 2) que Diego dejó apartado porque "no funcionaba
  muy bien", más una versión vieja/divergente de la PWA y de Consultas ya superada por
  lo que hay en `main`. Si se retoma, revisar con cuidado antes de fusionar (puede
  generar conflictos, sobre todo en Consultas).
- **`firebase-auth`** — rama vieja del trabajo inicial de autenticación, sin uso.

---

## 9. Pendientes / temas abiertos

- **Logo vectorial**: Diego vectorizó el logo completo en Inkscape (símbolo + texto en
  un solo trazado) y lo guardó como `memento nodos.svg` en la raíz del repo (sin
  trackear en git todavía). Había una idea en evaluación: en la tarjeta del hero de la
  landing, sacar la cajita blanca y poner el logo más grande directo sobre el fondo
  navy — se probaron variantes de color (blanco sólido 100% recomendado; blanco al 12%
  de opacidad tipo marca de agua, pero el texto se lee mal). Quedó en pausa, sin decidir.
- **Precio del curso**: al 15/07/2026 el precio era $5.500 regular, con un descuento de
  lanzamiento del 20% ($4.400) válido hasta el 25/07/2026. Esa promo ya venció — no
  asumir que ese precio sigue vigente sin confirmar con Diego.
- **Instagram / testimonios**: posible agregar a la landing más adelante, no inventar
  datos.
- **Archivos sin trackear en el repo** (existen localmente pero no están en git, o sea
  no se publican): `memento nodos.svg` y sus variantes de prueba, `cerebro.png`,
  `test-imagenes.html`, `.claude/`. No es necesario limpiarlos, pero tenerlo presente.

---

## 10. Nota de contenido — restricción deliberada (no revertir sin que Diego lo pida)

La sección "Quién lo dicta" de la landing y el resto del sitio **no deben mencionar
ninguna afiliación institucional de Diego** (ni UdelaR ni CENUR, ni cargo docente, ni
años de antigüedad). Solo debe figurar su formación académica personal: **Licenciado en
Biología Humana, doctorando en Neurociencias**. Tampoco debe haber links a su CV de
CVuy/ANII ni a sus publicaciones científicas — se removieron deliberadamente.

Esta es una instrucción explícita de Diego (julio 2026). **No restaurar estas menciones
ni agregar afiliaciones institucionales nuevas, aunque parezcan útiles para SEO,
aunque no se sepa el motivo exacto — es una decisión suya, respetarla sin indagar.**

(Sigue abierta la duda de si esto también aplica a menciones de UdelaR/CENUR que hablan
de a qué **estudiantes** les sirve el curso, no del cargo de Diego — por ejemplo "para
estudiantes de FMED, UdelaR". Esas quedaron sin tocar la última vez. Confirmar con Diego
si corresponde.)

---

## 11. Desarrollo local

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\diego\App_curso\server.ps1
```

Después abrir: http://localhost:3456/

`server.ps1` es un servidor HTTP básico (TcpListener, de un solo hilo). **Limitación
conocida**: a veces "pierde" pedidos cuando la página pide varias imágenes al mismo
tiempo (por ejemplo, el logo se puede ver roto). Si hace falta algo más robusto, se
puede armar un servidor con `System.Net.HttpListener` en PowerShell (multihilo, sin esa
limitación) — no está guardado en el repo, pero es rápido de rehacer si hace falta.

---

## 12. Colores / diseño

| Variable | Valor | Uso |
|---|---|---|
| Navy oscuro | `#1E3A5F` | Sidebar, headers, fondos oscuros |
| Azul medio | `#2E5C9E` | Botones, acentos |
| Fondo | `#FFFFFF` | Contenido principal |
| Fondo tarjetas | `#F4F6F9` | Cards de video/material |

Fuente: Inter. Estilo sobrio académico-médico.

---

## 13. Decisiones técnicas importantes

1. **Sin `onclick` en HTML** — todo el JS usa `addEventListener` dentro de
   `DOMContentLoaded` (necesario por los headers CSP de GitHub Pages).
2. **Modales con `style.display`** — flex/none directo, sin transiciones (evita un bug
   de freeze visual).
3. **`data.json` como CMS** — el admin lo edita desde la web y lo publica vía GitHub
   API, sin backend propio.
4. **Firebase SDK compat** (no modular) — compatible con script tags sin bundler.
5. **Hosting migrado de Netlify a GitHub Pages** — para evitar el límite de 300 minutos
   de build/mes de Netlify.
