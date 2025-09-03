// // src/features/table/mappers.ts
// export type UIStatus = "active" | "inactive";

// export const toApiTableStatus = (s: UIStatus) => (s === "inactive" ? "INACTIVE" : "ACTIVE") as const;
// export const fromApiTableStatus = (s: "ACTIVE" | "INACTIVE") =>
//   s === "INACTIVE" ? "inactive" : "active";

// export const normalizeUIStatus = (s: unknown): UIStatus =>
//   `${s ?? ""}`.toLowerCase() === "inactive" ||
//   `${s ?? ""}`.toLowerCase() === "0" ||
//   `${s ?? ""}`.toLowerCase() === "false"
//     ? "inactive"
//     : "active";
