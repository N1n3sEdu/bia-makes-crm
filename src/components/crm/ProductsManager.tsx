"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  X, 
  Check, 
  Filter, 
  Truck,
  ExternalLink,
  Copy,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { Product, ProductCategory, ProductVariation } from "@/types";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface ProductsManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const categoriesList: ProductCategory[] = [
  'Rosto',
  'Lábios',
  'Olhos',
  'Pincéis & Acessórios',
  'Skincare',
  'Kits de Presente',
  'Box Fechado'
];

export const CATEGORIES_WITHOUT_VARIATIONS: ProductCategory[] = [
  'Kits de Presente',
  'Pincéis & Acessórios',
  'Skincare',
  'Box Fechado'
];

export const hasVariations = (category: ProductCategory): boolean => {
  return !CATEGORIES_WITHOUT_VARIATIONS.includes(category);
};

export function ProductsManager({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProductsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formEan, setFormEan] = useState("");
  const [formCategory, setFormCategory] = useState<ProductCategory>("Rosto");
  const [formBrand, setFormBrand] = useState("Bia Makes");
  const [formCostPrice, setFormCostPrice] = useState<number>(25.00);
  const [formSalePrice, setFormSalePrice] = useState<number>(69.90);
  const [formDiscountPercent, setFormDiscountPercent] = useState<number | undefined>(undefined);
  const [formPhysicalStock, setFormPhysicalStock] = useState<number>(50);
  const [formMinStock, setFormMinStock] = useState<number>(15);
  const [formShippingValue, setFormShippingValue] = useState<number>(12.90);
  const [formFreeShipping, setFormFreeShipping] = useState<boolean>(false);
  const [formBatch, setFormBatch] = useState("LT2026-X1");
  const [formExpiryDate, setFormExpiryDate] = useState("2027-12-31");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("/logo.jpg");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formVariations, setFormVariations] = useState<ProductVariation[]>([
    { id: "var-1", name: "Cor Padrão", colorHex: "#EED7C5", sku: "SKU-VAR-1", stock: 50 }
  ]);

  // Handle opening an image file directly from the user's computer
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Optimize image dimensions for fast rendering and localStorage persistence
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setFormImageUrl(compressed);
        } else {
          setFormImageUrl(dataUrl);
        }
      };
      img.onerror = () => {
        setFormImageUrl(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Social & Marketplace Links Form State
  const [formInstagramUrl, setFormInstagramUrl] = useState("https://instagram.com/biamakeoficial_");
  const [formShopeeUrl, setFormShopeeUrl] = useState("https://shopee.com.br/biamakes.beauty");
  const [formMercadoLivreUrl, setFormMercadoLivreUrl] = useState("https://mercadolivre.com.br");
  const [formTiktokUrl, setFormTiktokUrl] = useState("https://tiktok.com/@biamakeoficial_");
  const [formAmazonUrl, setFormAmazonUrl] = useState("");
  const [formEmbedStockAndShipping, setFormEmbedStockAndShipping] = useState(true);

  const handleCopyEmbedLink = (sku: string) => {
    const url = `${window.location.origin}/p/${sku}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  // Open modal for new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku(`BM-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormEan(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormCategory("Rosto");
    setFormBrand("Bia Makes");
    setFormCostPrice(25.00);
    setFormSalePrice(69.90);
    setFormDiscountPercent(undefined);
    setFormPhysicalStock(50);
    setFormMinStock(15);
    setFormShippingValue(12.90);
    setFormFreeShipping(false);
    setFormBatch("LT2026-X1");
    setFormExpiryDate("2027-12-31");
    setFormDescription("");
    setFormImageUrl("/logo.jpg");
    setSelectedFileName("");
    setFormVariations([{ id: `var-${Date.now()}`, name: "Padrão", colorHex: "#EED7C5", sku: "VAR-01", stock: 50 }]);
    setFormInstagramUrl("https://instagram.com/biamakeoficial_");
    setFormShopeeUrl("https://shopee.com.br/biamakes.beauty");
    setFormMercadoLivreUrl("https://mercadolivre.com.br");
    setFormTiktokUrl("https://tiktok.com/@biamakeoficial_");
    setFormAmazonUrl("");
    setFormEmbedStockAndShipping(true);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormEan(p.ean);
    setFormCategory(p.category);
    setFormBrand(p.brand);
    setFormCostPrice(p.costPrice);
    setFormSalePrice(p.salePrice);
    if (p.promoPrice && p.promoPrice < p.salePrice && p.salePrice > 0) {
      const pct = Math.round(((p.salePrice - p.promoPrice) / p.salePrice) * 100);
      setFormDiscountPercent(pct);
    } else {
      setFormDiscountPercent(undefined);
    }
    setFormPhysicalStock(p.physicalStock);
    setFormMinStock(p.minStock);
    setFormShippingValue(p.shippingValue ?? 12.90);
    setFormFreeShipping(Boolean(p.freeShipping));
    setFormBatch(p.batch);
    setFormExpiryDate(p.expiryDate);
    setFormDescription(p.description);
    setFormImageUrl(p.images[0] || "/logo.jpg");
    setSelectedFileName("");
    setFormVariations(p.variations || []);
    setFormInstagramUrl(p.socialLinks?.instagramUrl || "https://instagram.com/biamakeoficial_");
    setFormShopeeUrl(p.socialLinks?.shopeeUrl || "");
    setFormMercadoLivreUrl(p.socialLinks?.mercadoLivreUrl || "");
    setFormTiktokUrl(p.socialLinks?.tiktokUrl || "");
    setFormAmazonUrl(p.socialLinks?.amazonUrl || "");
    setFormEmbedStockAndShipping(p.socialLinks?.embedStockAndShipping ?? true);
    setIsModalOpen(true);
  };

  // Save product (Add or Edit)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim()) {
      alert("Por favor, preencha o Nome e o SKU do produto.");
      return;
    }

    const calculatedPromoPrice =
      formDiscountPercent && formDiscountPercent > 0 && formDiscountPercent < 100
        ? Number((formSalePrice * (1 - formDiscountPercent / 100)).toFixed(2))
        : undefined;

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formName,
      sku: formSku,
      ean: formEan,
      category: formCategory,
      brand: formBrand,
      costPrice: Number(formCostPrice),
      salePrice: Number(formSalePrice),
      promoPrice: calculatedPromoPrice,
      physicalStock: Number(formPhysicalStock),
      reservedStock: 0,
      minStock: Number(formMinStock),
      shippingValue: formFreeShipping ? 0 : Number(formShippingValue),
      freeShipping: formFreeShipping,
      batch: formBatch,
      expiryDate: formExpiryDate,
      description: formDescription,
      images: [formImageUrl],
      variations: hasVariations(formCategory) ? formVariations : [],
      socialLinks: {
        instagramUrl: formInstagramUrl.trim() || undefined,
        shopeeUrl: formShopeeUrl.trim() || undefined,
        mercadoLivreUrl: formMercadoLivreUrl.trim() || undefined,
        tiktokUrl: formTiktokUrl.trim() || undefined,
        amazonUrl: formAmazonUrl.trim() || undefined,
        embedStockAndShipping: formEmbedStockAndShipping,
      },
      rating: editingProduct ? editingProduct.rating : 5.0,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 0,
      isFeatured: editingProduct ? editingProduct.isFeatured : false
    };

    if (editingProduct) {
      onUpdateProduct(productPayload);
    } else {
      onAddProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  const shortcutsRef = useRef({ handleOpenAdd, handleSave, isModalOpen });
  useEffect(() => {
    shortcutsRef.current = { handleOpenAdd, handleSave, isModalOpen };
  });

  // Global shortcuts integration: Alt+N (shortcut-new-item) and Alt+S (shortcut-save-form)
  useEffect(() => {
    const onNewItem = () => {
      shortcutsRef.current.handleOpenAdd();
    };
    const onSaveForm = () => {
      if (shortcutsRef.current.isModalOpen) {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        shortcutsRef.current.handleSave(fakeEvent);
      }
    };
    window.addEventListener("shortcut-new-item", onNewItem);
    window.addEventListener("shortcut-save-form", onSaveForm);
    return () => {
      window.removeEventListener("shortcut-new-item", onNewItem);
      window.removeEventListener("shortcut-save-form", onSaveForm);
    };
  }, []);

  // Category change handler (resets/restores variations if switching categories)
  const handleCategoryChange = (newCat: ProductCategory) => {
    setFormCategory(newCat);
    if (hasVariations(newCat) && formVariations.length === 0) {
      setFormVariations([
        { id: `var-${Date.now()}`, name: "Padrão", colorHex: "#EED7C5", sku: `${formSku || "SKU"}-VAR1`, stock: formPhysicalStock || 50 }
      ]);
    }
  };

  // Variations helper
  const handleAddVariation = () => {
    const newVar: ProductVariation = {
      id: `var-${Date.now()}`,
      name: `Novo Tom ${formVariations.length + 1}`,
      colorHex: "#C97A8B",
      sku: `${formSku}-T0${formVariations.length + 1}`,
      stock: 15
    };
    setFormVariations([...formVariations, newVar]);
  };

  const handleRemoveVariation = (id: string) => {
    if (formVariations.length <= 1) {
      alert("O produto deve possuir pelo menos 1 variação.");
      return;
    }
    setFormVariations(formVariations.filter(v => v.id !== id));
  };

  // Filter products
  const filtered = products.filter(p => {
    const matchCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.ean.includes(searchTerm);
    return matchCat && matchSearch;
  });

  // Calculate live promo price and live margin
  const livePromoPrice =
    formDiscountPercent && formDiscountPercent > 0 && formDiscountPercent < 100
      ? Number((formSalePrice * (1 - formDiscountPercent / 100)).toFixed(2))
      : undefined;

  const effectiveSellingPrice = livePromoPrice ?? formSalePrice;
  const liveMargin =
    effectiveSellingPrice > 0
      ? (((effectiveSellingPrice - formCostPrice) / effectiveSellingPrice) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#39313A]">
            Catálogo, Frete Embutido & Redes Vinculadas
          </h2>
          <p className="text-xs text-[#39313A]/70 mt-0.5">
            Cadastre produtos, configure o valor de frete embutido e vincule os links das redes sociais com estoque em tempo real.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-[#9C5B6F] hover:bg-[#7A3F51] text-white rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="bg-white p-4 rounded-3xl border border-[#E9D9CD] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Nome, SKU ou EAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F8] rounded-full border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
          />
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <span className="text-xs text-gray-500 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#C69A76]" />
            Categoria:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-[#FAF7F8] border border-[#E9D9CD] rounded-full px-3 py-1.5 focus:outline-none focus:border-[#9C5B6F] font-semibold"
          >
            <option value="ALL">Todas as Categorias</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-[#39313A]/70 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">SKU / EAN</th>
                <th className="py-3 px-4">Preço & Margem</th>
                <th className="py-3 px-4">Estoque Embutido</th>
                <th className="py-3 px-4">Frete do Produto</th>
                <th className="py-3 px-4">Redes & Link Embutido</th>
                <th className="py-3 px-4">Lote / Validade</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9D9CD]/50">
              {filtered.map((product) => {
                const available = product.physicalStock;
                const effectivePrice = product.promoPrice || product.salePrice;
                const margin =
                  effectivePrice > 0
                    ? (((effectivePrice - product.costPrice) / effectivePrice) * 100).toFixed(1)
                    : "0.0";
                const isLow = available <= product.minStock;
                const isFreeShip = product.freeShipping || product.shippingValue === 0;

                return (
                  <tr key={product.id} className="hover:bg-[#FAF7F8]/60 transition-colors">
                    
                    {/* Name & Photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#E9D9CD]">
                          <Image 
                            src={product.images[0] || '/logo.jpg'} 
                            alt={product.name} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#39313A] line-clamp-1">{product.name}</div>
                          <div className="text-[10px] text-gray-500">
                            {product.category}
                            {hasVariations(product.category) && product.variations && product.variations.length > 0
                              ? ` • ${product.variations.length} ${product.variations.length === 1 ? 'tom' : 'tons'}`
                              : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU & EAN */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#7A3F51]">{product.sku}</div>
                      <div className="text-[10px] font-mono text-gray-400">{product.ean}</div>
                    </td>

                    {/* Price & Margin */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#39313A]">
                        {formatCurrency(product.promoPrice || product.salePrice)}
                      </div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Margem: {margin}%
                      </span>
                    </td>

                    {/* Stock Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {available} un. disp.
                        </span>
                        {isLow && (
                          <span title="Estoque abaixo do mínimo!" className="text-rose-500">
                            <AlertTriangle className="w-3.5 h-3.5 inline" />
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-gray-400">
                        Disponível: {product.physicalStock} un | Mín: {product.minStock} un
                      </div>
                    </td>

                    {/* Shipping Value */}
                    <td className="py-3 px-4">
                      {isFreeShip ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Frete Grátis
                        </span>
                      ) : (
                        <span className="font-bold text-[#7A3F51]">
                          {formatCurrency(product.shippingValue || 12.90)}
                        </span>
                      )}
                    </td>

                    {/* Social Links & Shareable Link */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleCopyEmbedLink(product.sku)}
                          className="px-2 py-1 rounded-lg bg-[#FAF0F4] hover:bg-[#F5DDE5] text-[#7A3F51] border border-[#E9D9CD] text-[10px] font-bold flex items-center gap-1 transition-all"
                          title="Copiar link para Instagram/WhatsApp com estoque e frete embutido"
                        >
                          <Copy className="w-3 h-3 text-[#9C5B6F]" />
                          <span>{copiedSku === product.sku ? "Copiado!" : "Copiar Link Rede"}</span>
                        </button>
                        <Link
                          href={`/p/${product.sku}`}
                          target="_blank"
                          className="p-1 rounded-lg bg-white border border-[#E9D9CD] text-[#9C5B6F] hover:bg-[#FAF7F8]"
                          title="Visualizar Página de Rede Social (Estoque + Frete)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>

                    {/* Batch & Expiry */}
                    <td className="py-3 px-4 text-gray-600">
                      <div>Lote: <strong className="text-[#39313A]">{product.batch}</strong></div>
                      <div className="text-[10px] text-gray-500">{formatDateShort(product.expiryDate)}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-gray-500 hover:text-[#9C5B6F] hover:bg-[#F5DDE5] rounded-lg transition-colors"
                          title="Editar Produto, Frete e Redes"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir "${product.name}"?`)) {
                              onDeleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full relative shadow-2xl border border-[#E9D9CD] max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header Fixo do Modal */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#E9D9CD] bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C69A76]" />
                <h3 className="font-display text-xl font-bold text-[#39313A]">
                  {editingProduct ? "Editar Produto" : "Novo Cadastro de Produto"}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer transition-colors"
                title="Fechar formulário"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Rolável do Formulário */}
            <form id="product-modal-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs modal-content-scroll">
              
              {/* Row 1: Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#39313A] mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Base Líquida Velvet Matte HD"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Marca</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
              </div>

              {/* Row 2: SKU, EAN, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">SKU Oficial *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Código EAN-13 (Barras)</label>
                  <input
                    type="text"
                    value={formEan}
                    onChange={(e) => setFormEan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Pricing, Shipping & Margins */}
              <div className="bg-[#FAF7F8] p-4 rounded-2xl border border-[#E9D9CD] grid grid-cols-1 sm:grid-cols-5 gap-4 items-start">
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Preço Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Preço Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Promoção (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="99"
                      placeholder="Ex: 15"
                      value={formDiscountPercent !== undefined ? formDiscountPercent : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setFormDiscountPercent(undefined);
                        } else {
                          const num = Math.min(99, Math.max(0, parseInt(val, 10) || 0));
                          setFormDiscountPercent(num);
                        }
                      }}
                      className="w-full px-3 py-2 pr-7 rounded-xl bg-white border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  {livePromoPrice !== undefined && (
                    <div className="mt-1 text-[10px] font-bold text-emerald-700 truncate">
                      Valor Final: {formatCurrency(livePromoPrice)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-[#7A3F51] mb-1 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#C69A76]" />
                    <span>Valor Frete (R$)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={formFreeShipping}
                    value={formFreeShipping ? 0 : formShippingValue}
                    onChange={(e) => setFormShippingValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] disabled:opacity-50"
                  />
                  <label className="inline-flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFreeShipping}
                      onChange={(e) => setFormFreeShipping(e.target.checked)}
                      className="rounded text-[#9C5B6F]"
                    />
                    <span className="text-[10px] font-bold text-emerald-700">Frete Grátis</span>
                  </label>
                </div>
                <div className="text-center sm:text-right pt-1">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Margem Bruta</div>
                  <div className="text-xl font-extrabold text-emerald-700">{liveMargin}%</div>
                  <div className="text-[10px] text-gray-400">
                    Lucro: {formatCurrency(effectiveSellingPrice - formCostPrice)}/un
                  </div>
                </div>
              </div>

              {/* Row 4: Stocks, Batch and Expiry (ANVISA Compliance) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Estoque Físico Central</label>
                  <input
                    type="number"
                    value={formPhysicalStock}
                    onChange={(e) => setFormPhysicalStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Estoque Segurança (Mín)</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Lote de Fabricação</label>
                  <input
                    type="text"
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#39313A] mb-1">Data de Validade (ANVISA)</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                  />
                </div>
              </div>

              {/* Row 5: Variations (Tons & Swatches) - Oculto para Kits de Presente, Pincéis & Acessórios, Skincare e Box Fechado */}
              {hasVariations(formCategory) && (
                <div className="bg-[#FAF7F8] p-4 rounded-2xl border border-[#E9D9CD] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#39313A]">Variações & Tonalidades de Cor</span>
                      <p className="text-[10px] text-gray-500">Defina o nome da cor, estoque da variação e a cor hexadecimal para a vitrine.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="px-3 py-1 bg-white border border-[#E9D9CD] text-[#7A3F51] rounded-lg font-bold hover:bg-[#F5DDE5]"
                    >
                      + Adicionar Tom
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formVariations.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E9D9CD]">
                        <input
                          type="color"
                          value={v.colorHex}
                          onChange={(e) => {
                            setFormVariations(prev =>
                              prev.map((item, idx) => idx === i ? { ...item, colorHex: e.target.value } : item)
                            );
                          }}
                          className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                          title="Escolher Cor"
                        />
                        <input
                          type="text"
                          placeholder="Nome da Tonalidade (Ex: Tom 01)"
                          value={v.name}
                          onChange={(e) => {
                            setFormVariations(prev =>
                              prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item)
                            );
                          }}
                          className="flex-1 px-2 py-1 bg-[#FAF7F8] border border-[#E9D9CD] rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          placeholder="SKU Variação"
                          value={v.sku}
                          onChange={(e) => {
                            setFormVariations(prev =>
                              prev.map((item, idx) => idx === i ? { ...item, sku: e.target.value } : item)
                            );
                          }}
                          className="w-28 px-2 py-1 bg-[#FAF7F8] border border-[#E9D9CD] rounded-lg text-xs font-mono"
                        />
                        <input
                          type="number"
                          placeholder="Estoque"
                          value={v.stock}
                          onChange={(e) => {
                            const nextStock = parseInt(e.target.value, 10) || 0;
                            setFormVariations(prev =>
                              prev.map((item, idx) => idx === i ? { ...item, stock: nextStock } : item)
                            );
                          }}
                          className="w-20 px-2 py-1 bg-[#FAF7F8] border border-[#E9D9CD] rounded-lg text-xs font-bold"
                          title="Estoque desta variação"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(v.id)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 6: Local Computer Image Picker & Description */}
              <div>
                <label className="block font-bold text-[#39313A] mb-1.5">
                  Imagem Principal do Produto
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#FAF7F8] border-2 border-dashed border-[#E9D9CD] hover:border-[#9C5B6F] transition-colors">
                  {/* Image Preview Box */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white border border-[#E9D9CD] shrink-0 shadow-sm">
                    {formImageUrl ? (
                      <Image
                        src={formImageUrl}
                        alt="Pré-visualização do produto"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Computer File Picker Controls */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="font-bold text-[#39313A] text-xs">
                      {selectedFileName
                        ? `Arquivo selecionado: ${selectedFileName}`
                        : "Selecione uma foto do produto diretamente do seu computador"}
                    </div>
                    <p className="text-[11px] text-[#39313A]/60">
                      Formatos aceitos: JPG, PNG, WEBP. A imagem é ajustada automaticamente para a vitrine.
                    </p>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        id="product-image-upload"
                        onChange={handleImageFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white text-xs font-bold cursor-pointer shadow-md transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Escolher Imagem do Computador</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#39313A] mb-1">Descrição Comercial & Ativos</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Fórmulas enriquecidas com ácido hialurônico, acabamento matte natural..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                />
              </div>
            </form>

            {/* Rodapé Fixo do Modal que segue o template da caixa */}
            <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-[#E9D9CD] bg-[#FAF7F8] shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full border border-[#E9D9CD] text-gray-600 font-bold hover:bg-white transition-colors cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="product-modal-form"
                className="px-6 py-2.5 rounded-full bg-[#7A3F51] hover:bg-[#5E303E] text-white font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all text-xs"
              >
                <Check className="w-4 h-4" />
                <span>{editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
