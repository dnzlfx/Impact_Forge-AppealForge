
## Rol

Eres el ingeniero de frontend del equipo de **AppealForge**, un hackathon de 24 horas. Tu única responsabilidad es el cliente web; el equipo de backend (FastAPI + Python) ya está construyendo su parte en paralelo. No modifiques código de backend salvo que se te pida explícitamente — en vez de eso, deja claro en tus commits/README cualquier supuesto que hiciste sobre su contrato para que ellos lo confirmen.

**Antes de escribir una sola línea de código**, revisa tus skills disponibles (Next.js/Vite, React, Tailwind, testing, git) y actívalas si aplican a este stack. Si tienes una skill de diseño de UI o de generación de componentes, úsala — este producto necesita verse cuidado, no genérico.

## Qué es AppealForge

Una app que ayuda a apelar denegaciones de seguros médicos:

1. El usuario sube **un solo PDF**: la carta de denegación de la aseguradora.
2. El backend extrae el motivo del rechazo y los códigos médicos (CPT / ICD-10).
3. Un modelo (Kimi-K3) redacta la carta de apelación usando RAG sobre guías clínicas oficiales (CMS).
4. Un **segundo modelo, independiente**, audita el borrador y marca cualquier frase que no tenga una cita o prueba real en el expediente del paciente.
5. El usuario revisa la carta con las frases problemáticas resaltadas en rojo (con tooltip explicando por qué) antes de descargarla.

## Stack de frontend

- **Vite + React + TypeScript** (recomendado sobre Next.js: no necesitas SSR ni rutas de servidor — el backend ya es un servicio FastAPI aparte, así que un SPA ligero es más rápido de levantar en el tiempo de hackathon). Si prefieres Next.js de todas formas, usa el App Router en modo full-client (`"use client"`) y no dependas de API routes de Next — el fetch va directo al backend.
- **Tailwind CSS** para estilos.
- Fetch nativo o `axios` para las llamadas HTTP — no agregues React Query u otra librería de estado de servidor salvo que el tiempo lo permita; para un flujo de 3 pasos un `useState`/`useReducer` simple es suficiente.
- Fuentes vía Google Fonts (`Fraunces` para títulos, `IBM Plex Sans` para cuerpo, `IBM Plex Mono` para códigos y metadatos) para mantener el mismo lenguaje visual que ya validamos en el mockup estático del equipo.

## Contrato con el backend (revisar con Backend 1 y 2 antes de dar por final)

El PDF de asignación de roles define dos endpoints. Estos payloads son mi mejor supuesto a partir de ese documento — **confírmalos contra `schemas.py` en cuanto backend lo publique** y ajusta los tipos TypeScript de inmediato si difieren.

### `POST /api/v1/appeal/generate`
Sube el PDF de denegación y devuelve la carta redactada + los códigos extraídos.

```
Request: multipart/form-data
  denial_pdf: File

Response 200:
{
  "case_id": "IF-0417",
  "denial_reason": "string",
  "extracted_codes": [
    { "type": "CPT", "code": "70551", "status": "verified" },
    { "type": "ICD-10", "code": "G43.909", "status": "verified" }
  ],
  "guides_used": 3,
  "appeal_letter": "string — texto completo de la carta, sin marcas"
}
```

### `POST /api/v1/appeal/audit`
Recibe la carta generada y el expediente, devuelve las discrepancias.

```
Request:
{
  "case_id": "IF-0417",
  "appeal_letter": "string"
}

Response 200:
{
  "case_id": "IF-0417",
  "audit_flags": [
    { "phrase": "texto exacto a resaltar dentro de appeal_letter", "reason": "por qué no tiene respaldo" }
  ]
}
```

**Supuesto a validar**: que `phrase` sea un substring exacto de `appeal_letter` (así el frontend puede resaltarlo con un simple `split`/`replace` en vez de necesitar offsets). Si backend prefiere devolver `start`/`end` en caracteres, dilo explícitamente en el PR.

## Flujo de la interfaz — controlado por el sistema, no por el usuario

Esto es una regla de producto, no solo de UI: **la persona nunca navega manualmente entre pantallas**. No debe haber pestañas ni botones "atrás/adelante" entre pasos. Todo avanza solo, como una máquina de estados:

```
idle (esperando PDF)
  → uploading (archivo cargado, botón "Generar apelación" habilitado)
  → processing (POST /generate → luego POST /audit, en secuencia, actualizando 4 sub-pasos visuales)
  → review (resultado final, con las frases auditadas resaltadas)
  → [Empezar de nuevo] → vuelve a idle, limpia todo el estado
```

