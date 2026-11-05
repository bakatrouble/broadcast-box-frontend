import { ref } from "vue";

export const ADMIN_TOKEN_STORAGE_KEY = "adminToken";

const toBase64Utf8 = (value: string | null): string => {
    const bytes = new TextEncoder().encode(value ?? "");
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
};

export function clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

export const adminAuthHeader = (token?: string | null): string =>
    `Bearer ${toBase64Utf8(token ?? localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY))}`;

export const isUnauthorizedStatus = (status: number): boolean =>
    status > 400 && status < 500;

export class AdminUnauthorizedError extends Error {
    constructor() {
        super("Admin session is no longer valid");
    }
}

interface LoginResponse {
    isValid: boolean;
    errorMessage: string;
}

const readLoginBody = async (res: Response): Promise<LoginResponse | null> => {
    try {
        return (await res.json()) as LoginResponse;
    } catch {
        return null;
    }
};

export interface AdminStreamStatus {
    streamKey: string;
    isPublic: boolean;
    motd?: string;
    videoTracks: { rid: string; packetsReceived: number }[];
    audioTracks: { rid: string; packetsReceived: number }[];
    sessions: unknown[];
}

export interface StreamProfile {
    streamKey: string;
    token: string;
    isPublic: boolean;
    motd: string;
}

const loggedIn = ref(false);

export function useAdminAuth() {
    const login = async (token: string): Promise<string | null> => {
        let res: Response;
        try {
            res = await fetch(`/api/admin/login`, {
                method: "POST",
                headers: { Authorization: adminAuthHeader(token) },
            });
        } catch {
            return "Request failed";
        }
        if (isUnauthorizedStatus(res.status)) {
            clearAdminToken();
            return "Invalid login";
        }
        const body = await readLoginBody(res);
        if (body?.isValid) {
            localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
            loggedIn.value = true;
            return null;
        }
        clearAdminToken();
        return body?.errorMessage || "Invalid login";
    };

    const logout = () => {
        clearAdminToken();
        loggedIn.value = false;
    };

    const checkStored = async () => {
        const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
        if (!token) {
            return;
        }
        try {
            const res = await fetch(`/api/admin/login`, {
                method: "POST",
                headers: { Authorization: adminAuthHeader(token) },
            });
            if (isUnauthorizedStatus(res.status)) {
                clearAdminToken();
                return;
            }
            const body = await readLoginBody(res);
            if (body?.isValid) {
                loggedIn.value = true;
            } else {
                clearAdminToken();
            }
        } catch {
            // Network down: keep the stored token, stay logged out.
        }
    };

    const authFetch = async (
        path: string,
        init?: RequestInit,
    ): Promise<Response> => {
        const res = await fetch(path, {
            ...init,
            headers: { ...init?.headers, Authorization: adminAuthHeader() },
        });
        if (isUnauthorizedStatus(res.status)) {
            logout();
            throw new AdminUnauthorizedError();
        }
        return res;
    };

    return { loggedIn, login, logout, checkStored, authFetch };
}
