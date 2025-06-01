const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class APIError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" = "GET",
  body: unknown = null,
  isFormData: boolean = false,
) => {
  // 1️⃣ Obtener el token del localStorage
  const token = localStorage.getItem("token");
  if (!token) throw new APIError("No autenticado", 401);

  // 2️⃣ Definir los headers de la solicitud
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  // 3️⃣ Si no estamos enviando archivos, añadimos "Content-Type: application/json"
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  // 4️⃣ Definir las opciones de la solicitud HTTP
  const options: RequestInit = {
    method,
    headers,
    mode: "cors",
    credentials: "omit",
  };

  if (body && method !== "GET" && method !== "HEAD") {
    options.body = isFormData
      ? (body as BodyInit) // FormData ya es BodyInit
      : JSON.stringify(body);
  }

  // 3️⃣ Hacer la solicitud y manejar la respuesta
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (res.status === 401) {
      console.warn("⚠️ Token expirado. Redirigiendo a login...");
      localStorage.removeItem("token");
      window.location.href = "/"; // Redirigir al login
      return;
    }

    const contentType = res.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!res.ok) {
      const errorData = isJson ? await res.json() : null;
      throw new APIError(
        errorData?.message || res.statusText,
        res.status,
        errorData,
      );
    }

    return isJson ? await res.json() : null;
  } catch (err: unknown) {
    console.error("❌ apiRequest error:", err);
    throw err instanceof APIError
      ? err
      : new APIError("Error de red o servidor", 500);
  }
};
