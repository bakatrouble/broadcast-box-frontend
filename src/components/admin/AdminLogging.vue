<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { Button as UiButton } from "@/components/ui/button";
import MdiIcon from "@/components/MdiIcon.vue";
import { AdminUnauthorizedError, useAdminAuth } from "@/lib/admin";

const ROW_HEIGHT = 16;
const STICK_THRESHOLD_PX = 40;

// Module scope: Reka unmounts inactive tabs, so component state (including
// scroll position) is lost on every tab switch. This survives remounts.
const savedView = { top: 0, stick: true };

const { authFetch } = useAdminAuth();

const scrollEl = ref<HTMLDivElement | null>(null);
const stickToBottom = ref(true);

const {
    data: logText,
    refetch,
    isFetching,
    isPending,
} = useQuery({
    queryKey: ["admin-logging"],
    queryFn: async () => {
        const res = await authFetch(`/api/admin/logging`);
        return await res.text();
    },
    refetchInterval: 5000,
    retry: (count, err) =>
        !(err instanceof AdminUnauthorizedError) && count < 2,
});

const lines = computed(() => {
    const all = (logText.value ?? "").split("\n");
    if (all.length > 0 && all[all.length - 1] === "") {
        all.pop();
    }
    return all;
});

const virtualizer = useVirtualizer(
    computed(() => ({
        count: lines.value.length,
        getScrollElement: () => scrollEl.value,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    })),
);

const onScroll = () => {
    const el = scrollEl.value;
    if (!el) {
        return;
    }
    stickToBottom.value =
        el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
};

watch(
    () => lines.value.length,
    () => {
        if (!stickToBottom.value || lines.value.length === 0) {
            return;
        }
        void nextTick(() => {
            virtualizer.value.scrollToIndex(lines.value.length - 1, {
                align: "end",
            });
        });
    },
);

onMounted(() => {
    stickToBottom.value = savedView.stick;
    void nextTick(() => {
        const el = scrollEl.value;
        if (!el) {
            return;
        }
        if (savedView.stick && lines.value.length > 0) {
            el.scrollTop = el.scrollHeight;
        } else {
            el.scrollTop = savedView.top;
        }
    });
});

onBeforeUnmount(() => {
    const el = scrollEl.value;
    savedView.top = el ? el.scrollTop : 0;
    savedView.stick = stickToBottom.value;
});
</script>

<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="mb-4 flex flex-row items-center">
            <h3 class="text-xl">Server logs</h3>
            <div class="grow" />
            <ui-button
                variant="ghost"
                size="icon"
                aria-label="Refresh logs"
                title="Refresh logs"
                :disabled="isFetching"
                @click="refetch()"
            >
                <mdi-icon name="refresh" size="20" />
            </ui-button>
        </div>
        <div
            ref="scrollEl"
            class="min-h-0 flex-1 overflow-auto rounded-sm bg-muted p-4 font-mono text-xs"
            @scroll="onScroll"
        >
            <div
                :style="{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }"
            >
                <div
                    v-for="row in virtualizer.getVirtualItems()"
                    :key="row.index"
                    :style="{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: `${row.size}px`,
                        transform: `translateY(${row.start}px)`,
                    }"
                    class="whitespace-pre"
                >
                    {{ lines[row.index] }}
                </div>
            </div>
        </div>
        <p
            v-if="lines.length === 0 && !isPending"
            class="px-2 py-4 text-center text-sm text-muted-foreground"
        >
            No logs yet
        </p>
    </div>
</template>
