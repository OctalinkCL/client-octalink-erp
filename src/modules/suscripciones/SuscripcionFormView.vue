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
import { formatoCLP, mesCicloLegible } from '@/lib/formato'
import type { Cobro } from '@/modules/cobranza/types'
import { useCobranza } from '@/modules/cobranza/useCobranza'
import { useCobrosSuscripcionAnio } from '@/modules/cobranza/useCobrosSuscripcionAnio'
import GrillaMeses from './GrillaMeses.vue'
import ClienteFormDialog from '@/modules/clientes/ClienteFormDialog.vue'
import { useClientes } from '@/modules/clientes/useClientes'
import type { ClienteInput } from '@/modules/clientes/types'
import { useSuscripciones } from './useSuscripciones'
import {
  CLASE_ESTADO_SUSCRIPCION,
  ESTADOS_SUSCRIPCION,
  mesInicioDe,
  suscripcionInputVacio,
  type EstadoSuscripcion,
  type Suscripcion,
  type SuscripcionInput,
} from './types'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, crear: crearCliente } = useClientes()
const { obtener, crear, actualizar, cambiarEstado } = useSuscripciones()

const form = reactive<SuscripcionInput>(suscripcionInputVacio())
const cargando = ref(false)
const guardando = ref(false)
const guardandoEstado = ref(false)
const error = ref('')

// Existente: parte en la ficha y "Editar" habilita los datos. El estado se
// guarda al instante desde la columna lateral.
const { editando, empezarEdicion, cancelarEdicion: restaurarDatos } = useModoFicha(
  form,
  ['cliente_id', 'cliente_nombre', 'descripcion', 'monto', 'dia_cobro', 'mes_inicio', 'emite_boleta', 'notas'],
  !esEdicion.value,
)
// Suscripción tal como está guardada: la grilla genera cobros a partir de ella.
const original = ref<Suscripcion | null>(null)

// Pagos del año en curso (solo en edición).
const anio = ref(new Date().getFullYear())
const { porSuscripcion } = useCobrosSuscripcionAnio(anio)
const { generarDesdeSuscripcion } = useCobranza()
const generandoMes = ref('')

const dialogClienteAbierto = ref(false)
const guardandoCliente = ref(false)

