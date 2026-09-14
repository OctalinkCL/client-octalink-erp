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
import { useSuscripciones } from './useSuscripciones'
import {
  ESTADOS_SUSCRIPCION,
  suscripcionInputVacio,
  type EstadoSuscripcion,
  type SuscripcionInput,
} from './types'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, crear: crearCliente } = useClientes()
const { obtener, crear, actualizar } = useSuscripciones()

const form = reactive<SuscripcionInput>(suscripcionInputVacio())
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')

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
      Object.assign(form, {
        cliente_id: s.cliente_id,
        cliente_nombre: s.cliente_nombre,
        descripcion: s.descripcion,
        monto: s.monto,
        dia_cobro: s.dia_cobro,
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
    } else {
      await crear(payload)
    }
    router.push({ name: 'suscripciones' })
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar la suscripción.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-5">
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" @click="router.push({ name: 'suscripciones' })">
        ← Volver
      </Button>
      <h1 class="text-2xl font-semibold">
        {{ esEdicion ? 'Editar suscripción' : 'Nueva suscripción' }}
      </h1>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <div v-if="cargando" class="text-sm text-muted-foreground">Cargando…</div>

    <template v-else>
      <p
        v-if="form.cotizacion_numero || form.ot_numero"
        class="text-sm text-muted-foreground"
      >
        Origen:
        <template v-if="form.cotizacion_numero">cotización N°{{ form.cotizacion_numero }}</template>
        <template v-if="form.cotizacion_numero && form.ot_numero"> · </template>
        <template v-if="form.ot_numero">OT N°{{ form.ot_numero }}</template>.
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
        <Label for="desc">Descripción</Label>
        <Input id="desc" v-model="form.descripcion" placeholder="Ej: WaaS — mantención web mensual" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-1.5">
          <Label for="monto">Monto mensual (CLP)</Label>
          <Input id="monto" v-model.number="form.monto" type="number" min="0" step="1" />
          <span class="text-sm text-muted-foreground">{{ formatoCLP(form.monto) }}</span>
        </div>
        <div class="grid gap-1.5">
          <Label for="dia">Día de cobro</Label>
          <Input id="dia" v-model.number="form.dia_cobro" type="number" min="1" max="28" step="1" />
          <span class="text-sm text-muted-foreground">1 a 28</span>
        </div>
      </div>

      <label class="flex items-center gap-2 text-sm">
        <Checkbox
          :model-value="form.emite_boleta"
          @update:model-value="(v) => (form.emite_boleta = v === true)"
        />
        Emite boleta SII (los cobros mensuales lo heredan)
      </label>

      <div class="grid max-w-xs gap-1.5">
        <Label>Estado</Label>
        <Select
          :model-value="form.estado"
          @update:model-value="(v) => (form.estado = String(v) as EstadoSuscripcion)"
        >
          <SelectTrigger class="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in ESTADOS_SUSCRIPCION" :key="e" :value="e">{{ e }}</SelectItem>
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
        <Button
          variant="outline"
          :disabled="guardando"
          @click="router.push({ name: 'suscripciones' })"
        >
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
