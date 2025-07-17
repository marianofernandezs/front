import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import withAuth from "@/hoc/withAuth";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, APIError } from "@/utils/api";
import Head from "next/head";

const vehiculoSchema = z.object({
  matricula: z
    .string()
    .min(2, "La matrícula es obligatoria")
    .regex(/^[A-Z0-9.-]+$/, "Formato de matrícula inválido"),
  numero_de_maquina: z
    .number({ invalid_type_error: "Debe ser un número" })
    .int()
    .min(1, "Número de máquina inválido"),
  marca: z.string().min(2, "Marca obligatoria"),
  modelo: z.string().min(1, "Modelo obligatorio"),
});

type VehiculoFormData = z.infer<typeof vehiculoSchema>;

function CrearVehiculo() {
  const [vehiculos, setVehiculos] = useState<VehiculoFormData[]>([]);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehiculoFormData>({
    resolver: zodResolver(vehiculoSchema),
  });

  const router = useRouter();

  const irAInicio = () => {
    router.push("/application");
  };

  useEffect(() => {
    const obtenerVehiculos = async () => {
      try {
        const data = await apiRequest("/vehiculos/");
        setVehiculos(data);
      } catch (error) {
        console.error(error);
        setMensajeError("❌ Error al obtener vehículos.");
      } finally {
      }
    };
    obtenerVehiculos();
  }, []);

  const onSubmit = async (data: VehiculoFormData) => {
    setMensajeError(null);
    setMensajeExito(null);

    const matriculaNormalizada = data.matricula
      .toUpperCase()
      .replace(/\s/g, "");

    const matriculaExiste = vehiculos.some(
      (v) => v.matricula.toUpperCase() === matriculaNormalizada,
    );

    const numeroMaquinaExiste = vehiculos.some(
      (v) => v.numero_de_maquina === data.numero_de_maquina,
    );

    if (matriculaExiste) {
      setMensajeError("❌ La matrícula ya está registrada.");
      return;
    }

    if (numeroMaquinaExiste) {
      setMensajeError("❌ El número de máquina ya está registrado.");
      return;
    }

    try {
      await apiRequest("/vehiculos/", "POST", {
        ...data,
        matricula: matriculaNormalizada,
      });
      setMensajeExito("✅ Vehículo creado correctamente.");
      reset();
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (error) {
      if (error instanceof APIError) {
        const rawMsg =
          error.data?.matricula?.[0] ||
          error.data?.numero_de_maquina?.[0] ||
          error.message;

        let mensaje = `❌ ${rawMsg}`;

        if (
          rawMsg.toLowerCase().includes("already exists") ||
          rawMsg.toLowerCase().includes("ya existe") ||
          rawMsg.toLowerCase().includes("matrícula ya registrada")
        ) {
          mensaje =
            "❌ La matrícula o el número de máquina ya está registrada.";
        }

        setMensajeError(mensaje);
      } else {
        setMensajeError("❌ Error inesperado al crear el vehículo.");
      }
    }
  };

  return (
    <>
      <Head>
        <title>Crear Vehículo</title>
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

            {mensajeExito && (
              <div className="mb-4 text-green-600 font-medium">
                {mensajeExito}
              </div>
            )}

            {mensajeError && (
              <div className="mb-4 text-red-600 font-medium">
                {mensajeError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      {...register("matricula")}
                      className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                    {errors.matricula && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.matricula.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Marca:
                    </label>
                    <input
                      placeholder="Mercedes"
                      type="text"
                      {...register("marca")}
                      className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                    {errors.marca && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.marca.message}
                      </p>
                    )}
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
                      {...register("numero_de_maquina", {
                        valueAsNumber: true,
                      })}
                      className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                    {errors.numero_de_maquina && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.numero_de_maquina.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Modelo:
                    </label>
                    <input
                      placeholder="CLA-500"
                      type="text"
                      {...register("modelo")}
                      className="text-black mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
                    />
                    {errors.modelo && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.modelo.message}
                      </p>
                    )}
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
    </>
  );
}

export default withAuth(CrearVehiculo);
