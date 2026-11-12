'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkCode: string;
  linkName: string;
  fullUrl: string;
}

export function QrCodeModal({
  isOpen,
  onClose,
  linkCode,
  linkName,
  fullUrl,
}: QrCodeModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && fullUrl) {
      QRCode.toDataURL(fullUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#7A3F51',
          light: '#FFFFFF',
        },
      })
        .then((url) => setDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code:', err));
    }
  }, [isOpen, fullUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qrcode-${linkCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl border border-[#E9D9CD] shadow-2xl p-6 relative text-center space-y-4">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#7A3F51]/10 text-[#7A3F51] flex items-center justify-center mx-auto shadow-sm">
          <QrIcon className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-display text-lg font-bold text-[#39313A]">
            QR Code para Divulgação
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{linkName}</p>
          <p className="text-[11px] font-mono text-[#7A3F51] bg-[#FAF0F4] px-2 py-1 rounded-md mt-1.5 inline-block">
            {fullUrl}
          </p>
        </div>

        <div className="p-3 bg-white border-2 border-dashed border-[#E9D9CD] rounded-2xl inline-block shadow-sm">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code ${linkName}`}
              className="w-56 h-56 mx-auto object-contain rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-stone-400">
              Gerando QR Code...
            </div>
          )}
        </div>

        <p className="text-[11px] text-stone-500">
          Ideal para imprimir em <strong>etiquetas de envio</strong>, <strong>cartões de agradecimento</strong> e <strong>embalagens</strong>.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E9D9CD] hover:border-[#7A3F51] text-xs font-semibold text-[#39313A] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#7A3F51]" />}
            <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#7A3F51] hover:bg-[#683343] text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Imagem</span>
          </button>
        </div>
      </div>
    </div>
  );
}
