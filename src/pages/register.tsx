import { useState } from "react";
import Image from "next/image";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const REGISTER_URL_API = process.env.NEXT_PUBLIC_REGISTER_API_URL;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Enviando solicitud a:", REGISTER_URL_API); // Depuración
    console.log("Datos enviados:", formData);
    try {
      const response = await fetch(`${REGISTER_URL_API}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Registro exitoso:", data);
      } else {
        const errorData = await response.json();
        console.error("Error en el registro:", errorData);
      }
    } catch (error) {
      console.error("Error de red:", error);
    }
  };

  return (
    <main className="min-h-screen relative">
      <div className="fixed inset-0">
        <Image
          src="/camion.jpg"
          alt="Camión"
          fill
          style={{ objectFit: "cover" }}
          priority
          className="-z-10"
        />
      </div>
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="bg-white/65 p-10 rounded-lg shadow-xl w-96 mx-4">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Registro de Usuario
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">Usuario</h2>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Nombre de usuario"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">
                Correo Electrónico
              </h2>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">
                Contraseña
              </h2>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contraseña"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">
                Confirmar Contraseña
              </h2>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirmar contraseña"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors mt-6"
            >
              Registrarse
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
