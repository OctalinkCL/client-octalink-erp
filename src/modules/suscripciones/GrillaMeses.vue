<script setup lang="ts">
import { computed } from 'vue'
import { formatoCLP, mesCicloActual, mesCicloLegible } from '@/lib/formato'
import { numeroCobro, type Cobro } from '@/modules/cobranza/types'

// 12 cuadrados de un año para una suscripción. Solo presentación: el clic se
// emite y SuscripcionesView decide (abrir el cobro o generarlo).

const props = defineProps<{
  anio: number
  mesInicio: string // 'YYYY-MM'
  diaCobro: number // antes de este día, el mes en curso aún no se exige
  cobros: Map<string, Cobro> | undefined // mes_ciclo -> cobro
  generando: string // mes_ciclo que se está generando, o ''
}>()

const emit = defineEmits<{
  abrir: [cobro: Cobro]
  generar: [mesCiclo: string]
}>()

type EstadoMes = 'pagado' | 'debe' | 'sin_cobro' | 'por_venir' | 'no_aplica'

const CLASE: Record<EstadoMes, string> = {
  pagado: 'bg-green-500 border-green-500 hover:bg-green-600',
  debe: 'bg-amber-400 border-amber-400 hover:bg-amber-500',
  sin_cobro: 'bg-zinc-300 border-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:border-zinc-600',
  por_venir: 'border-border bg-transparent hover:bg-muted',
  no_aplica: 'border-border bg-transparent cursor-default',
}

const LABEL: Record<EstadoMes, string> = {
  pagado: 'pagado',
  debe: 'cobrado, sin pagar',
  sin_cobro: 'sin cobro generado',
  por_venir: 'aún no corresponde cobrar',
  no_aplica: 'no aplica',
}

const INICIAL = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

const mesActual = mesCicloActual()
const antesDelDiaDeCobro = computed(() => new Date().getDate() < (props.diaCobro || 1))

const meses = computed(() =>
  INICIAL.map((inicial, i) => {
    const mes = `${props.anio}-${String(i + 1).padStart(2, '0')}`
    const cobro = props.cobros?.get(mes)
    let estado: EstadoMes
    if (cobro) estado = cobro.estado_pago === 'pagado' ? 'pagado' : 'debe'
    else if (mes > mesActual || (props.mesInicio && mes < props.mesInicio)) estado = 'no_aplica'
    else if (mes === mesActual && antesDelDiaDeCobro.value) estado = 'por_venir'
    else estado = 'sin_cobro'

    let titulo = `${mesCicloLegible(mes)} · ${LABEL[estado]}`
    if (cobro) titulo += ` · Cobro N°${numeroCobro(cobro)} · ${formatoCLP(cobro.monto)}`
    else if (estado === 'sin_cobro') titulo += ' · clic para generarlo'
    else if (estado === 'por_venir') titulo += ' · clic para generarlo antes'

    return { mes, inicial, cobro, estado, titulo, esActual: mes === mesActual }
  }),
)

const deuda = computed(() =>
  meses.value
    .filter((m) => m.estado === 'debe')
    .reduce((acc, m) => acc + (m.cobro?.monto || 0), 0),
)

function onClick(m: (typeof meses.value)[number]) {
  if (m.cobro) emit('abrir', m.cobro)
  else if ((m.estado === 'sin_cobro' || m.estado === 'por_venir') && !props.generando)
    emit('generar', m.mes)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <div class="flex gap-0.5">
      <button
        v-for="m in meses"
        :key="m.mes"
        type="button"
        :title="m.titulo"
        :aria-label="m.titulo"
        :disabled="m.estado === 'no_aplica'"
        class="flex size-4 items-center justify-center rounded-[3px] border text-[8px] leading-none transition-colors"
        :class="[
          CLASE[m.estado],
          m.estado === 'no_aplica' || m.estado === 'por_venir'
            ? 'text-muted-foreground/60'
            : 'text-white/90',
          { 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background': m.esActual },
          { 'animate-pulse': generando === m.mes },
        ]"
        @click="onClick(m)"
      >
        {{ m.inicial }}
      </button>
    </div>
    <span v-if="deuda" class="whitespace-nowrap text-xs font-medium text-amber-600 dark:text-amber-400">
      Debe {{ formatoCLP(deuda) }}
    </span>
  </div>
</template>
