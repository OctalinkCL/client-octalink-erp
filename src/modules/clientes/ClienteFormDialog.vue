<script setup lang="ts">
import { reactive, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type Cliente, type ClienteInput, clienteInputVacio } from './types'

const props = defineProps<{
  open: boolean
  cliente: Cliente | null
  saving: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [input: ClienteInput]
}>()

const form = reactive<ClienteInput>(clienteInputVacio())

// Al abrir, precargar datos (editar) o limpiar (nuevo).
watch(
  () => props.open,
  (abierto) => {
    if (!abierto) return
    const base = props.cliente
      ? {
          nombre: props.cliente.nombre,
          rut: props.cliente.rut,
          email: props.cliente.email,
          telefono: props.cliente.telefono,
          direccion: props.cliente.direccion,
          contacto: props.cliente.contacto,
          notas: props.cliente.notas,
        }
      : clienteInputVacio()
    Object.assign(form, base)
  },
)

function submit() {
  emit('save', { ...form })
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ cliente ? 'Editar cliente' : 'Nuevo cliente' }}</DialogTitle>
        <DialogDescription>Datos de contacto y facturación.</DialogDescription>
      </DialogHeader>

      <form class="grid gap-3" @submit.prevent="submit">
        <div class="grid gap-1.5">
          <Label for="nombre">Nombre</Label>
          <Input id="nombre" v-model="form.nombre" required />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-1.5">
            <Label for="rut">RUT</Label>
            <Input id="rut" v-model="form.rut" placeholder="12.345.678-9" />
          </div>
          <div class="grid gap-1.5">
            <Label for="telefono">Teléfono</Label>
            <Input id="telefono" v-model="form.telefono" />
          </div>
        </div>

        <div class="grid gap-1.5">
          <Label for="email">Email</Label>
          <Input id="email" v-model="form.email" type="email" />
        </div>

        <div class="grid gap-1.5">
          <Label for="contacto">Persona de contacto</Label>
          <Input id="contacto" v-model="form.contacto" />
        </div>

        <div class="grid gap-1.5">
          <Label for="direccion">Dirección</Label>
          <Input id="direccion" v-model="form.direccion" />
        </div>

        <div class="grid gap-1.5">
          <Label for="notas">Notas</Label>
          <Textarea id="notas" v-model="form.notas" />
        </div>

        <DialogFooter class="mt-2">
          <Button type="button" variant="outline" :disabled="saving" @click="emit('update:open', false)">
            Cancelar
          </Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
