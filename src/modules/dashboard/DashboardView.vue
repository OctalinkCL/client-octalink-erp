<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import {
  CalendarClockIcon,
  CircleCheckIcon,
  FileTextIcon,
  RefreshCwIcon,
  RepeatIcon,
  WalletIcon,
} from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { fechaCorta, formatoCLP, mesCicloLegible } from "@/lib/formato";
import { useDashboard } from "./useDashboard";

const {
  loading,
  error,
  procesando,
  cargar,
  suscripcionesSinCobro,
  otsSinCobro,
  cotizacionesSinOt,
  cobrosPorEnviar,
  cobrosProgramados,
  cobrosPorCobrar,
  boletasPendientes,
  hayTareas,
  resumen,
  generarCobroDeSuscripcion,
  generarCobroDeOt,
  generarOtDeCotizacion,
} = useDashboard();

// 'martes, 13 de octubre'
const fechaHoy = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

// Las tres listas de cobros comparten fila: solo cambia el título y el color del punto.
const listasDeCobros = computed(() =>
  [
    {
      titulo: "Cobros por enviar",
      punto: "bg-amber-500",
      cobros: cobrosPorEnviar.value,
    },
    {
      titulo: "Pendientes",
      punto: "bg-blue-500",
      cobros: cobrosPorCobrar.value,
    },
    {
      titulo: "Boletas pendientes",
      punto: "bg-pink-500",
      cobros: boletasPendientes.value,
    },
  ].filter((l) => l.cobros.length),
);
</script>

