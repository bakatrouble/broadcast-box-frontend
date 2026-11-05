<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import {
    Table as UiTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AdminUnauthorizedError, useAdminAuth } from "@/lib/admin";
import type { AdminStreamStatus } from "@/lib/admin";

const { authFetch } = useAdminAuth();

const { data: streams } = useQuery({
    queryKey: ["admin-status"],
    queryFn: async () => {
        const res = await authFetch(`/api/admin/status`);
        return (await res.json()) as AdminStreamStatus[];
    },
    refetchInterval: 5000,
    retry: (count, error) =>
        !(error instanceof AdminUnauthorizedError) && count < 2,
});

const totalPackets = (stream: AdminStreamStatus): number =>
    stream.videoTracks.reduce((sum, track) => sum + track.packetsReceived, 0) +
    stream.audioTracks.reduce((sum, track) => sum + track.packetsReceived, 0);
</script>

<template>
    <div class="flex h-full min-h-0 flex-col">
        <h3 class="mb-4 text-xl">Active streams</h3>
        <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="rounded-sm bg-muted p-4 overflow-x-auto">
        <ui-table>
            <table-header>
                <table-row>
                    <table-head>Stream key</table-head>
                    <table-head>Public</table-head>
                    <table-head>Video tracks</table-head>
                    <table-head>Audio tracks</table-head>
                    <table-head>Sessions</table-head>
                    <table-head class="text-right">Total packets</table-head>
                </table-row>
            </table-header>
            <table-body>
                <table-row v-for="stream in streams" :key="stream.streamKey">
                    <table-cell class="font-medium">{{
                        stream.streamKey
                    }}</table-cell>
                    <table-cell>{{ stream.isPublic ? "Yes" : "No" }}</table-cell>
                    <table-cell>{{ stream.videoTracks.length }}</table-cell>
                    <table-cell>{{ stream.audioTracks.length }}</table-cell>
                    <table-cell>{{ stream.sessions.length }}</table-cell>
                    <table-cell class="text-right">{{
                        totalPackets(stream)
                    }}</table-cell>
                </table-row>
            </table-body>
        </ui-table>
        </div>
        <p
            v-if="!streams?.length"
            class="px-2 py-4 text-center text-sm text-muted-foreground"
        >
            No active streams right now
        </p>
        </div>
    </div>
</template>
