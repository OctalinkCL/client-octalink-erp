import { onBeforeUnmount, ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

/** Segundo nivel del breadcrumb ("OT N°75"); lo lee AppHeader. */
export const detalleBreadcrumb = ref('')

/**
 * Lo llama la vista de detalle con su título: la sección sale de la ruta, pero
 * el número del registro solo lo conoce la vista una vez que lo cargó.
 */
export function useBreadcrumb(titulo: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    detalleBreadcrumb.value = toValue(titulo)
  })
  // Antes de desmontar (no después): así no pisa el título de la vista que entra.
  onBeforeUnmount(() => {
    detalleBreadcrumb.value = ''
  })
}
