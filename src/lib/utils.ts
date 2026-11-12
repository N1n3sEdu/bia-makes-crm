import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Order, ShippingCarrierId, ShippingQuoteOption } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  const safeVal = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeVal);
}

export function formatDate(dateString: string): string {
  if (!dateString || dateString === '-') return 'Nunca sincronizado';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  if (!dateString || dateString === '-') return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.slice(0, 2)}/${month}/${year}`;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getDaysUntil(dateString: string): number {
  if (!dateString || dateString === '-') return 999;
  const target = new Date(dateString);
  if (isNaN(target.getTime())) return 999;
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export interface CepInfo {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  estimatedDaysLabel: string;
  pacDaysLabel: string;
  sedexDaysLabel: string;
  expressDaysLabel: string;
  source: 'viacep' | 'brasilapi' | 'fallback';
}

export interface BrazilState {
  uf: string;
  name: string;
}

/**
 * Lista oficial das 27 Unidades Federativas do Brasil (ordenadas por sigla).
 */
export const BRAZIL_STATES: BrazilState[] = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'TO', name: 'Tocantins' },
];

const VALID_BRAZIL_DDDS = new Set<number>([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

const OBVIOUS_MOBILE_SEQUENCES = new Set<string>([
  '912345678',
  '987654321',
  '912341234',
  '901234567',
  '998765432',
]);

/**
 * Valida número de celular/WhatsApp brasileiro seguindo regras oficiais da ANATEL:
 * 11 dígitos, um dos 67 DDDs válidos, 9º dígito obrigatório, 4º dígito != 0,
 * além de bloqueio anti-repetição e sequências óbvias de teste.
 */
export function validateBrazilianMobilePhone(phone: string): {
  valid: boolean;
  error?: string;
} {
  const clean = phone.replace(/\D/g, '');

  if (clean.length !== 11) {
    return {
      valid: false,
      error: 'Informe um celular válido com DDD e 11 dígitos. Ex: (11) 98765-4321.',
    };
  }

  if (/^(\d)\1{10}$/.test(clean)) {
    return {
      valid: false,
      error: 'Número inválido: evite dígitos repetidos como (11) 11111-1111.',
    };
  }

  const ddd = Number(clean.slice(0, 2));
  if (!VALID_BRAZIL_DDDS.has(ddd)) {
    return {
      valid: false,
      error: `DDD (${clean.slice(0, 2)}) inválido no Brasil.`,
    };
  }

  const subscriber9 = clean.slice(2);
  const subscriberLast8 = clean.slice(3);

  if (/^(\d)\1{8}$/.test(subscriber9) || /^(\d)\1{7}$/.test(subscriberLast8)) {
    return {
      valid: false,
      error: 'Número inválido: evite dígitos repetidos como (11) 11111-1111 ou (11) 99999-9999.',
    };
  }

  if (clean[2] !== '9') {
    return {
      valid: false,
      error: 'O celular deve começar com o dígito 9 após o DDD.',
    };
  }

  if (clean[3] === '0') {
    return {
      valid: false,
      error: 'Número de celular inválido (o dígito após o 9 não pode ser 0).',
    };
  }

  if (OBVIOUS_MOBILE_SEQUENCES.has(subscriber9)) {
    return {
      valid: false,
      error: 'Número inválido: evite sequências óbvias de teste.',
    };
  }

  return { valid: true };
}

const citiesCache = new Map<string, string[]>();

const FALLBACK_CITIES_BY_UF: Record<string, string[]> = {
  AC: ['Cruzeiro do Sul', 'Feijó', 'Rio Branco', 'Sena Madureira', 'Tarauacá'],
  AL: ['Arapiraca', 'Maceió', 'Palmeira dos Índios', 'Penedo', 'Rio Largo'],
  AM: ['Coari', 'Itacoatiara', 'Manacapuru', 'Manaus', 'Parintins', 'Tefé'],
  AP: ['Laranjal do Jari', 'Macapá', 'Mazagão', 'Oiapoque', 'Santana'],
  BA: ['Barreiras', 'Camaçari', 'Feira de Santana', 'Ilhéus', 'Itabuna', 'Juazeiro', 'Lauro de Freitas', 'Porto Seguro', 'Salvador', 'Vitória da Conquista'],
  CE: ['Caucaia', 'Crato', 'Fortaleza', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'],
  DF: ['Brasília'],
  ES: ['Cachoeiro de Itapemirim', 'Cariacica', 'Colatina', 'Linhares', 'Serra', 'Vila Velha', 'Vitória'],
  GO: ['Anápolis', 'Aparecida de Goiânia', 'Goiânia', 'Luziânia', 'Rio Verde', 'Valparaíso de Goiás'],
  MA: ['Açailândia', 'Bacabal', 'Caxias', 'Imperatriz', 'São José de Ribamar', 'São Luís', 'Timon'],
  MG: ['Belo Horizonte', 'Betim', 'Contagem', 'Divinópolis', 'Governador Valadares', 'Ipatinga', 'Juiz de Fora', 'Montes Claros', 'Poços de Caldas', 'Ribeirão das Neves', 'Sete Lagoas', 'Uberaba', 'Uberlândia'],
  MS: ['Campo Grande', 'Corumbá', 'Dourados', 'Ponta Porã', 'Três Lagoas'],
  MT: ['Barra do Garças', 'Cáceres', 'Cuiabá', 'Rondonópolis', 'Sinop', 'Sorriso', 'Várzea Grande'],
  PA: ['Ananindeua', 'Belém', 'Castanhal', 'Marabá', 'Parauapebas', 'Santarém'],
  PB: ['Bayeux', 'Cabedelo', 'Campina Grande', 'João Pessoa', 'Patos', 'Santa Rita'],
  PE: ['Cabo de Santo Agostinho', 'Caruaru', 'Garanhuns', 'Jaboatão dos Guararapes', 'Olinda', 'Paulista', 'Petrolina', 'Recife'],
  PI: ['Floriano', 'Parnaíba', 'Picos', 'Piripiri', 'Teresina'],
  PR: ['Cascavel', 'Colombo', 'Curitiba', 'Foz do Iguaçu', 'Guarapuava', 'Londrina', 'Maringá', 'Pinhais', 'Ponta Grossa', 'São José dos Pinhais'],
  RJ: ['Belford Roxo', 'Cabo Frio', 'Campos dos Goytacazes', 'Duque de Caxias', 'Macaé', 'Niterói', 'Nova Iguaçu', 'Petrópolis', 'Rio de Janeiro', 'São Gonçalo', 'São João de Meriti', 'Volta Redonda'],
  RN: ['Caicó', 'Macaíba', 'Mossoró', 'Natal', 'Parnamirim', 'São Gonçalo do Amarante'],
  RO: ['Ariquemes', 'Cacoal', 'Ji-Paraná', 'Porto Velho', 'Vilhena'],
  RR: ['Alto Alegre', 'Boa Vista', 'Caracaraí', 'Mucajaí', 'Rorainópolis'],
  RS: ['Canoas', 'Caxias do Sul', 'Gravataí', 'Novo Hamburgo', 'Passo Fundo', 'Pelotas', 'Porto Alegre', 'Rio Grande', 'Santa Maria', 'São Leopoldo', 'Viamão'],
  SC: ['Blumenau', 'Chapecó', 'Criciúma', 'Florianópolis', 'Itajaí', 'Jaraguá do Sul', 'Joinville', 'Lages', 'Palhoça', 'São José'],
  SE: ['Aracaju', 'Estância', 'Itabaiana', 'Lagarto', 'Nossa Senhora do Socorro', 'São Cristóvão'],
  SP: ['Barueri', 'Bauru', 'Campinas', 'Diadema', 'Franca', 'Guarulhos', 'Jundiaí', 'Mauá', 'Mogi das Cruzes', 'Osasco', 'Piracicaba', 'Praia Grande', 'Ribeirão Preto', 'Santo André', 'Santos', 'São Bernardo do Campo', 'São José do Rio Preto', 'São José dos Campos', 'São Paulo', 'Sorocaba', 'Taboão da Serra'],
  TO: ['Araguaína', 'Gurupi', 'Palmas', 'Paraíso do Tocantins', 'Porto Nacional'],
};

/**
 * Busca todos os municípios oficiais de uma UF via API do IBGE com cache em memória
 * e dicionário offline de fallback para os 27 estados.
 */
export async function fetchCitiesByState(uf: string): Promise<string[]> {
  const upperUf = uf.trim().toUpperCase();
  if (!upperUf) return [];

  const cached = citiesCache.get(upperUf);
  if (cached && cached.length > 0) {
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${upperUf}/municipios?orderBy=nome`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      return [...(FALLBACK_CITIES_BY_UF[upperUf] || [])];
    }

    const data: Array<{ nome?: string }> = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return [...(FALLBACK_CITIES_BY_UF[upperUf] || [])];
    }

    const cities = Array.from(
      new Set(
        data
          .map((item) => (typeof item?.nome === 'string' ? item.nome.trim() : ''))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    if (cities.length > 0) {
      citiesCache.set(upperUf, cities);
      return cities;
    }

    return [...(FALLBACK_CITIES_BY_UF[upperUf] || [])];
  } catch {
    return [...(FALLBACK_CITIES_BY_UF[upperUf] || [])];
  } finally {
    clearTimeout(timeoutId);
  }
}

