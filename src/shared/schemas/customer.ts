// shared/schemas/customer.ts
import { z } from "zod";

export const customerTypeSchema = z.enum(["PERSONAL", "COMPANY"]);
export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]).optional();

export const createCustomerSchema = z
  .object({
    type: customerTypeSchema,
    name: z
  .string()
  .min(1, "Tên khách hàng là bắt buộc")
  .regex(/^[\p{L}\s]+$/u, "Tên chỉ được chứa chữ cái"),

    code: z.string().trim().max(32).optional().or(z.literal("")), // FE có thể gửi "" => chuyển undefined
    companyName: z.string().trim().max(180).optional().or(z.literal("")),
    phone: z
      .string()
      .trim()
      .min(8, "Số điện thoại không hợp lệ")
      .max(20)
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Email không hợp lệ")
      .max(180)
      .optional()
      .or(z.literal("")),
    taxNo: z.string().trim().max(32).optional().or(z.literal("")),
    identityNo: z.string().trim().max(32).optional().or(z.literal("")),
    gender: genderSchema, // MALE | FEMALE | OTHER | undefined

    birthday: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không hợp lệ")
      .optional()
      .or(z.literal("")), // FE dùng <input type="date">
    address: z.string().trim().optional().or(z.literal("")),
    province: z.string().trim().optional().or(z.literal("")),
    district: z.string().trim().optional().or(z.literal("")),
    ward: z.string().trim().optional().or(z.literal("")),
    note: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // Nếu type = COMPANY thì companyName bắt buộc
    if (data.type === "COMPANY" && !data.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Tên công ty là bắt buộc khi loại khách là Công ty",
      });
    }
  });

// Type dùng chung cho FE/BE
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
