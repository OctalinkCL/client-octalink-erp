<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { obtenerSiguienteNumero, guardarSiguienteNumero } from './configuracion.service'

const numeros = reactive({ cotizaciones: 1, ots: 1, cobros: 1 })
const cargando = ref(false)
const guardando = ref(false)
const mensaje = ref('')

async function cargar() {
  cargando.value = true
  try {
    numeros.cotizaciones = await obtenerSiguienteNumero('cotizaciones')
    numeros.ots = await obtenerSiguienteNumero('ots')
    numeros.cobros = await obtenerSiguienteNumero('cobros')
  } catch (e) {
    console.error(e)
    mensaje.value = 'No se pudo cargar la configuración.'
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  guardando.value = true
  mensaje.value = ''
  try {
    await guardarSiguienteNumero('cotizaciones', numeros.cotizaciones)
    await guardarSiguienteNumero('ots', numeros.ots)
    await guardarSiguienteNumero('cobros', numeros.cobros)
    await cargar()
    mensaje.value = 'Guardado.'
  } catch (e) {
    console.error(e)
    mensaje.value = 'No se pudo guardar.'
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="flex max-w-md flex-col gap-5">
    <h1 class="text-2xl font-semibold">Configuración</h1>

    <div class="grid gap-1.5">
      <Label for="num-cot">Próximo número de cotización</Label>
      <Input
        id="num-cot"
        v-model.number="numeros.cotizaciones"
        type="number"
        min="1"
        step="1"
        :disabled="cargando"
      />
    </div>

    <div class="grid gap-1.5">
      <Label for="num-ot">Próximo número de OT</Label>
      <Input
        id="num-ot"
        v-model.number="numeros.ots"
        type="number"
        min="1"
        step="1"
        :disabled="cargando"
      />
    </div>

    <div class="grid gap-1.5">
      <Label for="num-cobro">Próximo número de cobro</Label>
      <Input
        id="num-cobro"
        v-model.number="numeros.cobros"
        type="number"
        min="1"
        step="1"
        :disabled="cargando"
      />
    </div>

    <p class="text-sm text-muted-foreground">
      El próximo documento que crees toma ese número y luego el contador sube solo.
    </p>

    <div class="flex items-center gap-3">
      <Button :disabled="guardando || cargando" @click="guardar">
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </Button>
      <span v-if="mensaje" class="text-sm text-muted-foreground">{{ mensaje }}</span>
    </div>
  </div>
</template>
