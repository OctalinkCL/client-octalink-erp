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

### 3. `use<Modulo>.ts` — con TanStack Query

El composable envuelve `useQuery` (lista) + `useMutation` (acciones). Referencia:
[`useClientes.ts`](../src/modules/clientes/useClientes.ts).

- `const KEY = ['<modulo>'] as const`.
- `useQuery({ queryKey: KEY, queryFn: listar<Modulo>s })`.
- Expone: `items = computed(() => query.data.value ?? [])`,
  `loading = computed(() => query.isPending.value)`,
  `error = computed(() => query.error.value ? '<mensaje>' : '')`,
  `busqueda` (ref local), `itemsFiltrados` (computed).
- **Mutaciones**: `useMutation({ mutationFn, onSuccess: invalidar })`. `invalidar`
  hace `qc.invalidateQueries({ queryKey: KEY })` **más las keys afectadas**
  (`['dashboard']` casi siempre; `['cotizaciones']` si tocás el flag `ot_generada`,
  `['ots']` si tocás `cobro_generado`, `['cobros-mes']` al generar cobro de suscripción).
- **Delete optimista**: `onMutate` cancela la query, guarda `prev`, quita la fila
  del cache (`setQueryData`); `onError` restaura `prev`; `onSettled` invalida.
- El composable devuelve funciones que llaman `mutateAsync(...)`, con la **misma
  firma** que antes (`crear(input)`, `actualizar(id, input)`, `eliminar(id)`), para
  que las vistas no cambien.
- `obtener(id)` NO es query: pasa derecho al service (lo usa el form de edición).
- Las vistas **no** llaman `onMounted(cargar)` — la query carga sola al montar.
  `cargar` (= `query.refetch`) solo se expone para un botón "Actualizar".

Defaults del `QueryClient` (en `main.ts`): `staleTime` 60s,
`refetchOnWindowFocus: false`.

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
- **Relaciones = back-references opcionales.** Una entidad guarda punteros a su
  origen directo (`ot_id`, `cotizacion_id`, `suscripcion_id`, …), siempre
  opcionales (`''` / `null`). El relato completo se recorre en la vista de
  detalle; no se denormaliza la cadena entera. Ver `cobros` en
  [`src/modules/cobranza/types.ts`](../src/modules/cobranza/types.ts).
- **Acciones entre módulos** van en el composable del módulo dueño de la entidad
  que se crea: `useOts().generarDesdeCotizacion(c)`,
  `useCobranza().generarDesdeOt(ot)`. La vista importa el composable, nunca el service ajeno.
- **Excepción: agregadores de solo lectura** (el Dashboard). `useDashboard` cruza
  varias colecciones; para las acciones reusa los composables dueños. Su
  `dashboard.service.ts` no lee colecciones enteras: hace queries de **campo
  único** acotadas a lo accionable (`where('estado_pago','in',[...])`,
  `where('fecha_pago','>=',inicioDeMes)`, etc.), sin índices compuestos, para que
  el costo no crezca con el histórico. Ver [`src/modules/dashboard/`](../src/modules/dashboard).
- **Flags denormalizados para "X sin Y".** Para no leer todos los hijos y cruzar,
  el padre guarda un booleano: `cotizacion.ot_generada`, `ot.cobro_generado`. Se
  pone `true` en `crearYDesde…` (idempotente, también si `yaExistia`) y se
  vuelve `false` al `eliminar…` el hijo. El formulario nunca lo edita (va fuera
  del `Input` type).
- **Dependencias pesadas** (pdfmake ~815 kB gzip): `import()` dinámico dentro del
  handler, no import estático. Ver `pdf()` en `CobranzaView.vue`.

## Checklist

- [ ] `types.ts` con `X`, `XInput`, `xInputVacio()`
- [ ] `service.ts` sin Vue, timestamps con `serverTimestamp()`
- [ ] `use<Modulo>.ts` con `loading` / `error` / `busqueda` / `cargar`
- [ ] Form: `FormDialog` (simple) o `FormView` con ruta propia (grande), pura UI
- [ ] `View` conecta todo, maneja errores visibles
- [ ] ruta(s) en `panel.routes.ts` + link en `PanelLayout.vue`
- [ ] `pnpm build` pasa
