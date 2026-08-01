<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
    useElementBounding,
    type UseFullscreenReturn,
    useLocalStorage,
    type UseMediaControlsReturn, useTimeout
} from "@vueuse/core";

const { videoControls, videoFullscreen } = defineProps<{
    videoControls: UseMediaControlsReturn,
    videoFullscreen: UseFullscreenReturn,
}>();

const volumeOut = ref(false);
const volume = useLocalStorage('volume', 1, { mergeDefaults: true });
const volumeSlider = ref<HTMLVideoElement>();
const volumeSliderRect = useElementBounding(volumeSlider);
const muted = useLocalStorage('muted', false, { mergeDefaults: true });

const show = ref(false);
const showTimeout = useTimeout(3000, {
    controls: true,
    callback: () => {
        if (videoControls.playing.value) {
            show.value = !show.value;
        }
    }
});
watch(videoControls.playing, playing => {
    if (playing) {
        showTimeout.start();
    }
})

const volumeMouseDown = (e: MouseEvent) => {
    window.addEventListener('mousemove', volumeMouseMove);
    window.addEventListener('mouseup', volumeMouseUp);
    volumeMouseMove(e);
}

const volumeMouseMove = (e: MouseEvent) => {
    const rawValue = (e.clientY - volumeSliderRect.top.value) / volumeSliderRect.height.value;
    volume.value = 1 - Math.max(0, Math.min(1, rawValue))
}

const volumeMouseUp = () => {
    window.removeEventListener('mousemove', volumeMouseMove);
    window.removeEventListener('mouseup', volumeMouseUp);
}

watch(volume, volume => {
    videoControls.volume.value = volume;
}, { immediate: true });

watch(muted, muted => {
    videoControls.muted.value = muted;
}, { immediate: true });

onMounted(() => {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        console.log('keydown', e);
        if (e.code === 'Space') {
            videoControls.playing.value = !videoControls.playing.value;
        } else if (e.code === 'ArrowUp') {
            videoControls.volume.value += .1;
        } else if (e.code === 'ArrowDown') {
            videoControls.volume.value -= .1;
        }
    });
    window.addEventListener('mousemove', () => {
        show.value = true;
        showTimeout.start();
    });
});
</script>

<template>
    <div class="absolute flex flex-row items-center bottom-0 left-0 right-0 p-4 opacity-0 data-[show=true]:opacity-100 transition-opacity" :data-show="show">
        <button class="btn" @click="videoControls.playing.value = !videoControls.playing.value">
            <mdicon :name="videoControls.playing.value ? 'pause' : 'play'" />
        </button>
        <div
            class="ml-2 flex-center relative"
            @mouseover="volumeOut = true"
            @mouseout="volumeOut = false"
        >
            <div
                class="absolute z-0 bg-gray-800 rounded-sm bottom-0 left-0 right-0 h-full data-[out=true]:h-[calc(100%+100px)] transition-all overflow-hidden"
                :data-out="volumeOut"
            >
                <div
                    class="absolute top-0 bottom-[calc(100%-100px)] left-0 right-0 pt-3 pb-2 flex-center cursor-pointer group"
                    @mousedown="volumeMouseDown"
                    ref="volumeSlider"
                >
                    <div class="w-1 h-full bg-gray-600 relative">
                        <div
                            class="absolute left-0 bottom-0 right-0 bg-gray-300 group-hover:bg-gray-100 transition-colors"
                            :style="{ height: `${volume * 100}%` }" />
                    </div>
                </div>
            </div>
            <button class="btn relative z-10" @click="muted = !muted">
                <mdicon size="20" :name="muted ? 'volume-high' : 'volume-off'" />
            </button>
        </div>
        <div class="grow"></div>
        <button v-if="videoControls.supportsPictureInPicture" class="btn mr-2" @click="videoControls.togglePictureInPicture()">
            <mdicon name="picture-in-picture-bottom-right" />
        </button>
        <button class="btn" @click="videoFullscreen.enter()">
            <mdicon name="fullscreen" />
        </button>
    </div>
</template>

<style scoped>

</style>
