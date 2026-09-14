<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileTextIcon, PencilIcon, Trash2Icon } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
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
import { useCobranza } from './useCobranza'
import {
  ESTADOS_BOLETA,
  ESTADOS_PAGO,
  LABEL_ESTADO_BOLETA,
  type Cobro,
  type EstadoBoleta,
  type EstadoPago,
} from './types'

const router = useRouter()
const {
  cobrosFiltrados,
  loading,
  error,
  busqueda,
  filtroPago,
  marcarPago,
  marcarBoleta,
  eliminar,
} = useCobranza()

const CLASE_PAGO: Record<EstadoPago, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  enviado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  pagado: 'bg-green-500/10 text-green-600 dark:text-green-400',
}
const CLASE_BOLETA: Record<EstadoBoleta, string> = {
  no_aplica: 'bg-muted text-muted-foreground',
  pendiente: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  enviada: 'bg-green-500/10 text-green-600 dark:text-green-400',
}

const editandoId = ref<string | null>(null)
const enEdicion = (c: Cobro) => editandoId.value === c.id

function toggleEdicion(c: Cobro) {
  editandoId.value = enEdicion(c) ? null : c.id
}

function verDetalle(c: Cobro) {
  router.push({ name: 'cobro-editar', params: { id: c.id } })
}

function onFiltroPago(valor: unknown) {
  filtroPago.value = String(valor) as EstadoPago | 'todos'
}

async function onPago(c: Cobro, valor: unknown) {
  const estado = String(valor) as EstadoPago
  if (estado && estado !== c.estado_pago) await marcarPago(c.id, estado, null)
}

async function onBoleta(c: Cobro, valor: unknown) {
  const estado = String(valor) as EstadoBoleta
  if (estado && estado !== c.estado_boleta) await marcarBoleta(c.id, estado)
}

async function pdf(c: Cobro) {
  const { descargarOrdenDeCobro } = await import('./ordenDeCobroPdf')
  descargarOrdenDeCobro(c)
}

async function borrar(c: Cobro) {
  if (!window.confirm(`¿Eliminar el cobro N°${c.numero}?`)) return
  try {
    await eliminar(c.id)
  } catch (e) {
    console.error(e)
    window.alert('No se pudo eliminar.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Cobranza</h1>
      <Button @click="router.push({ name: 'cobro-nuevo' })">Cobro directo</Button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Input
        v-model="busqueda"
        placeholder="Buscar por número, cliente, concepto o estado…"
        class="max-w-sm"
      />
      <Select :model-value="filtroPago" @update:model-value="onFiltroPago">
        <SelectTrigger class="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem v-for="e in ESTADOS_PAGO" :key="e" :value="e" class="capitalize">
            {{ e }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-14">N°</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead class="text-right">Monto</TableHead>
            <TableHead class="w-36">Pago</TableHead>
            <TableHead class="w-40">Boleta</TableHead>
            <TableHead class="w-0"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="7" class="text-center text-muted-foreground">Cargando…</TableCell>
          </TableRow>
          <TableRow v-else-if="!cobrosFiltrados.length">
            <TableCell colspan="7" class="text-center text-muted-foreground">Sin cobros.</TableCell>
          </TableRow>
          <TableRow v-for="c in cobrosFiltrados" v-else :key="c.id">
            <TableCell class="font-medium">
              <button type="button" class="hover:underline" @click="verDetalle(c)">
                {{ c.numero }}
              </button>
            </TableCell>
            <TableCell>{{ c.cliente_nombre }}</TableCell>
            <TableCell class="max-w-[24ch] truncate">{{ c.concepto }}</TableCell>
            <TableCell class="text-right">{{ formatoCLP(c.monto) }}</TableCell>
            <TableCell>
              <Select
                v-if="enEdicion(c)"
                :model-value="c.estado_pago"
                @update:model-value="(v) => onPago(c, v)"
              >
                <SelectTrigger class="h-7 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="e in ESTADOS_PAGO" :key="e" :value="e">{{ e }}</SelectItem>
                </SelectContent>
              </Select>
              <Badge v-else class="capitalize" :class="CLASE_PAGO[c.estado_pago]">
                {{ c.estado_pago }}
              </Badge>
            </TableCell>
            <TableCell>
              <Select
                v-if="enEdicion(c)"
                :model-value="c.estado_boleta"
                @update:model-value="(v) => onBoleta(c, v)"
              >
                <SelectTrigger class="h-7 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="e in ESTADOS_BOLETA" :key="e" :value="e">
                    {{ LABEL_ESTADO_BOLETA[e] }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge v-else :class="CLASE_BOLETA[c.estado_boleta]">
                {{ LABEL_ESTADO_BOLETA[c.estado_boleta] }}
              </Badge>
            </TableCell>
            <TableCell class="whitespace-nowrap text-right">
              <Button
                variant="ghost"
                size="icon-sm"
                title="Descargar PDF"
                aria-label="Descargar PDF"
                @click="pdf(c)"
              >
                <FileTextIcon />
              </Button>
              <Button
                :variant="enEdicion(c) ? 'secondary' : 'ghost'"
                size="icon-sm"
                title="Editar estado"
                aria-label="Editar estado"
                @click="toggleEdicion(c)"
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                class="text-destructive"
                title="Eliminar"
                aria-label="Eliminar"
                @click="borrar(c)"
              >
                <Trash2Icon />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
