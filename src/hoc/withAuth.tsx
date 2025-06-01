"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
) => {
  const Wrapper = (props: P) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const publicRoutes = useMemo(
      () => ["/", "/register", "/forgot-password"],
      [],
    );

    useEffect(() => {
      if (!user && pathname && !publicRoutes.includes(pathname)) {
        router.push("/"); // Redirige a la página de inicio (src/app/page.tsx)
      }
    }, [user, pathname, router, publicRoutes]);

    if (!user && pathname && !publicRoutes.includes(pathname)) {
      return null; // Muestra algo mientras se redirige
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth;
