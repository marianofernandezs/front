import React, { useState } from "react";
import { Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import withAuth from "@/hoc/withAuth";
import { useRouter } from "next/router";

const VEHICLES_API_URL =
  process.env.NEXT_PUBLIC_VEHICLES_API_URL ||
  "http://localhost:8000/api/vehiculos/";

function App() {
  const [formData, setFormData] = useState({
    matricula: "",
    numero_de_maquina: 0,
    marca: "",
    modelo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Datos a enviar:", formData);
    try {
      const response = await fetch(VEHICLES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricula: formData.matricula,
          numero_de_maquina: formData.numero_de_maquina,
          marca: formData.marca,
          modelo: formData.modelo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Vehículo guardado:", data);
        alert("Creación de vehículo exitosa");
        setFormData({
          matricula: "",
          numero_de_maquina: 0,
          marca: "",
          modelo: "",
        });
      } else {
        const errorData = await response.json();
        alert("Error al guardar el vehículo:");
        console.error("Error al guardar el vehículo:", errorData);
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error en la solicitud");
    }
  };

  const router = useRouter();

  const irAInicio = () => {
    router.push("/application");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <div className="fixed inset-0 bg-white">
        <div className="absolute inset-0">
          <Image
            src="/Fondoapp.jpg"
            alt="Fondo"
            fill
            style={{ objectFit: "cover" }}
            priority
            className="opacity-50"
          />
        </div>
      </div>
      {/* Header */}
      <header className="relative z-10">
        <div className="bg-gray-300/90 shadow-lg backdrop-blur-sm">
          <div className="w-full px-2">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center pl-0">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={100}
                  height={40}
                  className="ml-0"
                  style={{ width: "auto", height: "auto" }}
                  priority
                />
              </div>
              <div className="flex items-center space-x-4 pr-4">
                <button
                  onClick={irAInicio}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Inicio
                </button>
                <Link
                  href="/logout"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Cerrar Sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto mt-8 px-4 relative z-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Crear Vehículo
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Matrícula:
                  </label>
                  <input
                    placeholder="LL.PY-90"
                    type="text"
                    value={formData.matricula}
                    onChange={(e) =>
                      setFormData({ ...formData, matricula: e.target.value })
                    }
                    className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Marca:
                  </label>
                  <input
                    placeholder="Mercedes"
                    type="text"
                    value={formData.marca}
                    onChange={(e) =>
                      setFormData({ ...formData, marca: e.target.value })
                    }
                    className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Máquina:
                  </label>
                  <input
                    placeholder="13"
                    type="number"
                    value={formData.numero_de_maquina}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_de_maquina: parseInt(e.target.value),
                      })
                    }
                    className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Modelo:
                  </label>
                  <input
                    placeholder="CLA-500"
                    type="text"
                    value={formData.modelo}
                    onChange={(e) =>
                      setFormData({ ...formData, modelo: e.target.value })
                    }
                    className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default withAuth(App);
