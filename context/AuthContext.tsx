import React, {
    createContext,
    useContext,
    useEffect,
    useReducer,
    useCallback,
    ReactNode,
} from "react";
import { AuthContextType, AuthUser } from "@/types";
import { staffLogin } from "@/services/api";
import { saveAuthUser, loadAuthUser, clearAuthUser } from "@/services/storage";

// ─── State Shape ────────────────────────────────────────
interface AuthState {
    user: AuthUser | null;
    isLoading: boolean; // true while AsyncStorage is being read on boot
}

// ─── Actions ────────────────────────────────────────────
type AuthAction =
    | { type: "HYDRATE"; payload: AuthUser | null }
    | { type: "LOGIN_SUCCESS"; payload: AuthUser }
    | { type: "LOGOUT" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "HYDRATE":
            return { user: action.payload, isLoading: false };
        case "LOGIN_SUCCESS":
            return { user: action.payload, isLoading: false };
        case "LOGOUT":
            return { user: null, isLoading: false };
        default:
            return state;
    }
}

// ─── Context ────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        isLoading: true,
    });

    // On app boot: hydrate persisted session
    useEffect(() => {
        (async () => {
            const savedUser = await loadAuthUser();
            dispatch({ type: "HYDRATE", payload: savedUser });
        })();
    }, []);

    // ── login ──────────────────────────────────────────────
    const login = useCallback(
        async (
            username: string,
            password: string,
        ): Promise<{ success: boolean; error?: string }> => {
            try {
                const data = await staffLogin({ username, password });

                // API uses status:1 for success
                if (data.status !== 1 && data.response_code !== 200) {
                    return {
                        success: false,
                        error:
                            data.message ||
                            data.response_message ||
                            "Login failed. Please try again.",
                    };
                }

                const authUser: AuthUser = {
                    id: data.id,
                    // token: data.token,
                    token: data.authtoken,
                    authtoken: data.authtoken,
                    role: data.role,
                    record: data.record,
                };

                await saveAuthUser(authUser);
                dispatch({ type: "LOGIN_SUCCESS", payload: authUser });
                return { success: true };
            } catch (err: any) {
                const message = err?.message?.includes("Network request failed")
                    ? "No internet connection. Please check your network."
                    : err?.message || "Something went wrong. Please try again.";
                return { success: false, error: message };
            }
        },
        [],
    );

    // ── logout ─────────────────────────────────────────────
    const logout = useCallback(async () => {
        await clearAuthUser();
        dispatch({ type: "LOGOUT" });
    }, []);

    const value: AuthContextType = {
        user: state.user,
        isLoggedIn: state.user !== null,
        isLoading: state.isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────
export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
}
