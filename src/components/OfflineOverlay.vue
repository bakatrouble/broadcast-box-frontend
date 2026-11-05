<script setup lang="ts">
import MdiIcon from "@/components/MdiIcon.vue";
import OverlayShell from "@/components/OverlayShell.vue";
import ToolbarButton from "@/components/ToolbarButton.vue";

defineProps<{
    channel: string;
}>();

const emit = defineEmits<{
    openStreams: [];
}>();
</script>

<template>
    <overlay-shell :interactive="false">
        <mdi-icon name="television-off" size="48" class="mb-4 opacity-60" />
        <p class="text-xl">{{ channel }} is offline</p>
        <p class="mt-1 text-sm text-gray-400">
            This stream is not currently live
        </p>
        <toolbar-button
            size="default"
            class="pointer-events-auto mt-4 px-3"
            @click="emit('openStreams')"
        >
            <mdi-icon size="20" name="view-stream" />
            Active streams
        </toolbar-button>
    </overlay-shell>
</template>
