<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FileTextIcon, PencilIcon, SendIcon } from '@lucide/vue'
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
import { fechaCorta, fechaISO, formatoCLP, mesCicloLegible } from '@/lib/formato'
import ClienteFormDialog from '@/modules/clientes/ClienteFormDialog.vue'
import { useClientes } from '@/modules/clientes/useClientes'
import type { ClienteInput } from '@/modules/clientes/types'
import { useCobranza } from './useCobranza'
import {
  CLASE_BOLETA,
  CLASE_PAGO,
  ESTADOS_BOLETA,
  ESTADOS_PAGO,
  LABEL_ESTADO_BOLETA,
  LABEL_EVENTO_COBRO,
  cobroInputVacio,
  fechaEmisionDe,
  mesDeCobro,
  numeroCobro,
  type CobroInput,
  type EstadoBoleta,
  type EstadoPago,
  type EventoCobro,
} from './types'

// Vista del cobro en dos modos:
// - Ficha (lectura) para un cobro existente; "Editar" habilita los datos.
// - Edición directa al crear uno nuevo.
// El estado (pago, boleta) vive en la columna lateral y en un cobro existente
// se guarda al instante, sin pasar por "Editar".

const formatoFecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, crear: crearCliente } = useClientes()
const { obtener, crear, actualizar, marcarPago, marcarBoleta, cobroDeSuscripcionMes } =
  useCobranza()

const form = reactive<CobroInput>(cobroInputVacio())
const fechaPago = ref('') // 'YYYY-MM-DD'
const historial = ref<EventoCobro[]>([])
const numero = ref('') // visible: '14' o 'P3'
const cargando = ref(false)
const guardando = ref(false)
const guardandoEstado = ref(false)
const enviando = ref(false)
const error = ref('')

const { editando, empezarEdicion, cancelarEdicion: restaurarDatos } = useModoFicha(
  form,
  ['cliente_id', 'cliente_nombre', 'concepto', 'monto', 'mes_ciclo', 'fecha_emision', 'fecha_cobro', 'notas'],
  !esEdicion.value,
)

const yaEnviado = computed(() =>
  historial.value.some((h) => h.tipo === 'enviado' || h.tipo === 'reenviado'),
)

const dialogClienteAbierto = ref(false)
const guardandoCliente = ref(false)

const origenTexto = computed(() => {
  if (form.origen === 'ot') {
    const cot = form.cotizacion_numero ? ` · cotización N°${form.cotizacion_numero}` : ''
    return `Desde la OT N°${form.ot_numero}${cot}`
  }
  if (form.origen === 'suscripcion') return 'Cobro mensual de suscripción'
  return 'Cobro directo'
})

function volver() {
  router.push({ name: 'cobranza' })
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
        mes_ciclo: mesDeCobro(c),
        concepto: c.concepto,
        monto: c.monto,
        fecha_emision: fechaEmisionDe(c),
        fecha_cobro: c.fecha_cobro ?? '',
        estado_pago: c.estado_pago,
        estado_boleta: c.estado_boleta,
        url_boleta: c.url_boleta,
        notas: c.notas,
      })
      historial.value = c.historial ?? []
      numero.value = numeroCobro(c)
      if (c.fecha_pago) fechaPago.value = fechaISO(c.fecha_pago.toDate())
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo cargar.'
  } finally {
    cargando.value = false
  }
})

// --- Modo edición de datos ---

