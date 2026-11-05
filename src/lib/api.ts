import { useQuery } from "@tanstack/vue-query";

export const API_BASE = "https://broadcast.bakatrouble.me";
export const DEFAULT_CHANNEL = "bakatrouble";

export interface StreamStatus {
    streamKey: string;
    videoTracks?: { rid: string }[];
    audioTracks?: { rid: string }[];
    sessions?: unknown[];
}

export function useStreams() {
    return useQuery({
        queryKey: ["streams"],
        queryFn: async () => {
            const r = await fetch(`${API_BASE}/api/status`).then((res) =>
                res.json(),
            );
            return r as StreamStatus[];
        },
        refetchInterval: 5000,
    });
}
