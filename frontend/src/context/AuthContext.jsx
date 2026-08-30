import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseConfigError } from "../services/supabase";
import { normalizeProfile } from "../utils/authBranchPolicy";

const AuthContext = createContext(null);

function createSignedOutState() {
  return {
    session: null,
    authUser: null,
    profile: null,
    currentUser: null,
    isAuthenticated: false,
    hasSession: false,
    isLoading: false,
    profileState: "signed-out",
    error: "",
  };
}

function mapAuthErrorMessage(error) {
  const message = error?.message?.trim();
  if (!message) {
    return "We could not sign you in. Please try again.";
  }

  if (message.toLowerCase().includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }

  return message;
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => ({
    ...createSignedOutState(),
    isLoading: !supabaseConfigError,
    profileState: supabaseConfigError ? "config-error" : "loading",
  }));

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthState({
        ...createSignedOutState(),
        profileState: "config-error",
        error: supabaseConfigError,
      });
      return undefined;
    }

    let active = true;

    const syncSession = async (session) => {
      if (!active) return null;

      if (!session) {
        setAuthState(createSignedOutState());
        return null;
      }

      setAuthState((current) => ({
        ...current,
        session,
        hasSession: true,
        isLoading: true,
        profileState: "loading",
        error: "",
      }));

      const [{ data: userResult, error: userError }, profileResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
      ]);

      if (!active) return null;

      if (userError) {
        setAuthState({
          ...createSignedOutState(),
          error: "We could not verify your account session.",
        });
        return null;
      }

      if (profileResult.error) {
        setAuthState({
          session,
          authUser: userResult.user ?? session.user,
          profile: null,
          currentUser: null,
          hasSession: true,
          isAuthenticated: false,
          isLoading: false,
          profileState: "missing",
          error: "We could not load your Taste It profile.",
        });
        return null;
      }

      if (!profileResult.data) {
        setAuthState({
          session,
          authUser: userResult.user ?? session.user,
          profile: null,
          currentUser: null,
          hasSession: true,
          isAuthenticated: false,
          isLoading: false,
          profileState: "missing",
          error: "No Taste It profile was found for this account.",
        });
        return null;
      }

      const currentUser = normalizeProfile(profileResult.data, userResult.user ?? session.user);
      if (!currentUser?.role) {
        setAuthState({
          session,
          authUser: userResult.user ?? session.user,
          profile: profileResult.data,
          currentUser: null,
          hasSession: true,
          isAuthenticated: false,
          isLoading: false,
          profileState: "missing",
          error: "Your Taste It profile does not have a supported application role.",
        });
        return null;
      }

      if (!currentUser.isActive) {
        setAuthState({
          session,
          authUser: userResult.user ?? session.user,
          profile: profileResult.data,
          currentUser,
          hasSession: true,
          isAuthenticated: false,
          isLoading: false,
          profileState: "inactive",
          error: "",
        });
        return null;
      }

      setAuthState({
        session,
        authUser: userResult.user ?? session.user,
        profile: profileResult.data,
        currentUser,
        hasSession: true,
        isAuthenticated: true,
        isLoading: false,
        profileState: "active",
        error: "",
      });

      return currentUser;
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthState({
          ...createSignedOutState(),
          error: "We could not read the current Supabase session.",
        });
        return;
      }
      void syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    if (!supabase) {
      throw new Error(supabaseConfigError);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(mapAuthErrorMessage(error));
    }

    return data.user ?? null;
  };

  const logout = async () => {
    if (!supabase) {
      setAuthState(createSignedOutState());
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error("We could not sign you out right now.");
    }
  };

  const refreshProfile = async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  };

  const syncRuntimeBranchId = (branchId) => {
    setAuthState((current) => {
      if (!current.currentUser || current.currentUser.role !== "STAFF") {
        return current;
      }

      return {
        ...current,
        currentUser: {
          ...current.currentUser,
          branchId,
        },
      };
    });
  };

  const updateUser = (changes) => {
    setAuthState((current) => {
      if (!current.currentUser) {
        return current;
      }

      return {
        ...current,
        currentUser: {
          ...current.currentUser,
          ...changes,
        },
        profile: current.profile
          ? {
              ...current.profile,
              full_name: changes.name ?? current.profile.full_name,
              name: changes.name ?? current.profile.name,
              phone: changes.phone ?? current.profile.phone,
            }
          : current.profile,
      };
    });
  };

  const value = {
    ...authState,
    configError: supabaseConfigError,
    login,
    logout,
    refreshProfile,
    syncRuntimeBranchId,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