function cancelarEdicion() {
  if (!esEdicion.value) return volver()
  restaurarDatos()
  error.value = ''
}

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
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.mes_ciclo)) {
    error.value = 'Indica el mes del cobro (AAAA-MM).'
    return
  }
  if (!form.fecha_emision) {
    error.value = 'Indica la fecha de emisión.'
    return
  }
  if (form.suscripcion_id) {
    try {
      const otro = await cobroDeSuscripcionMes(form.suscripcion_id, form.mes_ciclo)
      if (otro && otro.id !== id.value) {
        error.value = `Ese mes ya tiene el cobro N°${numeroCobro(otro)}.`
        return
      }
    } catch (e) {
      console.error(e)
      error.value = 'No se pudo verificar el mes de la suscripción.'
      return
    }
  }

  form.concepto = form.concepto.trim()
  form.monto = Math.max(0, Math.trunc(Number(form.monto) || 0))
  form.url_boleta = form.url_boleta.trim()
  form.notas = form.notas.trim()
  const payload: CobroInput = { ...form }

  guardando.value = true
  try {
    if (esEdicion.value) {
      // El estado ya se guardó al cambiarlo; aquí van los datos.
      await actualizar(id.value, payload)
      editando.value = false
    } else {
      const res = await crear(payload)
      // fecha_pago va por su propio canal (no está en CobroInput)
      if (payload.estado_pago === 'pagado') await marcarPago(res.id, 'pagado', fechaPagoDate())
      volver()
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar el cobro.'
  } finally {
    guardando.value = false
  }
}

// --- Estado: en un cobro existente se guarda al instante ---

async function recargarHistorial() {
  const c = await obtener(id.value)
  if (c) historial.value = c.historial ?? []
}

async function persistirEstado(fn: () => Promise<unknown>, revertir: () => void) {
  if (!esEdicion.value) return
  guardandoEstado.value = true
  try {
    await fn()
    await recargarHistorial()
  } catch (e) {
    console.error(e)
    revertir()
    window.alert('No se pudo guardar el estado.')
  } finally {
    guardandoEstado.value = false
  }
}

function onEstadoPago(valor: unknown) {
  const estado = String(valor) as EstadoPago
  const prev = { estado: form.estado_pago, fecha: fechaPago.value }
  if (estado === prev.estado) return
  form.estado_pago = estado
  fechaPago.value = estado === 'pagado' ? prev.fecha || fechaISO() : ''
  persistirEstado(
    () => marcarPago(id.value, estado, estado === 'pagado' ? fechaPagoDate() : null),
    () => {
      form.estado_pago = prev.estado
      fechaPago.value = prev.fecha
    },
  )
}

function onFechaPago() {
  if (form.estado_pago !== 'pagado' || !fechaPago.value) return
  persistirEstado(() => marcarPago(id.value, 'pagado', fechaPagoDate()), () => {})
}

function onEstadoBoleta(valor: unknown) {
  const estado = String(valor) as EstadoBoleta
  const prev = form.estado_boleta
  if (estado === prev) return
  form.estado_boleta = estado
  persistirEstado(
    () => marcarBoleta(id.value, estado),
    () => (form.estado_boleta = prev),
  )
}

function onUrlBoleta() {
  persistirEstado(
    () => marcarBoleta(id.value, form.estado_boleta, form.url_boleta.trim()),
    () => {},
  )
}

// --- Documento ---

async function descargarPdf() {
  const c = await obtener(id.value)
  if (!c) return
  const { descargarOrdenDeCobro } = await import('./ordenDeCobroPdf')
  descargarOrdenDeCobro(c)
}

