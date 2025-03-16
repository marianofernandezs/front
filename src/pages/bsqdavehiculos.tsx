import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import withAuth from "@/hoc/withAuth";
import { useRouter } from "next/router";
import { DateTime } from "luxon";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // || "http://localhost:8000/api";

interface Documento {
  tipo: string;
  archivo?: string;
  fecha_vencimiento?: string;
  archivo_url?: string;
}

interface Vehiculo {
  matricula: string;
  marca: string;
  modelo: string;
  documentos?: Documento[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function BusquedaVehiculos() {
  const [busqueda, setBusqueda] = useState("");
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [resultados, setResultados] = useState<Vehiculo[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] =
    useState<Vehiculo | null>(null);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  const debouncedBusqueda = useDebounce(busqueda, 300);

  useEffect(() => {
    const obtenerVehiculos = async () => {
      setLoadingVehiculos(true);
      try {
        const response = await fetch(`${API_BASE_URL}/vehiculos/`);
        const data = await response.json();
        setVehiculos(data);
      } catch (error) {
        console.error("Error al obtener vehículos:", error);
      } finally {
        setLoadingVehiculos(false);
      }
    };
    obtenerVehiculos();
  }, []);

  useEffect(() => {
    if (debouncedBusqueda.trim().length > 0) {
      const filtrados = vehiculos.filter(
        (vehiculo) =>
          vehiculo.matricula
            .toLowerCase()
            .includes(debouncedBusqueda.toLowerCase()) ||
          vehiculo.marca
            .toLowerCase()
            .includes(debouncedBusqueda.toLowerCase()) ||
          vehiculo.modelo
            .toLowerCase()
            .includes(debouncedBusqueda.toLowerCase()),
      );
      setResultados(filtrados);
      setMostrarResultados(true);
    } else {
      setResultados([]);
      setMostrarResultados(false);
    }
  }, [debouncedBusqueda, vehiculos]);

  const manejarBusqueda = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBusqueda(e.target.value);
    },
    [],
  );

  const seleccionarVehiculo = useCallback(async (vehiculo: Vehiculo) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/documentos/${vehiculo.matricula}/`,
      );
      if (!response.ok) {
        throw new Error("Error al obtener documentos");
      }

      const documentos = await response.json();
      setVehiculoSeleccionado({ ...vehiculo, documentos: documentos });
      setBusqueda(
        `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.matricula}`,
      );
      setMostrarResultados(false);
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      // Si hay un error, aún mostramos el vehículo pero sin documentos
      setVehiculoSeleccionado({
        ...vehiculo,
        documentos: [],
      });
      setBusqueda(
        `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.matricula}`,
      );
      setMostrarResultados(false);
    }
  }, []);

  const router = useRouter();

  const irAInicio = () => {
    router.push("/application");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Fondo con opacidad */}
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

      {/* Contenido principal */}
      <div className="relative z-10">
        {/* Barra de navegación */}
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
                />
              </div>
              <div className="flex items-center space-x-4 pr-4">
                <button
                  onClick={irAInicio}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Inicio
                </button>
                <Link href="/logout">
                  <button className="text-gray-700 hover:text-gray-900">
                    Cerrar Sesión
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Barra de búsqueda */}
        <div className="max-w-3xl mx-auto mt-8 px-4">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Barra De Búsqueda (Vehículos)
          </h1>
          <div className="relative mb-8">
            <input
              type="text"
              value={busqueda}
              onChange={manejarBusqueda}
              placeholder="Buscar por matrícula, marca o modelo"
              className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />

            {/* Resultados de autocompletado */}
            {mostrarResultados && resultados.length > 0 && (
              <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                {resultados.map((vehiculo) => (
                  <div
                    key={vehiculo.matricula}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => seleccionarVehiculo(vehiculo)}
                  >
                    <p className="text-gray-800">
                      {vehiculo.marca} {vehiculo.modelo}
                    </p>
                    <p className="text-sm text-gray-600">
                      Matrícula: {vehiculo.matricula}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {loadingVehiculos && (
            <p className="text-center text-gray-800">Cargando vehículos...</p>
          )}

          {/* Información del vehículo seleccionado */}
          {vehiculoSeleccionado && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Información del Vehículo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-800">Marca:</p>
                  <p className="text-gray-700">{vehiculoSeleccionado.marca}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Modelo:</p>
                  <p className="text-gray-700">{vehiculoSeleccionado.modelo}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Matrícula:</p>
                  <p className="text-gray-700">
                    {vehiculoSeleccionado.matricula}
                  </p>
                </div>
              </div>

              {/* Documentos del vehículo */}
              {vehiculoSeleccionado.documentos && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-gray-800">
                    Documentos:
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {vehiculoSeleccionado.documentos.map((doc, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-lg shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-700">
                              {doc.tipo.replace(/_/g, " ").toUpperCase()}
                            </p>
                            {doc.fecha_vencimiento && (
                              <p className="text-sm text-gray-600">
                                Vence:{" "}
                                {DateTime.fromISO(
                                  doc.fecha_vencimiento,
                                ).toFormat("dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            {doc.archivo && (
                              <a
                                href={doc.archivo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                              >
                                Ver PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de filtro */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition-colors">
              <Link href="/editarvehiculos">Editar</Link>
            </button>
            <button className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors">
              <Link href="/crearmantenimiento">Crear Mantenimiento</Link>
            </button>
            <button className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors">
              <Link href="/crearvehiculos">Crear Vehículo</Link>
            </button>
            <button className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors">
              <Link href="/vermantenimiento">Ver Mantenimiento</Link>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default withAuth(BusquedaVehiculos);
