import { useStorage } from '@vueuse/core'
import { play, set as foleySet } from '@foleyjs/vue'
import { effectScope, watch } from 'vue'

// Scope "detached" por la misma razón que useTheme.ts: el watcher que sincroniza
// el motor de foley debe vivir mientras vive la app, no mientras vive el primer
// componente que llame a useSound().
const enabled = effectScope(true).run(() => useStorage('sound-enabled', true))!

watch(enabled, (v) => foleySet({ muted: !v }), { immediate: true })

export function useSound() {
  // El watcher de arriba es async (flush por defecto), así que para que el cue
  // de confirmación se escuche siempre hay que ordenar mute/play a mano: al
  // encender, desmutear antes de tocar "on"; al apagar, tocar "off" antes de mutear.
  function setEnabled(value: boolean) {
    if (value) {
      foleySet({ muted: false })
      play('on')
    } else {
      play('off')
      foleySet({ muted: true })
    }
    enabled.value = value
  }

  return { enabled, setEnabled }
}
