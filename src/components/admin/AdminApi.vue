<script setup lang="ts">
import {
    Table as UiTable,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Mirrors the upstream stub: headers only, no data source behind it.
</script>

<template>
    <div>
        <h3 class="mb-4 text-xl">API</h3>
        <ui-table>
            <table-header>
                <table-row>
                    <table-head>Setting</table-head>
                    <table-head>Value</table-head>
                </table-row>
            </table-header>
            <table-body />
        </ui-table>
    </div>
</template>
