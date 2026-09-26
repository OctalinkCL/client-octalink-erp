<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PencilIcon, PlusIcon, Trash2Icon } from '@lucide/vue'
import Loading from '@/components/Loading.vue'
import { useModoFicha } from '@/composables/useModoFicha'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useOts } from '@/modules/ots/useOts'
import { useCotizaciones } from './useCotizaciones'
import {
  CLASE_ESTADO_COTIZACION,
  calcularTotal,
  cotizacionInputVacio,
  ESTADOS_COTIZACION,
  itemVacio,
  type Cotizacion,
  type CotizacionInput,
  type EstadoCotizacion,
} from './types'

const formatoFecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' })

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, crear: crearCliente } = useClientes()
const { obtener, crear, actualizar, cambiarEstado } = useCotizaciones()
const { generarDesdeCotizacion } = useOts()

const form = reactive<CotizacionInput>(cotizacionInputVacio())
const cargando = ref(false)
const guardando = ref(false)
const guardandoEstado = ref(false)
const abriendoOt = ref(false)
const error = ref('')
// Cotización tal como está guardada: la OT se genera a partir de ella.
const original = ref<Cotizacion | null>(null)
const numero = ref<number | null>(null)
const otGenerada = ref(false)
const fecha = ref('') // legible, solo en edición

// Existente: parte en la ficha y "Editar" habilita los datos. El estado se
// guarda al instante desde la columna lateral.
const { editando, empezarEdicion, cancelarEdicion: restaurarDatos } = useModoFicha(
  form,
  ['cliente_id', 'cliente_nombre', 'items', 'notas'],
  !esEdicion.value,
)

const dialogClienteAbierto = ref(false)
const guardandoCliente = ref(false)

const total = computed(() => calcularTotal(form.items))

