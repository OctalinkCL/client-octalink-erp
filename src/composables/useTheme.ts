import { useColorMode } from '@vueuse/core'

let mode: ReturnType<typeof useColorMode> | null = null

export function useTheme() {
  if (!mode)
    mode = useColorMode()

  return { theme: mode.store }
}
