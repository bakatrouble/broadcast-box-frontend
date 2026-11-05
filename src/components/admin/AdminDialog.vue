<script setup lang="ts">
import { DialogContent, DialogOverlay, DialogRoot } from "reka-ui";
import { cn } from "cn";

/* Portal-free dialog for the admin surface: Reka primitives rendered
   inline so they stay inside the .admin-theme scope (a Portal to
   document.body would escape it and lose the theme). Stock classes. */

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
    contentClass?: string;
}>();
</script>

<template>
    <dialog-root v-model:open="open">
        <dialog-overlay
            class="fixed inset-0 z-50 bg-black/80 duration-100 supports-backdrop-filter:backdrop-blur-xs data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        />
        <dialog-content
            :class="
                cn(
                    'fixed left-1/2 top-1/2 z-50 flex w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 bg-background p-6 text-sm shadow-lg outline-none duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 sm:max-w-lg sm:rounded-lg',
                    props.contentClass,
                )
            "
        >
            <slot />
        </dialog-content>
    </dialog-root>
</template>
