<script setup lang="ts">
import Toolbar from "../components/Toolbar.vue";
import LoadingOverlay from "../components/LoadingOverlay.vue";
import OfflineOverlay from "../components/OfflineOverlay.vue";
import PauseOverlay from "../components/PauseOverlay.vue";
import StreamsDialog from "../components/StreamsDialog.vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useFullscreen, useMediaControls } from "@vueuse/core";
import { DEFAULT_CHANNEL, useStreams } from "@/lib/api";
import { useWhepConnection } from "@/lib/whep";

const video = ref<HTMLVideoElement>();
const videoControls = useMediaControls(video);
const route = useRoute();
const channel = computed(
    () => (route.params.channel as string) || DEFAULT_CHANNEL,
);
const app = ref<HTMLElement>();
const videoFullscreen = useFullscreen(app);

const { data: streams, isError: streamsError } = useStreams();
const isLive = computed(
    () =>
        streams.value?.some((stream) => stream.streamKey === channel.value) ??
        false,
);
const streamsModal = ref(false);
const peeking = ref(false);

const stopPeeking = () => {
    peeking.value = false;
};

const { videoReady } = useWhepConnection({ video, channel, isLive });

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
    <div id="app" class="flex items-center justify-center w-screen h-screen bg-gray-900" ref="app">
        <div class="w-full h-full relative">
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
                @open-streams="streamsModal = true"
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
            <toolbar :video-controls :video-fullscreen :channel :ui-hidden="peeking" @open-streams="streamsModal = true" />
            <streams-dialog v-model="streamsModal" :channel="channel" />
            <admin-panel />
        </div>
    </div>
</template>

