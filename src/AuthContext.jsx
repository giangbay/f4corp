import { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    fetchApi("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((error) => {
        setUser(null);
        setAuthError(error.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function signIn(credentials) {
    const { user: signedInUser } = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setUser(signedInUser);
    setAuthError("");
    return signedInUser;
  }

  async function register(details) {
    const { user: registeredUser } = await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
    });
    setUser(registeredUser);
    setAuthError("");
    return registeredUser;
  }

  async function signOut() {
    await fetchApi("/auth/logout", { method: "POST" });
    setUser(null);
    setAuthError("");
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, authError, signIn, register, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
