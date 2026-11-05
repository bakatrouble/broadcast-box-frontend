<script setup lang="ts">
import { TooltipProvider } from "@/components/ui/tooltip";
</script>

<template>
    <tooltip-provider>
        <router-view />
    </tooltip-provider>
</template>
