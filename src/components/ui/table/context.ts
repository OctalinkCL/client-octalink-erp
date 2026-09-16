import type { ComputedRef, InjectionKey } from 'vue'

export type TableVariant = 'default' | 'border'

export const TABLE_VARIANT_KEY: InjectionKey<ComputedRef<TableVariant>> = Symbol('table-variant')
