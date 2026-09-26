<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatoCLP } from '@/lib/formato'
import { ESTADOS_OT, type EstadoOt, type Ot } from './types'

// Vista kanban de OTs. Solo presentación: los cambios los hace OtsView vía emits,
// con la misma lógica que usa la tabla. Drag & drop nativo HTML5 (pensado para desktop).

const props = defineProps<{
  ots: Ot[]
  loading: boolean
  generandoCobro: string
}>()

const emit = defineEmits<{
  'cambiar-estado': [ot: Ot, estado: EstadoOt]
  editar: [ot: Ot]
  'generar-cobro': [ot: Ot]
}>()

const LABEL_ESTADO: Record<EstadoOt, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completada: 'Completada',
}

const arrastrando = ref<Ot | null>(null)
const columnaSobre = ref<EstadoOt | null>(null)

function otsDe(estado: EstadoOt) {
  return props.ots.filter((o) => o.estado === estado)
}

function onDragStart(e: DragEvent, o: Ot) {
  arrastrando.value = o
  e.dataTransfer?.setData('text/plain', o.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  arrastrando.value = null
  columnaSobre.value = null
}

function onDrop(estado: EstadoOt) {
  const o = arrastrando.value
  onDragEnd()
  if (o && o.estado !== estado) emit('cambiar-estado', o, estado)
}
</script>

<template>
  <p v-if="loading" class="text-sm text-muted-foreground">Cargando…</p>

  <div v-else class="grid grid-cols-3 gap-4">
    <section
      v-for="estado in ESTADOS_OT"
      :key="estado"
      class="flex min-h-64 flex-col gap-2 rounded-lg border bg-muted/40 p-2 transition-colors"
      :class="{ 'border-primary bg-primary/5': columnaSobre === estado }"
      @dragover.prevent="columnaSobre = estado"
      @drop.prevent="onDrop(estado)"
    >
      <header class="flex items-center justify-between px-1 py-1">
        <h2 class="text-sm font-medium">{{ LABEL_ESTADO[estado] }}</h2>
        <span class="text-xs text-muted-foreground">{{ otsDe(estado).length }}</span>
      </header>

      <article
        v-for="o in otsDe(estado)"
        :key="o.id"
        draggable="true"
        class="flex cursor-grab flex-col gap-1.5 rounded-md border bg-background p-3 text-sm shadow-xs hover:border-primary/50 active:cursor-grabbing"
        :class="{ 'opacity-50': arrastrando?.id === o.id }"
        @dragstart="onDragStart($event, o)"
        @dragend="onDragEnd"
        @click="emit('editar', o)"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium">N°{{ o.numero }}</span>
          <span class="font-medium">{{ formatoCLP(o.monto) }}</span>
        </div>
        <p class="truncate text-muted-foreground">{{ o.cliente_nombre }}</p>
        <p class="line-clamp-2">{{ o.descripcion }}</p>
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <Badge
            :class="
              o.emite_boleta
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            "
          >
            {{ o.emite_boleta ? 'Con boleta' : 'Sin boleta' }}
          </Badge>
          <Badge
            v-if="o.cobro_generado"
            class="bg-green-500/10 text-green-600 dark:text-green-400"
          >
            Cobro generado
          </Badge>
        </div>
        <Button
          v-if="o.estado === 'completada' && !o.cobro_generado"
          variant="outline"
          size="sm"
          class="mt-1"
          :disabled="generandoCobro === o.id"
          @click.stop="emit('generar-cobro', o)"
        >
          {{ generandoCobro === o.id ? 'Generando…' : 'Generar cobro' }}
        </Button>
      </article>

      <p
        v-if="!otsDe(estado).length"
        class="px-1 py-4 text-center text-xs text-muted-foreground"
      >
        Sin OTs.
      </p>
    </section>
  </div>
</template>
