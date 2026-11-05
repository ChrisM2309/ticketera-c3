import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-5 font-titulo text-etiqueta font-bold uppercase tracking-etiqueta transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primario: 'bg-accion text-texto-inverso hover:bg-accion-intensa',
        // La compra usa la acción de la marca (D-33); el turquesa es de la línea Crea y no es acción.
        compra: 'bg-accion text-texto-inverso hover:bg-accion-intensa',
        secundario: 'border-2 border-borde-fuerte text-texto hover:bg-superficie-sutil',
      },
      size: {
        md: '',
        lg: 'min-h-12 px-7 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primario',
      size: 'md',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
