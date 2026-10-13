"use client";

import { Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Product, Service } from "@/lib/data";

function isProduct(item: Product | Service): item is Product {
  return "inStock" in item;
}

export function ItemCard({ item }: { item: Product | Service }) {
  const prod = isProduct(item);

  return (
    <div
      className="rounded-lg p-3 text-xs flex flex-col gap-1"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--text)", fontSize: "0.75rem" }}>
          <Package size={11} style={{ color: "var(--accent)" }} />
          <span>{item.name}</span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
          }}
        >
          {item.category}
        </span>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.7rem", lineHeight: 1.4 }}>
        {item.description.slice(0, 90)}{item.description.length > 90 ? "…" : ""}
      </p>

      <div className="flex items-center justify-between mt-1">
        <span className="font-semibold" style={{ color: "var(--text)", fontSize: "0.8rem" }}>
          £{prod ? (item as Product).price.toFixed(2) : (item as Service).basePrice.toFixed(2)}
          <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.7rem" }}>
            {" "}/{item.unit}
          </span>
        </span>
        {prod ? (
          <span className="flex items-center gap-1" style={{ color: (item as Product).inStock ? "var(--green)" : "var(--red)", fontSize: "0.7rem" }}>
            {(item as Product).inStock ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {(item as Product).inStock ? "In stock" : "Out of stock"}
          </span>
        ) : (
          <span className="flex items-center gap-1" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
            <Clock size={10} />
            {(item as Service).duration}
          </span>
        )}
      </div>

      {prod && (item as Product).leadTime && (
        <span className="flex items-center gap-1" style={{ color: "var(--amber)", fontSize: "0.7rem" }}>
          <Clock size={10} />
          Lead time: {(item as Product).leadTime}
        </span>
      )}
    </div>
  );
}
