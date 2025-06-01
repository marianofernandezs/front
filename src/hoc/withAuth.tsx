"use client";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
) => {
  const Wrapper = (props: P) => {
    const router = useRouter();
    const { user } = useAuth();
    const publicRoutes = useMemo(
      () => ["/", "/register", "/forgot-password"],
      [],
    );

    useEffect(() => {
      if (!user && !publicRoutes.includes(router.pathname)) {
        router.push("/"); // Redirige a la página de inicio (src/app/page.tsx)
      }
    }, [user, router, publicRoutes]);

    if (!user && !publicRoutes.includes(router.pathname)) {
      return null; // Muestra algo mientras se redirige
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth;
