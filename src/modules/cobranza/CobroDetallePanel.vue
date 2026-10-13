<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CalendarClockIcon,
  CalendarIcon,
  CircleCheckIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  FolderIcon,
  ReceiptTextIcon,
  RepeatIcon,
  UserIcon,
  WalletIcon,
} from '@lucide/vue'
import DetalleCampo from '@/components/detalle/DetalleCampo.vue'
import DetallePanel from '@/components/detalle/DetallePanel.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fechaCorta, fechaISO, formatoCLP, mesCicloLegible } from '@/lib/formato'
import { useCobro } from './useCobro'
import {
  CLASE_BOLETA,
  CLASE_PAGO,
  LABEL_ESTADO_BOLETA,
  LABEL_EVENTO_COBRO,
  fechaEmisionDe,
  mesDeCobro,
  numeroCobro,
} from './types'

// Detalle de un cobro en panel lateral, solo lectura. Para editar o cambiar
// estados se abre la ficha completa.

const props = defineProps<{
  /** Id del cobro a mostrar; '' = panel cerrado. */
  id: string
}>()
const emit = defineEmits<{ cerrar: [] }>()

const formatoFecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

// Se conserva el último id para que el contenido no desaparezca mientras el
// panel se cierra.
const idVisible = ref(props.id)
watch(
  () => props.id,
  (v) => {
    if (v) idVisible.value = v
  },
)

const abierto = computed({
  get: () => !!props.id,
  set: (v) => {
    if (!v) emit('cerrar')
  },
})

const { cobro, loading, error } = useCobro(idVisible)

const origenTexto = computed(() => {
  const c = cobro.value
  if (!c) return ''
  if (c.origen === 'ot') {
    const cot = c.cotizacion_numero ? ` · cotización N°${c.cotizacion_numero}` : ''
    return `OT N°${c.ot_numero}${cot}`
  }
  if (c.origen === 'suscripcion') return 'Suscripción mensual'
  return 'Cobro directo'
})
</script>

<template>
  <DetallePanel v-model:open="abierto" :titulo="cobro ? `Cobro N°${numeroCobro(cobro)}` : 'Cobro'">
    <template v-if="cobro" #encabezado>
      <span class="truncate font-medium">{{ cobro.cliente_nombre }}</span>
      <span class="text-foreground-faint">/</span>
      <span class="shrink-0 font-mono text-foreground-soft">N°{{ numeroCobro(cobro) }}</span>
    </template>
    <template v-if="cobro" #acciones>
      <Button as-child variant="ghost">
        <RouterLink :to="{ name: 'cobro-editar', params: { id: cobro.id } }">
          <ExternalLinkIcon />
          Abrir ficha
        </RouterLink>
      </Button>
    </template>

    <p v-if="loading" class="text-sm text-muted-foreground">Cargando…</p>
    <p v-else-if="error" class="text-sm text-destructive">{{ error }}</p>

    <template v-else-if="cobro">
      <h2 class="text-2xl font-semibold tracking-tight">
        {{ cobro.concepto || `Cobro N°${numeroCobro(cobro)}` }}
      </h2>

      <dl class="mt-6 flex flex-col">
        <DetalleCampo :icono="CircleDotIcon" etiqueta="Pago">
          <Badge class="capitalize" :class="CLASE_PAGO[cobro.estado_pago]">{{
            cobro.estado_pago
          }}</Badge>
        </DetalleCampo>
        <DetalleCampo :icono="ReceiptTextIcon" etiqueta="Boleta">
          <Badge :class="CLASE_BOLETA[cobro.estado_boleta]">{{
            LABEL_ESTADO_BOLETA[cobro.estado_boleta]
          }}</Badge>
        </DetalleCampo>
        <DetalleCampo :icono="WalletIcon" etiqueta="Monto">
          <span class="font-mono tabular-nums">{{ formatoCLP(cobro.monto) }}</span>
        </DetalleCampo>
        <DetalleCampo :icono="UserIcon" etiqueta="Cliente">
          {{ cobro.cliente_nombre }}
        </DetalleCampo>
        <DetalleCampo :icono="CalendarIcon" etiqueta="Emisión">
          {{ fechaCorta(fechaEmisionDe(cobro)) }}
        </DetalleCampo>
        <DetalleCampo v-if="cobro.fecha_cobro" :icono="CalendarClockIcon" etiqueta="Cobrar desde">
          {{ fechaCorta(cobro.fecha_cobro) }}
        </DetalleCampo>
        <DetalleCampo v-if="cobro.fecha_pago" :icono="CircleCheckIcon" etiqueta="Fecha de pago">
          {{ fechaCorta(fechaISO(cobro.fecha_pago.toDate())) }}
        </DetalleCampo>
        <DetalleCampo v-if="mesDeCobro(cobro)" :icono="RepeatIcon" etiqueta="Mes">
          {{ mesCicloLegible(mesDeCobro(cobro)) }}
        </DetalleCampo>
        <DetalleCampo :icono="FolderIcon" etiqueta="Origen">
          {{ origenTexto }}
        </DetalleCampo>
      </dl>

      <section v-if="cobro.notas" class="mt-8">
        <h3 class="text-base font-semibold">Notas</h3>
        <p class="mt-2 text-sm whitespace-pre-line text-foreground-soft">{{ cobro.notas }}</p>
      </section>

      <section v-if="cobro.historial?.length" class="mt-8">
        <h3 class="text-base font-semibold">Historial</h3>
        <ul class="mt-2 flex flex-col">
          <li
            v-for="(h, i) in cobro.historial"
            :key="i"
            class="flex min-h-8 items-center justify-between gap-3 text-sm"
          >
            <span>{{ LABEL_EVENTO_COBRO[h.tipo] }}</span>
            <span class="text-foreground-soft">{{ formatoFecha.format(h.fecha.toDate()) }}</span>
          </li>
        </ul>
      </section>
    </template>
  </DetallePanel>
</template>
