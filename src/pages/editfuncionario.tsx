import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import withAuth from "@/hoc/withAuth";
import { DateTime } from "luxon";
import { useRouter } from "next/router";
import { apiRequest, APIError } from "@/utils/api";
import { documentoSchema } from "@/validations/documentoSchema";

interface Documento {
  tipo: string;
  archivo?: string;
  fecha_vencimiento?: string;
}

interface Funcionario {
  nombre_completo: string;
  edad: number;
  fecha_nacimiento: string;
  rut: string;
  documentos?: Documento[];
}

// Hook para debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function EditFuncionario() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const debouncedBusqueda = useDebounce(busqueda, 300);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    if (mensajeError) {
      const timeout = setTimeout(() => {
        setMensajeError(null);
      }, 4000); // 4 segundos

      return () => clearTimeout(timeout); // limpiar si cambia antes
    }
  }, [mensajeError]);

  useEffect(() => {
    if (mensajeExito) {
      const timeout = setTimeout(() => {
        setMensajeExito(null);
      }, 4000); // 4 segundos

      return () => clearTimeout(timeout);
    }
  }, [mensajeExito]);

  // Filtrado memorizado de funcionarios basado en la búsqueda "debounced"
  const resultados = useMemo(() => {
    if (!debouncedBusqueda.trim()) return [];
    const lowerBusqueda = debouncedBusqueda.toLowerCase();
    return funcionarios.filter((f) =>
      f.nombre_completo.toLowerCase().includes(lowerBusqueda),
    );
  }, [debouncedBusqueda, funcionarios]);

  // Estado único para el funcionario seleccionado/editar
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  // Estado para guardar el valor original antes de editar
  const [funcionarioOriginal, setFuncionarioOriginal] =
    useState<Funcionario | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [nuevoDocumento, setNuevoDocumento] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteDocumentoModal, setShowDeleteDocumentoModal] =
    useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] =
    useState<Documento | null>(null);

  const [isEditingDocumento, setIsEditingDocumento] = useState(false);
  const [documentoAEditar, setDocumentoAEditar] = useState<Documento | null>(
    null,
  );

  // Caché de documentos para evitar llamadas repetidas
  const documentosCache = useRef<{ [rut: string]: Documento[] }>({});

  const obtenerFuncionarios = useCallback(async () => {
    try {
      const data = await apiRequest("/empleados/");
      setFuncionarios(data);
    } catch (error: unknown) {
      if (error instanceof APIError) {
        setMensajeError(`❌ ${error.message}`);
      } else {
        setMensajeError("❌ Error inesperado al obtener funcionarios.");
      }
    }
  }, []);

  useEffect(() => {
    obtenerFuncionarios();
  }, [obtenerFuncionarios]);

  // Handler memorizado para actualizar la búsqueda
  const manejarBusqueda = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBusqueda(e.target.value);
    },
    [],
  );

  // Selecciona un funcionario y obtiene sus documentos si no están en caché
  const seleccionarFuncionario = useCallback(async (func: Funcionario) => {
    setBusqueda("");
    setIsEditing(false);

    try {
      const documentos = await apiRequest(`/empleados/${func.rut}/documentos/`);

      // Guardar en caché para evitar llamadas repetidas
      documentosCache.current[func.rut] = documentos;

      // Actualizar el estado con los documentos obtenidos
      setFuncionario({ ...func, documentos });
    } catch (error) {
      console.error("❌ Error al seleccionar funcionario:", error);
      setFuncionario(func);
    }
  }, []);

  // Al presionar "Editar", guardamos el estado original y activamos el modo edición
  const handleEdit = useCallback(() => {
    if (funcionario) {
      setFuncionarioOriginal({ ...funcionario });
      setIsEditing(true);
    }
  }, [funcionario]);

  // Función para cancelar la edición: se restaura el estado original y se desactiva el modo edición
  const handleCancelEdit = useCallback(() => {
    setFuncionario(funcionarioOriginal);
    setIsEditing(false);
  }, [funcionarioOriginal]);

  const handleDelete = useCallback(async () => {
    if (!funcionario) return;
    try {
      await apiRequest(`/empleados/${funcionario.rut}/`, "DELETE");
      setFuncionarios((prev) => prev.filter((f) => f.rut !== funcionario.rut));
      setFuncionario(null);
      setShowDeleteModal(false);
    } catch (error) {
      if (error instanceof APIError) {
        setMensajeError(`❌ ${error.message}`);
      } else {
        setMensajeError("❌ Error inesperado al eliminar funcionario.");
      }
    }
  }, [funcionario]);

  const handleSave = useCallback(async () => {
    if (!funcionario) return;
    try {
      await apiRequest(`/empleados/${funcionario.rut}/`, "PATCH", funcionario);
      setIsEditing(false);
      setMensajeExito("Funcionario actualizado exitosamente");
      setTimeout(() => {
        setMensajeExito("");
      }, 500);
    } catch (error) {
      if (error instanceof APIError) {
        setMensajeError(`❌ ${error.message}`);
      } else {
        setMensajeError("❌ Error inesperado al actualizar funcionario.");
      }
    }
  }, [funcionario]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setNuevoDocumento(file);
    },
    [],
  );

  const limpiarModal = useCallback(() => {
    setTipoDocumento("");
    setFechaVencimiento("");
    setNuevoDocumento(null);
    setDocumentoAEditar(null);
  }, []);

  const editarDocumento = useCallback(
    async (
      rut: string,
      tipo: string,
      archivo: File,
      fecha_vencimiento: string,
      archivo_anterior?: string,
    ) => {
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("tipo", tipo);
      formData.append("fecha_vencimiento", fecha_vencimiento);

      if (archivo_anterior) {
        formData.append("archivo_anterior", archivo_anterior);
      }

      try {
        await apiRequest(
          `/update_funcionario_file/${rut}/${tipo}/`,
          "PUT",
          formData,
          true,
        );

        const documentos = await apiRequest(
          `/empleados/${rut}/documentos/`,
          "GET",
        );
        documentosCache.current[rut] = documentos;
        setFuncionario((prev) => (prev ? { ...prev, documentos } : null));
      } catch (error) {
        if (error instanceof APIError) {
          setMensajeError(`❌ ${error.message}`);
        } else {
          setMensajeError("❌ Error inesperado al actualizar documento.");
        }
      }
    },
    [setFuncionario],
  );

  const subirArchivo = useCallback(
    async (
      rut: string,
      tipo: string,
      archivo: File,
      fecha_vencimiento: string,
    ) => {
      const formData = new FormData();
      formData.append("file", archivo);
      formData.append("rut", rut);
      formData.append("tipo", tipo);
      formData.append("fecha_vencimiento", fecha_vencimiento);

      try {
        const data = await apiRequest(
          `/upload_funcionario_file/`,
          "POST",
          formData,
          true,
        );

        console.log("✅ Archivo subido correctamente", data);

        const documentos = await apiRequest(`/empleados/${rut}/documentos/`);
        documentosCache.current[rut] = documentos;
        setFuncionario((prev) => (prev ? { ...prev, documentos } : null));
        limpiarModal();
        setShowModal(false);
      } catch (error) {
        if (error instanceof APIError) {
          setMensajeError(`❌ ${error.message}`);
        } else {
          setMensajeError("❌ Error inesperado al subir archivo.");
        }
      }
    },
    [limpiarModal],
  );

  const handleSubmit = useCallback(async () => {
    if (!funcionario?.rut) {
      setMensajeError("❌ Falta el RUT del funcionario.");
      return;
    }

    const validationResult = documentoSchema.safeParse({
      file: nuevoDocumento,
      tipo: tipoDocumento,
      fecha_vencimiento: fechaVencimiento,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message;
      setMensajeError(`❌ ${firstError}`);
      return;
    }

    try {
      if (isEditingDocumento && documentoAEditar) {
        await editarDocumento(
          funcionario.rut,
          tipoDocumento,
          nuevoDocumento!,
          fechaVencimiento,
          documentoAEditar.archivo, // <-- Pasamos el archivo anterior
        );
      } else {
        await subirArchivo(
          funcionario.rut,
          tipoDocumento,
          nuevoDocumento!,
          fechaVencimiento,
        );
      }

      limpiarModal();
      setShowModal(false);
      setMensajeError(null);
    } catch (error) {
      setMensajeError("❌ Error al guardar el documento.");
      console.error("❌ Error en handleSubmit:", error);
    }
  }, [
    nuevoDocumento,
    tipoDocumento,
    fechaVencimiento,
    funcionario,
    subirArchivo,
    editarDocumento,
    documentoAEditar,
    isEditingDocumento,
    limpiarModal,
  ]);

  // Calcular edad memorizado en base a la fecha de nacimiento
  const edadCalculada = useMemo(() => {
    if (!funcionario?.fecha_nacimiento) return 0;
    const hoy = DateTime.now().setZone("America/Santiago");
    const nacimiento = DateTime.fromISO(funcionario.fecha_nacimiento, {
      zone: "America/Santiago",
    });
    let edad = hoy.year - nacimiento.year;
    if (
      hoy.month < nacimiento.month ||
      (hoy.month === nacimiento.month && hoy.day < nacimiento.day)
    ) {
      edad--;
    }
    return edad;
  }, [funcionario?.fecha_nacimiento]);

  // Actualizar la edad en el estado del funcionario
  useEffect(() => {
    if (funcionario && funcionario.edad !== edadCalculada) {
      setFuncionario((prev) =>
        prev ? { ...prev, edad: edadCalculada } : null,
      );
    }
  }, [edadCalculada, funcionario]);

  // Formatear la fecha (memorizado)
  const formatDate = useCallback((dateString: string) => {
    const date = DateTime.fromISO(dateString, { zone: "America/Santiago" });
    return date.toFormat("dd/MM/yyyy");
  }, []);

  const handleEditDocumentoClick = useCallback((doc: Documento) => {
    setDocumentoAEditar(doc);
    setTipoDocumento(doc.tipo);
    setFechaVencimiento(doc.fecha_vencimiento || "");
    setNuevoDocumento(null);
    setIsEditingDocumento(true);
    setShowModal(true);
  }, []);

  const handleDeleteDocumento = useCallback(async () => {
    if (!funcionario || !documentoAEliminar) return;
    try {
      await apiRequest(
        `/delete_funcionario_file/${funcionario.rut}/${documentoAEliminar.tipo}/`,
        "DELETE",
      );
      const documentos = await apiRequest(
        `/empleados/${funcionario.rut}/documentos/`,
      );
      documentosCache.current[funcionario.rut] = documentos;
      setFuncionario((prev) => (prev ? { ...prev, documentos } : null));
      setShowDeleteDocumentoModal(false);
      setDocumentoAEliminar(null);
    } catch (error) {
      if (error instanceof APIError) {
        setMensajeError(`❌ ${error.message}`);
      } else {
        setMensajeError("❌ Error inesperado al eliminar documento.");
      }
    }
  }, [funcionario, documentoAEliminar]);

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
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Logo SSC"
                  width={100}
                  height={40}
                  className="ml-0"
                  priority
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={irAInicio}
                  className="text-gray-700 hover:text-gray-900 text-sm md:text-base"
                >
                  Inicio
                </button>
                <Link
                  href="/logout"
                  className="text-gray-700 hover:text-gray-900 text-sm md:text-base"
                >
                  Cerrar Sesión
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {mensajeExito && (
          <div
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-6 rounded-md shadow-lg"
            role="alert"
          >
            {mensajeExito}
          </div>
        )}
        {mensajeError && (
          <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white py-2 px-6 rounded-md shadow-lg">
            {mensajeError}
          </div>
        )}
        {/* Información del funcionario */}
        <div className="max-w-3xl mx-auto mt-8 px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-gray-800">
            Editar Funcionario
          </h1>
          <div className="relative mb-8">
            <input
              type="text"
              value={busqueda}
              onChange={manejarBusqueda}
              placeholder="Buscar funcionario..."
              className="w-full p-3 md:p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />

            {resultados.length > 0 && (
              <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                {resultados.map((f) => (
                  <div
                    key={f.rut}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => seleccionarFuncionario(f)}
                  >
                    <p className="text-gray-800">{f.nombre_completo}</p>
                    <p className="text-sm text-gray-600">{f.rut}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Renderizado del detalle y edición del funcionario */}
          {funcionario && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-800">
                    Nombre Completo:
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={funcionario.nombre_completo}
                      onChange={(e) =>
                        setFuncionario({
                          ...funcionario,
                          nombre_completo: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {funcionario.nombre_completo}
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-800">RUT:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={funcionario.rut}
                      onChange={(e) =>
                        setFuncionario({
                          ...funcionario,
                          rut: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  ) : (
                    <p className="text-gray-700">{funcionario.rut}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-800">
                    Fecha de Nacimiento:
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={DateTime.fromISO(funcionario.fecha_nacimiento, {
                        zone: "America/Santiago",
                      }).toFormat("yyyy-MM-dd")}
                      onChange={(e) =>
                        setFuncionario({
                          ...funcionario,
                          fecha_nacimiento: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {DateTime.fromISO(funcionario.fecha_nacimiento, {
                        zone: "America/Santiago",
                      }).toFormat("dd/MM/yyyy")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-800">Edad:</label>
                  <p className="text-gray-700">{funcionario.edad}</p>
                </div>
              </div>

              {/* Documentos del funcionario */}
              {funcionario.documentos && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-gray-800">
                    Documentos:
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {funcionario.documentos.map((doc, index) => (
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
                                Vence: {formatDate(doc.fecha_vencimiento)}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditDocumentoClick(doc)}
                              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setDocumentoAEliminar(doc);
                                setShowDeleteDocumentoModal(true);
                              }}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Editar
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Agregar Documento
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Eliminar Funcionario
            </button>
          </div>

          {showDeleteModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-bold mb-4 text-gray-800">
                  Confirmar Eliminación
                </h2>
                <p>
                  ¿Estás seguro de que deseas eliminar a{" "}
                  {funcionario?.nombre_completo}?
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 text-white p-2 rounded-lg"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="bg-gray-300 text-black p-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-bold mb-4 text-gray-800">
                  {isEditingDocumento ? "Editar Documento" : "Subir Documento"}
                </h2>
                <label className="font-semibold text-gray-800">Tipo:</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="text-gray-800 border border-gray-300 rounded p-1 w-full"
                >
                  <option value="">Seleccionar tipo de documento</option>
                  <option value="fotocopia_cedula">
                    Fotocopia Cédula de Identidad
                  </option>
                  <option value="examen_pre_ocupacional">
                    Examen Pre Ocupacional
                  </option>
                  <option value="contrato_trabajo">Contrato de Trabajo</option>
                  <option value="reglamento_interno">
                    Entrega Reglamento Interno
                  </option>
                  <option value="charla_odi">Charla ODI</option>
                  <option value="anexo_contrato">
                    Anexo de Contrato de Trabajo
                  </option>
                  <option value="entrega_epp">Entrega EPP</option>
                  <option value="hoja_vida_conductor">
                    Hoja de Vida del Conductor
                  </option>
                  <option value="examen_psicometrico">
                    Examen Psicométrico
                  </option>
                  <option value="licencia_conducir">
                    Fotocopia Licencia de Conducir
                  </option>
                </select>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="text-gray-800 p-1 mt-2"
                />
                <label className="font-semibold text-gray-800 mt-2">
                  Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="text-gray-800 border border-gray-300 rounded p-1 mt-1 w-full"
                />
                {isEditing && documentoAEditar && (
                  <p className="text-gray-600 mt-2">
                    Archivo Actual: {documentoAEditar.archivo}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {isEditingDocumento ? (
                    <button
                      onClick={handleSubmit}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Actualizar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSubmit}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {isEditingDocumento && (
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          {showDeleteDocumentoModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-lg font-bold mb-4 text-gray-800">
                  Confirmar Eliminación de Documento
                </h2>
                <p>
                  ¿Estás seguro de que deseas eliminar el documento{" "}
                  {documentoAEliminar?.tipo}?
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleDeleteDocumento}
                    className="bg-red-500 text-white p-2 rounded-lg"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteDocumentoModal(false);
                      setDocumentoAEliminar(null);
                    }}
                    className="bg-gray-300 text-black p-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditFuncionario);
