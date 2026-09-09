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
import { useCobranza } from '@/modules/cobranza/useCobranza'
import { useOts } from './useOts'
import { ESTADOS_OT, type EstadoOt, type Ot } from './types'

const router = useRouter()
const { otsFiltradas, loading, error, busqueda, cambiarEstado, eliminar } = useOts()
const { generarDesdeOt } = useCobranza()

const generandoCobro = ref('')

function editar(o: Ot) {
  router.push({ name: 'ot-editar', params: { id: o.id } })
}

async function onEstado(o: Ot, valor: unknown) {
  const estado = String(valor) as EstadoOt
  if (estado && estado !== o.estado) await cambiarEstado(o.id, estado)
}

async function borrar(o: Ot) {
  if (!window.confirm(`¿Eliminar la OT N°${o.numero}?`)) return
  try {
    await eliminar(o.id)
  } catch (e) {
    console.error(e)
    window.alert('No se pudo eliminar.')
  }
}

async function generarCobro(o: Ot) {
  if (!window.confirm(`¿Generar cobro desde la OT N°${o.numero}?`)) return
  generandoCobro.value = o.id
  try {
    const { id, numero, yaExistia } = await generarDesdeOt(o)
    if (yaExistia) window.alert(`Esta OT ya tiene el cobro N°${numero}.`)
    router.push({ name: 'cobro-editar', params: { id } })
  } catch (e) {
    console.error(e)
    window.alert('No se pudo generar el cobro.')
  } finally {
    generandoCobro.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Órdenes de trabajo</h1>
      <Button @click="router.push({ name: 'ot-nueva' })">Nueva OT</Button>
    </div>

    <Input
      v-model="busqueda"
      placeholder="Buscar por número, cliente, descripción o estado…"
      class="max-w-sm"
    />

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-14">N°</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead class="text-right">Monto</TableHead>
            <TableHead class="w-40">Estado</TableHead>
            <TableHead class="w-0"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="7" class="text-center text-muted-foreground">Cargando…</TableCell>
          </TableRow>
          <TableRow v-else-if="!otsFiltradas.length">
            <TableCell colspan="7" class="text-center text-muted-foreground">Sin OTs.</TableCell>
          </TableRow>
          <TableRow v-for="o in otsFiltradas" v-else :key="o.id">
            <TableCell class="font-medium">{{ o.numero }}</TableCell>
            <TableCell>{{ o.cliente_nombre }}</TableCell>
            <TableCell class="max-w-[22ch] truncate">{{ o.descripcion }}</TableCell>
            <TableCell class="text-muted-foreground">
              {{ o.origen === 'cotizacion' ? `Cotización N°${o.cotizacion_numero}` : 'Puntual' }}
            </TableCell>
            <TableCell class="text-right">{{ formatoCLP(o.monto) }}</TableCell>
            <TableCell>
              <Select :model-value="o.estado" @update:model-value="(v) => onEstado(o, v)">
                <SelectTrigger class="h-7 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="e in ESTADOS_OT" :key="e" :value="e">{{ e }}</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell class="whitespace-nowrap text-right">
              <Button
                v-if="o.estado === 'completada'"
                variant="outline"
                size="sm"
                :disabled="generandoCobro === o.id"
                @click="generarCobro(o)"
              >
                {{ generandoCobro === o.id ? 'Generando…' : 'Generar cobro' }}
              </Button>
              <Button variant="ghost" size="sm" @click="editar(o)">Editar</Button>
              <Button variant="ghost" size="sm" class="text-destructive" @click="borrar(o)">
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