onMounted(async () => {
  cargando.value = true
  try {
    if (esEdicion.value) {
      const s = await obtener(id.value)
      if (!s) {
        error.value = 'Suscripción no encontrada.'
        return
      }
      original.value = s
      Object.assign(form, {
        cliente_id: s.cliente_id,
        cliente_nombre: s.cliente_nombre,
        descripcion: s.descripcion,
        monto: s.monto,
        dia_cobro: s.dia_cobro,
        mes_inicio: mesInicioDe(s),
        emite_boleta: s.emite_boleta,
        estado: s.estado,
        cotizacion_id: s.cotizacion_id,
        cotizacion_numero: s.cotizacion_numero,
        ot_id: s.ot_id,
        ot_numero: s.ot_numero,
        notas: s.notas,
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
  router.push({ name: 'suscripciones' })
}

function cancelarEdicion() {
  if (!esEdicion.value) return volver()
  restaurarDatos()
  error.value = ''
}

async function onEstado(valor: unknown) {
  const estado = String(valor) as EstadoSuscripcion
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

function abrirCobro(c: Cobro) {
  router.push({ name: 'cobro-editar', params: { id: c.id } })
}

async function generarMes(mes: string) {
  const s = original.value
  if (!s) return
  if (!window.confirm(`¿Generar el cobro de ${mesCicloLegible(mes)} para ${s.cliente_nombre}?`)) return
  generandoMes.value = mes
  try {
    await generarDesdeSuscripcion(s, mes)
  } catch (e) {
    console.error(e)
    window.alert('No se pudo generar el cobro.')
  } finally {
    generandoMes.value = ''
  }
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
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.mes_inicio)) {
    error.value = 'Indica el mes de inicio (AAAA-MM).'
    return
  }

  const payload: SuscripcionInput = {
    ...form,
    descripcion: form.descripcion.trim(),
    monto: Math.max(0, Math.trunc(Number(form.monto) || 0)),
    dia_cobro: Math.min(28, Math.max(1, Math.trunc(Number(form.dia_cobro) || 1))),
    notas: form.notas.trim(),
  }

  guardando.value = true
  try {
    if (esEdicion.value) {
      await actualizar(id.value, payload)
      Object.assign(form, payload)
      original.value = await obtener(id.value)
      editando.value = false
    } else {
      await crear(payload)
      volver()
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar la suscripción.'
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
            {{ esEdicion ? `Suscripción · ${form.cliente_nombre}` : 'Nueva suscripción' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ form.descripcion || 'Cobro mensual recurrente' }}
            <template v-if="form.cotizacion_numero"> · cotización N°{{ form.cotizacion_numero }}</template>
            <template v-if="form.ot_numero"> · OT N°{{ form.ot_numero }}</template>
          </p>
        </div>
      </div>
      <Button v-if="esEdicion && !cargando && !editando" variant="outline" size="sm" @click="empezarEdicion">
        <PencilIcon /> Editar
      </Button>
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <Loading v-if="cargando" label="Cargando suscripción" />

    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_17rem]">
      <!-- Columna principal: ficha (lectura) -->
      <div v-if="!editando" class="flex flex-col gap-6">
        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Cliente y servicio</h2>
          <dl class="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <dt class="text-sm text-muted-foreground">Cliente</dt>
            <dd class="text-sm font-medium">{{ form.cliente_nombre }}</dd>
            <dt class="text-sm text-muted-foreground">Descripción</dt>
            <dd class="text-sm">{{ form.descripcion }}</dd>
          </dl>
        </section>

        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Cobro mensual</h2>
          <dl class="grid gap-4 sm:grid-cols-4">
            <div>
              <dt class="text-xs text-muted-foreground">Monto</dt>
              <dd class="font-mono text-sm">{{ formatoCLP(form.monto) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Día de cobro</dt>
              <dd class="text-sm">{{ form.dia_cobro }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Inicio</dt>
              <dd class="text-sm">{{ mesCicloLegible(form.mes_inicio) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Boleta</dt>
              <dd class="text-sm">{{ form.emite_boleta ? 'Emite boleta SII' : 'Sin boleta' }}</dd>
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
          <h2 class="text-sm font-semibold">Cliente y servicio</h2>
          <div class="grid gap-1.5">
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
              <Button type="button" variant="outline" @click="dialogClienteAbierto = true">＋ Nuevo</Button>
            </div>
          </div>
          <div class="grid gap-1.5">
            <Label for="desc">Descripción</Label>
            <Input id="desc" v-model="form.descripcion" placeholder="Ej: WaaS — mantención web mensual" />
          </div>
        </section>

        <section class="grid gap-4 rounded-lg border p-5">
          <h2 class="text-sm font-semibold">Cobro mensual</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="grid content-start gap-1.5">
              <Label for="monto">Monto (CLP)</Label>
              <Input id="monto" v-model.number="form.monto" type="number" min="0" step="1" />
            </div>
            <div class="grid content-start gap-1.5">
              <Label for="dia">Día de cobro</Label>
              <Input id="dia" v-model.number="form.dia_cobro" type="number" min="1" max="28" step="1" />
            </div>
            <div class="grid content-start gap-1.5">
              <Label for="inicio">Mes de inicio</Label>
              <Input id="inicio" v-model="form.mes_inicio" type="month" placeholder="AAAA-MM" />
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox :model-value="form.emite_boleta"
              @update:model-value="(v) => (form.emite_boleta = v === true)" />
            Emite boleta SII
          </label>
          <p class="text-xs text-muted-foreground">
            Día de cobro entre 1 y 28. Los meses anteriores al inicio no cuentan como deuda.
            Los cobros mensuales heredan monto y boleta al generarse.
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

      <!-- Columna lateral: resumen, estado y pagos del año -->
      <aside class="flex flex-col gap-6 lg:sticky lg:top-6">
        <div class="grid gap-4 rounded-lg border bg-muted/30 p-5">
          <div>
            <p class="text-xs text-muted-foreground">Monto mensual</p>
            <p class="font-mono text-2xl font-semibold">{{ formatoCLP(form.monto) }}</p>
            <p class="text-xs text-muted-foreground">
              Día {{ form.dia_cobro }} de cada mes
              <template v-if="form.mes_inicio"> · desde {{ mesCicloLegible(form.mes_inicio) }}</template>
              · {{ form.emite_boleta ? 'con boleta' : 'sin boleta' }}
            </p>
          </div>
          <div class="grid gap-1.5">
            <Label>Estado</Label>
            <Select :model-value="form.estado" :disabled="guardandoEstado" @update:model-value="onEstado">
              <SelectTrigger class="w-full bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="e in ESTADOS_SUSCRIPCION" :key="e" :value="e" class="capitalize">{{ e }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge class="capitalize" :class="CLASE_ESTADO_SUSCRIPCION[form.estado]">{{ form.estado }}</Badge>
        </div>

        <div v-if="esEdicion && original" class="grid gap-3">
          <h2 class="text-sm font-semibold">Pagos {{ anio }}</h2>
          <GrillaMeses :anio="anio" :mes-inicio="form.mes_inicio" :dia-cobro="form.dia_cobro" :cobros="porSuscripcion.get(original.id)"
            :generando="generandoMes" @abrir="abrirCobro" @generar="generarMes" />
        </div>
      </aside>
    </div>

    <ClienteFormDialog v-model:open="dialogClienteAbierto" :cliente="null" :saving="guardandoCliente"
      @save="onGuardarCliente" />
  </div>
</template>
