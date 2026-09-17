import { useStorage } from '@vueuse/core'
import { set as foleySet } from '@foleyjs/vue'
import { effectScope, watch } from 'vue'

// Scope "detached" por la misma razón que useTheme.ts: el watcher que sincroniza
// el motor de foley debe vivir mientras vive la app, no mientras vive el primer
// componente que llame a useSound().
const enabled = effectScope(true).run(() => useStorage('sound-enabled', true))!

watch(enabled, (v) => foleySet({ muted: !v }), { immediate: true })

export function useSound() {
  return { enabled }
}
