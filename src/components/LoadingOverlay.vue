<script setup lang="ts">
import OverlayShell from "@/components/OverlayShell.vue";

// Static loading indicator; visibility is decided by the parent.
</script>

<template>
    <overlay-shell>
        <div
            class="size-10 animate-spin rounded-full border-2 border-gray-600 border-t-gray-200"
        />
        <p class="mt-4 text-sm text-gray-400">Loading stream…</p>
    </overlay-shell>
</template>
