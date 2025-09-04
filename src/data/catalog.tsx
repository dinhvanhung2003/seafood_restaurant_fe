import type { Catalog, Table } from "@/types/types";


export const catalog: Catalog = {
categories: [
{ id: "all", name: "Tất cả" },
{ id: "beer", name: "BIA & THUỐC LÁ" },
{ id: "classic", name: "CLASSIC COCKTAILS" },
{ id: "appetizer", name: "MÓN KHAI VỊ" },
{ id: "soup", name: "SÚP" },
{ id: "tea", name: "TEA" },
],
items: [
{ id: "milano", name: "MILANO", price: 30000, categoryId: "classic", image: "/tomhum.jpg?height=100&width=160" },
{ id: "spritz", name: "APEROL SPRITZ", price: 30000, categoryId: "classic", image: "/tomhum.jpg?height=100&width=160" },
{ id: "cubalibre", name: "CUBA LIBRE", price: 30000, categoryId: "classic", image: "/tomhum.jpg?height=100&width=160" },
{ id: "ginfizz", name: "GIN FIZZ", price: 30000, categoryId: "classic", image: "/tomhum.jpg?height=100&width=160" },
{ id: "bloody", name: "BLOODY MARY", price: 30000, categoryId: "classic", image: "/tomhum.jpg?height=100&width=160" },
{ id: "app1", name: "Đĩa thịt nguội Tây Ban Nha", price: 125000, categoryId: "appetizer", image: "/tomhum.jpg?height=100&width=160" },
{ id: "app2", name: "Phômai dây Nga", price: 125000, categoryId: "appetizer", image: "/tomhum.jpg?height=100&width=160" },
{ id: "soup1", name: "Súp kem rau 4 mùa", price: 125000, categoryId: "soup", image: "/tomhum.jpg?height=100&width=160" },
{ id: "tea1", name: "Peach Tea", price: 15000, categoryId: "tea", image: "/tomhum.jpg?height=100&width=160" },
{ id: "tea2", name: "Mint Tea", price: 15000, categoryId: "tea", image: "/tomhum.jpg?height=100&width=160" },
{ id: "beer1", name: "Bia Heineken", price: 30000, categoryId: "beer", image: "/bia.png?height=100&width=160" },
{ id: "beer2", name: "Bia Hà Nội", price: 30000, categoryId: "beer", image: "/biahanoi.jpg?height=100&width=160" },
{ id: "beer3", name: "Bia 333", price: 30000, categoryId: "beer", image: "/bia33.png?height=100&width=160" },
{ id: "beer4", name: "Bia huda", price: 30000, categoryId: "beer", image: "/huda.jpg?height=100&width=160" },
{ id: "beer5", name: "Bia budweiser", price: 30000, categoryId: "beer", image: "/bud.jpg?height=100&width=160" },
{ id: "beer6", name: "Bia Sài Gòn", price: 30000, categoryId: "beer", image: "/saigon.jpg?height=100&width=160" },
{ id: "beer7", name: "Bia Tiger", price: 30000, categoryId: "beer", image: "/tiger.jpg?height=100&width=160" },
],
};


export const floors = ["Tất cả", "Lầu 2", "Lầu 3", "Phòng VIP"] as const;


export const tables: Table[] = Array.from({ length: 32 }).map((_, i) => ({
id: `t${i + 1}`,
name: i < 20 ? `Bàn ${i + 1}` : i < 27 ? `Phòng VIP ${i - 19}` : `Bàn ${i + 1}`,
floor: i < 20 ? "Lầu 2" : i < 27 ? "Phòng VIP" : "Lầu 3",
status: i === 0 || i === 6 ? "using" : "empty",
startedAt: i === 6
? new Date(Date.now() - 51 * 60 * 1000).toISOString()
: i === 0
? new Date().toISOString()
: undefined,
currentAmount: i === 6 ? 125000 : i === 0 ? 54000 : 0,
}));