export function formatCepMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function getDeliveryLabelsByUf(uf: string) {
  const upperUf = uf.toUpperCase();
  if (upperUf === 'SP') {
    return {
      estimatedDaysLabel: '1 a 3 dias úteis',
      pacDaysLabel: '2 a 3 dias úteis',
      sedexDaysLabel: '1 a 2 dias úteis',
      expressDaysLabel: 'Hoje / até 24h',
    };
  }
  if (['RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(upperUf)) {
    return {
      estimatedDaysLabel: '2 a 5 dias úteis',
      pacDaysLabel: '3 a 5 dias úteis',
      sedexDaysLabel: '1 a 3 dias úteis',
      expressDaysLabel: '1 a 2 dias úteis',
    };
  }
  return {
    estimatedDaysLabel: '4 a 8 dias úteis',
    pacDaysLabel: '5 a 8 dias úteis',
    sedexDaysLabel: '2 a 4 dias úteis',
    expressDaysLabel: '2 a 3 dias úteis',
  };
}

function buildOfflineFallbackCep(cleanCep: string): CepInfo {
  const firstDigit = cleanCep[0];
  let localidade = 'São Paulo';
  let uf = 'SP';
  let bairro = 'Centro';

  if (firstDigit === '0' || firstDigit === '1') {
    localidade = firstDigit === '0' ? 'São Paulo' : 'Campinas';
    uf = 'SP';
    bairro = firstDigit === '0' ? 'Bela Vista' : 'Centro';
  } else if (firstDigit === '2') {
    localidade = 'Rio de Janeiro';
    uf = 'RJ';
  } else if (firstDigit === '3') {
    localidade = 'Belo Horizonte';
    uf = 'MG';
  } else if (firstDigit === '4') {
    localidade = 'Salvador';
    uf = 'BA';
  } else if (firstDigit === '5') {
    localidade = 'Recife';
    uf = 'PE';
  } else if (firstDigit === '6') {
    localidade = 'Fortaleza';
    uf = 'CE';
  } else if (firstDigit === '7') {
    localidade = 'Brasília';
    uf = 'DF';
  } else if (firstDigit === '8') {
    localidade = 'Curitiba';
    uf = 'PR';
  } else if (firstDigit === '9') {
    localidade = 'Porto Alegre';
    uf = 'RS';
  }

  return {
    cep: formatCepMask(cleanCep),
    logradouro: '',
    bairro,
    localidade,
    uf,
    ...getDeliveryLabelsByUf(uf),
    source: 'fallback',
  };
}

/**
 * Consulta o endereço real via ViaCEP com fallback automático para BrasilAPI
 * e bloqueio imediato de CEPs inválidos/repetidos.
 */
export async function fetchCepInfo(cep: string): Promise<CepInfo> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    throw new Error('Digite um CEP válido com 8 dígitos (Ex: 01310-100).');
  }

  if (/^(\d)\1{7}$/.test(cleanCep)) {
    throw new Error('CEP inválido (dígitos repetidos). Informe um CEP real.');
  }

  const viaCepController = new AbortController();
  const viaCepTimeout = setTimeout(() => viaCepController.abort(), 3500);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: viaCepController.signal,
    });

    if (response.ok) {
      const data: {
        cep?: string;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
        erro?: boolean | string;
      } = await response.json();

      if (data.erro === true || data.erro === 'true') {
        throw new Error('CEP não encontrado nos Correios.');
      }

      if (data.uf && data.localidade) {
        const uf = data.uf.toUpperCase();
        return {
          cep: data.cep || formatCepMask(cleanCep),
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade,
          uf,
          ...getDeliveryLabelsByUf(uf),
          source: 'viacep',
        };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('CEP não encontrado')) {
      throw error;
    }
  } finally {
    clearTimeout(viaCepTimeout);
  }

  // Fallback automático para BrasilAPI v2 se ViaCEP falhar ou der timeout
  const brasilApiController = new AbortController();
  const brasilApiTimeout = setTimeout(() => brasilApiController.abort(), 3500);

  try {
    const brasilRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, {
      signal: brasilApiController.signal,
    });

    if (brasilRes.status === 404) {
      throw new Error('CEP não encontrado nos Correios.');
    }

    if (brasilRes.ok) {
      const data: {
        cep?: string;
        state?: string;
        city?: string;
        neighborhood?: string;
        street?: string;
      } = await brasilRes.json();

      if (data.state && data.city) {
        const uf = data.state.toUpperCase();
        return {
          cep: data.cep ? formatCepMask(data.cep) : formatCepMask(cleanCep),
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          localidade: data.city,
          uf,
          ...getDeliveryLabelsByUf(uf),
          source: 'brasilapi',
        };
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('CEP não encontrado')) {
      throw error;
    }
  } finally {
    clearTimeout(brasilApiTimeout);
  }

  // Em falhas totais de rede/offline, retorna estimativa resiliente
  return buildOfflineFallbackCep(cleanCep);
}

