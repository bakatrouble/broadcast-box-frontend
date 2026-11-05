<script setup lang="ts">
import { onUnmounted, ref } from "vue";

const modelValue = defineModel<number>({ default: 1 });

const expanded = ref(false);
const adjusting = ref(false);
const track = ref<HTMLDivElement>();

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const updateFromPointer = (clientY: number) => {
    const el = track.value;
    if (!el) {
        return;
    }
    const rect = el.getBoundingClientRect();
    modelValue.value = clamp01(1 - (clientY - rect.top) / rect.height);
};

const onPointerMove = (e: MouseEvent) => {
    adjusting.value = true;
    updateFromPointer(e.clientY);
};

const stopAdjusting = () => {
    adjusting.value = false;
    window.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("mouseup", stopAdjusting);
};

const onPointerDown = (e: MouseEvent) => {
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", stopAdjusting);
    onPointerMove(e);
};

onUnmounted(stopAdjusting);
</script>

<template>
    <div
        class="relative flex items-center justify-center"
        @mouseover="expanded = true"
        @mouseout="expanded = false"
        @mousedown.stop
    >
        <div
            class="absolute z-0 bg-gray-800 rounded-sm bottom-0 left-0 right-0 h-full data-[out=true]:h-[calc(100%+100px)] transition-all overflow-hidden"
            :data-out="expanded || adjusting"
        >
            <div
                class="absolute top-0 bottom-[calc(100%-100px)] left-0 right-0 pt-3 pb-2 flex items-center justify-center cursor-pointer group"
                @mousedown="onPointerDown"
            >
                <div class="w-1 h-full bg-gray-600 relative" ref="track">
                    <div
                        class="absolute left-0 bottom-0 right-0 bg-gray-300 group-hover:bg-gray-100 transition-colors"
                        :style="{ height: `${modelValue * 100}%` }"
                    />
                </div>
            </div>
        </div>
        <slot />
    </div>
</template>
