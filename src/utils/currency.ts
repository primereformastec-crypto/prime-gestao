/**
 * Utilitários para gestão de valores monetários e formatação em Euro (€)
 */

/**
 * Converte qualquer entrada de valor monetário (string ou número) para float válido.
 * Trata vírgula e ponto como separadores decimais e suporta separador de milhar.
 */
export const parseCurrencyInput = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  let clean = String(value).replace(/[€$\s]/g, '').trim();
  if (!clean) return 0;

  // Se tiver ponto e vírgula, e.g. 25.388,99 (ponto = milhar, vírgula = decimal)
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // Se só tiver vírgula, e.g. 25388,99 ou 0,50
    clean = clean.replace(',', '.');
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formata um valor numérico para a moeda Euro (€) no padrão português / europeu.
 * Exemplo: 25388.99 -> "€ 25.388,99" ou "25.388,99 €"
 */
export const formatCurrency = (value: number | string | undefined | null, showDecimals: boolean = true): string => {
  const num = typeof value === 'number' ? (isNaN(value) ? 0 : value) : parseCurrencyInput(value);
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Filtra caracteres indesejados mantendo números, vírgula e ponto
 */
export const sanitizeCurrencyInput = (value: string): string => {
  return value.replace(/[^0-9.,]/g, '');
};
