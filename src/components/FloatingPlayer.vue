<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import WatchPane from "@/components/WatchPane.vue";
import type { UseFullscreenReturn } from "@vueuse/core";

const props = withDefaults(
    defineProps<{
        channel: string;
        videoFullscreen: UseFullscreenReturn;
        x?: number;
        y?: number;
    }>(),
    { x: 120, y: 90 },
);

const emit = defineEmits<{
    close: [];
    openStreams: [];
}>();

const MIN_WIDTH = 240;
const MIN_HEIGHT = 140;
const VIEWPORT_PAD = 12;
const RETURN_MS = 250;

const pos = ref({ x: props.x, y: props.y });
const size = useLocalStorage(
    "floater:size",
    { width: 320, height: 180 },
    { mergeDefaults: true },
);

const dragState = ref<{ dx: number; dy: number } | null>(null);

type ResizeDir = "nw" | "ne" | "sw" | "se";
interface ResizeState {
    dir: ResizeDir;
    startX: number;
    startY: number;
    x: number;
    y: number;
    w: number;
    h: number;
}
const resizeState = ref<ResizeState | null>(null);
const returning = ref(false);
let returnTimer: ReturnType<typeof setTimeout> | null = null;

const clampAxis = (value: number, extent: number, viewport: number): number => {
    const min = VIEWPORT_PAD;
    const max = viewport - extent - VIEWPORT_PAD;
    if (max < min) {
        return Math.min(min, Math.max(max, value));
    }
    return Math.min(max, Math.max(min, value));
};

const clampToViewport = () => ({
    x: clampAxis(pos.value.x, size.value.width, window.innerWidth),
    y: clampAxis(pos.value.y, size.value.height, window.innerHeight),
});

const returnToBounds = () => {
    const clamped = clampToViewport();
    if (clamped.x === pos.value.x && clamped.y === pos.value.y) {
        return;
    }
    returning.value = true;
    pos.value = clamped;
    if (returnTimer !== null) {
        clearTimeout(returnTimer);
    }
    returnTimer = setTimeout(() => {
        returning.value = false;
        returnTimer = null;
    }, RETURN_MS);
};

const onPlayerDown = (e: MouseEvent) => {
    if (e.button !== 0) {
        return;
    }
    if ((e.target as HTMLElement | null)?.closest("button")) {
        return;
    }
    e.preventDefault();
    dragState.value = {
        dx: e.clientX - pos.value.x,
        dy: e.clientY - pos.value.y,
    };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd, { once: true });
};

const onDragMove = (e: MouseEvent) => {
    if (!dragState.value) {
        return;
    }
    pos.value = {
        x: e.clientX - dragState.value.dx,
        y: e.clientY - dragState.value.dy,
    };
};

const onDragEnd = () => {
    dragState.value = null;
    window.removeEventListener("mousemove", onDragMove);
    returnToBounds();
};

const onResizeDown = (dir: ResizeDir, e: MouseEvent) => {
    if (e.button !== 0) {
        return;
    }
    e.stopPropagation();
    e.preventDefault();
    resizeState.value = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        x: pos.value.x,
        y: pos.value.y,
        w: size.value.width,
        h: size.value.height,
    };
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeEnd, { once: true });
};

const onResizeMove = (e: MouseEvent) => {
    const st = resizeState.value;
    if (!st) {
        return;
    }
    const maxW = window.innerWidth - 2 * VIEWPORT_PAD;
    const maxH = window.innerHeight - 2 * VIEWPORT_PAD;
    const fit = (v: number, min: number, max: number) =>
        Math.min(max, Math.max(min, v));
    let w = st.w;
    let h = st.h;
    let x = st.x;
    let y = st.y;
    if (st.dir.includes("e")) {
        w = fit(st.w + e.clientX - st.startX, MIN_WIDTH, maxW);
    }
    if (st.dir.includes("s")) {
        h = fit(st.h + e.clientY - st.startY, MIN_HEIGHT, maxH);
    }
    if (st.dir.includes("w")) {
        w = fit(st.w - (e.clientX - st.startX), MIN_WIDTH, maxW);
        x = st.x + (st.w - w);
    }
    if (st.dir.includes("n")) {
        h = fit(st.h - (e.clientY - st.startY), MIN_HEIGHT, maxH);
        y = st.y + (st.h - h);
    }
    size.value = { width: w, height: h };
    pos.value = {
        x: clampAxis(x, w, window.innerWidth),
        y: clampAxis(y, h, window.innerHeight),
    };
};

const onResizeEnd = () => {
    resizeState.value = null;
    window.removeEventListener("mousemove", onResizeMove);
    returnToBounds();
};

const onViewportResize = () => {
    if (dragState.value || resizeState.value) {
        return;
    }
    size.value = {
        width: Math.max(
            MIN_WIDTH,
            Math.min(size.value.width, window.innerWidth - 2 * VIEWPORT_PAD),
        ),
        height: Math.max(
            MIN_HEIGHT,
            Math.min(size.value.height, window.innerHeight - 2 * VIEWPORT_PAD),
        ),
    };
    returnToBounds();
};

onUnmounted(() => {
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("resize", onViewportResize);
    if (returnTimer !== null) {
        clearTimeout(returnTimer);
    }
});

onMounted(() => {
    size.value = {
        width: Math.max(
            MIN_WIDTH,
            Math.min(size.value.width, window.innerWidth - 2 * VIEWPORT_PAD),
        ),
        height: Math.max(
            MIN_HEIGHT,
            Math.min(size.value.height, window.innerHeight - 2 * VIEWPORT_PAD),
        ),
    };
    pos.value = clampToViewport();
    window.addEventListener("resize", onViewportResize);
});
</script>

<template>
    <div
        class="floater fixed z-40 overflow-hidden rounded-md border border-gray-600 bg-black shadow-xl select-none"
        :class="
            returning
                ? 'transition-[left,top] duration-200 ease-out'
                : dragState
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
        "
        :style="{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
        }"
        @mousedown="onPlayerDown"
    >
        <watch-pane
            :channel="channel"
            :video-fullscreen="videoFullscreen"
            closable
            minimal
            hover-ui
            @close="emit('close')"
            @open-streams="emit('openStreams')"
        />
        <div
            class="absolute left-0 top-0 z-10 h-4 w-4 cursor-nwse-resize"
            @mousedown.stop="onResizeDown('nw', $event)"
        />
        <div
            class="absolute right-0 top-0 z-10 h-4 w-4 cursor-nesw-resize"
            @mousedown.stop="onResizeDown('ne', $event)"
        />
        <div
            class="absolute bottom-0 left-0 z-10 h-4 w-4 cursor-nesw-resize"
            @mousedown.stop="onResizeDown('sw', $event)"
        />
        <div
            class="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-nwse-resize"
            @mousedown.stop="onResizeDown('se', $event)"
        />
    </div>
</template>

<style scoped>
.floater button {
    cursor: pointer;
}
</style>