onMounted(async () => {
  cargando.value = true
  try {
    if (esEdicion.value) {
      const c = await obtener(id.value)
      if (!c) {
        error.value = 'Cotización no encontrada.'
        return
      }
      Object.assign(form, {
        cliente_id: c.cliente_id,
        cliente_nombre: c.cliente_nombre,
        items: c.items.length ? c.items.map((i) => ({ ...i })) : [itemVacio()],
        estado: c.estado,
        notas: c.notas,
      })
      original.value = c
      numero.value = c.numero
      otGenerada.value = !!c.ot_generada
      if (c.fecha) fecha.value = formatoFecha.format(c.fecha.toDate())
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo cargar.'
  } finally {
    cargando.value = false
  }
})

const itemsConNombre = computed(() => form.items.filter((i) => i.item.trim()).length)

function volver() {
  router.push({ name: 'cotizaciones' })
}

function cancelarEdicion() {
  if (!esEdicion.value) return volver()
  restaurarDatos()
  error.value = ''
}

async function onEstado(valor: unknown) {
  const estado = String(valor) as EstadoCotizacion
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

// Genera la OT (o abre la existente: es idempotente) y navega a ella.
async function irAOt() {
  const c = original.value
  if (!c) return
  if (!otGenerada.value && !window.confirm(`¿Generar OT desde la cotización N°${c.numero}?`)) return
  abriendoOt.value = true
  try {
    const { id: otId } = await generarDesdeCotizacion(c)
    router.push({ name: 'ot-editar', params: { id: otId } })
  } catch (e) {
    console.error(e)
    window.alert('No se pudo abrir la OT.')
  } finally {
    abriendoOt.value = false
  }
}

function seleccionarCliente(clienteId: string) {
  const c = clientes.value.find((x) => x.id === clienteId)
  form.cliente_id = clienteId
  form.cliente_nombre = c?.nombre ?? ''
}

function agregarItem() {
  form.items.push(itemVacio())
}

function quitarItem(idx: number) {
  form.items.splice(idx, 1)
  if (!form.items.length) form.items.push(itemVacio())
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
  if (!form.items.some((i) => i.item.trim())) {
    error.value = 'Agrega al menos un ítem con nombre.'
    return
  }

  const payload: CotizacionInput = {
    ...form,
    items: form.items
      .filter((i) => i.item.trim())
      .map((i) => ({
        item: i.item.trim(),
        descripcion: i.descripcion.trim(),
        precio: Math.max(0, Math.trunc(Number(i.precio) || 0)),
      })),
  }

  guardando.value = true
  try {
    if (esEdicion.value) {
      await actualizar(id.value, payload)
      form.items = payload.items.map((i) => ({ ...i }))
      original.value = await obtener(id.value)
      editando.value = false
    } else {
      await crear(payload)
      volver()
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar la cotización.'
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
            {{ esEdicion && numero ? `Cotización N°${numero}` : 'Nueva cotización' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ form.cliente_nombre || 'Sin cliente' }}<template v-if="fecha"> · {{ fecha }}</template>
            <template v-if="otGenerada"> · OT generada</template>
          </p>
        </div>
      </div>
      <Button v-if="esEdicion && !cargando && !editando" variant="outline" size="sm" @click="empezarEdicion">
        <PencilIcon /> Editar
      </Button>
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Loading v-if="cargando" label="Cargando cotización" />

    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_17rem]">
      <!-- Columna principal: ficha (lectura) -->
      <div v-if="!editando" class="flex flex-col gap-6">
        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Cliente</h2>
          <p class="text-sm font-medium">{{ form.cliente_nombre }}</p>
        </section>

        <section class="grid gap-3 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Ítems</h2>
          <div v-for="(it, idx) in form.items" :key="idx"
            class="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
            <div class="min-w-0">
              <p class="text-sm font-medium">{{ it.item }}</p>
              <p v-if="it.descripcion" class="whitespace-pre-line text-sm text-muted-foreground">
                {{ it.descripcion }}
              </p>
            </div>
            <p class="shrink-0 font-mono text-sm">{{ formatoCLP(it.precio) }}</p>
          </div>
          <div class="flex justify-end border-t pt-3 text-sm">
            <span class="text-muted-foreground">Total&nbsp;</span>
            <span class="font-mono font-semibold">{{ formatoCLP(total) }}</span>
          </div>
        </section>

        <section v-if="form.notas" class="grid gap-2 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Notas internas</h2>
          <p class="whitespace-pre-line text-sm">{{ form.notas }}</p>
        </section>
      </div>

      <!-- Columna principal: edición de datos -->
      <div v-else class="flex flex-col gap-6">
        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Cliente</h2>
          <div class="flex gap-2">
            <Select :model-value="form.cliente_id" @update:model-value="(v) => seleccionarCliente(String(v))">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" @click="dialogClienteAbierto = true">＋ Nuevo</Button>
          </div>
        </section>

        <section class="grid gap-3 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Ítems</h2>

          <!-- Cabecera de columnas (desktop) -->
          <div class="hidden grid-cols-[1fr_1.4fr_9rem_2rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
            <span>Ítem</span>
            <span>Descripción</span>
            <span class="text-right">Precio (CLP)</span>
            <span />
          </div>

          <div v-for="(it, idx) in form.items" :key="idx"
            class="grid gap-2 border-b pb-3 last:border-b-0 sm:grid-cols-[1fr_1.4fr_9rem_2rem] sm:items-center sm:border-0 sm:pb-0">
            <Input v-model="it.item" placeholder="Ítem" />
            <Input v-model="it.descripcion" placeholder="Descripción (opcional)" />
            <Input v-model.number="it.precio" type="number" min="0" step="1" placeholder="0"
              class="text-right font-mono" />
            <Button type="button" variant="ghost" size="icon-sm" class="justify-self-end text-muted-foreground hover:text-destructive"
              title="Quitar ítem" aria-label="Quitar ítem" @click="quitarItem(idx)">
              <Trash2Icon />
            </Button>
          </div>

          <div class="flex items-center justify-between border-t pt-3">
            <Button type="button" variant="ghost" size="sm" @click="agregarItem">
              <PlusIcon /> Agregar ítem
            </Button>
            <p class="text-sm">
              <span class="text-muted-foreground">Total </span>
              <span class="font-mono font-semibold">{{ formatoCLP(total) }}</span>
            </p>
          </div>
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

      <!-- Columna lateral: resumen + estado -->
      <aside class="grid gap-4 rounded-lg border bg-muted/30 p-5 lg:sticky lg:top-6">
        <div>
          <p class="text-xs text-muted-foreground">Total</p>
          <p class="font-mono text-2xl font-semibold">{{ formatoCLP(total) }}</p>
          <p class="text-xs text-muted-foreground">
            {{ itemsConNombre }} {{ itemsConNombre === 1 ? 'ítem' : 'ítems' }}
          </p>
        </div>
        <div class="grid gap-1.5">
          <Label>Estado</Label>
          <Select :model-value="form.estado" :disabled="guardandoEstado" @update:model-value="onEstado">
            <SelectTrigger class="w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="e in ESTADOS_COTIZACION" :key="e" :value="e" class="capitalize">{{ e }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <Badge class="capitalize" :class="CLASE_ESTADO_COTIZACION[form.estado]">{{ form.estado }}</Badge>
          <Badge v-if="otGenerada" class="bg-green-500/10 text-green-600 dark:text-green-400">OT generada</Badge>
        </div>
        <Button v-if="original && (otGenerada || form.estado === 'aceptada')" variant="outline" size="sm"
          class="bg-background" :disabled="abriendoOt" @click="irAOt">
          {{ abriendoOt ? 'Abriendo…' : otGenerada ? 'Ver OT' : 'Generar OT' }}
        </Button>
      </aside>
    </div>

    <ClienteFormDialog v-model:open="dialogClienteAbierto" :cliente="null" :saving="guardandoCliente"
      @save="onGuardarCliente" />
  </div>
</template>
