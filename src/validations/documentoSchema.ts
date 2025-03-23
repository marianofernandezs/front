import { z } from "zod";

export const documentoSchema = z.object({
  file: z
    .custom<File>((file) => file instanceof File, {
      message: "Debes seleccionar un archivo válido.",
    })
    .refine((file) => file.type === "application/pdf", {
      message: "Solo se permiten archivos PDF.",
    }),
  tipo: z.string().min(1, "Selecciona un tipo de documento."),
  fecha_vencimiento: z
    .string()
    .min(1, "Ingresa la fecha de vencimiento.")
    .refine((value) => !isNaN(Date.parse(value)), {
      message: "La fecha de vencimiento no es válida.",
    }),
});