async function enviarCorreo() {
  const verbo = yaEnviado.value ? 'Reenviar' : 'Enviar'
  if (!window.confirm(`¿${verbo} este cobro por correo al cliente?`)) return
  enviando.value = true
  try {
    const c = await obtener(id.value)
    if (!c) return
    const { enviarCobro } = await import('./enviarCobro')
    await enviarCobro(c)
    const actualizado = await obtener(id.value)
    if (actualizado) {
      form.estado_pago = actualizado.estado_pago
      historial.value = actualizado.historial ?? []
    }
  } catch (e) {
    console.error(e)
    window.alert(e instanceof Error ? e.message : 'No se pudo enviar el correo.')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="flex max-w-5xl flex-col gap-6">
    <!-- Encabezado: qué cobro es, de dónde viene y acciones -->
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <Button variant="outline" size="sm" class="mt-1" @click="volver">← Volver</Button>
        <div>
          <h1 class="text-2xl font-semibold">
            {{ esEdicion ? `Cobro N°${numero}` : 'Nuevo cobro directo' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ origenTexto }}<template v-if="form.cliente_nombre"> · {{ form.cliente_nombre }}</template>
          </p>
        </div>
      </div>
      <div v-if="esEdicion && !cargando && !editando" class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="empezarEdicion">
          <PencilIcon /> Editar
        </Button>
        <Button variant="outline" size="sm" @click="descargarPdf">
          <FileTextIcon /> Orden de Cobro
        </Button>
        <Button v-if="form.estado_pago !== 'pagado'" variant="outline" size="sm" :disabled="enviando"
          @click="enviarCorreo">
          <SendIcon /> {{ enviando ? 'Enviando…' : yaEnviado ? 'Reenviar' : 'Enviar por correo' }}
        </Button>
      </div>
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Loading v-if="cargando" label="Cargando cobro" />

    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_17rem]">
      <!-- Columna principal: ficha (lectura) -->
      <div v-if="!editando" class="flex flex-col gap-6">
        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Qué se cobra</h2>
          <dl class="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <dt class="text-sm text-muted-foreground">Cliente</dt>
            <dd class="text-sm font-medium">{{ form.cliente_nombre }}</dd>
            <dt class="text-sm text-muted-foreground">Concepto</dt>
            <dd class="whitespace-pre-line text-sm">{{ form.concepto }}</dd>
            <dt class="text-sm text-muted-foreground">Monto</dt>
            <dd class="font-mono text-sm">{{ formatoCLP(form.monto) }}</dd>
          </dl>
        </section>

        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Fechas</h2>
          <dl class="grid gap-4 sm:grid-cols-3">
            <div>
              <dt class="text-xs text-muted-foreground">Mes del cobro</dt>
              <dd class="text-sm">{{ mesCicloLegible(form.mes_ciclo) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Emisión</dt>
              <dd class="text-sm">{{ form.fecha_emision ? fechaCorta(form.fecha_emision) : '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Cobrar a partir de</dt>
              <dd class="text-sm">{{ form.fecha_cobro ? fechaCorta(form.fecha_cobro) : 'Inmediato' }}</dd>
            </div>
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
          <h2 class="text-sm font-semibold">Qué se cobra</h2>

          <div class="grid gap-1.5">
            <Label>Cliente</Label>
            <div class="flex gap-2">
              <Select :model-value="form.cliente_id" :disabled="form.origen === 'suscripcion'"
                @update:model-value="(v) => seleccionarCliente(String(v))">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nombre }}</SelectItem>
                </SelectContent>
              </Select>
              <Button v-if="form.origen !== 'suscripcion'" type="button" variant="outline"
                @click="dialogClienteAbierto = true">
                ＋ Nuevo
              </Button>
            </div>
            <span v-if="form.origen === 'suscripcion'" class="text-xs text-muted-foreground">
              Cobro de suscripción: el cliente no se puede cambiar.
            </span>
          </div>

          <div class="grid gap-1.5">
            <Label for="concepto">Concepto</Label>
            <Textarea id="concepto" v-model="form.concepto" rows="2" placeholder="Qué se está cobrando" />
          </div>

          <div class="grid max-w-56 gap-1.5">
            <Label for="monto">Monto (CLP)</Label>
            <Input id="monto" v-model.number="form.monto" type="number" min="0" step="1" />
          </div>
        </section>

        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Fechas</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="grid content-start gap-1.5">
              <Label for="mesciclo">Mes del cobro</Label>
              <Input id="mesciclo" v-model="form.mes_ciclo" type="month" placeholder="AAAA-MM" />
            </div>
            <div class="grid content-start gap-1.5">
              <Label for="femision">Emisión</Label>
              <Input id="femision" v-model="form.fecha_emision" type="date" />
            </div>
            <div class="grid content-start gap-1.5">
              <Label for="fcobro">Cobrar a partir de</Label>
              <Input id="fcobro" v-model="form.fecha_cobro" type="date" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            El mes define dónde aparece en Cobranza. La emisión va impresa en la Orden de Cobro.
            "Cobrar a partir de" es opcional: con fecha futura el cobro queda programado.
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

      <!-- Columna lateral: resumen + estado (siempre activo) + historial -->
      <aside class="flex flex-col gap-6 lg:sticky lg:top-6">
        <div class="grid gap-4 rounded-lg border bg-muted/30 p-5">
          <div>
            <p class="text-xs text-muted-foreground">Monto</p>
            <p class="font-mono text-2xl font-semibold">{{ formatoCLP(form.monto) }}</p>
          </div>

          <div class="grid gap-1.5">
            <Label>Pago</Label>
            <Select :model-value="form.estado_pago" :disabled="guardandoEstado"
              @update:model-value="(v) => (esEdicion ? onEstadoPago(v) : (form.estado_pago = String(v) as EstadoPago))">
              <SelectTrigger class="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="e in ESTADOS_PAGO" :key="e" :value="e" class="capitalize">{{ e }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="form.estado_pago === 'pagado'" class="grid gap-1.5">
            <Label for="fpago">Fecha de pago</Label>
            <Input id="fpago" v-model="fechaPago" type="date" class="bg-background" :disabled="guardandoEstado"
              @change="esEdicion && onFechaPago()" />
          </div>

          <div class="grid gap-1.5">
            <Label>Boleta</Label>
            <Select :model-value="form.estado_boleta" :disabled="guardandoEstado"
              @update:model-value="(v) => (esEdicion ? onEstadoBoleta(v) : (form.estado_boleta = String(v) as EstadoBoleta))">
              <SelectTrigger class="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="e in ESTADOS_BOLETA" :key="e" :value="e">
                  {{ LABEL_ESTADO_BOLETA[e] }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="form.estado_boleta !== 'no_aplica'" class="grid gap-1.5">
            <Label for="urlb">Link de la boleta</Label>
            <Input id="urlb" v-model="form.url_boleta" placeholder="https://…" class="bg-background"
              :disabled="guardandoEstado" @change="esEdicion && onUrlBoleta()" />
            <a v-if="form.url_boleta" :href="form.url_boleta" target="_blank" rel="noopener"
              class="text-xs text-primary underline-offset-2 hover:underline">
              Abrir boleta
            </a>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <Badge class="capitalize" :class="CLASE_PAGO[form.estado_pago]">{{ form.estado_pago }}</Badge>
            <Badge :class="CLASE_BOLETA[form.estado_boleta]">{{ LABEL_ESTADO_BOLETA[form.estado_boleta] }}</Badge>
            <span v-if="guardandoEstado" class="text-xs text-muted-foreground">Guardando…</span>
          </div>
        </div>

        <div v-if="esEdicion && historial.length" class="grid gap-3">
          <h2 class="text-sm font-semibold">Historial</h2>
          <ol class="ml-1 flex flex-col gap-4 border-l border-border py-1 pl-4">
            <li v-for="(h, i) in historial" :key="i" class="relative">
              <span class="absolute top-1.5 -left-5.25 size-2 rounded-full bg-primary" />
              <p class="text-sm font-medium">{{ LABEL_EVENTO_COBRO[h.tipo] }}</p>
              <p class="text-xs text-muted-foreground">{{ formatoFecha.format(h.fecha.toDate()) }}</p>
            </li>
          </ol>
        </div>
      </aside>
    </div>

    <ClienteFormDialog v-model:open="dialogClienteAbierto" :cliente="null" :saving="guardandoCliente"
      @save="onGuardarCliente" />
  </div>
</template>
