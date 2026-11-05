<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { Button as UiButton } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input as UiInput } from "@/components/ui/input";
import {
    Table as UiTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import MdiIcon from "@/components/MdiIcon.vue";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import {
    AdminUnauthorizedError,
    useAdminAuth,
    type StreamProfile,
} from "@/lib/admin";

const { authFetch } = useAdminAuth();

const addOpen = ref(false);
const newKey = ref("");
const removeKey = ref("");
const error = ref("");
const copiedKey = ref("");
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

onUnmounted(() => {
    if (copiedTimer !== null) {
        clearTimeout(copiedTimer);
    }
});

const { data: profiles, refetch } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
        const res = await authFetch(`/api/admin/profiles`);
        return (await res.json()) as StreamProfile[];
    },
    retry: (count, err) =>
        !(err instanceof AdminUnauthorizedError) && count < 2,
});

const postProfile = async (
    path: string,
    streamKey: string,
): Promise<string | null> => {
    try {
        const res = await authFetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ streamKey }),
        });
        if (res.status === 400) {
            return await res.text();
        }
        return null;
    } catch (e) {
        if (e instanceof AdminUnauthorizedError) {
            return null;
        }
        return "Request failed";
    }
};

const copyToken = async (tokenText: string, streamKey: string) => {
    try {
        await navigator.clipboard.writeText(tokenText);
    } catch {
        // Clipboard unavailable; token stays visible for manual copy.
        return;
    }
    copiedKey.value = streamKey;
    if (copiedTimer !== null) {
        clearTimeout(copiedTimer);
    }
    copiedTimer = setTimeout(() => {
        copiedKey.value = "";
        copiedTimer = null;
    }, 2000);
};

const addProfile = async () => {
    const key = newKey.value.trim();
    if (!key) {
        return;
    }
    error.value =
        (await postProfile(`/api/admin/profiles/add-profile`, key)) ?? "";
    if (!error.value) {
        addOpen.value = false;
        newKey.value = "";
        await refetch();
    }
};

const removeProfile = async () => {
    error.value =
        (await postProfile(
            `/api/admin/profiles/remove-profile`,
            removeKey.value,
        )) ?? "";
    if (!error.value) {
        removeKey.value = "";
        await refetch();
    }
};

const resetToken = async (streamKey: string) => {
    await postProfile(`/api/admin/profiles/reset-token`, streamKey);
    await refetch();
};
</script>

<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="mb-4 flex flex-row items-center">
            <h3 class="text-xl">Stream profiles</h3>
            <div class="grow" />
            <ui-button @click="addOpen = true"> Add profile </ui-button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="rounded-sm bg-muted p-4 overflow-x-auto">
        <ui-table>
            <table-header>
                <table-row>
                    <table-head>Stream key</table-head>
                    <table-head>Public</table-head>
                    <table-head>MOTD</table-head>
                    <table-head>Token</table-head>
                    <table-head />
                </table-row>
            </table-header>
            <table-body>
                <table-row
                    v-for="profile in profiles"
                    :key="profile.streamKey"
                >
                    <table-cell class="font-medium">{{
                        profile.streamKey
                    }}</table-cell>
                    <table-cell>{{ profile.isPublic ? "Yes" : "No" }}</table-cell>
                    <table-cell>{{ profile.motd }}</table-cell>
                    <table-cell>
                        <tooltip
                            :open="copiedKey === profile.streamKey"
                        >
                            <tooltip-trigger as-child>
                                <span
                                    class="flex cursor-pointer flex-row items-center gap-2"
                                    title="Copy to clipboard"
                                    @click="
                                        copyToken(
                                            profile.token,
                                            profile.streamKey,
                                        )
                                    "
                                >
                                    <mdi-icon name="content-copy" size="16" />
                                    <span class="font-mono text-xs">{{
                                        profile.token
                                    }}</span>
                                </span>
                            </tooltip-trigger>
                            <tooltip-content align="start"
                                >Copied!</tooltip-content
                            >
                        </tooltip>
                    </table-cell>
                    <table-cell class="whitespace-nowrap">
                        <ui-button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Reset token"
                            title="Reset token"
                            @click="resetToken(profile.streamKey)"
                        >
                            <mdi-icon name="refresh" size="20" />
                        </ui-button>
                        <ui-button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remove profile"
                            title="Remove profile"
                            @click="removeKey = profile.streamKey"
                        >
                            <mdi-icon
                                name="delete"
                                size="20"
                                class="text-destructive"
                            />
                        </ui-button>
                    </table-cell>
                </table-row>
            </table-body>
        </ui-table>
        </div>
        <p
            v-if="!profiles?.length"
            class="px-2 py-4 text-center text-sm text-muted-foreground"
        >
            No profiles yet
        </p>
        </div>

        <admin-dialog v-model:open="addOpen">
            <dialog-title>Add profile</dialog-title>
            <dialog-description>
                Stream key for the new profile
            </dialog-description>
            <ui-input
                v-model="newKey"
                placeholder="Stream key"
                @keyup.enter="addProfile"
            />
            <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            <div class="flex flex-row justify-end gap-2">
                <ui-button variant="ghost" @click="addOpen = false">
                    Cancel
                </ui-button>
                <ui-button @click="addProfile"> Add </ui-button>
            </div>
        </admin-dialog>

        <admin-dialog
            :open="removeKey !== ''"
            @update:open="(value) => { if (!value) removeKey = ''; }"
        >
            <dialog-title>Remove profile</dialog-title>
            <dialog-description>
                Remove profile "{{ removeKey }}"?
            </dialog-description>
            <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
            <div class="flex flex-row justify-end gap-2">
                <ui-button variant="ghost" @click="removeKey = ''">
                    Cancel
                </ui-button>
                <ui-button variant="destructive" @click="removeProfile">
                    Remove
                </ui-button>
            </div>
        </admin-dialog>
    </div>
</template>
