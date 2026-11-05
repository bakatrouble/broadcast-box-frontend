<script setup lang="ts">
import { Button as UiButton } from "@/components/ui/button";
import MdiIcon from "@/components/MdiIcon.vue";
import ToolbarButton from "@/components/ToolbarButton.vue";
import {
    Dialog as UiDialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useStreams } from "@/lib/api";

defineProps<{
    channel: string;
}>();

const open = defineModel<boolean>({ default: false });
const { data: streams } = useStreams();
</script>

<template>
    <ui-dialog v-model:open="open">
        <dialog-content
            :show-close-button="false"
            class="w-100 gap-0 rounded-md border-gray-600 bg-gray-800 p-0 text-base text-gray-200 ring-0 sm:max-w-none"
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
            <div class="px-4 py-2">
                <ui-button
                    v-for="stream in streams"
                    :key="stream.streamKey"
                    as-child
                    variant="ghost"
                    :class="[
                        'mb-1 flex w-full rounded-sm border-0 px-2 py-1 text-gray-200 hover:text-gray-200',
                        stream.streamKey === channel
                            ? 'bg-gray-600 hover:bg-gray-600'
                            : 'bg-gray-700 hover:bg-gray-600',
                    ]"
                >
                    <router-link
                        :to="`/${stream.streamKey}`"
                        @click="open = false"
                    >
                        <mdi-icon name="play" class="mr-2" />
                        {{ " " }}{{ stream.streamKey }}
                        </router-link>
                </ui-button>
                <p
                    v-if="!streams?.length"
                    class="px-2 py-4 text-center text-sm text-gray-400"
                >
                    No active streams right now
                </p>
            </div>
        </dialog-content>
    </ui-dialog>
</template>
