import { Icon } from '@/components/ui/icon';
import type { DescribedBenefit } from '@/features/packages/benefits';

type BenefitListProps = Readonly<{ benefits: readonly DescribedBenefit[] }>;

export function BenefitList({ benefits }: BenefitListProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {benefits.map((benefit) => (
        <li key={benefit.title} className="flex gap-3 rounded-lg bg-superficie p-5">
          <Icon name="check" size={24} tone="exito" />
          <span className="flex flex-col gap-1">
            <strong className="font-titulo text-base">{benefit.title}</strong>
            <span className="font-texto text-sm leading-6 text-texto-suave">{benefit.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
