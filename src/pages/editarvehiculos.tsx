import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import withAuth from "@/hoc/withAuth";
import { DateTime } from "luxon";

interface Documento {
  tipo: string;
  archivo?: string;
  fecha_vencimiento?: string;
}

interface Vehiculo {
  matricula: string;
  marca: string;
  modelo: string;
  numero_de_maquina: number;
  documentos?: Documento[];
}

const VEHICULOS_API_URL =
  process.env.NEXT_PUBLIC_VEHICULOS_API_URL ||
  "http://localhost:8000/api/vehiculos/";
const DOCUMENTOS_API_URL =
  process.env.NEXT_PUBLIC_DOCUMENTOS_API_URL ||
  "http://localhost:8000/api/documentos/";

function EditFuncionario() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Vehiculo[]>([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] =
    useState<Vehiculo | null>(null);
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [vehiculoOriginal, setVehiculoOriginal] = useState<Vehiculo | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [nuevoDocumento, setNuevoDocumento] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] =
    useState<Documento | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    const obtenerFuncionarios = async () => {
      try {
        const response = await fetch(VEHICULOS_API_URL);
        const data = await response.json();
        console.log("Datos de vehículos:", data);
        setVehiculos(data);
      } catch (error) {
        console.error("Error al obtener vehiculos:", error);
      }
    };
    obtenerFuncionarios();
  }, []);

  const manejarBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusqueda(valor);

    if (valor.length > 0) {
      const filtrados = vehiculos.filter((vehiculo) =>
        vehiculo.matricula.toLowerCase().includes(valor.toLowerCase()),
      );
      setResultados(filtrados);
    } else {
      setResultados([]);
    }
  };

  const seleccionarVehiculo = async (vehiculo: Vehiculo) => {
    console.log("Vehículo seleccionado:", vehiculo);
    setVehiculoSeleccionado(vehiculo);
    setBusqueda(vehiculo.matricula);
    setResultados([]);
    setVehiculo({
      matricula: vehiculo.matricula,
      numero_de_maquina: vehiculo.numero_de_maquina,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      documentos: [],
    });
    setIsEditing(false);

    // Obtener documentos asociados al vehículo
    try {
      const response = await fetch(
        `${DOCUMENTOS_API_URL}${vehiculo.matricula}/`,
      );
      if (!response.ok) {
        throw new Error("Error al obtener documentos");
      }
      const documentos = await response.json();
      setVehiculo((prev) => (prev ? { ...prev, documentos } : null));
    } catch (error) {
      console.error("Error al obtener documentos:", error);
      setVehiculo((prev) => (prev ? { ...prev, documentos: [] } : null));
    }
  };

  const handleEdit = () => {
    if (vehiculo) {
      setVehiculoOriginal({ ...vehiculo });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (vehiculoOriginal) {
      setVehiculo(vehiculoOriginal);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (vehiculo) {
      const response = await fetch(
        `${VEHICULOS_API_URL}${vehiculo.matricula}/`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setVehiculos((prev) =>
          prev.filter((v) => v.matricula !== vehiculo.matricula),
        );
        setVehiculoSeleccionado(null);
        setVehiculo(null);
        setShowDeleteModal(false);
      } else {
        console.error("Error al eliminar el vehiculo");
      }
    }
  };

  const handleSave = async () => {
    if (vehiculo) {
      // Verificar si la matrícula o el número de máquina ya existen
      const existeMatricula = vehiculos.some(
        (v) =>
          v.matricula === vehiculo.matricula &&
          v.matricula !== vehiculoSeleccionado?.matricula,
      );
      const existeNumeroMaquina = vehiculos.some(
        (v) =>
          v.numero_de_maquina === vehiculo.numero_de_maquina &&
          v.numero_de_maquina !== vehiculoSeleccionado?.numero_de_maquina,
      );

      if (existeMatricula) {
        alert("La matrícula ya existe para otro vehículo.");
        return;
      }

      if (existeNumeroMaquina) {
        alert("El número de máquina ya existe para otro vehículo.");
        return;
      }

      console.log("Datos a enviar para guardar:", vehiculo);
      await fetch(`${VEHICULOS_API_URL}${vehiculo.matricula}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricula: vehiculo.matricula,
          numero_de_maquina: vehiculo.numero_de_maquina,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
        }),
      });
      setIsEditing(false);
      setMensajeExito("Vehículo actualizado exitosamente");
      setTimeout(() => {
        setMensajeExito("");
      }, 500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNuevoDocumento(file);
    }
  };

  const handleSubmit = async () => {
    if (nuevoDocumento && tipoDocumento && fechaVencimiento) {
      await subirArchivo(
        vehiculo?.matricula || "",
        tipoDocumento,
        nuevoDocumento,
        fechaVencimiento,
      );
      setShowModal(false);
    } else {
      alert("Por favor, completa todos los campos.");
    }
  };

  const subirArchivo = async (
    matricula: string,
    tipo: string,
    archivo: File,
    fecha_vencimiento: string,
  ) => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("vehiculo", matricula);
    formData.append("tipo", tipo);
    formData.append("fecha_vencimiento", fecha_vencimiento);

    const response = await fetch(`${DOCUMENTOS_API_URL}${matricula}/`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const documentosResponse = await fetch(
        `${DOCUMENTOS_API_URL}${matricula}/`,
      );
      const documentos = await documentosResponse.json();
      setVehiculo((prev) => (prev ? { ...prev, documentos } : null));
    } else {
      const errorData = await response.json();
      console.error("Error al subir archivo:", errorData);
    }
  };

  const handleEditDocument = (documento: Documento) => {
    setDocumentoSeleccionado(documento);
    setTipoDocumento(documento.tipo);
    setFechaVencimiento(documento.fecha_vencimiento || "");
    setShowModal(true);
  };

  const handleEditSubmit = async () => {
    if (
      documentoSeleccionado &&
      nuevoDocumento &&
      tipoDocumento &&
      fechaVencimiento
    ) {
      await editarDocumento(
        vehiculo?.matricula || "",
        documentoSeleccionado.tipo,
        nuevoDocumento,
        fechaVencimiento,
      );
      setShowModal(false);
      setDocumentoSeleccionado(null);
    } else {
      alert("Por favor, completa todos los campos.");
    }
  };

  const editarDocumento = async (
    matricula: string,
    tipo: string,
    archivo: File,
    fecha_vencimiento: string,
  ) => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("vehiculo", matricula);
    formData.append("tipo", tipo);
    formData.append("fecha_vencimiento", fecha_vencimiento);

    const response = await fetch(`${DOCUMENTOS_API_URL}${matricula}/${tipo}/`, {
      method: "PATCH",
      body: formData,
    });

    if (response.ok) {
      const documentosResponse = await fetch(
        `${DOCUMENTOS_API_URL}${matricula}/`,
      );
      const documentos = await documentosResponse.json();
      setVehiculo((prev) => (prev ? { ...prev, documentos } : null));
    } else {
      const errorData = await response.json();
      console.error("Error al editar archivo:", errorData);
    }
  };

  const handleDeleteDocument = async () => {
    if (vehiculo && documentoSeleccionado) {
      try {
        const response = await fetch(
          `${DOCUMENTOS_API_URL}${vehiculo.matricula}/${documentoSeleccionado.tipo}/`,
          { method: "DELETE" },
        );
        if (response.ok) {
          const documentosResponse = await fetch(
            `${DOCUMENTOS_API_URL}${vehiculo.matricula}/`,
          );
          const documentos = await documentosResponse.json();
          setVehiculo((prev) => (prev ? { ...prev, documentos } : null));
          setShowDeleteDocumentModal(false);
        } else {
          const errorData = await response.json();
          console.error("Error al eliminar documento:", errorData);
        }
      } catch (error) {
        console.error("Error al eliminar documento:", error);
      }
    }
  };

  const router = useRouter();

  const irAInicio = () => {
    router.push("/application");
  };

  const irAVerMantenimiento = () => {
    router.push("/vermantenimiento");
  };

  const irACrearMantenimiento = () => {
    router.push("/crearmantenimiento");
  };

  const irACrearVehiculo = () => {
    router.push("/crearvehiculo");
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

        {mensajeExito && (
          <div
            className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-6 rounded-md shadow-lg"
            role="alert"
          >
            {mensajeExito}
          </div>
        )}

        {/* Información del funcionario */}
        <div className="max-w-3xl mx-auto mt-8 px-4">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Editar Vehiculos
          </h1>
          <div className="relative mb-8">
            <input
              type="text"
              value={busqueda}
              onChange={manejarBusqueda}
              placeholder="Buscar vehiculo..."
              className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />

            {resultados.length > 0 && (
              <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                {resultados.map((vehiculo) => (
                  <div
                    key={vehiculo.matricula}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    onClick={() => seleccionarVehiculo(vehiculo)}
                  >
                    <p className="text-gray-800">{vehiculo.matricula}</p>
                    <p className="text-sm text-gray-600">{vehiculo.marca}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {vehiculo && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-800">
                    Matricula:
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={vehiculo.matricula}
                      onChange={(e) =>
                        setVehiculo({ ...vehiculo, matricula: e.target.value })
                      }
                      className="text-gray-600 border border-gray-300 rounded p-1 w-full"
                    />
                  ) : (
                    <p className="text-gray-700">{vehiculo.matricula}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-800">
                    Número de máquina:
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={vehiculo.numero_de_maquina}
                      onChange={(e) =>
                        setVehiculo({
                          ...vehiculo,
                          numero_de_maquina: parseInt(e.target.value),
                        })
                      }
                      className="text-gray-600 border border-gray-300 rounded p-1 w-full"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {vehiculo.numero_de_maquina}
                    </p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-800">Marca:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={vehiculo.marca}
                      onChange={(e) =>
                        setVehiculo({ ...vehiculo, marca: e.target.value })
                      }
                      className="text-gray-600 border border-gray-300 rounded p-1 w-full"
                    />
                  ) : (
                    <p className="text-gray-700">{vehiculo.marca}</p>
                  )}
                </div>
                <div>
                  <label className="font-semibold text-gray-800">Modelo:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={vehiculo.modelo}
                      onChange={(e) =>
                        setVehiculo({ ...vehiculo, modelo: e.target.value })
                      }
                      className="text-gray-600 border border-gray-300 rounded p-1 w-full"
                    />
                  ) : (
                    <p className="text-gray-700">{vehiculo.modelo}</p>
                  )}
                </div>
              </div>

              {/* Documentos del funcionario */}
              {vehiculo.documentos && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-gray-800">
                    Documentos:
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {vehiculo.documentos.map((doc, index) => (
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
                            <button
                              onClick={() => handleEditDocument(doc)}
                              className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setDocumentoSeleccionado(doc);
                                setShowDeleteDocumentModal(true);
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
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors w-full"
                >
                  Guardar
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors w-full"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition-colors w-full"
              >
                Editar
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors w-full"
            >
              Agregar Documento
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition-colors w-full"
            >
              Eliminar Vehiculo
            </button>
            <button
              onClick={irAVerMantenimiento}
              className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors w-full"
            >
              Ver Mantenimiento
            </button>
            <button
              onClick={irACrearMantenimiento}
              className="bg-yellow-500 text-white p-4 rounded-lg hover:bg-yellow-600 transition-colors w-full"
            >
              Crear Mantenimiento
            </button>
            <button
              onClick={irACrearVehiculo}
              className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors w-full"
            >
              Crear Vehiculo
            </button>
          </div>

          {showDeleteModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-bold mb-4 text-gray-800">
                  Confirmar Eliminación
                </h2>
                <p>
                  ¿Estás seguro de que deseas eliminar a {vehiculo?.matricula}?
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
                  Subir Documento
                </h2>
                <label className="font-semibold text-gray-800">Tipo:</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="border border-gray-300 rounded p-1 w-full"
                >
                  <option value="">Seleccionar tipo de documento</option>
                  <option value="seguro">Seguro</option>
                  <option value="padron">Padron</option>
                  <option value="permiso_circulacion">
                    Permiso de Circulación
                  </option>
                  <option value="revision_tecnica">Revision Tecnica</option>
                </select>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mt-2"
                />
                <label className="font-semibold text-gray-800 mt-2">
                  Fecha de Vencimiento:
                </label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="border border-gray-300 rounded p-1 mt-1 w-full"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-blue-500 text-white p-2 rounded-lg mt-2"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-red-500 text-white p-2 rounded-lg mt-2"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="bg-blue-500 text-white p-2 rounded-lg mt-2"
                >
                  Editar
                </button>
              </div>
            </div>
          )}
          {showDeleteDocumentModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-5 rounded-lg shadow-lg">
                <h2 className="text-lg font-bold mb-4 text-gray-800">
                  Confirmar Eliminación de Documento
                </h2>
                <p className="text-gray-800">
                  ¿Estás seguro de que deseas eliminar el documento{" "}
                  {documentoSeleccionado?.tipo}?
                </p>
                <div className="mt-4 space-x-3">
                  <button
                    onClick={handleDeleteDocument}
                    className="bg-red-500 text-white p-2 rounded-lg"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setShowDeleteDocumentModal(false)}
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
