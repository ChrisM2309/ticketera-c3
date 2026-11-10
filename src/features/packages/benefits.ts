import type { PackageBenefits } from '@/features/settings/settings';

export { defaultPackageBenefits } from '@/features/settings/settings';

export type DescribedBenefit = { title: string; detail: string };

export function describeBenefits(benefits: PackageBenefits): DescribedBenefit[] {
  const descriptions: DescribedBenefit[] = [
    { title: 'Multieventos', detail: `Hasta ${benefits.eventsIncluded} eventos durante el año` },
  ];

  if (benefits.personalizedFollowUp) {
    descriptions.push({
      title: 'Seguimiento personalizado',
      detail: 'Acompañamiento para tu organización durante el año',
    });
  }

  descriptions.push({
    title: 'Destacados con descuento o gratis',
    detail: `${benefits.featuredDaysIncluded} días de destacado gratis y ${benefits.featuredDiscountPercent} % de descuento después`,
  });

  if (benefits.advancedReport) {
    descriptions.push({
      title: 'Reporte de datos superior',
      detail: 'Accede a un reporte avanzado del rendimiento de tus eventos',
    });
  }

  return descriptions;
}
