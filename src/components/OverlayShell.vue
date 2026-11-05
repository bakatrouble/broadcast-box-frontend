<script setup lang="ts">
withDefaults(
    defineProps<{
        dimmed?: boolean;
        peeking?: boolean;
        interactive?: boolean;
    }>(),
    { dimmed: false, peeking: false, interactive: true },
);
</script>

<template>
    <div
        class="absolute inset-0 flex items-center justify-center transition-opacity"
        :class="[
            dimmed
                ? 'bg-[#00000060] supports-backdrop-filter:backdrop-blur-xs'
                : '',
            peeking ? 'opacity-0' : 'opacity-100',
            interactive ? '' : 'pointer-events-none',
        ]"
    >
        <div class="flex flex-col items-center justify-center text-gray-200">
            <slot />
        </div>
    </div>
</template>
