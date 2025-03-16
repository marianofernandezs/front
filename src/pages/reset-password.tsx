"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import "../styles/globals.css";

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Leer uid y token de la URL
  const uid = searchParams ? searchParams.get("uid") || "" : "";
  const token = searchParams ? searchParams.get("token") || "" : "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que ambas contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    const RESESTPASSWORD_API_URL =
      process.env.NEXT_PUBLIC_RESETPASSWORD_API_URL;

    // Enviar la petición al backend
    const response = await fetch(`${RESESTPASSWORD_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid,
        token,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Contraseña restablecida exitosamente.");
      // Opcional: redirigir a la página de login después de un tiempo
      setTimeout(() => router.push("/"), 3000);
    } else {
      setMessage(data.error || "Error al restablecer la contraseña.");
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
          <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 text-center">
            Restablecer Contraseña
          </h1>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Nueva contraseña"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded text-black"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirmar contraseña"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded text-black"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 sm:p-3 rounded transition-colors"
            >
              Restablecer Contraseña
            </button>
          </form>
          {message && (
            <p className="text-center text-sm text-gray-700 mt-2">{message}</p>
          )}
          <Link
            href="/"
            className="block text-center text-blue-500 hover:underline mt-4"
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
