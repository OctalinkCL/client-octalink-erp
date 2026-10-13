<script setup lang="ts">
import { XIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet'

// Panel lateral genérico para ver el detalle de un registro sin salir de la
// lista. No conoce ningún módulo: cada uno monta su contenido en los slots.
// - #encabezado: migas cortas (ej. cliente / N°).
// - #acciones: botones a la izquierda de cerrar.
// - default: cuerpo con scroll.
// En móvil ocupa todo el ancho.

defineProps<{
  /** Título accesible del panel (lo leen los lectores de pantalla). */
  titulo: string
}>()

const abierto = defineModel<boolean>('open', { required: true })
</script>

<template>
  <Sheet v-model:open="abierto">
    <SheetContent
      side="right"
      :show-close-button="false"
      :aria-describedby="undefined"
      class="gap-0 bg-background data-[side=right]:w-full data-[side=right]:sm:max-w-155"
    >
      <header
        class="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border pr-3 pl-6"
      >
        <SheetTitle class="sr-only">{{ titulo }}</SheetTitle>
        <div class="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <slot name="encabezado" />
        </div>
        <slot name="acciones" />
        <SheetClose as-child>
          <Button variant="ghost" size="icon">
            <XIcon />
            <span class="sr-only">Cerrar</span>
          </Button>
        </SheetClose>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-7">
        <slot />
      </div>
    </SheetContent>
  </Sheet>
</template>
