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
