"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";

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

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Ruta:", pathname);

      const token = localStorage.getItem("token");
      const name = localStorage.getItem("name");

      const publicRoutes = [
        "/",
        "/register",
        "/reset-password",
        "/forgotpassword",
      ];

      if (token && token !== "undefined") {
        const decoded = decodeJWT(token);

        if (decoded && decoded.user_id) {
          setUser({ token, name: name !== null ? name : "Usuario" }); // Usamos el nombre almacenado o un valor por defecto
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("name");
          router.push("/");
        }
      } else {
        console.log("No hay token almacenado, redirigiendo a /");
        if (!pathname || !publicRoutes.includes(pathname)) {
          router.push("/");
        }
      }

      setIsMounted(true);
    };

    checkAuth();
  }, [router, pathname]);

  const login = (token: string, name: string) => {
    if (token && name) {
      console.log("Iniciando sesión con token:", token);
      console.log("Iniciando sesión con nombre:", name);
      localStorage.setItem("token", token);
      localStorage.setItem("name", name);
      setUser({ token, name });
      setIsAuthenticated(true);
      router.push("/application");
    } else {
      console.error("Token inválido:", token);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/");
  };

  if (!isMounted) {
    return null;
  }

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
