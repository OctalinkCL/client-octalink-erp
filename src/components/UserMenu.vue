<script setup lang="ts">
import { useRouter } from "vue-router";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
} from "reka-ui";
import {
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
} from "@lucide/vue";
import UserAvatar from "@/components/UserAvatar.vue";
import { useUsuario } from "@/composables/useUsuario";
import { useTheme } from "@/composables/useTheme";
import { useAuthStore } from "@/stores/auth";

// El trigger va por slot: quien use el menú decide cómo se ve el botón que lo
// abre (fila del sidebar, avatar en el header, etc.).
withDefaults(
  defineProps<{
    side?: DropdownMenuContentProps["side"];
    align?: DropdownMenuContentProps["align"];
  }>(),
  { side: "top", align: "start" },
);

const auth = useAuthStore();
const router = useRouter();
const { nombre, email } = useUsuario();
const { theme } = useTheme();

const opcionesTema = [
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Oscuro", icon: MoonIcon },
  { value: "auto", label: "Sistema", icon: MonitorIcon },
] as const;

// Medidas calcadas de la referencia (gr8r): fila de 30px, radio 6px, 13.5px.
const claseItem =
  "flex min-h-7.5 cursor-default items-center gap-[9px] rounded-sm px-2 text-[13.5px] outline-hidden select-none data-highlighted:bg-accent [&_svg]:size-[15px] [&_svg]:shrink-0 [&_svg]:text-foreground-soft";
const claseSeparador = "-mx-1 my-1 h-px bg-divider";

async function handleLogout() {
  await auth.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :side="side"
        :align="align"
        :side-offset="6"
        class="bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 z-50 w-65 origin-(--reka-dropdown-menu-content-transform-origin) rounded-lg p-1 text-[13.5px] leading-[1.45] shadow-pop duration-100"
      >
        <!-- datos -->
        <div class="flex items-center gap-2.5 px-2 pt-2 pb-2.5">
          <UserAvatar class="size-9 text-sm font-semibold" />
          <div class="min-w-0">
            <div class="truncate font-semibold">{{ nombre }}</div>
            <div class="truncate text-xs leading-[1.45] text-muted-foreground">
              {{ email }}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator :class="claseSeparador" />

        <DropdownMenuItem
          :class="claseItem"
          @select="router.push({ name: 'configuracion' })"
        >
          <SettingsIcon />
          Configuración
        </DropdownMenuItem>

        <DropdownMenuSeparator :class="claseSeparador" />

        <!-- tema -->
        <DropdownMenuLabel
          class="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-[.06em] text-muted-foreground uppercase"
        >
          Tema
        </DropdownMenuLabel>
        <div class="px-1.5 pt-0.5 pb-1.5">
          <DropdownMenuRadioGroup
            v-model="theme"
            class="flex gap-0.5 rounded-sm bg-muted p-0.5"
          >
            <!-- @select.prevent: cambiar el tema no cierra el menú -->
            <DropdownMenuRadioItem
              v-for="opcion in opcionesTema"
              :key="opcion.value"
              :value="opcion.value"
              class="flex h-6 flex-1 cursor-default items-center justify-center gap-[5px] rounded-[5px] px-[9px] text-xs font-medium text-foreground-soft outline-hidden transition-colors select-none data-highlighted:text-foreground data-[state=checked]:bg-popover data-[state=checked]:text-foreground data-[state=checked]:shadow-[0_1px_2px_#00000014,0_0_0_1px_var(--border)] [&_svg]:size-[13px] [&_svg]:shrink-0"
              @select.prevent
            >
              <component :is="opcion.icon" />
              {{ opcion.label }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>

        <DropdownMenuSeparator :class="claseSeparador" />

        <DropdownMenuItem :class="claseItem" @select="handleLogout">
          <LogOutIcon />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