<template>
  <div class="mx-5 px-6 pt-7 max-w-290">
    <!-- header -->
    <div class="flex items-start justify-between gap-4 mb-5">
      <div class="flex flex-col gap-1">
        <h1
          class="text-2xl font-semibold tracking-tight text-sidebar-foreground"
        >
          Good morning, Tanjim
        </h1>
        <p class="text-sm text-foreground-soft capitalize">
          {{ fechaHoy }} • Here's what's happening across your workspace.
        </p>
      </div>
      <Button :disabled="loading" @click="cargar">
        <RefreshCwIcon :class="{ 'animate-spin': loading }" />
        {{ loading ? "Actualizando…" : "Actualizar" }}
      </Button>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <!-- Resumen -->
    <div
      class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-border lg:grid-cols-4"
    >
      <div class="flex flex-col gap-2 bg-background p-5">
        <p class="flex items-center gap-2 text-sm text-muted-foreground">
          <WalletIcon class="size-4" /> Por cobrar
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          {{ formatoCLP(resumen.porCobrar) }}
        </p>
      </div>
      <div class="flex flex-col gap-2 bg-background p-5">
        <p class="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheckIcon class="size-4" /> Cobrado este mes
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          {{ formatoCLP(resumen.cobradoMes) }}
        </p>
      </div>
      <div class="flex flex-col gap-2 bg-background p-5">
        <p class="flex items-center gap-2 text-sm text-muted-foreground">
          <RepeatIcon class="size-4" /> Suscripciones activas
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          {{ resumen.suscripcionesActivas }}
        </p>
        <p class="text-sm text-muted-foreground tabular-nums">
          {{ formatoCLP(resumen.mrr) }}/mes
        </p>
      </div>
      <div class="flex flex-col gap-2 bg-background p-5">
        <p class="flex items-center gap-2 text-sm text-muted-foreground">
          <FileTextIcon class="size-4" /> Cotizaciones pendientes
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          {{ resumen.cotizacionesPendientes }}
        </p>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">Cargando…</p>

    <div
      v-else
      class="grid items-start gap-6"
      :class="{
        'lg:grid-cols-[minmax(0,1fr)_22rem]': cobrosProgramados.length,
      }"
    >
      <div class="flex min-w-0 flex-col gap-6">
        <p
          v-if="!hayTareas"
          class="rounded-xl border border-dashed border-sidebar-border p-6 text-center text-muted-foreground"
        >
          Todo al día ✅
        </p>

        <template v-else>
          <!-- 1. Suscripciones sin cobro del ciclo vigente -->
          <section
            v-if="suscripcionesSinCobro.length"
            class="overflow-hidden rounded-xl border border-sidebar-border"
          >
            <header
              class="flex items-center gap-2 border-b border-sidebar-border px-5 py-4 font-semibold"
            >
              Suscripciones sin cobro generado
              <span class="font-normal text-muted-foreground">{{
                suscripcionesSinCobro.length
              }}</span>
            </header>
            <ul class="divide-y divide-sidebar-border">
              <li
                v-for="{ suscripcion: s, mesCiclo } in suscripcionesSinCobro"
                :key="s.id"
                class="flex items-center gap-3 px-5 py-3 text-sm"
              >
                <span class="size-2 shrink-0 rounded-full bg-violet-500" />
                <span class="min-w-0 flex-1 truncate">
                  {{ s.cliente_nombre }}
                  <span class="text-muted-foreground"
                    >· {{ s.descripcion }}</span
                  >
                </span>
                <span class="hidden shrink-0 text-muted-foreground sm:inline">{{
                  mesCicloLegible(mesCiclo)
                }}</span>
                <span class="shrink-0 tabular-nums">{{
                  formatoCLP(s.monto)
                }}</span>
                <Button
                  size="sm"
                  :disabled="procesando === `sus-${s.id}`"
                  @click="generarCobroDeSuscripcion(s, mesCiclo)"
                >
                  {{
                    procesando === `sus-${s.id}`
                      ? "Generando…"
                      : "Generar cobro"
                  }}
                </Button>
              </li>
            </ul>
          </section>

          <!-- 2. OTs completadas sin cobro -->
          <section
            v-if="otsSinCobro.length"
            class="overflow-hidden rounded-xl border border-sidebar-border"
          >
            <header
              class="flex items-center gap-2 border-b border-sidebar-border px-5 py-4 font-semibold"
            >
              Órdenes de trabajo completadas sin cobro
              <span class="font-normal text-muted-foreground">{{
                otsSinCobro.length
              }}</span>
            </header>
            <ul class="divide-y divide-sidebar-border">
              <li
                v-for="o in otsSinCobro"
                :key="o.id"
                class="flex items-center gap-3 px-5 py-3 text-sm"
              >
                <span class="size-2 shrink-0 rounded-full bg-emerald-500" />
                <span class="min-w-0 flex-1 truncate">
                  {{ o.cliente_nombre }}
                  <span class="text-muted-foreground"
                    >· OT N°{{ o.numero }}</span
                  >
                </span>
                <span class="shrink-0 tabular-nums">{{
                  formatoCLP(o.monto)
                }}</span>
                <Button
                  size="sm"
                  :disabled="procesando === `ot-${o.id}`"
                  @click="generarCobroDeOt(o)"
                >
                  {{
                    procesando === `ot-${o.id}` ? "Generando…" : "Generar cobro"
                  }}
                </Button>
              </li>
            </ul>
          </section>

          <!-- 3. Cotizaciones aceptadas sin OT -->
          <section
            v-if="cotizacionesSinOt.length"
            class="overflow-hidden rounded-xl border border-sidebar-border"
          >
            <header
              class="flex items-center gap-2 border-b border-sidebar-border px-5 py-4 font-semibold"
            >
              Cotizaciones aceptadas sin OT
              <span class="font-normal text-muted-foreground">{{
                cotizacionesSinOt.length
              }}</span>
            </header>
            <ul class="divide-y divide-sidebar-border">
              <li
                v-for="q in cotizacionesSinOt"
                :key="q.id"
                class="flex items-center gap-3 px-5 py-3 text-sm"
              >
                <span class="size-2 shrink-0 rounded-full bg-orange-500" />
                <span class="min-w-0 flex-1 truncate">
                  {{ q.cliente_nombre }}
                  <span class="text-muted-foreground"
                    >· Cotización N°{{ q.numero }}</span
                  >
                </span>
                <span class="shrink-0 tabular-nums">{{
                  formatoCLP(q.total)
                }}</span>
                <Button
                  size="sm"
                  :disabled="procesando === `cot-${q.id}`"
                  @click="generarOtDeCotizacion(q)"
                >
                  {{
                    procesando === `cot-${q.id}` ? "Generando…" : "Generar OT"
                  }}
                </Button>
              </li>
            </ul>
          </section>

          <!-- 4–6. Cobros por enviar, pendientes y boletas pendientes -->
          <section
            v-for="lista in listasDeCobros"
            :key="lista.titulo"
            class="overflow-hidden rounded-xl border border-sidebar-border"
          >
            <header
              class="flex items-center gap-2 border-b border-sidebar-border px-5 py-4 font-semibold"
            >
              {{ lista.titulo }}
              <span class="font-normal text-muted-foreground">{{
                lista.cobros.length
              }}</span>
            </header>
            <ul class="divide-y divide-sidebar-border">
              <li
                v-for="c in lista.cobros"
                :key="c.id"
                class="flex items-center gap-3 px-5 py-3 text-sm"
              >
                <span
                  class="size-2 shrink-0 rounded-full"
                  :class="lista.punto"
                />
                <span class="min-w-0 flex-1 truncate">
                  {{ c.cliente_nombre }}
                  <span class="text-muted-foreground">· N°{{ c.numero }}</span>
                </span>
                <span class="shrink-0 tabular-nums">{{
                  formatoCLP(c.monto)
                }}</span>
                <Button as-child size="sm" variant="outline">
                  <RouterLink
                    :to="{ name: 'cobro-editar', params: { id: c.id } }"
                    >Ver</RouterLink
                  >
                </Button>
              </li>
            </ul>
          </section>
        </template>
      </div>

      <!-- Programados: cobros con fecha futura. No cuentan como tarea hasta su fecha. -->
      <section
        v-if="cobrosProgramados.length"
        class="overflow-hidden rounded-xl border border-sidebar-border"
      >
        <header class="flex items-center gap-2 px-5 pt-4 pb-2 font-semibold">
          Cobros programados
          <span class="font-normal text-muted-foreground">{{
            cobrosProgramados.length
          }}</span>
          <CalendarClockIcon class="ml-auto size-4 text-muted-foreground" />
        </header>
        <ul class="pb-2">
          <li v-for="c in cobrosProgramados" :key="c.id">
            <RouterLink
              :to="{ name: 'cobro-editar', params: { id: c.id } }"
              class="flex items-start gap-3 px-5 py-2.5 text-sm hover:bg-muted/50"
            >
              <span
                class="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/50"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ c.cliente_nombre }}</span>
                <span class="block text-xs text-muted-foreground">
                  N°{{ c.numero }} · desde el {{ fechaCorta(c.fecha_cobro) }}
                </span>
              </span>
              <span class="shrink-0 tabular-nums">{{
                formatoCLP(c.monto)
              }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
