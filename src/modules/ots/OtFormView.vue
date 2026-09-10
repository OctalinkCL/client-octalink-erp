<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import { useCotizaciones } from '@/modules/cotizaciones/useCotizaciones'
import { useOts } from './useOts'
import { ESTADOS_OT, otInputVacio, type EstadoOt, type OtInput } from './types'

const NINGUNA = '__ninguna__'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, crear: crearCliente } = useClientes()
const { cotizaciones } = useCotizaciones()
const { obtener, crear, actualizar } = useOts()

const form = reactive<OtInput>(otInputVacio())
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')

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
    } else {
      await crear(payload)
    }
    router.push({ name: 'ots' })
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar la OT.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-5">
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" @click="router.push({ name: 'ots' })">← Volver</Button>
      <h1 class="text-2xl font-semibold">{{ esEdicion ? 'Editar OT' : 'Nueva OT' }}</h1>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <div v-if="cargando" class="text-sm text-muted-foreground">Cargando…</div>

    <template v-else>
      <div class="grid gap-1.5">
        <Label>Cliente</Label>
        <div class="flex gap-2">
          <Select
            :model-value="form.cliente_id"
            @update:model-value="(v) => seleccionarCliente(String(v))"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" @click="dialogClienteAbierto = true">
            ＋ Nuevo
          </Button>
        </div>
      </div>

      <div class="grid gap-1.5">
        <Label>Cotización asociada</Label>
        <Select
          :model-value="form.cotizacion_id || NINGUNA"
          :disabled="!form.cliente_id"
          @update:model-value="(v) => seleccionarCotizacion(String(v))"
        >
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
        <span class="text-sm text-muted-foreground">Opcional, solo como referencia.</span>
      </div>

      <div class="grid gap-1.5">
        <Label for="desc">Descripción</Label>
        <Textarea id="desc" v-model="form.descripcion" placeholder="Qué trabajo cubre la OT" />
      </div>

      <div class="grid max-w-xs gap-1.5">
        <Label for="monto">Monto (CLP)</Label>
        <Input id="monto" v-model.number="form.monto" type="number" min="0" step="1" />
        <span class="text-sm text-muted-foreground">{{ formatoCLP(form.monto) }}</span>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <Checkbox
          :model-value="form.emite_boleta"
          @update:model-value="(v) => (form.emite_boleta = v === true)"
        />
        Emite boleta SII (si no, el cobro es informal)
      </label>

      <div class="grid max-w-xs gap-1.5">
        <Label>Estado</Label>
        <Select
          :model-value="form.estado"
          @update:model-value="(v) => (form.estado = String(v) as EstadoOt)"
        >
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in ESTADOS_OT" :key="e" :value="e">{{ e }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-1.5">
        <Label for="notas">Notas</Label>
        <Textarea id="notas" v-model="form.notas" />
      </div>

      <div class="flex gap-3">
        <Button :disabled="guardando" @click="guardar">
          {{ guardando ? 'Guardando…' : 'Guardar' }}
        </Button>
        <Button variant="outline" :disabled="guardando" @click="router.push({ name: 'ots' })">
          Cancelar
        </Button>
      </div>
    </template>

    <ClienteFormDialog
      v-model:open="dialogClienteAbierto"
      :cliente="null"
      :saving="guardandoCliente"
      @save="onGuardarCliente"
    />
  </div>
</template>
