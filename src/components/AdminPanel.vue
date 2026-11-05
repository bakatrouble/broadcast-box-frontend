<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "reka-ui";
import { Button as UiButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTitle } from "@/components/ui/dialog";
import { Input as UiInput } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import MdiIcon from "@/components/MdiIcon.vue";
import AdminDialog from "@/components/admin/AdminDialog.vue";
import AdminApi from "@/components/admin/AdminApi.vue";
import AdminStatus from "@/components/admin/AdminStatus.vue";
import AdminProfiles from "@/components/admin/AdminProfiles.vue";
import AdminLogging from "@/components/admin/AdminLogging.vue";
import { useAdminAuth } from "@/lib/admin";

const { loggedIn, login, logout, checkStored } = useAdminAuth();

const open = ref(false);

const token = ref("");
const error = ref("");
const menu = ref<string>("Status");

const menus = ["Status", "Profiles", "Logging", "API", "Settings"];
const disabledMenus = ["API", "Settings"];

const tabList = ref<{ $el: unknown } | null>(null);
const marker = reactive({ left: 0, width: 0 });
let markerObserver: ResizeObserver | null = null;

const updateMarker = () => {
    const root = tabList.value?.$el as HTMLElement | undefined;
    const active = root?.querySelector<HTMLElement>('[data-state="active"]');
    if (!active) {
        return;
    }
    marker.left = active.offsetLeft;
    marker.width = active.offsetWidth;
};

const doLogin = async () => {
    error.value = (await login(token.value)) ?? "";
    token.value = "";
};

const doLogout = () => {
    logout();
    error.value = "";
};

const close = () => {
    open.value = false;
};

const onKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
    }
    if ((e.target as HTMLElement | null)?.closest("input, textarea, select")) {
        return;
    }
    if (e.code === "KeyA") {
        open.value = true;
    }
};

watch(menu, () => {
    void nextTick(updateMarker);
});

const observeList = () => {
    const root = tabList.value?.$el;
    if (!(root instanceof HTMLElement)) {
        return;
    }
    markerObserver?.disconnect();
    markerObserver = new ResizeObserver(updateMarker);
    markerObserver.observe(root);
};

watch(open, (isOpen) => {
    if (!isOpen) {
        return;
    }
    void nextTick(() => {
        updateMarker();
        observeList();
    });
});

onMounted(() => {
    void checkStored();
    window.addEventListener("keydown", onKeyDown);
    updateMarker();
    observeList();
});

onUnmounted(() => {
    window.removeEventListener("keydown", onKeyDown);
    markerObserver?.disconnect();
});
</script>

<template>
    <div class="admin-theme">
        <tooltip-provider>
        <admin-dialog
            v-model:open="open"
            content-class="h-[600px] max-h-[85vh] w-[900px] max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-md p-0 sm:max-w-none sm:rounded-md"
        >
            <dialog-title class="sr-only">Administration</dialog-title>
            <div class="h-full min-h-0 w-full min-w-0 overflow-y-auto px-4 py-4">
            <div
                v-if="!loggedIn"
                class="flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center"
            >
                <card class="w-full max-w-sm">
                    <card-header class="flex flex-row items-center">
                        <card-title>Admin login</card-title>
                        <div class="grow" />
                        <ui-button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Close"
                            @click="close"
                        >
                            <mdi-icon name="close" />
                        </ui-button>
                    </card-header>
                    <card-content class="flex flex-col gap-3">
                        <ui-input
                            v-model="token"
                            type="password"
                            placeholder="Admin token"
                            @keyup.enter="doLogin"
                        />
                        <ui-button @click="doLogin"> Login </ui-button>
                        <p v-if="error" class="text-sm text-destructive">
                            {{ error }}
                        </p>
                    </card-content>
                </card>
            </div>

            <div v-else class="flex h-full min-h-0 w-full min-w-0 flex-col gap-4">
                <div class="flex min-w-0 flex-row items-center gap-2">
                    <h3 class="text-xl">Administration</h3>
                    <div class="grow" />
                    <ui-button
                        variant="ghost"
                        size="icon"
                        aria-label="Logout"
                        title="Logout"
                        @click="doLogout"
                    >
                        <mdi-icon name="logout" size="20" />
                    </ui-button>
                    <ui-button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Close"
                        @click="close"
                    >
                        <mdi-icon name="close" />
                    </ui-button>
                </div>

                <tabs-root
                    v-model="menu"
                    class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4"
                >
                    <tabs-list
                        ref="tabList"
                        class="relative flex flex-row gap-2"
                    >
                        <div
                            aria-hidden="true"
                            class="absolute inset-y-0 rounded-sm bg-accent transition-[left,width] duration-200 ease-out"
                            :style="{
                                left: `${marker.left}px`,
                                width: `${marker.width}px`,
                            }"
                        />
                        <tabs-trigger
                            v-for="item in menus"
                            :key="item"
                            :value="item"
                            :disabled="disabledMenus.includes(item)"
                            class="relative flex h-8 flex-1 items-center justify-center rounded-sm px-2.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-accent-foreground data-[state=active]:hover:bg-muted/50 data-[state=active]:hover:text-accent-foreground"
                        >
                            {{ item }}
                        </tabs-trigger>
                    </tabs-list>

                    <card class="min-h-0 min-w-0 flex-1">
                        <card-content class="h-full p-4 flex-1">
                            <tabs-content value="Status" class="h-full">
                                <admin-status />
                            </tabs-content>
                            <tabs-content value="Profiles" class="h-full">
                                <admin-profiles />
                            </tabs-content>
                            <tabs-content value="Logging" class="h-full">
                                <admin-logging />
                            </tabs-content>
                            <tabs-content value="API" class="h-full">
                                <admin-api />
                            </tabs-content>
                            <tabs-content value="Settings" class="h-full">
                                <p
                                    class="px-2 py-4 text-center text-sm text-muted-foreground"
                                >
                                    Not available in this build
                                </p>
                            </tabs-content>
                        </card-content>
                    </card>
                </tabs-root>
            </div>
            </div>
        </admin-dialog>
        </tooltip-provider>
    </div>
</template>
