"use client";

import Image from "next/image";
import Link from "next/link";
import "../styles/globals.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // || "http://localhost:8000/api";

  const handleLogin = async () => {
    if (!isClient) return;

    if (username && password) {
      // Aquí puedes hacer una llamada a tu API para verificar las credenciales
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        credentials: "include",
      });

      console.log("Respuesta de la Api:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta Completa de la Api:", data);
        if (data.token && data.user) {
          login(data.token, data.user);
          console.log("Token recibido:", data.token);
          router.push("/application");
        } else {
          setError("Respuesta del servidor invalida");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Error al iniciar sesión");
        alert("Usuario o contraseña incorrectos");
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <Image
            src="/camion.jpg"
            alt="Camión"
            fill
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            priority
            className="z-0"
          />
        </div>
      </div>
      <div className="relative z-20 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white/60 backdrop-blur-md p-6 sm:p-10 rounded-2xl shadow-lg w-full max-w-md">
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800">
                Usuario
              </h1>
              <input
                type="text"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded text-black text-sm sm:text-base"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800">
                Contraseña
              </h1>
              <input
                type="password"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded text-black text-sm sm:text-base"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 sm:p-3 rounded text-sm sm:text-base transition-colors"
                onClick={handleLogin}
              >
                Iniciar Sesión
              </button>
              {error && <p className="text-red-500">{error}</p>}

              <Link href="/register" className="block">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white p-2 sm:p-3 rounded text-sm sm:text-base transition-colors">
                  Registrarse
                </button>
              </Link>
              <Link href="/forgotpassword" className="block">
                <button className="w-full bg-rose-500 hover:bg-rose-600 text-white p-2 sm:p-3 rounded text-sm sm:text-base transition-colors">
                  Restablecer contraseña
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
