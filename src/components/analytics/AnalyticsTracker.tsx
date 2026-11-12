'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent, resolveTrafficSource } from '@/lib/analytics/track';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    // Não monitora o painel de administração
    if (pathname.startsWith('/admin')) return;

    // Inicializa a classificação da origem da sessão logo no primeiro carregamento
    resolveTrafficSource(searchParams);

    // Se for página de produto, extrai o SKU da URL
    let productSku: string | undefined = undefined;
    if (pathname.startsWith('/p/')) {
      const parts = pathname.split('/');
      if (parts[2]) {
        productSku = decodeURIComponent(parts[2]);
      }
    }

    // Dispara o pageview
    trackEvent('pageview', {
      product_sku: productSku,
    });
  }, [pathname, searchParams]);

  return null;
}
