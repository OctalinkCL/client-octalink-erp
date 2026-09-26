<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PencilIcon } from '@lucide/vue'
import Loading from '@/components/Loading.vue'
import { useModoFicha } from '@/composables/useModoFicha'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatoCLP } from '@/lib/formato'
import ClienteFormDialog from '@/modules/clientes/ClienteFormDialog.vue'
import { useClientes } from '@/modules/clientes/useClientes'
import type { ClienteInput } from '@/modules/clientes/types'
import { useCobranza } from '@/modules/cobranza/useCobranza'
import { useCotizaciones } from '@/modules/cotizaciones/useCotizaciones'
import { useOts } from './useOts'
import {
  CLASE_ESTADO_OT,
  ESTADOS_OT,
  LABEL_ESTADO_OT,
  otInputVacio,
  type EstadoOt,
  type Ot,
  type OtInput,
} from './types'

const NINGUNA = '__ninguna__'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, crear: crearCliente } = useClientes()
const { cotizaciones } = useCotizaciones()
const { obtener, crear, actualizar, cambiarEstado } = useOts()
const { generarDesdeOt } = useCobranza()

const form = reactive<OtInput>(otInputVacio())
const cargando = ref(false)
const guardando = ref(false)
const guardandoEstado = ref(false)

// Existente: parte en la ficha y "Editar" habilita los datos. El estado se
// guarda al instante desde la columna lateral.
const { editando, empezarEdicion, cancelarEdicion: restaurarDatos } = useModoFicha(
  form,
  ['cliente_id', 'cliente_nombre', 'cotizacion_id', 'cotizacion_numero', 'descripcion', 'monto', 'emite_boleta', 'notas'],
  !esEdicion.value,
)
const error = ref('')
// OT tal como está guardada: el cobro se genera a partir de ella.
const original = ref<Ot | null>(null)
const abriendoCobro = ref(false)

const dialogClienteAbierto = ref(false)
const guardandoCliente = ref(false)

// Cotizaciones del cliente elegido que aún no tienen OT, más la ya asociada.
const cotizacionesDisponibles = computed(() =>
  cotizaciones.value
    .filter(
      (q) =>
        q.cliente_id === form.cliente_id &&
        (!q.ot_generada || q.id === form.cotizacion_id),
    )
    .sort((a, b) => b.numero - a.numero),
)