Modela esto con un `useReducer` o una librería de máquina de estados si el tiempo lo permite (ej. un `type Stage = 'idle' | 'uploading' | 'processing' | 'review' | 'error'`). El único control manual del usuario dentro de "processing" es ninguno — ni cancelar, ni saltar pasos. Si una llamada falla, pasa a un estado `error` con opción de reintentar, nunca deja al usuario "atascado" sin salida.

Los 4 sub-pasos visuales durante `processing` deben mapear así a las llamadas reales:
1. "Leyendo la denegación" — mientras se sube el PDF y corre `POST /generate` (extracción de motivo + códigos)
2. "Consultando guías oficiales (RAG)" — parte del mismo `POST /generate` (no hay endpoint separado; es una animación de la misma espera, no bloquees si el backend no expone progreso granular)
3. "Auditando con modelo independiente" — mientras corre `POST /audit` con la carta ya generada
4. "Preparando visor de revisión" — el breve render final antes de mostrar `review`

## Componentes a construir

- `<DenialUpload />` — dropzone de un solo archivo (click + drag&drop), valida que sea PDF, muestra nombre/tamaño real, deshabilita el botón hasta tener archivo.
- `<ProcessingStepper />` — los 4 pasos con estados `pending | active | done`, barra de progreso y tiempo estimado. Debe ser puramente controlado por props/estado, sin lógica de red adentro.
- `<AppealLetterViewer />` — renderiza `appeal_letter` como párrafos, envuelve cada `audit_flags[].phrase` encontrada en un `<mark>`/`<span>` con estilo de "flag" y un tooltip accesible (teclado + hover) mostrando `reason`.
- `<ExtractedCodesPanel />` — lista de `extracted_codes` con su estado.
- `<AppStateMachine />` (o hook `useAppealFlow()`) — orquesta las tres llamadas y las transiciones de estado descritas arriba.

## Sistema de diseño (paleta ya validada, no la cambies sin avisar)

```css
--deep:   #312c4d;  /* marca principal, headers, botones primarios, paso completado */
--mid:    #53699e;  /* hover de botones, texto secundario */
--accent: #3c90b8;  /* estado activo/en-progreso, links, checks verificados */
--lilac:  #acadd2;  /* bordes y líneas divisorias */
--sky:    #b5cef5;  /* fondos y detalles muy sutiles */
--flag-red: #B23B2E; /* EXCEPCIÓN intencional a la paleta — solo para frases sin respaldo. No la reemplaces por ninguno de los tonos de arriba: es la señal funcional del producto. */
```

Tipografía: `Fraunces` (display, pesos 400–600), `IBM Plex Sans` (cuerpo/UI), `IBM Plex Mono` (códigos, metadatos, timestamps). Bordes casi rectos (`border-radius: 3px`), sin sombras pesadas, un solo elemento con animación de pulso (el paso "activo" del stepper) — evita animaciones decorativas adicionales.

## Estructura de carpetas sugerida

```
src/
  components/
    DenialUpload.tsx
    ProcessingStepper.tsx
    AppealLetterViewer.tsx
    ExtractedCodesPanel.tsx
  hooks/
    useAppealFlow.ts
  lib/
    api.ts          # fetch wrappers para /generate y /audit
    types.ts         # tipos TS del contrato de arriba
  App.tsx
  index.css          # tokens de Tailwind + variables de color
.env.example          # VITE_API_BASE_URL=http://localhost:8000
```

## Variables de entorno

```
VITE_API_BASE_URL=http://localhost:8000
```

No hardcodees la URL del backend en ningún componente — todo pasa por `lib/api.ts`.

## Criterios de aceptación

- [ ] No existe ningún control de navegación manual entre pantallas — verificar con teclado y mouse.
- [ ] El botón "Generar apelación" está deshabilitado sin archivo cargado.
- [ ] Si `POST /generate` o `POST /audit` fallan, la persona ve un estado de error claro y puede reintentar sin perder el archivo subido.
- [ ] Cada `audit_flags[].phrase` resaltada tiene un tooltip accesible por teclado (`tabindex` + `:focus`), no solo por hover.
- [ ] Responsive hasta ~375px de ancho.
- [ ] El botón "Descargar" produce un archivo real (aunque sea `.txt` si no hay generación de PDF del lado del cliente todavía).
- [ ] `npm run build` corre sin errores de TypeScript antes de hacer commit.

## Notas para coordinarte con backend

Deja estas preguntas visibles en el README o en un PR draft en cuanto arranques, para que Backend 1/2 las respondan sin bloquear tu avance (usa datos mockeados mientras tanto):

1. ¿`audit_flags[].phrase` es substring exacto o vienen offsets?
2. ¿`POST /generate` es síncrono o hay que hacer polling/websocket para RAG + generación larga?
3. ¿CORS ya está habilitado en FastAPI para `localhost:5173`?
4. ¿Hay un endpoint de salud (`/health`) para mostrar un estado de "backend no disponible" en vez de un error genérico?