interface CarrierPricingRule {
  carrierId: ShippingCarrierId;
  carrierName: string;
  serviceLabel: string;
  baseCost: number;
  extraPerItem: number;
  isEconomic: boolean;
  deliveryDays: string;
}

/**
 * Motor determinístico de cotação de transportadoras por UF/Região do CEP
 * (origem: São Paulo/SP) + peso estimado por quantidade de itens.
 * Regra de negócio: `companyCost` NUNCA zera (sempre reflete o custo real pago à transportadora);
 * `customerPrice` zera apenas nas modalidades econômicas quando o pedido atinge >= R$ 150 ou tem frete grátis.
 */
export function calculateCarrierQuotesByCep(
  cepInfo: CepInfo,
  itemsCount: number,
  cartSubtotal: number,
  hasProductFreeShipping: boolean
): ShippingQuoteOption[] {
  const upperUf = (cepInfo.uf || 'SP').toUpperCase();
  const extraItems = Math.max(0, Math.floor(itemsCount) - 1);
  const qualifiesForFreeEco = cartSubtotal >= 150 || hasProductFreeShipping;

  let rules: CarrierPricingRule[];

  if (upperUf === 'SP') {
    rules = [
      {
        carrierId: 'JADLOG_PACKAGE',
        carrierName: 'Jadlog Package',
        serviceLabel: 'Econômico',
        baseCost: 11.9,
        extraPerItem: 1.2,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '2 a 3 dias úteis',
      },
      {
        carrierId: 'CORREIOS_PAC',
        carrierName: 'Correios PAC',
        serviceLabel: 'Econômico',
        baseCost: 13.5,
        extraPerItem: 1.4,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '2 a 3 dias úteis',
      },
      {
        carrierId: 'LOGGI_EXPRESS',
        carrierName: 'Loggi Express',
        serviceLabel: 'Expresso',
        baseCost: 16.9,
        extraPerItem: 1.5,
        isEconomic: false,
        deliveryDays: cepInfo.expressDaysLabel || 'Hoje / até 24h',
      },
      {
        carrierId: 'CORREIOS_SEDEX',
        carrierName: 'Correios SEDEX',
        serviceLabel: 'Rápido',
        baseCost: 18.9,
        extraPerItem: 1.8,
        isEconomic: false,
        deliveryDays: cepInfo.sedexDaysLabel || '1 a 2 dias úteis',
      },
    ];
  } else if (['RJ', 'MG', 'ES', 'PR', 'SC', 'RS'].includes(upperUf)) {
    rules = [
      {
        carrierId: 'JADLOG_PACKAGE',
        carrierName: 'Jadlog Package',
        serviceLabel: 'Econômico',
        baseCost: 16.9,
        extraPerItem: 1.8,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '3 a 5 dias úteis',
      },
      {
        carrierId: 'CORREIOS_PAC',
        carrierName: 'Correios PAC',
        serviceLabel: 'Econômico',
        baseCost: 18.9,
        extraPerItem: 2.0,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '3 a 5 dias úteis',
      },
      {
        carrierId: 'LOGGI_EXPRESS',
        carrierName: 'Loggi Express',
        serviceLabel: 'Expresso',
        baseCost: 23.9,
        extraPerItem: 2.2,
        isEconomic: false,
        deliveryDays: cepInfo.expressDaysLabel || '1 a 2 dias úteis',
      },
      {
        carrierId: 'CORREIOS_SEDEX',
        carrierName: 'Correios SEDEX',
        serviceLabel: 'Rápido',
        baseCost: 27.9,
        extraPerItem: 2.5,
        isEconomic: false,
        deliveryDays: cepInfo.sedexDaysLabel || '1 a 3 dias úteis',
      },
    ];
  } else if (
    ['DF', 'GO', 'MS', 'MT', 'BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'MA', 'PI'].includes(upperUf)
  ) {
    rules = [
      {
        carrierId: 'JADLOG_PACKAGE',
        carrierName: 'Jadlog Package',
        serviceLabel: 'Econômico',
        baseCost: 22.9,
        extraPerItem: 2.2,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '5 a 8 dias úteis',
      },
      {
        carrierId: 'CORREIOS_PAC',
        carrierName: 'Correios PAC',
        serviceLabel: 'Econômico',
        baseCost: 24.9,
        extraPerItem: 2.5,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '5 a 8 dias úteis',
      },
      {
        carrierId: 'LOGGI_EXPRESS',
        carrierName: 'Loggi Express',
        serviceLabel: 'Expresso',
        baseCost: 32.9,
        extraPerItem: 2.9,
        isEconomic: false,
        deliveryDays: cepInfo.expressDaysLabel || '2 a 3 dias úteis',
      },
      {
        carrierId: 'CORREIOS_SEDEX',
        carrierName: 'Correios SEDEX',
        serviceLabel: 'Rápido',
        baseCost: 38.9,
        extraPerItem: 3.2,
        isEconomic: false,
        deliveryDays: cepInfo.sedexDaysLabel || '2 a 4 dias úteis',
      },
    ];
  } else {
    // Norte (AM, PA, AC, RO, RR, AP, TO) e demais UFs
    rules = [
      {
        carrierId: 'JADLOG_PACKAGE',
        carrierName: 'Jadlog Package',
        serviceLabel: 'Econômico',
        baseCost: 28.9,
        extraPerItem: 2.8,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '6 a 10 dias úteis',
      },
      {
        carrierId: 'CORREIOS_PAC',
        carrierName: 'Correios PAC',
        serviceLabel: 'Econômico',
        baseCost: 31.9,
        extraPerItem: 3.0,
        isEconomic: true,
        deliveryDays: cepInfo.pacDaysLabel || '6 a 10 dias úteis',
      },
      {
        carrierId: 'CORREIOS_SEDEX',
        carrierName: 'Correios SEDEX',
        serviceLabel: 'Rápido',
        baseCost: 49.9,
        extraPerItem: 4.0,
        isEconomic: false,
        deliveryDays: cepInfo.sedexDaysLabel || '3 a 5 dias úteis',
      },
    ];
  }

  return rules.map((rule) => {
    const companyCost =
      Math.round((rule.baseCost + rule.extraPerItem * extraItems) * 100) / 100;
    const isFreeForCustomer = qualifiesForFreeEco && rule.isEconomic;
    const customerPrice = isFreeForCustomer ? 0 : companyCost;

    return {
      carrierId: rule.carrierId,
      carrierName: rule.carrierName,
      serviceLabel: rule.serviceLabel,
      deliveryDays: rule.deliveryDays,
      companyCost,
      customerPrice,
      isFreeForCustomer,
    };
  });
}

/**
 * Retorna o custo real do frete pago pela empresa Bia Makes em um pedido.
 * Se o pedido legado não possuir `companyShippingCost` salvo, calcula um fallback realista
 * baseado nos itens do pedido (mínimo R$ 14,90) para nunca zerar o custo logístico da loja.
 */
export function resolveOrderCompanyShippingCost(order: Pick<Order, 'companyShippingCost' | 'shippingAmount' | 'items'>): number {
  if (typeof order.companyShippingCost === 'number' && order.companyShippingCost > 0) {
    return Math.round(order.companyShippingCost * 100) / 100;
  }
  if (typeof order.shippingAmount === 'number' && order.shippingAmount > 0) {
    return Math.round(order.shippingAmount * 100) / 100;
  }
  const totalUnits = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
  const extraUnits = Math.max(0, totalUnits - 1);
  return Math.round((14.9 + extraUnits * 1.5) * 100) / 100;
}
