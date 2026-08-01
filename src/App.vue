<script setup lang="ts">
import Toolbar from "./components/Toolbar.vue";
import { computed, onMounted, ref } from "vue";
import { useFullscreen, useMediaControls, useUrlSearchParams } from "@vueuse/core";

const pc = ref<RTCPeerConnection>();
const video = ref<HTMLVideoElement>();
const videoControls = useMediaControls(video);
const searchParams = useUrlSearchParams('history');
const channel = computed(() => searchParams?.channel as string || 'bakatrouble');
const videoWidth = ref(0);
const videoHeight = ref(0);
const app = ref<HTMLElement>();
const videoFullscreen = useFullscreen(app);

const connect = async () => {
    const lpc = pc.value = new RTCPeerConnection({
        bundlePolicy: 'max-bundle',
    });
    lpc.addTransceiver('audio', { direction: 'recvonly' });
    lpc.addTransceiver('video', { direction: 'recvonly' });
    lpc.ontrack = e => {
        console.log('track', e);
        video.value!.srcObject = e.streams[0];
    }
    setInterval(async () => {
        const receivers = lpc.getReceivers();
        console.log(await Promise.all(receivers.map(async r => ({
            r,
            stats: Object.fromEntries((await r.getStats()).entries()),
            params: r.getParameters(),
        }))))
    }, 1000);

    const offer = await lpc.createOffer();
    offer.sdp = offer.sdp?.replace(`useinbandfec=1`, `useinbandfec=1;stereo=1`);
    await lpc.setLocalDescription(offer);
    const r = await fetch(
        `https://broadcast.bakatrouble.me/api/whep`,
        {
            method: 'POST',
            body: offer.sdp,
            headers: {
                Authorization: `Bearer ${channel.value}`,
                'Content-Type': 'application/sdp',
            }
        }
    ).then(r => r.text());
    await lpc.setRemoteDescription({ sdp: r, type: `answer` });
};

const onResize = () => {
    const windowSize = {
        x: window.innerWidth,
        y: window.innerHeight
    };
    const windowRatio = windowSize.x / windowSize.y;
    const videoSize = {
        x: video.value?.videoWidth || 0,
        y: video.value?.videoHeight || 0,
    };
    const videoRatio = videoSize.x / videoSize.y;
    if (windowRatio > videoRatio) {
        videoWidth.value = videoSize.x * windowSize.y / videoSize.y;
        videoHeight.value = windowSize.y;
    } else {
        videoWidth.value = windowSize.x;
        videoHeight.value = videoSize.y * windowSize.x / videoSize.x;
    }

    console.log('resize', videoWidth.value, videoHeight.value);
};

onMounted(async () => {
    window.addEventListener('resize', onResize);
    onResize();

    await connect();
});

const onLoadedMetadata = () => {
    onResize();
    videoControls.playing.value = true;
}
</script>

<template>
    <div id="app" class="flex-center w-screen h-screen" ref="app">
        <div class="w-full h-full flex-center relative">
            <div class="flex-center w-full h-full" @mousedown="videoControls.playing.value = !videoControls.playing.value">
                <video
                    ref="video"
                    :width="videoWidth"
                    :height="videoHeight"
                    autoplay
                    playsinline
                    @loadedmetadata="onLoadedMetadata"
                />
            </div>
            <toolbar :video-controls :video-fullscreen :channel />
        </div>
    </div>
</template>
