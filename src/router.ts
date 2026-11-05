import { createRouter, createWebHistory } from "vue-router";
import WatchView from "./views/WatchView.vue";
import { DEFAULT_CHANNEL } from "./lib/api";

export const router = createRouter({
    // Browser history: the backend falls back to index.html for unknown
    // frontend paths (see frontendHandler upstream), so deep links work.
    history: createWebHistory(),
    routes: [
        { path: "/", redirect: `/${DEFAULT_CHANNEL}` },
        { path: "/:channel", component: WatchView },
    ],
});
