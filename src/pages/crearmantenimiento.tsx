import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import withAuth from "@/hoc/withAuth";
import { useRouter } from "next/router";
import { apiRequest, APIError } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface Vehicle {
  id: number;
  matricula: string;
  modelo: string;
}

function CrearMantenimiento() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicleMatricula, setSelectedVehicleMatricula] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [maintenanceData, setMaintenanceData] = useState({
    numero_mantenimiento: "",
    fecha: "",
    tipo_de_aceite: "",
    litros_de_aceite: "",
    refrigerante: "",
    litros_de_refrigerante: "",
    filtro_de_aceite: false,
    filtro_de_polen: false,
    filtro_de_aire: false,
    filtro_de_petroleo: false,
    kilometraje: "",
    proxima_mantencion_kilometraje: "",
    observaciones: "",
  });

  const router = useRouter();

  // Fetch vehicles usando AbortController para evitar actualizaciones si el componente se desmonta
  useEffect(() => {
    if (!user) return;

    const fetchVehicles = async () => {
      try {
        const response = await apiRequest("/vehiculos/");
        setVehicles(response);
      } catch (error: unknown) {
        console.error("Error al obtener vehículos:", error);
        setMensajeError("Error al obtener vehículos.");
        setTimeout(() => setMensajeError(null), 4000);
      }
    };
    fetchVehicles();
  }, [user]);

  // Manejo centralizado de los cambios en los inputs del formulario
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setMaintenanceData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validarFormulario = () => {
    const {
      numero_mantenimiento,
      kilometraje,
      litros_de_aceite,
      litros_de_refrigerante,
    } = maintenanceData;

    const mostrarError = (mensaje: string) => {
      setMensajeError(`❌ ${mensaje}`);
      setTimeout(() => setMensajeError(null), 4000);
    };

    if (!/^\d+$/.test(numero_mantenimiento)) {
      mostrarError("El número de mantenimiento debe ser un número positivo.");
      return false;
    }

    if (!/^\d+$/.test(kilometraje)) {
      mostrarError("El kilometraje debe ser un número positivo.");
      return false;
    }

    if (
      !/^\d+(\.\d+)?$/.test(litros_de_aceite) ||
      parseFloat(litros_de_aceite) <= 0
    ) {
      mostrarError("Los litros de aceite deben ser un número positivo.");
      return false;
    }

    if (
      !/^\d+(\.\d+)?$/.test(litros_de_refrigerante) ||
      parseFloat(litros_de_refrigerante) < 0
    ) {
      mostrarError(
        "Los litros de refrigerante deben ser un número igual o mayor a 0.",
      );
      return false;
    }

    return true;
  };

  // Envío del formulario
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleMatricula) {
      setMensajeError("Seleccione un vehículo");
      return;
    }
    if (!validarFormulario()) {
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/mantenimientos/", "POST", {
        vehiculo: selectedVehicleMatricula,
        ...maintenanceData,
      });

      setMensaje("Mantenimiento guardado exitosamente");
      setShowForm(false);
      setSelectedVehicleMatricula("");
      setMaintenanceData({
        numero_mantenimiento: "",
        fecha: "",
        tipo_de_aceite: "",
        litros_de_aceite: "",
        refrigerante: "",
        litros_de_refrigerante: "",
        filtro_de_aceite: false,
        filtro_de_polen: false,
        filtro_de_aire: false,
        filtro_de_petroleo: false,
        kilometraje: "",
        proxima_mantencion_kilometraje: "",
        observaciones: "",
      });
    } catch (error) {
      if (error instanceof APIError) {
        setMensajeError(`❌ ${error.message}`);
      } else {
        setMensajeError("❌ Error inesperado al guardar mantenimiento.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMensaje(null);
        setMensajeError(null);
      }, 4000);
    }
  };

  // Función para cancelar y resetear el formulario
  const handleCancel = useCallback(() => {
    setShowForm(false);
    setSelectedVehicleMatricula("");
    setMaintenanceData({
      numero_mantenimiento: "",
      fecha: "",
      tipo_de_aceite: "",
      litros_de_aceite: "",
      refrigerante: "",
      litros_de_refrigerante: "",
      filtro_de_aceite: false,
      filtro_de_polen: false,
      filtro_de_aire: false,
      filtro_de_petroleo: false,
      kilometraje: "",
      proxima_mantencion_kilometraje: "",
      observaciones: "",
    });
  }, []);

  const irAInicio = useCallback(() => {
    router.push("/application");
  }, [router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'url("/Fondoapp.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Navigation Bar */}
      <nav className="bg-gray-300/90 shadow-lg backdrop-blur-sm relative z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Logo"
                width={100}
                height={40}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <div className="flex items-center space-x-4">
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

      {mensaje && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-6 rounded-md shadow-lg z-50"
          role="alert"
        >
          {mensaje}
        </div>
      )}
      {mensajeError && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white py-2 px-6 rounded-md shadow-lg z-50"
          role="alert"
        >
          {mensajeError}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <button
            className="p-2 text-green-600 hover:text-green-700"
            onClick={() => setShowForm(true)}
            aria-label="Agregar mantenimiento"
          >
            <Plus size={20} />
          </button>

          {showForm && (
            <form
              onSubmit={handleSave}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Vehículo:</label>
                <select
                  className="w-full border rounded-md p-2 text-gray-700"
                  value={selectedVehicleMatricula}
                  onChange={(e) => setSelectedVehicleMatricula(e.target.value)}
                >
                  <option value="">Seleccione un vehículo</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.matricula} value={vehicle.matricula}>
                      {vehicle.matricula} - {vehicle.modelo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Número mantenimiento:
                  </label>
                  <input
                    type="text"
                    name="numero_mantenimiento"
                    value={maintenanceData.numero_mantenimiento}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Fecha:</label>
                  <input
                    type="date"
                    name="fecha"
                    value={maintenanceData.fecha}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Tipo de aceite:
                  </label>
                  <input
                    type="text"
                    name="tipo_de_aceite"
                    value={maintenanceData.tipo_de_aceite}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Litros de aceite:
                  </label>
                  <input
                    type="text"
                    name="litros_de_aceite"
                    value={maintenanceData.litros_de_aceite}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Refrigerante:
                  </label>
                  <input
                    type="text"
                    name="refrigerante"
                    value={maintenanceData.refrigerante}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Litros de refrigerante:
                  </label>
                  <input
                    type="text"
                    name="litros_de_refrigerante"
                    value={maintenanceData.litros_de_refrigerante}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <label className="flex items-center text-gray-700">
                    <input
                      type="checkbox"
                      name="filtro_de_aceite"
                      checked={maintenanceData.filtro_de_aceite}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Filtro de aceite
                  </label>
                  <label className="flex items-center text-gray-700">
                    <input
                      type="checkbox"
                      name="filtro_de_polen"
                      checked={maintenanceData.filtro_de_polen}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Filtro de polen
                  </label>
                  <label className="flex items-center text-gray-700">
                    <input
                      type="checkbox"
                      name="filtro_de_aire"
                      checked={maintenanceData.filtro_de_aire}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Filtro de aire
                  </label>
                  <label className="flex items-center text-gray-700">
                    <input
                      type="checkbox"
                      name="filtro_de_petroleo"
                      checked={maintenanceData.filtro_de_petroleo}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Filtro de petroleo
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Kilometraje:
                  </label>
                  <input
                    type="text"
                    name="kilometraje"
                    value={maintenanceData.kilometraje}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">
                    Próxima mantención kilometraje:
                  </label>
                  <select
                    name="proxima_mantencion_kilometraje"
                    value={maintenanceData.proxima_mantencion_kilometraje}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2 text-gray-700"
                  >
                    <option value="">Seleccione</option>
                    <option value="10000">10.000 Km</option>
                    <option value="13000">13.000 Km</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-gray-700 mb-2">
                  Observaciones:
                </label>
                <textarea
                  name="observaciones"
                  value={maintenanceData.observaciones}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2 h-32 text-gray-700"
                />
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-md text-white ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(CrearMantenimiento);
