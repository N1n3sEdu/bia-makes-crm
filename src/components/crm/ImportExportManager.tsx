"use client";

import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  FileCheck 
} from "lucide-react";
import { Product, ProductCategory } from "@/types";

interface ImportExportManagerProps {
  products: Product[];
  onImportProducts: (imported: Product[]) => void;
}

function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function ImportExportManager({
  products,
  onImportProducts,
}: ImportExportManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Product[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const headers = "Nome,SKU,EAN,Categoria,Marca,PrecoCusto,PrecoVenda,EstoqueFisico,EstoqueMinimo,Lote,Validade,Descricao\n";
    const sampleRows = [
      '"Base Líquida Matte HD Porcelana","BM-BASE-P01","7891234567101","Rosto","Bia Makes",28.00,79.90,50,15,"LT2026-X1","2027-12-31","Base de alta cobertura com acabamento aveludado."',
      '"Gloss Labial Rosé Gold Glow","BM-GLOSS-01","7891234567102","Lábios","Bia Makes",12.50,39.90,80,20,"LT2026-X2","2028-01-15","Brilho labial com efeito espelhado e ácido hialurônico."',
      '"Máscara de Cílios Volume Máximo","BM-MASK-01","7891234567103","Olhos","Bia Makes",18.00,49.90,40,10,"LT2026-X3","2027-06-30","Resistente à água com pincel curvado aplicador."'
    ].join("\n");

    downloadCsvFile("modelo_importacao_bia_makes.csv", headers + sampleRows);
  };

  // Export current catalog to CSV
  const handleExportCurrent = () => {
    const headers = "Nome,SKU,EAN,Categoria,Marca,PrecoCusto,PrecoVenda,EstoqueDisponivel,Lote,Validade\n";
    const rows = products.map(p => {
      return `"${p.name.replace(/"/g, '""')}","${p.sku}","${p.ean}","${p.category}","${p.brand}",${p.costPrice},${p.salePrice},${p.physicalStock},"${p.batch}","${p.expiryDate}"`;
    }).join("\n");

    downloadCsvFile(`estoque_bia_makes_${new Date().toISOString().slice(0, 10)}.csv`, headers + rows);
  };

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        alert("O arquivo parece vazio ou contém apenas o cabeçalho.");
        return;
      }

      // Parse rows as preview
      const parsedRows: Product[] = lines.slice(1).map((line, idx) => {
        const parts = parseCsvLine(line);
        const sku = parts[1] || `SKU-${idx}`;
        const physicalStock = parseInt(parts[7], 10) || 10;
        return {
          id: `imp-${Date.now()}-${idx}`,
          name: parts[0] || "Sem Nome",
          sku,
          ean: parts[2] || "7890000000000",
          category: (parts[3] as ProductCategory) || "Rosto",
          brand: parts[4] || "Bia Makes",
          costPrice: parseFloat(parts[5]) || 20.0,
          salePrice: parseFloat(parts[6]) || 59.90,
          shippingValue: 0,
          freeShipping: false,
          physicalStock,
          reservedStock: 0,
          minStock: parseInt(parts[8], 10) || 5,
          batch: parts[9] || "LT-IMP",
          expiryDate: parts[10] || "2027-12-31",
          description: parts[11] || "Produto importado via planilha.",
          images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"],
          variations: [{ id: `v-${Date.now()}-${idx}`, name: "Padrão", colorHex: "#E9D9CD", sku, stock: physicalStock }],
          socialLinks: { embedStockAndShipping: true },
          rating: 5.0,
          reviewsCount: 0
        };
      });

      setPreviewData(parsedRows);
    };
    reader.readAsText(uploaded);
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (previewData.length === 0) return;
    onImportProducts(previewData);
    setImportStatus(`Sucesso! ${previewData.length} produtos importados com êxito para o banco de dados.`);
    setPreviewData([]);
    setFile(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h2 className="font-serif text-2xl font-medium text-[#39313A]">
          Importação & Exportação de Planilhas
        </h2>
        <p className="text-xs text-[#39313A]/70 mt-0.5">
          Carga em lote de cosméticos via CSV e exportação de relatórios de estoque para conferência contábil.
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Template & Export Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#C69A76]" />
            <h3 className="font-serif text-lg font-medium text-[#39313A]">
              Modelos & Exportação
            </h3>
          </div>

          <p className="text-xs text-[#39313A]/70 leading-relaxed">
            Baixe a planilha modelo oficial com os campos obrigatórios da ANVISA (Lote, Validade, SKU, EAN) ou exporte o inventário atual da loja.
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleDownloadTemplate}
              className="w-full py-2.5 rounded-full bg-[#FAF0F4] hover:bg-[#F5DDE5] text-[#7A3F51] border border-[#E9D9CD] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#C69A76]" />
              <span>Baixar Modelo de Planilha CSV (Cosméticos)</span>
            </button>

            <button
              onClick={handleExportCurrent}
              className="w-full py-2.5 rounded-full bg-white hover:bg-gray-50 text-[#39313A] border border-[#E9D9CD] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-[#9C5B6F]" />
              <span>Exportar Estoque Atual ({products.length} itens)</span>
            </button>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#E9D9CD] shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#9C5B6F]" />
            <h3 className="font-serif text-lg font-medium text-[#39313A]">
              Upload de Planilha CSV
            </h3>
          </div>

          <p className="text-xs text-[#39313A]/70 leading-relaxed">
            Selecione o arquivo CSV preenchido no padrão Bia Makes para validação e gravação automática.
          </p>

          <div className="border-2 border-dashed border-[#E9D9CD] hover:border-[#9C5B6F] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#FAF7F8]">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="hidden" 
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
              <Upload className="w-8 h-8 text-[#C69A76] mx-auto" />
              <div className="text-xs font-bold text-[#39313A]">
                {file ? file.name : "Clique para selecionar o arquivo CSV"}
              </div>
              <div className="text-[10px] text-gray-400">
                Formato suportado: .csv (separado por vírgula)
              </div>
            </label>
          </div>

          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>

      </div>

      {/* PREVIEW TABLE BEFORE SAVING */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E9D9CD] p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#39313A]">
                Pré-visualização dos Dados ({previewData.length} itens identificados)
              </h3>
              <p className="text-xs text-gray-500">
                Confira os campos antes de confirmar a gravação definitiva no banco de dados.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>Confirmar & Gravar no Banco</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F8] border-b border-[#E9D9CD] text-[10px] uppercase text-[#39313A]/70">
                <tr>
                  <th className="py-2.5 px-3">Nome</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Custo</th>
                  <th className="py-2.5 px-3">Venda</th>
                  <th className="py-2.5 px-3">Estoque</th>
                  <th className="py-2.5 px-3">Lote / Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9D9CD]/40">
                {previewData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F8]/50">
                    <td className="py-2 px-3 font-semibold text-[#39313A]">{item.name}</td>
                    <td className="py-2 px-3 font-mono text-[#7A3F51]">{item.sku}</td>
                    <td className="py-2 px-3">{item.category}</td>
                    <td className="py-2 px-3">R$ {item.costPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 font-bold">R$ {item.salePrice.toFixed(2)}</td>
                    <td className="py-2 px-3 font-bold text-emerald-700">{item.physicalStock} un</td>
                    <td className="py-2 px-3 text-gray-500">{item.batch} ({item.expiryDate})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
