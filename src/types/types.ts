export type Table = {
id: string;
name: string;
floor: string;
status: "empty" | "using" | "reserved";
startedAt?: string; // ISO
currentAmount?: number;
};


export type MenuItem = {
id: string;
name: string;
price: number;
image?: string;
categoryId: string;
};


export type Category = { id: string; name: string };


export type OrderItem = { id: string; qty: number,note?:string };


export type OrderMap = Record<string, OrderItem[]>; // key = tableId


export type Catalog = {
categories: Category[];
items: MenuItem[];
};




export type CatalogItem = {
  id: string;
  name: string;
  price: number;
  
};
