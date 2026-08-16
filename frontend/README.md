# AppealForge — Frontend (Vite + React + TypeScript + Tailwind)

Cliente web de **AppealForge**: sube la carta de denegación de la aseguradora
(un PDF), y el sistema redacta la apelación con respaldo en guías de CMS y la
audita con un modelo independiente antes de que la revises.

Este frontend se construyó contra el **contrato real del backend** (rama
`develop`), no contra el borrador de instrucciones — ver "Contracto real" abajo.

## Requisitos

- Node.js 18+ (probado con Node 24)
- El backend corriendo en `http://localhost:8000` (opcional en desarrollo)

## Puesta en marcha

```bash
cd frontend
npm install
cp .env.example .env   # ajusta VITE_API_BASE_URL si hace falta
npm run dev            # http://localhost:5173
```

Build de producción y control de calidad:

```bash
npm run build   # tsc -b + vite build (sin errores TS antes de commit)
npm run lint    # oxlint
```

## Flujo de la UI (máquina de estados)

`idle → uploading → processing → review | error → (reset) → idle`

No existe navegación manual entre pantallas: todo avanza solo salvo las dos
acciones del usuario: **Generar apelación** y **Empezar de nuevo**. Durante
`processing` se animan 4 sub-pasos visuales en paralelo a la/las llamadas reales.

## Contrato real del backend (fuente de verdad)

Definido en `backend/app/schemas/appeal.py` y `backend/app/api/v1/appeal.py`
(tipos duplicados en `src/lib/types.ts`):

- `POST /api/v1/appeal/generate-from-files` — multipart:
  - `denial_file: File` (obligatorio)
  - `medical_record_file: File` (opcional — solo audita si llega)
  - `patient_name`, `insurer_name`, `additional_notes` (opcionales)
- Respuesta (`AppealResponse`): `appeal_text`, `codes_detected: {cpt[], icd10[]}`,
  `rag_citations: [{source, text}]`, `audit_flags: [{claim_text, issue_type, severity, explanation}]`,
  `status`.
- `GET /health` — estado del backend.
- CORS ya habilitado para `http://localhost:5173`.

La **auditoría es inline** en `/generate-from-files`; **no existe endpoint
`/audit` separado**. El paso 3 del stepper ("Auditando…") se completa cuando
llegan los `audit_flags` dentro de la misma respuesta.

## Supuestos que Backend 1/2 debe confirmar

Preguntas que quedan abiertas (no bloquean el desarrollo; en desarrollo se usa
mock si no responde el backend):

1. **`audit_flags[].claim_text`**: asumimos que es substring exacto de
   `appeal_text` (el frontend lo resalta con una búsqueda case-insensitive;
   no usamos offsets). Si prefieren devolver `start`/`end`, avisadlo.
2. **`generate-from-files` es síncrono**: asumimos que una sola respuesta
   devuelve todo (incluida la auditoría). Si va a tardar >30 s considerad
   polling o websockets; el stepper ya está listo para acoplarse.
3. **`medical_record_file` opcional**: la auditoría solo corre cuando el
   backend recibe expediente. Si se envía solo la denegación, no habrá flags
   ("Sin marcas de auditoría").
4. **CORS / health**: ya está cubierto para `localhost:5173` y existe
   `/health`, pero si los puertos cambian avisadnos.

## URL del backend

- Nada de URLs hardcodeadas en componentes. Toda petición pasa por
  `src/lib/api.ts` usando `VITE_API_BASE_URL` (por defecto
  `http://localhost:8000`).
- `VITE_MOCK_FALLBACK=true` (por defecto): si el backend no responde, la UI
  cae a datos de ejemplo para poder probar el flujo completo sin servidor.

## Estructura

```
src/
  components/
    DenialUpload.tsx        # dropzone 1 PDF + expediente opcional + metadatos
    ProcessingStepper.tsx   # stepper de 4 pasos, controlado por props
    AppealLetterViewer.tsx  # carta + flags con tooltip accesible (hover+teclado)
    ExtractedCodesPanel.tsx # códigos CPT / ICD-10 con estado
  hooks/
    useAppealFlow.ts        # máquina de estados (useReducer)
  lib/
    api.ts                  # fetch wrappers + fallback mock
    types.ts                # copia TS del contrato del backend
    steps.ts                # definición de los 4 sub-pasos
    highlight.ts            # split de la carta por claim_text (testable)
  App.tsx
  index.css                 # tokens Tailwind + paleta validada
.env.example
```