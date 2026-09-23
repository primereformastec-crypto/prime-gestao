export interface InterestDetectionInput {
  rawMetaFields?: Record<string, any>;
  campaignName?: string;
  adName?: string;
  fileName?: string;
  notes?: string;
  currentService?: string;
}

export interface InterestBadgeStyle {
  label: string;
  shortLabel: string;
  category: 'ducha' | 'termo' | 'aire' | 'bano' | 'cocina' | 'integral' | 'pintura' | 'eletricidade' | 'outro';
  icon: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const STANDARD_INTERESTS = [
  '🚿 Plato de Ducha',
  '⚡ Termoeléctrico',
  '❄️ Ar Condicionado',
  '🛁 Reforma de Banheiro',
  '🍳 Reforma de Cozinha',
  '🏠 Reforma Integral',
  '🎨 Pintura',
  '🔧 Instalações / Eletricidade',
  '📋 Contacto Geral (A Qualificar)'
] as const;

export function getInterestBadge(serviceName?: string): InterestBadgeStyle {
  const s = (serviceName || '').toLowerCase();
  
  if (s.includes('ducha') || s.includes('bañera') || s.includes('banheira')) {
    return {
      label: serviceName || '🚿 Plato de Ducha',
      shortLabel: 'Ducha',
      category: 'ducha',
      icon: '🚿',
      bgClass: 'bg-cyan-50',
      textClass: 'text-cyan-800',
      borderClass: 'border-cyan-300'
    };
  }
  if (s.includes('termo') || s.includes('calentador') || s.includes('caldera') || s.includes('agua caliente')) {
    return {
      label: serviceName || '⚡ Termoeléctrico',
      shortLabel: 'Termoeléctrico',
      category: 'termo',
      icon: '⚡',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-300'
    };
  }
  if (s.includes('aire') || s.includes('ar condicionado') || s.includes('clima') || s.includes('split') || s.includes('acondicionado') || s.includes('aerotermia')) {
    return {
      label: serviceName || '❄️ Ar Condicionado',
      shortLabel: 'Ar Condicionado',
      category: 'aire',
      icon: '❄️',
      bgClass: 'bg-sky-50',
      textClass: 'text-sky-800',
      borderClass: 'border-sky-300'
    };
  }
  if (s.includes('cocina') || s.includes('cozinha')) {
    return {
      label: serviceName || '🍳 Reforma de Cozinha',
      shortLabel: 'Cozinha',
      category: 'cocina',
      icon: '🍳',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300'
    };
  }
  if (s.includes('baño') || s.includes('banheiro') || s.includes('aseo') || s.includes('wc') || s.includes('sanit')) {
    return {
      label: serviceName || '🛁 Reforma de Banheiro',
      shortLabel: 'Banheiro',
      category: 'bano',
      icon: '🛁',
      bgClass: 'bg-violet-50',
      textClass: 'text-violet-800',
      borderClass: 'border-violet-300'
    };
  }
  if (s.includes('integral') || s.includes('completa') || s.includes('total') || s.includes('vivienda') || s.includes('piso completo')) {
    return {
      label: serviceName || '🏠 Reforma Integral',
      shortLabel: 'Integral',
      category: 'integral',
      icon: '🏠',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-800',
      borderClass: 'border-indigo-300'
    };
  }
  if (s.includes('pintura') || s.includes('pintar')) {
    return {
      label: serviceName || '🎨 Pintura',
      shortLabel: 'Pintura',
      category: 'pintura',
      icon: '🎨',
      bgClass: 'bg-pink-50',
      textClass: 'text-pink-800',
      borderClass: 'border-pink-300'
    };
  }
  if (s.includes('fontaner') || s.includes('electric') || s.includes('eletric') || s.includes('encanad')) {
    return {
      label: serviceName || '🔧 Instalações',
      shortLabel: 'Instalações',
      category: 'eletricidade',
      icon: '🔧',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-800',
      borderClass: 'border-orange-300'
    };
  }

  const isGeneric = !serviceName || 
    serviceName === 'Reforma Geral / Remodelação' || 
    serviceName === 'Reforma Geral' || 
    serviceName.toLowerCase().includes('reformulação');

  return {
    label: isGeneric ? '📋 Contacto Geral (A Qualificar)' : serviceName,
    shortLabel: 'Geral',
    category: 'outro',
    icon: '📋',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300'
  };
}

export function detectLeadInterest(input: InterestDetectionInput): string {
  const { rawMetaFields, campaignName, adName, fileName, notes, currentService } = input;

  // 1. Look for explicit questions/answers in rawMetaFields
  if (rawMetaFields && typeof rawMetaFields === 'object') {
    const keys = Object.keys(rawMetaFields);
    
    for (const k of keys) {
      const lowerKey = k.toLowerCase();
      const val = rawMetaFields[k];
      if (!val || (typeof val !== 'string' && typeof val !== 'number')) continue;
      const lowerVal = String(val).toLowerCase();

      // Skip generic IDs, metadata, contact info
      if (
        lowerKey.includes('id') || 
        lowerKey.includes('time') || 
        lowerKey.includes('date') || 
        lowerKey.includes('phone') || 
        lowerKey.includes('email') || 
        lowerKey.includes('name') || 
        lowerKey.includes('city') || 
        lowerKey.includes('street')
      ) {
        continue;
      }

      // Check if value or key points to specific services
      if (lowerVal.includes('ducha') || lowerVal.includes('bañera') || lowerVal.includes('banheira') || lowerKey.includes('ducha') || lowerKey.includes('bañera')) {
        return '🚿 Plato de Ducha';
      }
      if (lowerVal.includes('termo') || lowerVal.includes('calentador') || lowerVal.includes('caldera') || lowerKey.includes('termo') || lowerKey.includes('calentador')) {
        return '⚡ Termoeléctrico';
      }
      if (lowerVal.includes('aire') || lowerVal.includes('ar condicionado') || lowerVal.includes('split') || lowerVal.includes('clima') || lowerKey.includes('aire') || lowerKey.includes('clima')) {
        return '❄️ Ar Condicionado';
      }
      if (lowerVal.includes('cocina') || lowerVal.includes('cozinha') || lowerKey.includes('cocina')) {
        return '🍳 Reforma de Cozinha';
      }
      if (lowerVal.includes('baño') || lowerVal.includes('banheiro') || lowerKey.includes('baño') || lowerKey.includes('banheiro')) {
        return '🛁 Reforma de Banheiro';
      }
      if (lowerVal.includes('integral') || lowerVal.includes('completa') || lowerKey.includes('integral')) {
        return '🏠 Reforma Integral';
      }
      if (lowerVal.includes('pintura') || lowerVal.includes('pintar') || lowerKey.includes('pintura')) {
        return '🎨 Pintura';
      }
      
      // If the question header asks "¿Qué servicio necesitas?" or similar, and value is a short description
      if ((lowerKey.includes('servicio') || lowerKey.includes('necesit') || lowerKey.includes('interes') || lowerKey.startsWith('¿')) && lowerVal.length > 2 && lowerVal.length < 50) {
        return String(val).trim();
      }
    }
  }

  // 2. Check campaignName, adName, fileName, and notes
  const combinedText = `${campaignName || ''} ${adName || ''} ${fileName || ''} ${notes || ''}`.toLowerCase();
  
  if (combinedText.includes('ducha') || combinedText.includes('bañera') || combinedText.includes('banheira')) {
    return '🚿 Plato de Ducha';
  }
  if (combinedText.includes('termo') || combinedText.includes('calentador') || combinedText.includes('caldera') || combinedText.includes('agua caliente')) {
    return '⚡ Termoeléctrico';
  }
  if (combinedText.includes('aire') || combinedText.includes('ar condicionado') || combinedText.includes('split') || combinedText.includes('clima') || combinedText.includes('acondicionado')) {
    return '❄️ Ar Condicionado';
  }
  if (combinedText.includes('cocina') || combinedText.includes('cozinha')) {
    return '🍳 Reforma de Cozinha';
  }
  if (combinedText.includes('baño') || combinedText.includes('banheiro')) {
    return '🛁 Reforma de Banheiro';
  }
  if (combinedText.includes('integral') || combinedText.includes('completa') || combinedText.includes('vivienda')) {
    return '🏠 Reforma Integral';
  }
  if (combinedText.includes('pintura') || combinedText.includes('pintar')) {
    return '🎨 Pintura';
  }

  // 3. If current service is already specific, preserve it
  if (
    currentService && 
    !currentService.includes('Remodelação') && 
    !currentService.includes('Reforma Geral') && 
    !currentService.toLowerCase().includes('reformulação') &&
    currentService.trim().length > 0
  ) {
    return currentService;
  }

  return '📋 Contacto Geral (A Qualificar)';
}
