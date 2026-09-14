<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ClienteFormDialog from './ClienteFormDialog.vue'
import { useClientes } from './useClientes'
import type { Cliente, ClienteInput } from './types'

const { clientesFiltrados, loading, error, busqueda, crear, actualizar, eliminar } =
  useClientes()

const dialogAbierto = ref(false)
const clienteEditando = ref<Cliente | null>(null)
const guardando = ref(false)

function nuevo() {
  clienteEditando.value = null
  dialogAbierto.value = true
}

function editar(cliente: Cliente) {
  clienteEditando.value = cliente
  dialogAbierto.value = true
}

async function guardar(input: ClienteInput) {
  guardando.value = true
  try {
    if (clienteEditando.value) {
      await actualizar(clienteEditando.value.id, input)
    } else {
      await crear(input)
    }
    dialogAbierto.value = false
  } catch (e) {
    console.error(e)
    window.alert('No se pudo guardar el cliente.')
  } finally {
    guardando.value = false
  }
}

async function borrar(cliente: Cliente) {
  if (!window.confirm(`¿Eliminar a ${cliente.nombre}?`)) return
  try {
    await eliminar(cliente.id)
  } catch (e) {
    console.error(e)
    window.alert('No se pudo eliminar el cliente.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Clientes</h1>
      <Button @click="nuevo">Nuevo cliente</Button>
    </div>

    <Input
      v-model="busqueda"
      placeholder="Buscar por nombre, RUT, email o contacto…"
      class="max-w-sm"
    />

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>RUT</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead class="w-0"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="6" class="text-center text-muted-foreground">Cargando…</TableCell>
          </TableRow>
          <TableRow v-else-if="!clientesFiltrados.length">
            <TableCell colspan="6" class="text-center text-muted-foreground">Sin clientes.</TableCell>
          </TableRow>
          <TableRow v-for="c in clientesFiltrados" v-else :key="c.id">
            <TableCell class="font-medium">{{ c.nombre }}</TableCell>
            <TableCell>{{ c.rut }}</TableCell>
            <TableCell>{{ c.email }}</TableCell>
            <TableCell>{{ c.telefono }}</TableCell>
            <TableCell>{{ c.contacto }}</TableCell>
            <TableCell class="whitespace-nowrap text-right">
              <Button variant="ghost" size="sm" @click="editar(c)">Editar</Button>
              <Button variant="ghost" size="sm" class="text-destructive" @click="borrar(c)">
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <ClienteFormDialog
      v-model:open="dialogAbierto"
      :cliente="clienteEditando"
      :saving="guardando"
      @save="guardar"
    />
  </div>
</template>
