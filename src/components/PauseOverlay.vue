<script setup lang="ts">
import MdiIcon from "@/components/MdiIcon.vue";
import OverlayShell from "@/components/OverlayShell.vue";

defineProps<{
    visible: boolean;
    peeking: boolean;
}>();

const emit = defineEmits<{
    peekStart: [];
    resume: [];
}>();

const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
        emit("peekStart");
    }
};
</script>

<template>
    <Transition name="pause-fade">
        <overlay-shell
            v-if="visible"
            dimmed
            :peeking="peeking"
            @mousedown.self="onMouseDown"
            @touchstart.self.passive="emit('peekStart')"
        >
            <button
                class="pause-zoom-in flex cursor-pointer items-center justify-center rounded-full bg-gray-800/90 p-5 text-gray-200 transition-all hover:scale-105 hover:bg-gray-700/90"
                title="Play"
                aria-label="Play"
                @click="emit('resume')"
            >
                <mdi-icon name="play" size="48" />
            </button>
            <p class="mt-4 text-xs text-gray-400 opacity-70 pointer-events-none">
                Click and hold to hide overlay
            </p>
        </overlay-shell>
    </Transition>
</template>

<style scoped>
.pause-fade-enter-active,
.pause-fade-leave-active {
    transition: opacity 250ms ease;
}
.pause-fade-enter-from,
.pause-fade-leave-to {
    opacity: 0;
}

@keyframes pause-zoom-in {
    from {
        transform: scale(0.6);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}
.pause-zoom-in {
    animation: pause-zoom-in 250ms ease-out;
}
@keyframes pause-zoom-out {
    from {
        transform: scale(1);
        opacity: 1;
    }
    to {
        transform: scale(0.6);
        opacity: 0;
    }
}
.pause-fade-leave-active .pause-zoom-in {
    animation: pause-zoom-out 250ms ease-in;
}
</style>
