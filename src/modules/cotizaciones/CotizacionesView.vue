<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatoCLP } from '@/lib/formato'
import { useOts } from '@/modules/ots/useOts'
import { useCotizaciones } from './useCotizaciones'
import { ESTADOS_COTIZACION, type Cotizacion, type EstadoCotizacion } from './types'

const router = useRouter()
const { cotizacionesFiltradas, loading, error, busqueda, cambiarEstado, eliminar } =
  useCotizaciones()
const { generarDesdeCotizacion } = useOts()

const generandoOt = ref('')

function editar(c: Cotizacion) {
  router.push({ name: 'cotizacion-editar', params: { id: c.id } })
}

async function onEstado(c: Cotizacion, valor: unknown) {
  const estado = String(valor) as EstadoCotizacion
  if (estado && estado !== c.estado) await cambiarEstado(c.id, estado)
}

async function borrar(c: Cotizacion) {
  if (!window.confirm(`¿Eliminar la cotización N°${c.numero}?`)) return
  try {
    await eliminar(c.id)
  } catch (e) {
    console.error(e)
    window.alert('No se pudo eliminar.')
  }
}

async function generarOt(c: Cotizacion) {
  if (!window.confirm(`¿Generar OT desde la cotización N°${c.numero}?`)) return
  generandoOt.value = c.id
  try {
    const { id, numero, yaExistia } = await generarDesdeCotizacion(c)
    if (yaExistia) {
      window.alert(`Esta cotización ya tiene la OT N°${numero}.`)
    }
    router.push({ name: 'ot-editar', params: { id } })
  } catch (e) {
    console.error(e)
    window.alert('No se pudo generar la OT.')
  } finally {
    generandoOt.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Cotizaciones</h1>
      <Button @click="router.push({ name: 'cotizacion-nueva' })">Nueva cotización</Button>
    </div>

    <Input
      v-model="busqueda"
      placeholder="Buscar por número, cliente o estado…"
      class="max-w-sm"
    />

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-16">N°</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead class="text-right">Total</TableHead>
            <TableHead class="w-40">Estado</TableHead>
            <TableHead class="w-0"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="5" class="text-center text-muted-foreground">Cargando…</TableCell>
          </TableRow>
          <TableRow v-else-if="!cotizacionesFiltradas.length">
            <TableCell colspan="5" class="text-center text-muted-foreground">
              Sin cotizaciones.
            </TableCell>
          </TableRow>
          <TableRow v-for="c in cotizacionesFiltradas" v-else :key="c.id">
            <TableCell class="font-medium">{{ c.numero }}</TableCell>
            <TableCell>{{ c.cliente_nombre }}</TableCell>
            <TableCell class="text-right">{{ formatoCLP(c.total) }}</TableCell>
            <TableCell>
              <Select :model-value="c.estado" @update:model-value="(v) => onEstado(c, v)">
                <SelectTrigger class="h-7 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="e in ESTADOS_COTIZACION" :key="e" :value="e">
                    {{ e }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell class="whitespace-nowrap text-right">
              <Button
                v-if="c.estado === 'aceptada'"
                variant="outline"
                size="sm"
                :disabled="generandoOt === c.id"
                @click="generarOt(c)"
              >
                {{ generandoOt === c.id ? 'Generando…' : 'Generar OT' }}
              </Button>
              <Button variant="ghost" size="sm" @click="editar(c)">Editar</Button>
              <Button variant="ghost" size="sm" class="text-destructive" @click="borrar(c)">
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
