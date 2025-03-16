import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import withAuth from "@/hoc/withAuth";
import { useRouter } from "next/router";
import { DateTime } from "luxon";

interface Vehicle {
  id: number;
  matricula: string;
  modelo: string;
}

interface Maintenance {
  id: number;
  numero_mantenimiento: string;
  fecha: string;
  tipo_de_aceite: string;
  litros_de_aceite: string;
  refrigerante: string;
  litros_de_refrigerante: string;
  filtro_de_aceite: boolean;
  filtro_de_polen: boolean;
  filtro_de_aire: boolean;
  filtro_de_petroleo: boolean;
  kilometraje: string;
  proxima_mantencion_kilometraje: string;
  proxima_mantencion: string;
  observaciones: string;
}

const VEHICLES_API_URL = process.env.NEXT_PUBLIC_VEHICLES_API_URL; // ||"http://localhost:8000/api/vehiculos/";
const MAINTENANCE_API_URL = process.env.NEXT_PUBLIC_MAINTENANCE_API_URL; // ||"http://localhost:8000/api/mantenimientos/";

function App() {
  const [selectedVehicleMatricula, setSelectedVehicleMatricula] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<Maintenance | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editableMaintenance, setEditableMaintenance] =
    useState<Maintenance | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(VEHICLES_API_URL);
        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        console.error("Error al obtener vehículos:", error);
      }
    };
    fetchVehicles();
  }, []);

  const fetchMaintenances = async (matricula: string) => {
    try {
      const response = await fetch(`${MAINTENANCE_API_URL}/${matricula}/`);
      const data = await response.json();
      setMaintenances(data);
      if (data.length > 0) {
        setSelectedMaintenance(data[0]);
      } else {
        setSelectedMaintenance(null);
      }
    } catch (error) {
      console.error("Error al obtener mantenimientos:", error);
    }
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matricula = e.target.value;
    setSelectedVehicleMatricula(matricula);
    if (matricula) {
      fetchMaintenances(matricula);
    } else {
      setMaintenances([]);
      setSelectedMaintenance(null);
    }
    setEditMode(false);
    setEditableMaintenance(null);
  };

  const handleMaintenanceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMaintenanceNumber = e.target.value;
    const maintenance = maintenances.find(
      (m) => String(m.numero_mantenimiento) === selectedMaintenanceNumber,
    );
    setSelectedMaintenance(maintenance || null);
    setEditMode(false);
    setEditableMaintenance(null);
  };

  const handleEdit = () => {
    setEditMode(true);
    // Clonamos el mantenimiento seleccionado para editarlo sin modificar el original
    setEditableMaintenance({ ...selectedMaintenance } as Maintenance);
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditableMaintenance(null);
  };
  const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate) return "";
    return DateTime.fromISO(isoDate).toFormat("dd/MM/yyyy");
  };

  const handleSave = async () => {
    if (!editableMaintenance) return;
    try {
      const response = await fetch(
        `${MAINTENANCE_API_URL}${selectedVehicleMatricula}/${editableMaintenance.numero_mantenimiento}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editableMaintenance),
        },
      );
      if (response.ok) {
        const updatedMaintenance = await response.json();
        setMaintenances((prev) =>
          prev.map((m) =>
            m.numero_mantenimiento === updatedMaintenance.numero_mantenimiento
              ? updatedMaintenance
              : m,
          ),
        );
        setSelectedMaintenance(updatedMaintenance);
        setEditMode(false);
        setEditableMaintenance(null);
        window.alert("Guardado exitosamente");
      } else {
        console.error("Error al guardar el mantenimiento");
      }
    } catch (error) {
      console.error("Error al guardar el mantenimiento:", error);
    }
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target; // Eliminamos 'checked' de la desestructuración

    if (type === "checkbox") {
      // Type assertion to ensure e.target is an HTMLInputElement
      setEditableMaintenance((prev) => ({
        ...(prev as Maintenance),
        [name]: (e.target as HTMLInputElement).checked, // solo accedemos a checked aquí
      }));
    } else {
      setEditableMaintenance((prev) => ({
        ...(prev as Maintenance),
        [name]: value,
      }));
    }
  };

  const router = useRouter();

  const irAInicio = () => {
    router.push("/application");
  };
  const handleDeleteMaintenance = async () => {
    if (!selectedMaintenance || !selectedVehicleMatricula) {
      window.alert("Seleccione un mantenimiento para eliminar.");
      return;
    }
    try {
      const response = await fetch(
        `${MAINTENANCE_API_URL}${selectedVehicleMatricula}/${selectedMaintenance.numero_mantenimiento}/`,
        { method: "DELETE" },
      );
      if (response.ok) {
        window.alert("Mantenimiento eliminado exitosamente.");
        // Actualizamos la lista de mantenimientos eliminando el borrado
        setMaintenances((prev) =>
          prev.filter(
            (m) =>
              m.numero_mantenimiento !==
              selectedMaintenance.numero_mantenimiento,
          ),
        );
        setSelectedMaintenance(null);
      } else {
        console.error("Error al eliminar el mantenimiento");
      }
    } catch (error) {
      console.error("Error en la eliminación del mantenimiento:", error);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Imagen de fondo */}
      <div
        className="fixed inset-0 z-0 opacity-10"
        style={{
          backgroundImage: 'url("/Fondoapp.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Barra de navegación */}
      <nav className="bg-gray-300/90 shadow-lg backdrop-blur-sm relative z-10">
        <div className="w-full px-2">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center pl-0">
              <Image
                src="/logo.png"
                alt="Logo"
                width={100}
                height={40}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <div className="flex items-center space-x-4 pr-4">
              <button
                className="text-gray-700 hover:text-gray-900"
                onClick={irAInicio}
              >
                Inicio
              </button>
              <button className="text-gray-700 hover:text-gray-900">
                <Link href="/logout">Cerrar Sesión</Link>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {/* Selector de vehículo */}
              <div>
                <label className="block text-gray-700 mb-2">Vehículo:</label>
                <select
                  className="w-full border rounded-md p-2 text-gray-700"
                  value={selectedVehicleMatricula}
                  onChange={handleVehicleChange}
                >
                  <option value="">Seleccione un vehículo</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.matricula} value={vehicle.matricula}>
                      {vehicle.matricula} - {vehicle.modelo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de mantenimiento */}
              {selectedVehicleMatricula && maintenances.length > 0 && (
                <div>
                  <label className="block text-gray-700 mb-2">
                    Número de mantenimiento:
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-gray-700"
                    value={
                      selectedMaintenance
                        ? selectedMaintenance.numero_mantenimiento
                        : ""
                    }
                    onChange={handleMaintenanceChange}
                  >
                    <option value="">Seleccione un mantenimiento</option>
                    {maintenances.map((maintenance) => (
                      <option
                        key={maintenance.id}
                        value={maintenance.numero_mantenimiento}
                      >
                        Mantenimiento #{maintenance.numero_mantenimiento}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Detalle del mantenimiento */}
              {selectedMaintenance && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Campos de tipo texto o fecha */}
                    {[
                      { label: "Fecha", name: "fecha", type: "date" },
                      {
                        label: "Tipo de aceite",
                        name: "tipo_de_aceite",
                        type: "text",
                      },
                      {
                        label: "Litros de aceite",
                        name: "litros_de_aceite",
                        type: "text",
                      },
                      {
                        label: "Refrigerante",
                        name: "refrigerante",
                        type: "text",
                      },
                      {
                        label: "Litros de refrigerante",
                        name: "litros_de_refrigerante",
                        type: "text",
                      },
                      {
                        label: "Kilometraje",
                        name: "kilometraje",
                        type: "text",
                      },
                      {
                        label: "Próxima mantención kilometraje",
                        name: "proxima_mantencion_kilometraje",
                        type: "text",
                      },
                      {
                        label: "Próxima mantención",
                        name: "proxima_mantencion",
                        type: "text",
                      },
                    ].map((field) => (
                      <div key={field.name}>
                        <label className="block text-gray-700 mb-2">
                          {field.label}:
                        </label>
                        <input
                          type={
                            field.name == "fecha" && !editMode
                              ? "text"
                              : field.type
                          }
                          name={field.name}
                          value={
                            field.name === "fecha" && !editMode
                              ? formatDateForDisplay(
                                  selectedMaintenance?.fecha || "",
                                )
                              : editMode
                                ? editableMaintenance?.[
                                    field.name as keyof Maintenance
                                  ]?.toString() || ""
                                : selectedMaintenance?.[
                                    field.name as keyof Maintenance
                                  ]?.toString() || ""
                          }
                          onChange={editMode ? handleFieldChange : undefined}
                          readOnly={!editMode}
                          className={`w-full border rounded-md p-2 ${
                            editMode ? "bg-white" : "bg-gray-50"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Campo de observaciones (textarea) */}
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Observaciones:
                    </label>
                    {editMode ? (
                      <textarea
                        name="observaciones"
                        value={editableMaintenance?.observaciones || ""}
                        onChange={handleFieldChange}
                        className="w-full border rounded-md p-2 bg-white"
                        rows={4}
                      />
                    ) : (
                      <textarea
                        name="observaciones"
                        value={selectedMaintenance.observaciones}
                        readOnly
                        className="w-full border rounded-md p-2 bg-gray-50"
                        rows={4}
                      />
                    )}
                  </div>

                  {/* Campos tipo checkbox */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Filtro de aceite", name: "filtro_de_aceite" },
                      { label: "Filtro de polen", name: "filtro_de_polen" },
                      { label: "Filtro de aire", name: "filtro_de_aire" },
                      {
                        label: "Filtro de petroleo",
                        name: "filtro_de_petroleo",
                      },
                    ].map((field) => (
                      <div key={field.name} className="flex items-center">
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={
                            editMode
                              ? (editableMaintenance?.[
                                  field.name as keyof Maintenance
                                ] as boolean) || false
                              : (selectedMaintenance?.[
                                  field.name as keyof Maintenance
                                ] as boolean) || false
                          }
                          onChange={editMode ? handleFieldChange : undefined}
                          disabled={!editMode}
                          className="mr-2"
                        />
                        <label className="text-gray-700">{field.label}</label>
                      </div>
                    ))}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-4 mt-6">
                    {!editMode ? (
                      <>
                        <button
                          className="bg-blue-500 text-white px-4 py-2 rounded-md"
                          onClick={handleEdit}
                        >
                          Editar
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-md"
                          onClick={handleDeleteMaintenance}
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded-md"
                          onClick={handleSave}
                        >
                          Guardar
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-md"
                          onClick={handleCancel}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(App);
