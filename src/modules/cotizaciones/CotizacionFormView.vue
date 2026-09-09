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
import { useCotizaciones } from './useCotizaciones'
import {
  calcularTotal,
  cotizacionInputVacio,
  ESTADOS_COTIZACION,
  itemVacio,
  type CotizacionInput,
  type EstadoCotizacion,
} from './types'

const route = useRoute()
const router = useRouter()

const id = computed(() => (route.params.id as string) || '')
const esEdicion = computed(() => !!id.value)

const { clientes, cargar: cargarClientes, crear: crearCliente } = useClientes()
const { obtener, crear, actualizar } = useCotizaciones()

const form = reactive<CotizacionInput>(cotizacionInputVacio())
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')

const dialogClienteAbierto = ref(false)
const guardandoCliente = ref(false)

const total = computed(() => calcularTotal(form.items))

onMounted(async () => {
  cargando.value = true
  try {
    await cargarClientes()
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
    } else {
      await crear(payload)
    }
    router.push({ name: 'cotizaciones' })
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo guardar la cotización.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="flex max-w-3xl flex-col gap-5">
    <div class="flex items-center gap-3">
      <Button variant="outline" size="sm" @click="router.push({ name: 'cotizaciones' })">
        ← Volver
      </Button>
      <h1 class="text-2xl font-semibold">
        {{ esEdicion ? 'Editar cotización' : 'Nueva cotización' }}
      </h1>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="cargando" class="text-sm text-muted-foreground">Cargando…</div>

    <template v-else>
      <!-- Cliente -->
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
              <SelectItem v-for="c in clientes" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" @click="dialogClienteAbierto = true">
            ＋ Nuevo
          </Button>
        </div>
      </div>

      <!-- Ítems -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <Label>Ítems</Label>
          <Button type="button" variant="outline" size="sm" @click="agregarItem">
            Agregar ítem
          </Button>
        </div>

        <div
          v-for="(it, idx) in form.items"
          :key="idx"
          class="grid grid-cols-[1fr_1fr_130px_auto] items-start gap-2 rounded-lg border p-2"
        >
          <div class="grid gap-1">
            <Input v-model="it.item" placeholder="Ítem" />
            <Input v-model="it.descripcion" placeholder="Descripción (opcional)" />
          </div>
          <div class="col-start-3">
            <Input v-model.number="it.precio" type="number" min="0" step="1" placeholder="Precio" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="text-destructive"
            @click="quitarItem(idx)"
          >
            Quitar
          </Button>
        </div>

        <div class="flex justify-end pr-2 text-sm">
          <span class="text-muted-foreground">Total:&nbsp;</span>
          <span class="font-semibold">{{ formatoCLP(total) }}</span>
        </div>
      </div>

      <!-- Estado -->
      <div class="grid max-w-xs gap-1.5">
        <Label>Estado</Label>
        <Select
          :model-value="form.estado"
          @update:model-value="(v) => (form.estado = String(v) as EstadoCotizacion)"
        >
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="e in ESTADOS_COTIZACION" :key="e" :value="e">{{ e }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Notas -->
      <div class="grid gap-1.5">
        <Label for="notas">Notas</Label>
        <Textarea id="notas" v-model="form.notas" />
      </div>

      <div class="flex gap-3">
        <Button :disabled="guardando" @click="guardar">
          {{ guardando ? 'Guardando…' : 'Guardar' }}
        </Button>
        <Button variant="outline" :disabled="guardando" @click="router.push({ name: 'cotizaciones' })">
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
