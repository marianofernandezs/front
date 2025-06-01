"use client";

import Image from "next/image";
import "../styles/globals.css";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const iralogin = () => {
    router.push("/");
  };
  const FORGOT_PASSWORD_API_URL =
    process.env.NEXT_PUBLIC_FORGOT_PASSWORD_API_URL;
  const handleForgotPassword = async () => {
    setEmailError("");
    setMessage("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Ingresa un correo válido.");
      return;
    }

    try {
      const response = await fetch(`${FORGOT_PASSWORD_API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage("Revisa tu correo para restablecer la contraseña.");
        setEmail("");
      } else {
        setMessage("Error al enviar el correo. Verifica tu dirección.");
      }
    } catch {
      setMessage("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <div className="fixed inset-0 bg-white">
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
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/60 backdrop-blur-sm p-4 sm:p-8 rounded shadow-lg w-full max-w-md mx-auto">
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 text-center">
              Restablecer Contraseña
            </h1>
            <div>
              <input
                type="email"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded text-black text-sm sm:text-base"
                placeholder="Ingresa tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-1">{emailError}</p>
              )}
            </div>
            <div className="space-y-3 pt-2">
              <button
                className={`w-full ${
                  isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                } text-white p-2 sm:p-3 rounded text-sm sm:text-base transition-colors`}
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                {isLoading ? "Enviando...." : "Enviar"}
              </button>
              <p className="text-center text-sm text-gray-700">{message}</p>
              <div className="flex justify-center">
                <button
                  onClick={iralogin}
                  className="block text-center text-white hover:text-blue-500"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
              <p className="text-center text-sm text-gray-700">
                Si no recibes el correo electrónico, verifica tu bandeja de
                spam.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
