import type { Metadata } from "next";
import React from "react";
import { initialProducts, STORE_CONFIG } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

interface ProductLayoutProps {
  children: React.ReactNode;
  params: { sku: string };
}

function findInitialProductBySku(rawSku: string) {
  const decoded = decodeURIComponent(rawSku || "").trim().toLowerCase();
  if (!decoded) return undefined;
  return initialProducts.find(
    (p) => p.sku.toLowerCase() === decoded || p.id.toLowerCase() === decoded
  );
}

export async function generateMetadata({
  params,
}: {
  params: { sku: string };
}): Promise<Metadata> {
  const product = findInitialProductBySku(params.sku);

  if (!product) {
    return {
      title: "Produto não encontrado — Bia Makes",
      description:
        "O item solicitado não foi localizado no catálogo atual da Bia Makes. Explore nossas novidades em maquiagem e cosméticos.",
      openGraph: {
        title: "Produto não encontrado — Bia Makes",
        description: "Explore a loja oficial Bia Makes.",
        images: [{ url: "/logo.jpg", alt: "Bia Makes" }],
      },
    };
  }

  const price =
    product.promoPrice && product.promoPrice < product.salePrice
      ? product.promoPrice
      : product.salePrice;
  const availableStock = Math.max(0, product.physicalStock - product.reservedStock);
  const isFree = Boolean(product.freeShipping || product.shippingValue === 0);

  const title = `${product.name} | ${formatCurrency(price)} — Bia Makes`;
  const description = `Em estoque (${availableStock} un) • Frete: ${
    isFree ? "Grátis" : formatCurrency(product.shippingValue)
  } • ${product.description}`;
  const mainImage = product.images?.[0] || "/logo.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "pt_BR",
      siteName: "Bia Makes",
      images: [
        {
          url: mainImage,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [mainImage],
    },
  };
}

export default function ProductSkuLayout({ children, params }: ProductLayoutProps) {
  const product = findInitialProductBySku(params.sku);

  if (!product) {
    return <>{children}</>;
  }

  const price =
    product.promoPrice && product.promoPrice < product.salePrice
      ? product.promoPrice
      : product.salePrice;
  const availableStock = Math.max(0, product.physicalStock - product.reservedStock);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    gtin13: product.ean || undefined,
    image: product.images && product.images.length > 0 ? product.images : ["/logo.jpg"],
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand || "Bia Makes",
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: Number(price.toFixed(2)),
      availability:
        availableStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Bia Makes",
        url: STORE_CONFIG.instagramUrl,
      },
    },
    aggregateRating:
      product.rating && product.reviewsCount
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {children}
    </>
  );
}
