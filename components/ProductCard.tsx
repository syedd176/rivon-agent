"use client";

import { Package, Clock, CheckCircle2, XCircle, Tag, Lock } from "lucide-react";
import { Product, ServiceOffering } from "@/lib/data";
import { productImage } from "@/lib/productImage";

/** Service matches arrive without basePrice — prices need owner approval first. */
type ServiceWithheldPrice = Omit<ServiceOffering, "basePrice"> & { basePrice?: number };

function isProduct(item: Product | ServiceWithheldPrice): item is Product {
  return "inStock" in item;
}

export function ItemCard({ item }: { item: Product | ServiceWithheldPrice }) {
  const prod = isProduct(item);
  const priceWithheld = !prod && (item as ServiceWithheldPrice).basePrice === undefined;

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1.5"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-2.5">
        {prod && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImage(item.category, item.name)}
            alt=""
            width={48}
            height={48}
            className="rounded-md flex-shrink-0"
            style={{ background: "var(--background)" }}
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium text-xs" style={{ color: "var(--text)" }}>
              <Package size={11} style={{ color: "var(--accent)" }} />
              <span>{item.name}</span>
            </div>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
            >
              {item.category}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.7rem", lineHeight: 1.4 }}>
            {item.description.slice(0, 100)}{item.description.length > 100 ? "…" : ""}
          </p>
        </div>
      </div>

      {prod && (item as Product).colors && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
          Colours: {(item as Product).colors!.join(", ")}
        </p>
      )}
      {prod && (item as Product).sizes && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
          Sizes: {(item as Product).sizes!.join(", ")}
        </p>
      )}

      <div className="flex items-center justify-between mt-0.5">
        <div className="flex items-center gap-2">
          {priceWithheld ? (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "var(--amber-dim)", color: "var(--amber)" }}
            >
              <Lock size={9} />
              Priced after the team confirms
            </span>
          ) : (
            <>
              <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                {prod
                  ? "£" + (item as Product).price.toFixed(2)
                  : (item as ServiceWithheldPrice).basePrice === 0
                    ? "Free"
                    : "£" + (item as ServiceWithheldPrice).basePrice!.toFixed(2)}
              </span>
              {prod && (item as Product).originalPrice && (
                <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", textDecoration: "line-through" }}>
                  £{(item as Product).originalPrice!.toFixed(2)}
                </span>
              )}
              <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>/{item.unit}</span>
            </>
          )}
        </div>

        {prod ? (
          <span className="flex items-center gap-1" style={{ color: (item as Product).inStock ? "var(--green)" : "var(--red)", fontSize: "0.68rem" }}>
            {(item as Product).inStock ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {(item as Product).inStock ? "In stock" : "Out of stock"}
          </span>
        ) : (
          <span className="flex items-center gap-1" style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
            <Clock size={10} />
            {(item as ServiceOffering).duration}
          </span>
        )}
      </div>

      {prod && (item as Product).sku && (
        <span className="flex items-center gap-1" style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
          <Tag size={9} />
          SKU: {(item as Product).sku}
        </span>
      )}
    </div>
  );
}
