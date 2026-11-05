<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import {
    type UseFullscreenReturn,
    useLocalStorage,
    type UseMediaControlsReturn,
} from "@vueuse/core";
import MdiIcon from "@/components/MdiIcon.vue";
import ToolbarButton from "@/components/ToolbarButton.vue";
import VolumeSlider from "@/components/VolumeSlider.vue";

const {
    videoControls,
    videoFullscreen,
    channel,
    uiHidden,
    uiVisible,
    playDisabled,
    minimal,
} = defineProps<{
    videoControls: UseMediaControlsReturn;
    videoFullscreen: UseFullscreenReturn;
    channel: string;
    uiHidden?: boolean;
    uiVisible?: boolean;
    playDisabled?: boolean;
    minimal?: boolean;
}>();

const emit = defineEmits<{
    openStreams: [];
}>();

const volume = useLocalStorage(`${channel}:volume`, 1, { mergeDefaults: true });
const muted = useLocalStorage(`${channel}:muted`, false, {
    mergeDefaults: true,
});

const clampVolume = (value: number) => Math.min(1, Math.max(0, value));

const enterPip = () => {
    // requestPictureInPicture can reject (e.g. no video track yet);
    // must not surface as an unhandled rejection.
    videoControls.togglePictureInPicture().catch((e: unknown) => {
        console.warn("picture-in-picture failed", e);
    });
};

watch(
    volume,
    (volume) => {
        videoControls.volume.value = volume;
    },
    { immediate: true },
);

watch(
    muted,
    (muted) => {
        videoControls.muted.value = muted;
    },
    { immediate: true },
);

const onKeyDown = (e: KeyboardEvent) => {
    // Let focused controls handle their own keys (avoids double-toggle).
    if ((e.target as HTMLElement | null)?.closest("button, input, a")) {
        return;
    }
    switch (e.code) {
        case "Space":
            e.preventDefault();
            videoControls.playing.value = !videoControls.playing.value;
            break;
        case "ArrowUp":
            e.preventDefault();
            videoControls.volume.value = volume.value = clampVolume(
                videoControls.volume.value + 0.1,
            );
            break;
        case "ArrowDown":
            e.preventDefault();
            videoControls.volume.value = volume.value = clampVolume(
                videoControls.volume.value - 0.1,
            );
            break;
        case "KeyF":
            if (!minimal) {
                videoFullscreen.toggle();
            }
            break;
    }
};

onMounted(() => {
    window.addEventListener("keydown", onKeyDown);
    onUnmounted(() => {
        window.removeEventListener("keydown", onKeyDown);
    });
});
</script>

<template>
        <div class="absolute flex flex-row items-center bottom-0 left-0 right-0 p-4 opacity-0 data-[show=true]:opacity-100 transition-opacity" :data-show="uiVisible && !uiHidden">
            <toolbar-button
                :aria-label="videoControls.playing.value ? 'Pause' : 'Play'"
                :tooltip="videoControls.playing.value ? 'Pause (Space)' : 'Play (Space)'"
                :disabled="playDisabled"
                @click="videoControls.playing.value = !videoControls.playing.value"
            >
                <mdi-icon :name="videoControls.playing.value ? 'pause' : 'play'" />
            </toolbar-button>
            <div class="ml-2 flex items-center justify-center">
                <volume-slider v-model="volume">
                    <toolbar-button
                        size="icon-sm"
                        class="relative z-10"
                        :aria-label="muted ? 'Unmute' : 'Mute'"
                        @click="muted = !muted"
                    >
                        <mdi-icon size="20" :name="muted ? 'volume-off' : 'volume-high'" />
                    </toolbar-button>
                </volume-slider>
            </div>
            <div v-if="!minimal" class="ml-2 flex items-center justify-center">
                <toolbar-button
                    size="icon-sm"
                    class="relative z-10"
                    aria-label="Active streams"
                    tooltip="Active streams"
                    @click="emit('openStreams')"
                >
                    <mdi-icon size="20" name="view-stream" />
                </toolbar-button>
            </div>
            <div class="grow"></div>
            <toolbar-button
                v-if="!minimal && videoControls.supportsPictureInPicture"
                class="mr-2"
                aria-label="Picture in picture"
                tooltip="Picture in picture"
                @click="enterPip"
            >
                <mdi-icon name="picture-in-picture-bottom-right" />
            </toolbar-button>
            <toolbar-button
                v-if="!minimal"
                :aria-label="videoFullscreen.isFullscreen.value ? 'Exit fullscreen' : 'Fullscreen'"
                :tooltip="videoFullscreen.isFullscreen.value ? 'Exit fullscreen (F)' : 'Fullscreen (F)'"
                @click="videoFullscreen.toggle()"
            >
                <mdi-icon :name="videoFullscreen.isFullscreen.value ? 'fullscreen-exit' : 'fullscreen'" />
            </toolbar-button>
        </div>
</template>
