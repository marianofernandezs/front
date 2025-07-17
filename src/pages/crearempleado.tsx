import React, { useState, useEffect, useCallback } from "react";
import { Save } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import withAuth from "@/hoc/withAuth";
import { useRouter } from "next/router";
import { apiRequest } from "@/utils/api";
import Head from "next/head";

function App() {
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    rut: "",
    fechaNacimiento: "",
  });
  const [edad, setEdad] = useState<number | null>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formData.fechaNacimiento) {
      const hoy = new Date();
      const nacimiento = new Date(formData.fechaNacimiento);
      let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
      const mesDiff = hoy.getMonth() - nacimiento.getMonth();
      if (
        mesDiff < 0 ||
        (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())
      ) {
        edadCalculada--;
      }
      setEdad(edadCalculada);
    } else {
      setEdad(null);
    }
  }, [formData.fechaNacimiento]);

  const mostrarAlert = useCallback(
    (message: string, type: "error" | "success") => {
      setAlert({
        message,
        type,
      });
      setTimeout(() => {
        setAlert(null);
      }, 3000);
    },
    [],
  );

  const limpiarYValidarRut = (rut: string) => {
    rut = rut.trim().toUpperCase(); // Eliminar espacios y forzar mayúsculas
    const rutRegex = /^(\d{1,2}\.\d{3}\.\d{3}-[\dkK])$/;
    return rutRegex.test(rut);
  };

  const validate = useCallback(() => {
    if (!formData.nombreCompleto.trim()) {
      mostrarAlert("El Nombre es obligatorio", "error");
      return false;
    }
    if (!formData.rut.trim() || !limpiarYValidarRut(formData.rut)) {
      mostrarAlert("El Rut no es válido", "error");
      return false;
    }
    if (!formData.fechaNacimiento) {
      mostrarAlert("La Fecha de Nacimiento es obligatoria", "error");
      return false;
    }

    return true;
  }, [formData, mostrarAlert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);

    try {
      await apiRequest("/empleados/", "POST", {
        nombre_completo: formData.nombreCompleto,
        rut: formData.rut.toUpperCase(),
        fecha_nacimiento: formData.fechaNacimiento,
        edad: edad,
      });
      mostrarAlert("Empleado guardado exitosamente.", "success");
      setFormData({ nombreCompleto: "", rut: "", fechaNacimiento: "" });
      setEdad(null);
    } catch (error: unknown) {
      let errorMessage = "Error desconocido.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (typeof error === "object" && error !== null && "response" in error) {
        const response = (
          error as {
            response?: { status?: number; data?: { message?: string } };
          }
        ).response;
        if (response) {
          if (response.status === 409) {
            errorMessage = "El RUT ingresado ya existe.";
          } else if (response.status === 400) {
            errorMessage = "Datos inválidos. Revisa los campos.";
          } else {
            errorMessage = `Error: ${response.data?.message || "Error inesperado."}`;
          }
        }
      }
      mostrarAlert(`Error: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  const irAInicio = () => {
    router.push("/application");
  };

  return (
    <>
      <Head>
        <title>Crear Funcionario</title>
      </Head>
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
        {alert && (
          <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-50 ${
              alert.type === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {alert.message}
          </div>
        )}

        <div className="relative z-10">
          <nav className="bg-gray-300/90 shadow-lg backdrop-blur-sm">
            <div className="w-full px-2">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center pl-0">
                  <Image
                    src="/logo.png"
                    alt="Logo SSC"
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
          </nav>
        </div>

        {/* Main Content */}
        <main className="max-w-lg mx-auto mt-8 px-4 relative z-10">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">
              Crear Funcionario
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre Completo:
                    </label>
                    <input
                      type="text"
                      value={formData.nombreCompleto}
                      placeholder="Nombre Completo"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nombreCompleto: e.target.value,
                        })
                      }
                      className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha de Nacimiento:
                    </label>
                    <input
                      type="date"
                      placeholder="2020-09-13"
                      value={formData.fechaNacimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaNacimiento: e.target.value,
                        })
                      }
                      className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Edad:
                    </label>
                    <p className="mt-1 text-gray-700">
                      {edad !== null ? edad : "No disponible"}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      RUT:
                    </label>
                    <input
                      type="text"
                      placeholder="12.345.678-9"
                      value={formData.rut}
                      onChange={(e) =>
                        setFormData({ ...formData, rut: e.target.value })
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
                  className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  }`}
                >
                  {loading ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      );
    </>
  );
}

export default withAuth(App);
