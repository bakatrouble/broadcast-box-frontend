<script setup lang="ts">
import StreamsDialog from "../components/StreamsDialog.vue";
import WatchPane from "../components/WatchPane.vue";
import FloatingPlayer from "../components/FloatingPlayer.vue";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useFullscreen } from "@vueuse/core";
import { DEFAULT_CHANNEL } from "@/lib/api";

const route = useRoute();
const channel = computed(
    () => (route.params.channel as string) || DEFAULT_CHANNEL,
);
const app = ref<HTMLElement>();
const videoFullscreen = useFullscreen(app);

const streamsModal = ref(false);

interface Pane {
    id: number;
    channel: string;
}

interface Floater {
    id: number;
    channel: string;
}

const MAX_PANES = 3;
const MIN_PANE_FRACTION = 0.15;

let paneSeq = 0;
let floaterSeq = 0;
const panes = ref<Pane[]>([{ id: paneSeq++, channel: channel.value }]);
const floaters = ref<Floater[]>([]);
const sizes = ref<number[]>([1]);
const stage = ref<HTMLElement>();

const resetSizes = () => {
    sizes.value = panes.value.map(() => 1 / panes.value.length);
};

const isOpen = (openChannel: string) =>
    panes.value.some((pane) => pane.channel === openChannel) ||
    floaters.value.some((floater) => floater.channel === openChannel);

const openChannels = computed(() => [
    ...panes.value.map((pane) => pane.channel),
    ...floaters.value.map((floater) => floater.channel),
]);

const addSplit = (splitChannel: string) => {
    if (panes.value.length >= MAX_PANES) {
        return;
    }
    // Duplicate panes are dev-only (same gate as addFloater); the
    // panes-dupe case must not be blocked separately, or split silently
    // no-ops in dev when only the current stream is live.
    if (!import.meta.env.DEV && isOpen(splitChannel)) {
        return;
    }
    panes.value.push({ id: ++paneSeq, channel: splitChannel });
    resetSizes();
};

const removePane = (id: number) => {
    if (panes.value.length <= 1) {
        return;
    }
    panes.value = panes.value.filter((pane) => pane.id !== id);
    resetSizes();
};

const addFloater = (floaterChannel: string) => {
    if (!import.meta.env.DEV && isOpen(floaterChannel)) {
        return;
    }
    floaters.value.push({ id: ++floaterSeq, channel: floaterChannel });
};

const removeFloater = (id: number) => {
    floaters.value = floaters.value.filter((floater) => floater.id !== id);
};

watch(channel, (next) => {
    panes.value = [{ id: ++paneSeq, channel: next }];
    sizes.value = [1];
});

interface DividerDrag {
    index: number;
    startX: number;
    width: number;
    sizes: number[];
}

const dividerDrag = ref<DividerDrag | null>(null);

const onDividerMove = (e: MouseEvent) => {
    const drag = dividerDrag.value;
    if (!drag || sizes.value.length !== drag.sizes.length) {
        onDividerUp();
        return;
    }
    const pairSum = drag.sizes[drag.index] + drag.sizes[drag.index + 1];
    let first = drag.sizes[drag.index] + (e.clientX - drag.startX) / drag.width;
    first = Math.min(
        pairSum - MIN_PANE_FRACTION,
        Math.max(MIN_PANE_FRACTION, first),
    );
    const next = [...drag.sizes];
    next[drag.index] = first;
    next[drag.index + 1] = pairSum - first;
    sizes.value = next;
};

const onDividerUp = () => {
    dividerDrag.value = null;
    window.removeEventListener("mousemove", onDividerMove);
    window.removeEventListener("mouseup", onDividerUp);
};

const onDividerDown = (index: number, e: MouseEvent) => {
    if (e.button !== 0 || !stage.value) {
        return;
    }
    dividerDrag.value = {
        index,
        startX: e.clientX,
        width: stage.value.getBoundingClientRect().width,
        sizes: [...sizes.value],
    };
    window.addEventListener("mousemove", onDividerMove);
    window.addEventListener("mouseup", onDividerUp);
};

onUnmounted(() => {
    window.removeEventListener("mousemove", onDividerMove);
    window.removeEventListener("mouseup", onDividerUp);
});
</script>

<template>
    <div id="app" class="flex items-center justify-center w-screen h-screen bg-gray-900" ref="app">
        <div class="w-full h-full relative flex flex-row" ref="stage">
            <template v-for="(pane, i) in panes" :key="pane.id">
                <div
                    v-if="i > 0"
                    class="w-1.5 flex-none cursor-col-resize bg-gray-800 transition-colors hover:bg-gray-600"
                    @mousedown="onDividerDown(i - 1, $event)"
                />
                <div
                    class="relative h-full min-w-0"
                    :style="{ width: `${(sizes[i] ?? 0) * 100}%` }"
                >
                    <watch-pane
                        :channel="pane.channel"
                        :video-fullscreen="videoFullscreen"
                        :closable="panes.length > 1"
                        @close="removePane(pane.id)"
                        @open-streams="streamsModal = true"
                    />
                </div>
            </template>
            <floating-player
                v-for="floater in floaters"
                :key="floater.id"
                :channel="floater.channel"
                :video-fullscreen="videoFullscreen"
                :x="120 + floater.id * 36"
                :y="90 + floater.id * 30"
                @close="removeFloater(floater.id)"
                @open-streams="streamsModal = true"
            />
            <streams-dialog
                v-model="streamsModal"
                :channel="channel"
                :can-split="panes.length < MAX_PANES"
                :open-channels="openChannels"
                @pip="addFloater"
                @split="addSplit"
            />
            <admin-panel />
        </div>
    </div>
</template>
