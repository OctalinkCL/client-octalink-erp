# Cómo se crea un módulo

Patrón usado en este proyecto. Referencia viva: [`src/modules/clientes/`](../src/modules/clientes).

## Filosofía: 3 capas

```
service   →  solo Firestore. Sin Vue. Funciones que devuelven datos/promesas.
composable →  estado reactivo (ref/computed) + acciones. Envuelve el service.
.vue      →  solo UI. Llama al composable. NUNCA importa firebase/firestore.
```

Regla de oro: si ves `import ... from 'firebase/firestore'` en un `.vue`, está mal.

## Estructura de carpeta

```
src/modules/<modulo>/
  types.ts                 # interface del documento + <X>Input + <x>InputVacio()
  <modulo>.service.ts      # listar / obtener / crear / actualizar / eliminar
  use<Modulo>.ts           # composable: lista, loading, error, busqueda + acciones
  <Modulo>View.vue         # pantalla: tabla + buscador + botón "Nuevo"
  <Modulo>FormDialog.vue   # dialog crear/editar
```

## Paso a paso

### 1. `types.ts`

- `interface X` = forma del doc en Firestore, incluye `id: string` y
  `creado_en: Timestamp | null`, `actualizado_en: Timestamp | null`.
- `type XInput = Omit<X, 'id' | 'creado_en' | 'actualizado_en'>` = lo que edita el form.
- `function xInputVacio(): XInput` = valores por defecto (strings vacíos, `0`, etc.).

### 2. `<modulo>.service.ts`

- `const <modulo>Col = collection(db, '<coleccion>')`.
- `listar<Modulo>s()` → `getDocs(query(col, orderBy('<campo>')))`, mapea
  `{ id: d.id, ...d.data() }`.
- `crear<Modulo>(input)` → `addDoc` con `creado_en` y `actualizado_en` =
  `serverTimestamp()`. Devuelve el id.
- `actualizar<Modulo>(id, input)` → `updateDoc` con `actualizado_en = serverTimestamp()`.
- `eliminar<Modulo>(id)` → `deleteDoc`.
- Sin `try/catch` acá: los errores suben al composable.

### 3. `use<Modulo>.ts`

- Estado: `items` (`ref<X[]>([])`), `loading`, `error`, `busqueda`.
- `itemsFiltrados` = `computed` que filtra por `busqueda` sobre los campos de texto.
- `cargar()` → setea `loading`, llama al service, captura error en `error.value` +
  `console.error(e)`, baja `loading` en `finally`.
- `crear/actualizar/eliminar` → llaman al service y luego `await cargar()`
  (refresco simple; `onSnapshot` es un upgrade posterior si hace falta).

### 4. `<Modulo>FormDialog.vue`

- Props: `open: boolean`, `item: X | null`, `saving: boolean`.
- Emits: `update:open`, `save: [input: XInput]`.
- `reactive<XInput>(xInputVacio())`; `watch(() => props.open)` → al abrir,
  precarga (`props.item`) o limpia.
- Submit hace `emit('save', { ...form })`. El dialog NO guarda ni cierra:
  eso lo decide la vista.

### 5. `<Modulo>View.vue`

- Usa `use<Modulo>()`, `onMounted(cargar)`.
- Estado local: `dialogAbierto`, `itemEditando: X | null`, `guardando`.
- `guardar(input)` → según `itemEditando` llama `actualizar` o `crear`,
  cierra el dialog, maneja error con `window.alert`.
- `borrar(item)` → `window.confirm` y `eliminar`.
- Tabla con shadcn `Table*`, filas de `loading` / vacío / datos.

### 6. Enchufar

- Ruta en [`src/router/routes/panel.routes.ts`](../src/router/routes/panel.routes.ts)
  como `child` (hereda `meta.requiresAuth`):
  ```ts
  { path: '<modulo>', name: '<modulo>', component: () => import('@/modules/<modulo>/<Modulo>View.vue') }
  ```
- Link en el `nav` de [`src/layouts/PanelLayout.vue`](../src/layouts/PanelLayout.vue).
- `pnpm build` para type-check + bundle.

## Variante: formularios grandes → `FormView` con ruta propia

Cuando el form tiene filas dinámicas, selects con datos de otros módulos o mucho
campo (ej. **cotizaciones**), en vez de `FormDialog` se usa una página:

- `<Modulo>FormView.vue` en rutas `<modulo>/nueva` (`name: '<modulo>-nueva'`) y
  `<modulo>/:id` (`name: '<modulo>-editar'`), ambas al mismo componente.
- `const id = computed(() => route.params.id as string || '')`,
  `esEdicion = computed(() => !!id.value)`.
- En `onMounted`: cargar datos que dependa (clientes, etc.) y, si `esEdicion`,
  `obtener(id)` para precargar el `form`.
- Reusar diálogos de otros módulos tal cual: `CotizacionFormView` importa
  `@/modules/clientes/ClienteFormDialog.vue` para crear un cliente al vuelo.
- `guardar()` valida, arma el `payload`, llama `crear`/`actualizar` y
  `router.push({ name: '<modulo>' })`.

Referencia: [`src/modules/cotizaciones/`](../src/modules/cotizaciones).

## Correlativos y configuración (`settings`)

- Los números correlativos van en la colección **`settings`**, un doc por tema:
  `settings/cotizaciones` → `{ siguiente_numero: number }`.
- Asignar el número **dentro de una transacción** (`runTransaction`): leer el
  contador, usar ese valor, subirlo a `+1`, y escribir el doc nuevo — todo
  atómico. Así un doble-click no duplica ni salta números. Ver
  `crearCotizacion` en `cotizaciones.service.ts`.
- El valor de arranque se edita desde
  [`src/modules/configuracion/`](../src/modules/configuracion) (`/configuracion`),
  que hace un `getDoc`/`setDoc` simple sobre el mismo doc.

## Convenciones

- **Idioma:** nombres de campos, funciones y variables en español (`crear`, `busqueda`, `fecha_pago`).
- **Dinero:** enteros en CLP, nunca `float`.
- **Fechas:** `serverTimestamp()` al escribir; en el tipo son `Timestamp | null`.
- **shadcn-vue:** agregar componentes con `pnpm dlx shadcn-vue@latest add <x>`, no a mano.
- **Sin store (Pinia)** salvo estado global real. Un módulo = un composable.

## Checklist

- [ ] `types.ts` con `X`, `XInput`, `xInputVacio()`
- [ ] `service.ts` sin Vue, timestamps con `serverTimestamp()`
- [ ] `use<Modulo>.ts` con `loading` / `error` / `busqueda` / `cargar`
- [ ] Form: `FormDialog` (simple) o `FormView` con ruta propia (grande), pura UI
- [ ] `View` conecta todo, maneja errores visibles
- [ ] ruta(s) en `panel.routes.ts` + link en `PanelLayout.vue`
- [ ] `pnpm build` pasa
