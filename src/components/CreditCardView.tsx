import type { Card } from "@/lib/mock/types";
import { cn } from "@/lib/utils";

const brandLabel: Record<Card["brand"], string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  amex: "Amex",
};

export function CreditCardView({ card, variant = 1 }: { card: Card; variant?: 1 | 2 }) {
  return (
    <div
      className={cn(
        "relative w-full aspect-[1.7/1] rounded-3xl p-5 text-white shadow-soft overflow-hidden",
        variant === 1 ? "bg-gradient-card" : "bg-gradient-card-2",
      )}
    >
      <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
      <div className="flex justify-between items-start">
        <span className="text-sm/none font-medium opacity-90">Cerquita</span>
        {card.isDefault && (
          <span className="text-[10px] uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-1 rounded-full">
            Predeterminada
          </span>
        )}
      </div>
      <div className="mt-8 text-xl tracking-[0.3em] font-medium tabular-nums">
        •••• {card.last4}
      </div>
      <div className="mt-4 flex items-end justify-between text-xs">
        <div>
          <div className="opacity-70">Titular</div>
          <div className="font-medium truncate max-w-[10rem]">{card.holder}</div>
        </div>
        <div>
          <div className="opacity-70">Vence</div>
          <div className="font-medium tabular-nums">{card.exp}</div>
        </div>
        <div className="font-semibold tracking-wide">{brandLabel[card.brand]}</div>
      </div>
    </div>
  );
}
