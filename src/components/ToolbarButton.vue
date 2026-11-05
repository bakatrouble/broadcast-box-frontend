<script setup lang="ts">
import { Button } from "@/components/ui/button";
import type { ButtonVariants } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

defineOptions({ inheritAttrs: false });

withDefaults(
    defineProps<{
        size?: ButtonVariants["size"];
        tooltip?: string;
    }>(),
    { size: "icon" },
);
</script>

<template>
    <!-- NOTE: attributes must be bound explicitly below. This component's
         root is <tooltip> (renders no element of its own), so fallthrough
         onto it would hit a fragment and silently drop class/aria/click. -->
    <tooltip>
        <tooltip-trigger as-child>
            <Button
                v-bind="$attrs"
                variant="ghost"
                :size="size"
                class="rounded-sm border-0 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-gray-200"
            >
                <slot />
            </Button>
        </tooltip-trigger>
        <tooltip-content v-if="tooltip !== undefined">{{
            tooltip
        }}</tooltip-content>
    </tooltip>
</template>
