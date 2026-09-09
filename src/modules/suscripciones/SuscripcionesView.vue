<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
import { formatoCLP, mesCicloActual, mesCicloLegible } from '@/lib/formato'
import { useCobranza } from '@/modules/cobranza/useCobranza'
import { useSuscripciones } from './useSuscripciones'
import { ESTADOS_SUSCRIPCION, type EstadoSuscripcion, type Suscripcion } from './types'

const router = useRouter()
const {
  suscripcionesFiltradas,
  loading,
  error,
  busqueda,
  cargar,
  cambiarEstado,
  eliminar,
} = useSuscripciones()
const { generarDesdeSuscripcion } = useCobranza()

const generandoCobro = ref('')
const mesActual = mesCicloActual()

onMounted(cargar)

function editar(s: Suscripcion) {
  router.push({ name: 'suscripcion-editar', params: { id: s.id } })
}

async function onEstado(s: Suscripcion, valor: unknown) {
  const estado = String(valor) as EstadoSuscripcion
  if (estado && estado !== s.estado) await cambiarEstado(s.id, estado)
}

async function generarCobroMes(s: Suscripcion) {
  if (!window.confirm(`¿Generar el cobro de ${mesCicloLegible(mesActual)} para ${s.cliente_nombre}?`))
    return
  generandoCobro.value = s.id
  try {
    const { id, numero, yaExistia } = await generarDesdeSuscripcion(s, mesActual)
    if (yaExistia) window.alert(`Ya existe el cobro N°${numero} de este mes.`)
    router.push({ name: 'cobro-editar', params: { id } })
  } catch (e) {
    console.error(e)
    window.alert('No se pudo generar el cobro.')
  } finally {
    generandoCobro.value = ''
  }
}

async function borrar(s: Suscripcion) {
  if (!window.confirm(`¿Eliminar la suscripción de ${s.cliente_nombre}?`)) return
  try {
    await eliminar(s.id)
  } catch (e) {
    console.error(e)
    window.alert('No se pudo eliminar.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Suscripciones</h1>
      <Button @click="router.push({ name: 'suscripcion-nueva' })">Nueva suscripción</Button>
    </div>

    <Input
      v-model="busqueda"
      placeholder="Buscar por cliente, descripción o estado…"
      class="max-w-sm"
    />

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead class="text-right">Monto / mes</TableHead>
            <TableHead class="w-16 text-center">Día</TableHead>
            <TableHead class="w-32">Estado</TableHead>
            <TableHead class="w-0"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="6" class="text-center text-muted-foreground">Cargando…</TableCell>
          </TableRow>
          <TableRow v-else-if="!suscripcionesFiltradas.length">
            <TableCell colspan="6" class="text-center text-muted-foreground">
              Sin suscripciones.
            </TableCell>
          </TableRow>
          <TableRow v-for="s in suscripcionesFiltradas" v-else :key="s.id">
            <TableCell class="font-medium">{{ s.cliente_nombre }}</TableCell>
            <TableCell class="max-w-[24ch] truncate">{{ s.descripcion }}</TableCell>
            <TableCell class="text-right">{{ formatoCLP(s.monto) }}</TableCell>
            <TableCell class="text-center">{{ s.dia_cobro }}</TableCell>
            <TableCell>
              <Select :model-value="s.estado" @update:model-value="(v) => onEstado(s, v)">
                <SelectTrigger class="h-7 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="e in ESTADOS_SUSCRIPCION" :key="e" :value="e">{{ e }}</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell class="whitespace-nowrap text-right">
              <Button
                v-if="s.estado === 'activa'"
                variant="outline"
                size="sm"
                :disabled="generandoCobro === s.id"
                @click="generarCobroMes(s)"
              >
                {{ generandoCobro === s.id ? 'Generando…' : 'Generar cobro del mes' }}
              </Button>
              <Button variant="ghost" size="sm" @click="editar(s)">Editar</Button>
              <Button variant="ghost" size="sm" class="text-destructive" @click="borrar(s)">
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
