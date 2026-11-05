<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { type UseFullscreenReturn, useMediaControls } from "@vueuse/core";
import { useTimeout } from "@vueuse/core";
import Toolbar from "@/components/Toolbar.vue";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import OfflineOverlay from "@/components/OfflineOverlay.vue";
import PauseOverlay from "@/components/PauseOverlay.vue";
import MdiIcon from "@/components/MdiIcon.vue";
import { useStreams } from "@/lib/api";
import { useWhepConnection } from "@/lib/whep";

const props = defineProps<{
    channel: string;
    videoFullscreen: UseFullscreenReturn;
    closable?: boolean;
    minimal?: boolean;
    hoverUi?: boolean;
}>();

const emit = defineEmits<{
    close: [];
    openStreams: [];
}>();

const video = ref<HTMLVideoElement>();
const videoControls = useMediaControls(video);

const { data: streams, isError: streamsError } = useStreams();
const isLive = computed(
    () =>
        streams.value?.some((stream) => stream.streamKey === props.channel) ??
        false,
);
const peeking = ref(false);

const stopPeeking = () => {
    peeking.value = false;
};

// Toolbar visibility is driven by this pane's own element: mousemove
// reveals (auto-hiding after 3s while playing), or plain hover enters/
// leaves in hoverUi mode. No window-level mousemove listeners.
const hovering = ref(false);
const timedVisible = ref(false);
const uiTimeout = useTimeout(3000, {
    controls: true,
    callback: () => {
        if (videoControls.playing.value) {
            timedVisible.value = false;
        }
    },
});
watch(videoControls.playing, (playing) => {
    if (playing) {
        uiTimeout.start();
    }
});
const touchUi = () => {
    timedVisible.value = true;
    uiTimeout.start();
};
const uiVisible = computed(() =>
    props.hoverUi ? hovering.value : timedVisible.value,
);

const { videoReady } = useWhepConnection({
    video,
    channel: () => props.channel,
    isLive,
});

onMounted(() => {
    window.addEventListener("mouseup", stopPeeking);
    window.addEventListener("touchend", stopPeeking);
    window.addEventListener("touchcancel", stopPeeking);
    onUnmounted(() => {
        window.removeEventListener("mouseup", stopPeeking);
        window.removeEventListener("touchend", stopPeeking);
        window.removeEventListener("touchcancel", stopPeeking);
    });
});

const onLoadedMetadata = () => {
    videoReady.value = true;
    videoControls.playing.value = true;
};
</script>

<template>
    <div
        class="group relative h-full w-full"
        @mousemove="touchUi"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false"
    >
        <video
            ref="video"
            class="absolute inset-0 h-full w-full object-contain"
            autoplay
            playsinline
            @loadedmetadata="onLoadedMetadata"
        />
        <offline-overlay
            v-if="(streams !== undefined && !isLive) || streamsError"
            :channel="channel"
            @open-streams="emit('openStreams')"
        />
        <loading-overlay
            v-if="streams !== undefined && isLive && !videoControls.playing.value && !videoReady"
        />
        <pause-overlay
            :visible="streams !== undefined && isLive && !videoControls.playing.value && videoReady"
            :peeking="peeking"
            @peek-start="peeking = true"
            @resume="videoControls.playing.value = true"
        />
        <toolbar
            :video-controls="videoControls"
            :video-fullscreen="videoFullscreen"
            :channel="channel"
            :ui-hidden="peeking"
            :ui-visible="uiVisible"
            :play-disabled="!isLive"
            :minimal="minimal"
            @open-streams="emit('openStreams')"
        />
        <button
            v-if="closable"
            class="absolute right-1.5 top-1.5 z-10 flex size-6 cursor-pointer items-center justify-center rounded-sm bg-black/60 text-gray-200 opacity-0 transition-all data-[show=true]:opacity-100 hover:bg-gray-700 hover:text-white"
            :data-show="uiVisible && !peeking"
            aria-label="Close pane"
            title="Close pane"
            @click="emit('close')"
        >
            <mdi-icon name="close" size="16" />
        </button>
    </div>
</template>

<style scoped>
video::-webkit-media-controls-picture-in-picture-button {
    display: none !important;
}
</style>
