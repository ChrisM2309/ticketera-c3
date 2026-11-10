import { describe, expect, it } from 'vitest';

import { defaultPackageBenefits, describeBenefits } from '@/features/packages/benefits';

describe('beneficios del paquete empresarial', () => {
  it('describeBenefits con valores por defecto produce los cuatro beneficios', () => {
    expect(describeBenefits(defaultPackageBenefits)).toEqual([
      { title: 'Multieventos', detail: 'Hasta 10 eventos durante el año' },
      { title: 'Seguimiento personalizado', detail: 'Acompañamiento para tu organización durante el año' },
      { title: 'Destacados con descuento o gratis', detail: '30 días de destacado gratis y 50 % de descuento después' },
      { title: 'Reporte de datos superior', detail: 'Accede a un reporte avanzado del rendimiento de tus eventos' },
    ]);
  });

  it('sin seguimiento ni reporte avanzado omite esas entradas', () => {
    const benefits = describeBenefits({
      ...defaultPackageBenefits,
      personalizedFollowUp: false,
      advancedReport: false,
    });

    expect(benefits.map((benefit) => benefit.title)).toEqual(['Multieventos', 'Destacados con descuento o gratis']);
  });
});
