import { z } from "zod";

const passwordStrong = /^(?=.*[A-Z])(?=.*\d)(?=.*[#\$%&\*@]).{8,}$/;

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(passwordStrong, {
    message:
      "Password inválido: mínimo 8 caracteres, 1 mayúscula, 1 dígito y 1 especial (# $ % & * @).",
  }),
  name: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  birthdate: z.coerce.date(),
  url_profile: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  roles: z.array(z.enum(["user", "admin"])).optional(),
});

export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  birthdate: z.coerce.date().optional(),
  url_profile: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const message = result.error.issues?.[0]?.message || "Datos inválidos";
  const err = new Error(message);
  err.status = 400;
  throw err;
}

