"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiRequest } from "@/utils/api";
import { decode } from "querystring";

interface User {
  token: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Función para decodificar manualmente un JWT
function decodeJWT(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/");
  }, [router]);

  const login = useCallback(
    async (token: string, name: string) => {
      if (!token) {
        console.error("Token inválido:", token);
        return;
      }

      localStorage.setItem("token", token);

      try {
        const profile = await apiRequest("/profile/");
        setUser({ token, name: profile.username || name });
        setIsAuthenticated(true);
        router.push("/application");
      } catch (error) {
        console.error("Error al obtener el perfil:", error);
        logout();
      }
    },
    [router, logout],
  );

  useEffect(() => {
    const checkAuth = async () => {
      let token: string | null = null;

      try {
        token = localStorage.getItem("token");
      } catch (err) {
        console.warn("⚠️ No se pudo acceder a localStorage:", err);
      }

      const publicRoutes = [
        "/",
        "/register",
        "/reset-password",
        "/forgotpassword",
      ];

      if (token && token !== "undefined") {
        const decoded = decodeJWT(token);

        if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
          console.warn("Token expirado.");
          logout();
          return;
        }

        if (decoded && decoded.user_id) {
          try {
            const profile = await apiRequest("/profile/");
            setUser({ token, name: profile.username || profile.email });
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Error al obtener el perfil:", error);
            logout();
          }
        } else {
          logout();
        }
      } else {
        if (!pathname || !publicRoutes.includes(pathname)) {
          router.push("/");
        }
      }

      setIsMounted(true);
    };

    checkAuth();
  }, [pathname, logout, router]);

  if (!isMounted) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
