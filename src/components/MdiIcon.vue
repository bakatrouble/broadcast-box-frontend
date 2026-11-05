<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
    defineProps<{
        name: string;
        size?: number | string;
    }>(),
    { size: 24 },
);

const px = computed(() => `${Number.parseInt(String(props.size), 10)}px`);
</script>

<template>
    <span class="mdi-wrap" :style="{ width: px, height: px }">
        <mdicon :name="name" :size="size" />
    </span>
</template>

<style scoped>
/* mdi-vue puts class/size on its wrapper span, so shadcn Button's
   [&_svg]:size-4 rule would shrink the svg. The span gets its size
   from the prop and the svg fills it. :deep is required because the
   span/svg are rendered inside the child component. Unlayered output
   wins over Tailwind's layered utilities. */
.mdi-wrap {
    display: inline-flex;
    flex: none;
}
.mdi-wrap:deep(span.mdi > svg) {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
