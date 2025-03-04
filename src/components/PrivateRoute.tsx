// components/PrivateRoute.tsx
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth(); // Obtener el estado de autenticación
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "";
  const publicRoutes = useMemo(
    () => ["/", "/register", "/forgot-password", "/reset-password"],
    [],
  ); // Rutas públicas

  useEffect(() => {
    // Si el usuario no está autenticado, redirigirlo a la página de login
    if (!user && !publicRoutes.includes(safePathname)) {
      router.push("/"); // Redirige a la página de inicio o login
    }
  }, [user, router, safePathname, publicRoutes]);

  // Mostrar un mensaje de carga mientras verificamos la autenticación
  if (!user && !publicRoutes.includes(safePathname)) {
    return <div>Cargando...</div>;
  }

  // Si está autenticado, renderizar los componentes hijos (contenido de la página)
  return <>{children}</>;
};

export default PrivateRoute;
