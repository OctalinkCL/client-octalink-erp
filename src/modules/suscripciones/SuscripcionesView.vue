<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue'
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
import { formatoCLP, mesCicloLegible } from '@/lib/formato'
import type { Cobro } from '@/modules/cobranza/types'
import { useCobranza } from '@/modules/cobranza/useCobranza'
import { useCobrosSuscripcionAnio } from '@/modules/cobranza/useCobrosSuscripcionAnio'
import GrillaMeses from './GrillaMeses.vue'
import { useSuscripciones } from './useSuscripciones'
import {
  ESTADOS_SUSCRIPCION,
  mesInicioDe,
  type EstadoSuscripcion,
  type Suscripcion,
} from './types'

const router = useRouter()
const {
  suscripcionesFiltradas,
  loading,
  error,
  busqueda,
  cambiarEstado,
  eliminar,
} = useSuscripciones()
const { generarDesdeSuscripcion } = useCobranza()

// `${suscripcion_id}:${mes_ciclo}` del cobro que se está generando
const generandoCobro = ref('')
// La grilla parte en 2026 (inicio del control) y no muestra años futuros.
const ANIO_MIN = 2026
const ANIO_MAX = Math.max(ANIO_MIN, new Date().getFullYear())
const anio = ref(ANIO_MAX)
// suscripcion_id -> mes_ciclo -> cobro, para la grilla de 12 meses
const { porSuscripcion } = useCobrosSuscripcionAnio(anio)

function mesGenerando(s: Suscripcion): string {
  const [id, mes] = generandoCobro.value.split(':')
  return id === s.id ? mes : ''
}

function abrirCobro(c: Cobro) {
  router.push({ name: 'cobro-editar', params: { id: c.id } })
}

function editar(s: Suscripcion) {
  router.push({ name: 'suscripcion-editar', params: { id: s.id } })
}

async function onEstado(s: Suscripcion, valor: unknown) {
  const estado = String(valor) as EstadoSuscripcion
  if (estado && estado !== s.estado) await cambiarEstado(s.id, estado)
}

async function generarCobroMes(s: Suscripcion, mesCiclo: string) {
  if (
    !window.confirm(
      `¿Generar el cobro de ${mesCicloLegible(mesCiclo)} para ${s.cliente_nombre}?`,
    )
  )
    return
  generandoCobro.value = `${s.id}:${mesCiclo}`
  try {
    await generarDesdeSuscripcion(s, mesCiclo)
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

    <div class="flex flex-wrap items-center justify-between gap-3">
      <Input v-model="busqueda" placeholder="Buscar por cliente, descripción o estado…" class="max-w-sm" />
      <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span class="flex items-center gap-1"><span class="size-3 rounded-[3px] bg-green-500" /> Pagado</span>
        <span class="flex items-center gap-1"><span class="size-3 rounded-[3px] bg-amber-400" /> Debe</span>
        <span class="flex items-center gap-1">
          <span class="size-3 rounded-[3px] bg-zinc-300 dark:bg-zinc-600" /> Sin cobro
        </span>
        <span class="flex items-center gap-1"><span class="size-3 rounded-[3px] border" /> No aplica</span>
      </div>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <Table variant="border">
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead class="text-right">Monto / mes</TableHead>
          <TableHead class="w-16 text-center">Día</TableHead>
          <TableHead class="w-32">Estado</TableHead>
          <TableHead class="w-72">
            <div class="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Año anterior" :disabled="anio <= ANIO_MIN"
                @click="anio--">
                <ChevronLeftIcon />
              </Button>
              <span class="font-mono">{{ anio }}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Año siguiente" :disabled="anio >= ANIO_MAX"
                @click="anio++">
                <ChevronRightIcon />
              </Button>
            </div>
          </TableHead>
          <TableHead class="w-0"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="loading">
          <TableCell colspan="7" class="text-center text-muted-foreground">Cargando…</TableCell>
        </TableRow>
        <TableRow v-else-if="!suscripcionesFiltradas.length">
          <TableCell colspan="7" class="text-center text-muted-foreground">
            Sin suscripciones.
          </TableCell>
        </TableRow>
        <TableRow v-for="s in suscripcionesFiltradas" v-else :key="s.id">
          <TableCell class="font-medium">{{ s.cliente_nombre }}</TableCell>
          <TableCell class="max-w-[24ch] truncate">{{ s.descripcion }}</TableCell>
          <TableCell class="text-right font-mono">{{ formatoCLP(s.monto) }}</TableCell>
          <TableCell class="text-center font-mono">{{ s.dia_cobro }}</TableCell>
          <TableCell>
            <Select :model-value="s.estado" @update:model-value="(v) => onEstado(s, v)">
              <SelectTrigger class="h-7 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="e in ESTADOS_SUSCRIPCION" :key="e" :value="e">{{ e }}</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <GrillaMeses :anio="anio" :mes-inicio="mesInicioDe(s)" :cobros="porSuscripcion.get(s.id)"
              :generando="mesGenerando(s)" @abrir="abrirCobro" @generar="(mes) => generarCobroMes(s, mes)" />
          </TableCell>
          <TableCell class="whitespace-nowrap text-right">
            <Button variant="ghost" size="sm" @click="editar(s)">Editar</Button>
            <Button variant="ghost" size="sm" class="text-destructive" @click="borrar(s)">
              Eliminar
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
