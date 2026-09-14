<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { formatoCLP, mesCicloLegible } from '@/lib/formato'
import { useDashboard } from './useDashboard'

const {
  loading,
  error,
  procesando,
  mesActual,
  cargar,
  suscripcionesSinCobro,
  otsSinCobro,
  cotizacionesSinOt,
  cobrosPorEnviar,
  cobrosPorCobrar,
  boletasPendientes,
  hayTareas,
  resumen,
  generarCobroDeSuscripcion,
  generarCobroDeOt,
  generarOtDeCotizacion,
} = useDashboard()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <Button variant="outline" size="sm" :disabled="loading" @click="cargar">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </Button>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <!-- Resumen -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">Por cobrar</p>
        <p class="text-lg font-semibold">{{ formatoCLP(resumen.porCobrar) }}</p>
      </div>
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">Cobrado este mes</p>
        <p class="text-lg font-semibold">{{ formatoCLP(resumen.cobradoMes) }}</p>
      </div>
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">Suscripciones activas</p>
        <p class="text-lg font-semibold">
          {{ resumen.suscripcionesActivas }}
          <span class="text-sm font-normal text-muted-foreground">
            · {{ formatoCLP(resumen.mrr) }}/mes
          </span>
        </p>
      </div>
      <div class="rounded-lg border p-3">
        <p class="text-xs text-muted-foreground">Cotizaciones pendientes</p>
        <p class="text-lg font-semibold">{{ resumen.cotizacionesPendientes }}</p>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">Cargando…</p>

    <p
      v-else-if="!hayTareas"
      class="rounded-lg border border-dashed p-6 text-center text-muted-foreground"
    >
      Todo al día ✅
    </p>

    <template v-else>
      <!-- 1. Suscripciones sin cobro del mes -->
      <section v-if="suscripcionesSinCobro.length" class="rounded-lg border">
        <header class="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
          Suscripciones sin cobro de {{ mesCicloLegible(mesActual) }}
          ({{ suscripcionesSinCobro.length }})
        </header>
        <ul class="divide-y">
          <li
            v-for="s in suscripcionesSinCobro"
            :key="s.id"
            class="flex items-center justify-between gap-4 px-4 py-2 text-sm"
          >
            <span>
              {{ s.cliente_nombre }} — {{ s.descripcion }}
              <span class="text-muted-foreground">· {{ formatoCLP(s.monto) }}</span>
            </span>
            <Button
              size="sm"
              :disabled="procesando === `sus-${s.id}`"
              @click="generarCobroDeSuscripcion(s)"
            >
              {{ procesando === `sus-${s.id}` ? 'Generando…' : 'Generar cobro' }}
            </Button>
          </li>
        </ul>
      </section>

      <!-- 2. OTs completadas sin cobro -->
      <section v-if="otsSinCobro.length" class="rounded-lg border">
        <header class="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
          Órdenes de trabajo completadas sin cobro ({{ otsSinCobro.length }})
        </header>
        <ul class="divide-y">
          <li
            v-for="o in otsSinCobro"
            :key="o.id"
            class="flex items-center justify-between gap-4 px-4 py-2 text-sm"
          >
            <span>
              OT N°{{ o.numero }} — {{ o.cliente_nombre }}
              <span class="text-muted-foreground">· {{ formatoCLP(o.monto) }}</span>
            </span>
            <Button
              size="sm"
              :disabled="procesando === `ot-${o.id}`"
              @click="generarCobroDeOt(o)"
            >
              {{ procesando === `ot-${o.id}` ? 'Generando…' : 'Generar cobro' }}
            </Button>
          </li>
        </ul>
      </section>

      <!-- 3. Cotizaciones aceptadas sin OT -->
      <section v-if="cotizacionesSinOt.length" class="rounded-lg border">
        <header class="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
          Cotizaciones aceptadas sin OT ({{ cotizacionesSinOt.length }})
        </header>
        <ul class="divide-y">
          <li
            v-for="q in cotizacionesSinOt"
            :key="q.id"
            class="flex items-center justify-between gap-4 px-4 py-2 text-sm"
          >
            <span>
              Cotización N°{{ q.numero }} — {{ q.cliente_nombre }}
              <span class="text-muted-foreground">· {{ formatoCLP(q.total) }}</span>
            </span>
            <Button
              size="sm"
              :disabled="procesando === `cot-${q.id}`"
              @click="generarOtDeCotizacion(q)"
            >
              {{ procesando === `cot-${q.id}` ? 'Generando…' : 'Generar OT' }}
            </Button>
          </li>
        </ul>
      </section>

      <!-- 4. Cobros por enviar -->
      <section v-if="cobrosPorEnviar.length" class="rounded-lg border">
        <header class="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
          Cobros por enviar ({{ cobrosPorEnviar.length }})
        </header>
        <ul class="divide-y">
          <li
            v-for="c in cobrosPorEnviar"
            :key="c.id"
            class="flex items-center justify-between gap-4 px-4 py-2 text-sm"
          >
            <span>
              N°{{ c.numero }} — {{ c.cliente_nombre }}
              <span class="text-muted-foreground">· {{ formatoCLP(c.monto) }}</span>
            </span>
            <Button as-child size="sm" variant="outline">
              <RouterLink :to="{ name: 'cobro-editar', params: { id: c.id } }">Ver</RouterLink>
            </Button>
          </li>
        </ul>
      </section>

      <!-- 5. Por cobrar -->
      <section v-if="cobrosPorCobrar.length" class="rounded-lg border">
        <header class="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
          Por cobrar ({{ cobrosPorCobrar.length }})
        </header>
        <ul class="divide-y">
          <li
            v-for="c in cobrosPorCobrar"
            :key="c.id"
            class="flex items-center justify-between gap-4 px-4 py-2 text-sm"
          >
            <span>
              N°{{ c.numero }} — {{ c.cliente_nombre }}
              <span class="text-muted-foreground">· {{ formatoCLP(c.monto) }}</span>
            </span>
            <Button as-child size="sm" variant="outline">
              <RouterLink :to="{ name: 'cobro-editar', params: { id: c.id } }">Ver</RouterLink>
            </Button>
          </li>
        </ul>
      </section>

      <!-- 6. Boletas pendientes -->
      <section v-if="boletasPendientes.length" class="rounded-lg border">
        <header class="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">
          Boletas pendientes ({{ boletasPendientes.length }})
        </header>
        <ul class="divide-y">
          <li
            v-for="c in boletasPendientes"
            :key="c.id"
            class="flex items-center justify-between gap-4 px-4 py-2 text-sm"
          >
            <span>
              N°{{ c.numero }} — {{ c.cliente_nombre }}
              <span class="text-muted-foreground">· {{ formatoCLP(c.monto) }}</span>
            </span>
            <Button as-child size="sm" variant="outline">
              <RouterLink :to="{ name: 'cobro-editar', params: { id: c.id } }">Ver</RouterLink>
            </Button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
