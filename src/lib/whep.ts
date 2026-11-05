import { onMounted, onUnmounted, ref, watch } from "vue";
import type { MaybeRefOrGetter, Ref } from "vue";
import { toValue } from "vue";
import { API_BASE } from "./api";

const CONNECT_TIMEOUT_MS = 10_000;
const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 30_000;

export interface WhepConnectionOptions {
    video: Ref<HTMLVideoElement | undefined>;
    channel: MaybeRefOrGetter<string>;
    isLive: MaybeRefOrGetter<boolean>;
}

export function useWhepConnection(options: WhepConnectionOptions): {
    videoReady: Ref<boolean>;
} {
    const { video, channel, isLive } = options;
    const videoReady = ref(false);

    let peer: RTCPeerConnection | null = null;
    let connectSeq = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelayMs = RETRY_BASE_MS;
    let aborter: AbortController | null = null;

    const teardownPeer = () => {
        connectSeq += 1;
        if (retryTimer !== null) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
        aborter?.abort();
        aborter = null;
        if (peer !== null) {
            peer.onconnectionstatechange = null;
            peer.ontrack = null;
            peer.close();
            peer = null;
        }
        if (video.value) {
            video.value.srcObject = null;
        }
    };

    const whepOnce = async (
        signal: AbortSignal,
    ): Promise<RTCPeerConnection> => {
        const pc = new RTCPeerConnection({
            bundlePolicy: "max-bundle",
        });
        try {
            pc.addTransceiver("audio", { direction: "recvonly" });
            pc.addTransceiver("video", { direction: "recvonly" });
            pc.ontrack = (e) => {
                const el = video.value;
                const stream = e.streams[0];
                if (el && stream) {
                    el.srcObject = stream;
                }
            };

            const offer = await pc.createOffer();
            if (!offer.sdp) {
                throw new Error("whep: empty local offer");
            }
            // The server expects stereo Opus.
            const patchedSdp = offer.sdp.replace(
                `useinbandfec=1`,
                `useinbandfec=1;stereo=1`,
            );
            await pc.setLocalDescription({ type: offer.type, sdp: patchedSdp });

            const res = await fetch(`${API_BASE}/api/whep`, {
                method: "POST",
                body: patchedSdp,
                headers: {
                    Authorization: `Bearer ${toValue(channel)}`,
                    "Content-Type": "application/sdp",
                },
                signal,
            });
            const answer = await res.text();
            if (!res.ok) {
                throw new Error(
                    `whep: request failed (${res.status}): ${answer.slice(0, 200)}`,
                );
            }
            if (!answer.startsWith("v=")) {
                throw new Error("whep: invalid SDP answer");
            }
            try {
                await pc.setRemoteDescription({ sdp: answer, type: "answer" });
            } catch (e) {
                throw new Error(
                    `whep: invalid SDP answer (${(e as Error).message})`,
                );
            }
            return pc;
        } catch (e) {
            pc.onconnectionstatechange = null;
            pc.ontrack = null;
            pc.close();
            throw e;
        }
    };

    const scheduleReconnect = () => {
        if (retryTimer !== null || !toValue(isLive)) {
            return;
        }
        const delay = retryDelayMs;
        retryDelayMs = Math.min(RETRY_MAX_MS, retryDelayMs * 2);
        retryTimer = setTimeout(() => {
            retryTimer = null;
            void connectManaged();
        }, delay);
    };

    const connectManaged = async () => {
        if (!toValue(isLive)) {
            return;
        }
        // Already healthy (or getting there) — e.g. status flapped or a
        // transient disconnect healed before a scheduled retry fired.
        if (
            peer !== null &&
            (peer.connectionState === "connected" ||
                peer.connectionState === "connecting")
        ) {
            return;
        }
        teardownPeer();
        const seq = connectSeq;
        aborter = new AbortController();
        const timeout = setTimeout(() => aborter?.abort(), CONNECT_TIMEOUT_MS);
        try {
            const pc = await whepOnce(aborter.signal);
            if (seq !== connectSeq) {
                pc.close();
                return;
            }
            peer = pc;
            retryDelayMs = RETRY_BASE_MS;
            pc.onconnectionstatechange = () => {
                if (peer !== pc) {
                    return;
                }
                if (pc.connectionState === "failed") {
                    console.warn("whep: connection failed, reconnecting");
                    void connectManaged();
                } else if (pc.connectionState === "disconnected") {
                    // Transient blips self-heal; the scheduled attempt is a
                    // no-op if we're connected again by the time it fires,
                    // and never runs when the stream is down in status.
                    console.warn("whep: connection lost, reconnecting");
                    scheduleReconnect();
                }
            };
        } catch (e) {
            if (seq !== connectSeq) {
                return;
            }
            console.warn("whep: connect failed", e);
            scheduleReconnect();
        } finally {
            clearTimeout(timeout);
        }
    };

    watch(
        () => toValue(channel),
        () => {
            videoReady.value = false;
            teardownPeer();
            void connectManaged();
        },
    );

    watch(
        () => toValue(isLive),
        (live) => {
            if (live) {
                void connectManaged();
            } else {
                teardownPeer();
            }
        },
    );

    onMounted(() => {
        void connectManaged();
    });

    onUnmounted(() => {
        teardownPeer();
    });

    return { videoReady };
}
