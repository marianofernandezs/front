import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import withAuth from "@/hoc/withAuth";
import { useRouter } from "next/router";
import { DateTime } from "luxon";
import { apiRequest } from "@/utils/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Head from "next/head";

interface Documento {
  tipo: string;
  archivo?: string;
  fecha_vencimiento?: string;
}

interface Empleado {
  nombre_completo: string;
  rut: string;
  fecha_nacimiento?: string;
  edad?: number;
  documentos?: Documento[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function BusquedaEmpleados() {
  const [busqueda, setBusqueda] = useState("");
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [resultados, setResultados] = useState<Empleado[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] =
    useState<Empleado | null>(null);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  const documentosCache = useRef<{ [rut: string]: Documento[] }>({});

  const debouncedBusqueda = useDebounce(busqueda, 300);

  // Se carga la lista de empleados una sola vez al montar el componente.
  useEffect(() => {
    const obtenerEmpleados = async () => {
      setLoadingEmpleados(true);
      try {
        const data = await apiRequest("/empleados/");
        setEmpleados(data);
      } catch (error) {
        console.error("Error al obtener empleados:", error);
        toast.error("Error al cargar empleados. Intenta nuevamente.");
      } finally {
        setLoadingEmpleados(false);
      }
    };
    obtenerEmpleados();
  }, []);

  useEffect(() => {
    if (debouncedBusqueda.trim().length > 0) {
      const filtrados = empleados.filter((empleado) =>
        empleado.nombre_completo
          .toLowerCase()
          .includes(debouncedBusqueda.toLowerCase()),
      );
      setResultados(filtrados);
      setMostrarResultados(true);
    } else {
      setResultados([]);
      setMostrarResultados(false);
    }
  }, [debouncedBusqueda, empleados]);

  // Se utiliza useCallback para evitar recrear la función en cada render.
  const manejarBusqueda = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBusqueda(e.target.value);
    },
    [],
  );

  // Se utiliza useCallback y se evita la llamada a la API si el empleado ya tiene documentos cargados.
  const seleccionarEmpleado = useCallback(async (empleado: Empleado) => {
    setBusqueda(empleado.nombre_completo);
    setMostrarResultados(false);

    if (documentosCache.current[empleado.rut]?.length) {
      setEmpleadoSeleccionado({
        ...empleado,
        documentos: documentosCache.current[empleado.rut],
      });
      return;
    }

    setLoadingDocumentos(true);

    try {
      const documentos = await apiRequest(
        `/empleados/${empleado.rut}/documentos/`,
      );
      if (documentos.length > 0) {
        documentosCache.current[empleado.rut] = documentos;
        setEmpleadoSeleccionado({ ...empleado, documentos });
      } else {
        setEmpleadoSeleccionado({ ...empleado, documentos: [] });
      }
    } catch (error) {
      console.error("❌ Error al obtener documentos:", error);
      toast.error("Error al cargar documentos del empleado.");
    } finally {
      setLoadingDocumentos(false);
    }
  }, []);

  const router = useRouter();

  const irAInicio = () => {
    router.push("/application");
  };

  return (
    <>
      <Head>
        <title>Búsqueda De Personal</title>
      </Head>
      <div className="relative min-h-screen w-full overflow-auto bg-white">
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
            <div className="w-full px-4 sm:px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Image
                    src="/logo.png"
                    alt="Logo SSC"
                    width={100}
                    height={40}
                    style={{ width: "auto", height: "auto" }}
                    className="ml-0"
                  />
                </div>
                <div className="flex items-center space-x-4">
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
          <div className="w-full max-w-4xl mx-auto mt-8 px-2 sm:px-4">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
              Barra De Búsqueda (Personal)
            </h1>
            <div className="relative mb-8">
              <input
                type="text"
                value={busqueda}
                onChange={manejarBusqueda}
                placeholder="Esteban Alvarez Ramirez"
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />

              {/* Resultados de autocompletado */}
              {mostrarResultados &&
                resultados.length > 0 &&
                (!empleadoSeleccionado ||
                  busqueda !== empleadoSeleccionado.nombre_completo) && (
                  <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                    {resultados.map((empleado) => (
                      <div
                        key={empleado.rut}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                        onClick={() => seleccionarEmpleado(empleado)}
                      >
                        <p className="text-gray-800">
                          {empleado.nombre_completo}
                        </p>
                        <p className="text-sm text-gray-600">{empleado.rut}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {loadingEmpleados && (
              <p className=" text-centertext-gray-500">Cargando empleados...</p>
            )}

            {/* Información del empleado seleccionado */}
            {empleadoSeleccionado && (
              <div className="bg-white/80 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Información del Empleado
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Nombre Completo:
                    </p>
                    <p className="text-gray-700">
                      {empleadoSeleccionado.nombre_completo}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">RUT:</p>
                    <p className="text-gray-700">{empleadoSeleccionado.rut}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Fecha de Nacimiento:
                    </p>
                    <p className="text-gray-700">
                      {empleadoSeleccionado.fecha_nacimiento
                        ? DateTime.fromISO(
                            empleadoSeleccionado.fecha_nacimiento,
                          ).toFormat("dd/MM/yyyy")
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Edad:</p>
                    <p className="text-gray-700">{empleadoSeleccionado.edad}</p>
                  </div>
                </div>

                {/* Documentos del empleado */}
                {loadingDocumentos ? (
                  <p className="text-center text-gray-500">
                    Cargando documentos...
                  </p>
                ) : (
                  Array.isArray(empleadoSeleccionado?.documentos) &&
                  empleadoSeleccionado?.documentos?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2 text-gray-800">
                        Documentos:
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {empleadoSeleccionado.documentos.map((doc, index) => {
                          return (
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
                                <div className="flex space-x-2 flex-wrap">
                                  {doc.archivo && (
                                    <a
                                      href={doc.archivo}
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
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Botones de filtro (se mantienen sin cambios) */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-2 gap-3">
              <button className="w-full sm:w-auto  bg-yellow-500 text-white p-3 rounded-lg hover:bg-yellow-600 transition-colors">
                <Link href="/editfuncionario">Editar</Link>
              </button>
              <button className="w-full sm:w-auto bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors">
                <Link href="/crearempleado">Crear Funcionario</Link>
              </button>
            </div>
          </div>
        </div>
      </div>
      );
    </>
  );
}

export default withAuth(BusquedaEmpleados);
