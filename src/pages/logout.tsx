// src/pages/logout.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext"; // Asegúrate de que useAuth esté exportado correctamente

const Logout = () => {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Llama a la función logout y redirige a la página de inicio
    logout();
    router.push("/"); // Redirige a la página de inicio o login
  }, [logout, router]);

  return <div>Redirigiendo...</div>;
};

export default Logout;
