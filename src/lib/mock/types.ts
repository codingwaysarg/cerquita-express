export type User = { id: string; email: string };

export type Card = {
  id: string;
  brand: "visa" | "mastercard" | "amex";
  last4: string;
  holder: string;
  exp: string;
  isDefault: boolean;
};

export type Fridge = {
  id: string;
  name: string;
  address: string;
  distanceM: number;
  online: boolean;
};

export type SessionState =
  | "idle"
  | "unlocking"
  | "open"
  | "processing"
  | "done"
  | "error";

export type Product = {
  id: string;
  name: string;
  brand?: string;
  price: number; // ARS
  emoji?: string;
};

export type TxItem = {
  productId: string;
  qty: number;
  unitPrice: number; // snapshot
};

export type TxStatus = "completed" | "in_review" | "adjusted" | "cancelled";

export type Transaction = {
  id: string;
  fridgeId: string;
  fridgeName: string;
  createdAt: number;
  items: TxItem[];
  status: TxStatus;
  appealReason?: string;
  cardLast4?: string;
};
