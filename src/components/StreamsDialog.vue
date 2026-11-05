<script setup lang="ts">
import { useRouter } from "vue-router";
import {
    Table as UiTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
} from "@/components/ui/table";
import MdiIcon from "@/components/MdiIcon.vue";
import ToolbarButton from "@/components/ToolbarButton.vue";
import {
    Dialog as UiDialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useStreams, type StreamStatus } from "@/lib/api";

const props = defineProps<{
    channel: string;
    canSplit: boolean;
    openChannels: string[];
}>();

const emit = defineEmits<{
    pip: [channel: string];
    split: [channel: string];
}>();

const open = defineModel<boolean>({ default: false });
const { data: streams } = useStreams();
const router = useRouter();
const isDev = import.meta.env.DEV;

const tracksLabel = (stream: StreamStatus): string => {
    const video = (stream.videoTracks ?? []).length;
    const audio = (stream.audioTracks ?? []).length;
    return `${video}V · ${audio}A`;
};

const go = (streamKey: string) => {
    open.value = false;
    void router.push(`/${streamKey}`);
};

const float = (streamKey: string) => {
    open.value = false;
    emit("pip", streamKey);
};

const split = (streamKey: string) => {
    open.value = false;
    emit("split", streamKey);
};

// Duplicates of an already-open stream are dev-only: in production the
// buttons stay visible but disabled instead of disappearing.
const isGated = (streamKey: string): boolean =>
    !isDev && props.openChannels.includes(streamKey);

const rowClass = (): string =>
    "cursor-pointer border-b transition-colors hover:bg-white/15!";
const floatTooltip = (streamKey: string): string =>
    isGated(streamKey) ? "Already open" : "Float player";

const splitDisabled = (streamKey: string): boolean =>
    isGated(streamKey) || !props.canSplit;

const splitTooltip = (streamKey: string): string => {
    if (isGated(streamKey)) {
        return "Already open";
    }
    return props.canSplit ? "Split view" : "Max splits reached";
};
</script>

<template>
    <ui-dialog v-model:open="open">
        <dialog-content
            :show-close-button="false"
            class="gap-0 rounded-md border-gray-600 bg-gray-800 p-0 text-base text-gray-200 ring-0 sm:max-w-2xl"
        >
            <dialog-header
                class="flex flex-row items-center border-b border-b-gray-600 px-4 py-2 text-left"
            >
                <dialog-title class="text-xl font-normal text-gray-200"
                    >Active streams</dialog-title
                >
                <dialog-description class="sr-only"
                    >List of active streams to watch</dialog-description
                >
                <div class="grow" />
                <toolbar-button
                    size="icon-sm"
                    class="size-6 cursor-pointer rounded-none border-0 bg-transparent p-0 hover:bg-transparent"
                    aria-label="Close"
                    @click="open = false"
                >
                    <mdi-icon name="close" />
                </toolbar-button>
            </dialog-header>
            <div class="px-4 py-4">
                <div class="overflow-hidden rounded-md border border-white/10">
                <ui-table>
                    <table-header>
                        <tr>
                            <table-head class="text-gray-400"
                                >Stream</table-head
                            >
                            <table-head class="text-gray-400"
                                >Sessions</table-head
                            >
                            <table-head class="text-gray-400"
                                >Tracks</table-head
                            >
                            <table-head />
                        </tr>
                    </table-header>
                    <table-body>
                        <tr
                            v-for="stream in streams"
                            :key="stream.streamKey"
                            :class="rowClass()"
                            @click="go(stream.streamKey)"
                        >
                            <table-cell class="font-medium">{{
                                stream.streamKey
                            }}</table-cell>
                            <table-cell>{{
                                (stream.sessions ?? []).length
                            }}</table-cell>
                            <table-cell>{{
                                tracksLabel(stream)
                            }}</table-cell>
                            <table-cell
                                class="whitespace-nowrap text-right space-x-2"
                            >
                                <toolbar-button
                                    size="icon-sm"
                                    aria-label="Float player"
                                    :tooltip="floatTooltip(stream.streamKey)"
                                    :disabled="isGated(stream.streamKey)"
                                    @click.stop="float(stream.streamKey)"
                                >
                                    <mdi-icon
                                        name="picture-in-picture-bottom-right"
                                        size="20"
                                    />
                                </toolbar-button>
                                <toolbar-button
                                    size="icon-sm"
                                    aria-label="Split view"
                                    :tooltip="splitTooltip(stream.streamKey)"
                                    :disabled="splitDisabled(stream.streamKey)"
                                    @click.stop="split(stream.streamKey)"
                                >
                                    <mdi-icon
                                        name="view-split-vertical"
                                        size="20"
                                    />
                                </toolbar-button>
                            </table-cell>
                        </tr>
                        <tr v-if="!streams?.length">
                            <table-cell
                                colspan="4"
                                class="px-2 py-4 text-center text-sm text-gray-400"
                            >
                                No active streams right now
                            </table-cell>
                        </tr>
                    </table-body>
                </ui-table>
                </div>
            </div>
        </dialog-content>
    </ui-dialog>
</template>
