<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import { useCobranza } from './useCobranza'
import {
  ESTADOS_BOLETA,
  ESTADOS_PAGO,
  LABEL_ESTADO_BOLETA,
  cobroInputVacio,
  type CobroInput,
  type EstadoBoleta,
  type EstadoPago,
} from './types'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, crear: crearCliente } = useClientes()
const { obtener, crear, actualizar, marcarPago } = useCobranza()

const form = reactive<CobroInput>(cobroInputVacio())
const fechaPago = ref('') // 'YYYY-MM-DD'
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')

const dialogClienteAbierto = ref(false)
const guardandoCliente = ref(false)

function pad(n: number) {
  return String(n).padStart(2, '0')
}

onMounted(async () => {
  cargando.value = true
  try {
    if (esEdicion.value) {
      const c = await obtener(id.value)
      if (!c) {
        error.value = 'Cobro no encontrado.'
        return
      }
      Object.assign(form, {
        cliente_id: c.cliente_id,
        cliente_nombre: c.cliente_nombre,
        origen: c.origen,
        ot_id: c.ot_id,
        ot_numero: c.ot_numero,
        cotizacion_id: c.cotizacion_id,
        cotizacion_numero: c.cotizacion_numero,
        suscripcion_id: c.suscripcion_id,
        mes_ciclo: c.mes_ciclo,
        concepto: c.concepto,
        monto: c.monto,
        estado_pago: c.estado_pago,
        estado_boleta: c.estado_boleta,
        url_boleta: c.url_boleta,
        notas: c.notas,
      })
      if (c.fecha_pago) {
        const d = c.fecha_pago.toDate()
        fechaPago.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      }
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

function fechaPagoDate(): Date | null {
  if (!fechaPago.value) return null
  const [y, m, d] = fechaPago.value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

async function guardar() {
  error.value = ''
  if (!form.cliente_id) {
    error.value = 'Selecciona un cliente.'
    return
  }
  if (!form.concepto.trim()) {
    error.value = 'Escribe un concepto.'
    return
  }

  const payload: CobroInput = {
    ...form,
    concepto: form.concepto.trim(),
    monto: Math.max(0, Math.trunc(Number(form.monto) || 0)),
    url_boleta: form.url_boleta.trim(),
    notas: form.notas.trim(),
  }

  guardando.value = true
  try {
    let cobroId = id.value
    if (esEdicion.value) {
      await actualizar(cobroId, payload)
    } else {
      const res = await crear(payload)
      cobroId = res.id
    }
    // fecha_pago va por su propio canal (no está en CobroInput)
    await marcarPago(
      cobroId,
      payload.estado_pago,
      payload.estado_pago === 'pagado' ? fechaPagoDate() : null,
    )
    router.push({ name: 'cobranza' })
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar el cobro.'
  } finally {
    guardando.value = false
  }
}

async function descargarPdf() {
  const c = await obtener(id.value)
  if (!c) return
  const { descargarOrdenDeCobro } = await import('./ordenDeCobroPdf')
  descargarOrdenDeCobro(c)
}
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-5">
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" @click="router.push({ name: 'cobranza' })">← Volver</Button>
      <h1 class="text-2xl font-semibold">{{ esEdicion ? 'Editar cobro' : 'Cobro directo' }}</h1>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <div v-if="cargando" class="text-sm text-muted-foreground">Cargando…</div>

    <template v-else>
      <p v-if="form.origen === 'ot'" class="text-sm text-muted-foreground">
        Generado desde la OT N°{{ form.ot_numero }}<template v-if="form.cotizacion_numero">
          (cotización N°{{ form.cotizacion_numero }})</template>.
      </p>

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
        <Label for="concepto">Concepto</Label>
        <Textarea id="concepto" v-model="form.concepto" placeholder="Qué se está cobrando" />
      </div>

      <div class="grid max-w-xs gap-1.5">
        <Label for="monto">Monto (CLP)</Label>
        <Input id="monto" v-model.number="form.monto" type="number" min="0" step="1" />
        <span class="text-sm text-muted-foreground">{{ formatoCLP(form.monto) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-1.5">
          <Label>Estado de pago</Label>
          <Select
            :model-value="form.estado_pago"
            @update:model-value="(v) => (form.estado_pago = String(v) as EstadoPago)"
          >
            <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="e in ESTADOS_PAGO" :key="e" :value="e">{{ e }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="form.estado_pago === 'pagado'" class="grid gap-1.5">
          <Label for="fpago">Fecha de pago</Label>
          <Input id="fpago" v-model="fechaPago" type="date" />
        </div>
      </div>

      <div class="grid gap-1.5">
        <Label>Estado de boleta</Label>
        <Select
          :model-value="form.estado_boleta"
          @update:model-value="(v) => (form.estado_boleta = String(v) as EstadoBoleta)"
        >
          <SelectTrigger class="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in ESTADOS_BOLETA" :key="e" :value="e">
              {{ LABEL_ESTADO_BOLETA[e] }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div v-if="form.estado_boleta !== 'no_aplica'" class="grid gap-1.5">
        <Label for="urlb">URL de la boleta (PDF)</Label>
        <Input id="urlb" v-model="form.url_boleta" placeholder="https://…" />
        <span class="text-sm text-muted-foreground">
          Por ahora pega el link (Drive u otro). La subida directa se agrega después.
        </span>
      </div>

      <div class="grid gap-1.5">
        <Label for="notas">Notas</Label>
        <Textarea id="notas" v-model="form.notas" />
      </div>

      <div class="flex flex-wrap gap-3">
        <Button :disabled="guardando" @click="guardar">
          {{ guardando ? 'Guardando…' : 'Guardar' }}
        </Button>
        <Button variant="outline" :disabled="guardando" @click="router.push({ name: 'cobranza' })">
          Cancelar
        </Button>
        <Button v-if="esEdicion" type="button" variant="outline" @click="descargarPdf">
          Descargar Orden de Cobro
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