onMounted(async () => {
  cargando.value = true
  try {
    if (esEdicion.value) {
      const o = await obtener(id.value)
      if (!o) {
        error.value = 'OT no encontrada.'
        return
      }
      original.value = o
      Object.assign(form, {
        cliente_id: o.cliente_id,
        cliente_nombre: o.cliente_nombre,
        cotizacion_id: o.cotizacion_id,
        cotizacion_numero: o.cotizacion_numero,
        descripcion: o.descripcion,
        monto: o.monto,
        emite_boleta: o.emite_boleta,
        estado: o.estado,
        notas: o.notas,
      })
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo cargar.'
  } finally {
    cargando.value = false
  }
})

function volver() {
  router.push({ name: 'ots' })
}

function cancelarEdicion() {
  if (!esEdicion.value) return volver()
  restaurarDatos()
  error.value = ''
}

async function onEstado(valor: unknown) {
  const estado = String(valor) as EstadoOt
  const prev = form.estado
  if (estado === prev) return
  form.estado = estado
  if (!esEdicion.value) return
  guardandoEstado.value = true
  try {
    await cambiarEstado(id.value, estado)
    if (original.value) original.value = { ...original.value, estado }
  } catch (e) {
    console.error(e)
    form.estado = prev
    window.alert('No se pudo cambiar el estado.')
  } finally {
    guardandoEstado.value = false
  }
}

// Genera el cobro (o abre el existente: generarDesdeOt es idempotente) y navega a él.
async function irACobro() {
  const o = original.value
  if (!o) return
  if (!o.cobro_generado && !window.confirm(`¿Generar cobro desde la OT N°${o.numero}?`)) return
  abriendoCobro.value = true
  try {
    const { id: cobroId } = await generarDesdeOt(o)
    router.push({ name: 'cobro-editar', params: { id: cobroId } })
  } catch (e) {
    console.error(e)
    window.alert('No se pudo abrir el cobro.')
  } finally {
    abriendoCobro.value = false
  }
}

function seleccionarCliente(clienteId: string) {
  const c = clientes.value.find((x) => x.id === clienteId)
  form.cliente_id = clienteId
  form.cliente_nombre = c?.nombre ?? ''
  // Si la cotización asociada era de otro cliente, se limpia.
  const q = cotizaciones.value.find((x) => x.id === form.cotizacion_id)
  if (q && q.cliente_id !== clienteId) {
    form.cotizacion_id = ''
    form.cotizacion_numero = null
  }
}

function seleccionarCotizacion(valor: string) {
  if (valor === NINGUNA) {
    form.cotizacion_id = ''
    form.cotizacion_numero = null
    return
  }
  const q = cotizaciones.value.find((x) => x.id === valor)
  form.cotizacion_id = valor
  form.cotizacion_numero = q?.numero ?? null
}

async function onGuardarCliente(input: ClienteInput) {
  guardandoCliente.value = true
  try {
    const nuevoId = await crearCliente(input)
    seleccionarCliente(nuevoId)
    dialogClienteAbierto.value = false
  } catch (e) {
    console.error(e)
    window.alert('No se pudo crear el cliente.')
  } finally {
    guardandoCliente.value = false
  }
}

async function guardar() {
  error.value = ''
  if (!form.cliente_id) {
    error.value = 'Selecciona un cliente.'
    return
  }
  if (!form.descripcion.trim()) {
    error.value = 'Escribe una descripción.'
    return
  }

  const payload: OtInput = {
    ...form,
    descripcion: form.descripcion.trim(),
    monto: Math.max(0, Math.trunc(Number(form.monto) || 0)),
    notas: form.notas.trim(),
  }

  guardando.value = true
  try {
    if (esEdicion.value) {
      await actualizar(id.value, payload)
      original.value = await obtener(id.value)
      editando.value = false
    } else {
      await crear(payload)
      volver()
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar la OT.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="flex max-w-5xl flex-col gap-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <Button variant="outline" size="sm" class="mt-1" @click="volver">← Volver</Button>
        <div>
          <h1 class="text-2xl font-semibold">
            {{ esEdicion && original ? `OT N°${original.numero}` : 'Nueva OT' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ form.cliente_nombre || 'Sin cliente' }} ·
            {{ form.cotizacion_numero ? `cotización N°${form.cotizacion_numero}` : 'trabajo puntual' }}
          </p>
        </div>
      </div>
      <Button v-if="esEdicion && !cargando && !editando" variant="outline" size="sm" @click="empezarEdicion">
        <PencilIcon /> Editar
      </Button>
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Loading v-if="cargando" label="Cargando OT" />

    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_17rem]">
      <!-- Columna principal: ficha (lectura) -->
      <div v-if="!editando" class="flex flex-col gap-6">
        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Trabajo</h2>
          <dl class="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <dt class="text-sm text-muted-foreground">Cliente</dt>
            <dd class="text-sm font-medium">{{ form.cliente_nombre }}</dd>
            <dt class="text-sm text-muted-foreground">Cotización</dt>
            <dd class="text-sm">
              {{ form.cotizacion_numero ? `N°${form.cotizacion_numero}` : 'Ninguna (trabajo puntual)' }}
            </dd>
            <dt class="text-sm text-muted-foreground">Descripción</dt>
            <dd class="whitespace-pre-line text-sm">{{ form.descripcion }}</dd>
          </dl>
        </section>

        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Cobro</h2>
          <dl class="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <dt class="text-sm text-muted-foreground">Monto</dt>
            <dd class="font-mono text-sm">{{ formatoCLP(form.monto) }}</dd>
            <dt class="text-sm text-muted-foreground">Boleta</dt>
            <dd class="text-sm">{{ form.emite_boleta ? 'Emite boleta SII' : 'Sin boleta (informal)' }}</dd>
          </dl>
        </section>

        <section v-if="form.notas" class="grid gap-2 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Notas internas</h2>
          <p class="whitespace-pre-line text-sm">{{ form.notas }}</p>
        </section>
      </div>

      <!-- Columna principal: edición de datos -->
      <div v-else class="flex flex-col gap-6">
        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Trabajo</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid content-start gap-1.5">
              <Label>Cliente</Label>
              <div class="flex gap-2">
                <Select :model-value="form.cliente_id" @update:model-value="(v) => seleccionarCliente(String(v))">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" @click="dialogClienteAbierto = true">＋</Button>
              </div>
            </div>
            <div class="grid content-start gap-1.5">
              <Label>Cotización <span class="font-normal text-muted-foreground">(opcional)</span></Label>
              <Select :model-value="form.cotizacion_id || NINGUNA" :disabled="!form.cliente_id"
                @update:model-value="(v) => seleccionarCotizacion(String(v))">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="form.cliente_id ? 'Ninguna' : 'Elige un cliente primero'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NINGUNA">(ninguna)</SelectItem>
                  <SelectItem v-for="q in cotizacionesDisponibles" :key="q.id" :value="q.id">
                    N°{{ q.numero }} · {{ q.estado }} · {{ formatoCLP(q.total) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid gap-1.5">
            <Label for="desc">Descripción</Label>
            <Textarea id="desc" v-model="form.descripcion" rows="3" placeholder="Qué trabajo cubre la OT" />
          </div>
        </section>

        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Cobro</h2>
          <div class="grid max-w-56 gap-1.5">
            <Label for="monto">Monto (CLP)</Label>
            <Input id="monto" v-model.number="form.monto" type="number" min="0" step="1" />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox :model-value="form.emite_boleta"
              @update:model-value="(v) => (form.emite_boleta = v === true)" />
            Emite boleta SII
          </label>
          <p class="text-xs text-muted-foreground">
            Al completar la OT, el cobro se genera con este monto. Sin boleta, el cobro es informal.
          </p>
        </section>

        <section class="grid gap-1.5">
          <Label for="notas">Notas internas</Label>
          <Textarea id="notas" v-model="form.notas" rows="2" />
        </section>

        <div class="flex gap-3">
          <Button :disabled="guardando" @click="guardar">
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </Button>
          <Button variant="outline" :disabled="guardando" @click="cancelarEdicion">Cancelar</Button>
        </div>
      </div>

      <!-- Columna lateral: resumen, estado y cobro -->
      <aside class="grid gap-4 rounded-lg border bg-muted/30 p-5 lg:sticky lg:top-6">
        <div>
          <p class="text-xs text-muted-foreground">Monto</p>
          <p class="font-mono text-2xl font-semibold">{{ formatoCLP(form.monto) }}</p>
          <p class="text-xs text-muted-foreground">
            {{ form.emite_boleta ? 'Con boleta' : 'Sin boleta (informal)' }}
          </p>
        </div>
        <div class="grid gap-1.5">
          <Label>Estado</Label>
          <Select :model-value="form.estado" :disabled="guardandoEstado" @update:model-value="onEstado">
            <SelectTrigger class="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="e in ESTADOS_OT" :key="e" :value="e">{{ LABEL_ESTADO_OT[e] }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <Badge :class="CLASE_ESTADO_OT[form.estado]">{{ LABEL_ESTADO_OT[form.estado] }}</Badge>
          <Badge v-if="original?.cobro_generado" class="bg-green-500/10 text-green-600 dark:text-green-400">
            Cobro generado
          </Badge>
        </div>
        <Button v-if="original && (original.cobro_generado || original.estado === 'completada')"
          variant="outline" size="sm" class="bg-background" :disabled="abriendoCobro" @click="irACobro">
          {{ abriendoCobro ? 'Abriendo…' : original.cobro_generado ? 'Ver cobro' : 'Generar cobro' }}
        </Button>
      </aside>
    </div>

    <ClienteFormDialog v-model:open="dialogClienteAbierto" :cliente="null" :saving="guardandoCliente"
      @save="onGuardarCliente" />
  </div>
</template>
