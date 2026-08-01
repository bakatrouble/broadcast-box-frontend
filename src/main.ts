import { createApp } from 'vue'
import App from './App.vue'
import mdiVue from 'mdi-vue/v3';
import {
    mdiContentCopy,
    mdiCheck,
    mdiOpenInNew,
    mdiUpload,
    mdiMagnify,
    mdiClose,
    mdiChevronLeft,
    mdiChevronRight,
    mdiFullscreen,
    mdiPause,
    mdiPlay,
    mdiVolumeOff,
    mdiVolumeHigh,
    mdiFullscreenExit,
    mdiPictureInPictureBottomRight,
    mdiViewStream,
} from '@mdi/js';
import { VueQueryPlugin } from "@tanstack/vue-query";

createApp(App)
    .use(mdiVue, {
        icons: {
            mdiContentCopy,
            mdiCheck,
            mdiOpenInNew,
            mdiUpload,
            mdiMagnify,
            mdiClose,
            mdiChevronLeft,
            mdiChevronRight,
            mdiFullscreen,
            mdiPause,
            mdiPlay,
            mdiVolumeOff,
            mdiVolumeHigh,
            mdiFullscreenExit,
            mdiPictureInPictureBottomRight,
            mdiViewStream,
        }
    })
    .use(VueQueryPlugin)
    .mount('#app')
