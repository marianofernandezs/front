import Image from "next/image";
import Link from "next/link";
import withAuth from "@/hoc/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";

const Dashboard = () => {
  const { user } = useAuth();
  const router = useRouter();

  const refrescarPagina = () => {
    router.reload();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Imagen de fondo con opacidad y tamaño ajustado */}
      <div className="fixed inset-0 bg-white">
        <div className="absolute inset-0">
          <Image
            src="/Fondoapp.jpg"
            alt="Fondo"
            fill
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            priority
            className="opacity-50"
          />
        </div>
      </div>

      {/* Contenido con fondo semitransparente */}
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
                  onClick={refrescarPagina}
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

        {/* Contenido principal */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
            Bienvenido a el Intranet&nbsp;
            <span className="text-blue-400">{user?.name ?? ""}</span>
          </h1>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
              Acceso Aplicaciones
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Tarjeta de Funcionarios */}
              <Link href="/bsqdaempleados" className="block group">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  <Image
                    src="/Funcionarios.jpg"
                    alt="Funcionarios"
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                    priority
                  />
                  <div className="p-4 text-center">
                    <h3 className="text-xl text-blue-500">Listado</h3>
                    <p className="text-blue-500">De Funcionarios</p>
                  </div>
                </div>
              </Link>

              {/* Tarjeta de Vehículos */}
              <Link href="/bsqdavehiculos" className="block group">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  <Image
                    src="/vehiculos.jpg"
                    alt="Vehículos"
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                    priority
                  />
                  <div className="p-4 text-center">
                    <h3 className="text-xl text-blue-500">Listado</h3>
                    <p className="text-blue-500">De Vehículos</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default withAuth(Dashboard);
