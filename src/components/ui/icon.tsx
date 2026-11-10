import {
  Building2,
  Calendar,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  Code,
  ChartColumn,
  Cpu,
  Download,
  FileText,
  Flag,
  Globe,
  Handshake,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Mic,
  Minus,
  Monitor,
  MonitorPlay,
  Package,
  Pencil,
  Phone,
  Plus,
  Printer,
  QrCode,
  Rocket,
  Search,
  Settings,
  Share2,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Target,
  Terminal,
  Ticket,
  Trash2,
  Trophy,
  TriangleAlert,
  User,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Registro de iconos de la interfaz: nombre en español/dominio -> componente de lucide-react 0.468.
 * Nombres de lucide que difieren del nombre del registro:
 * cart -> ShoppingCart, close -> X, qr -> QrCode, share -> Share2, alert -> TriangleAlert,
 * building -> Building2, message -> MessageSquare, edit -> Pencil, print -> Printer, trash -> Trash2.
 */
export const iconRegistry = {
  search: Search,
  cart: ShoppingCart,
  user: User,
  userPlus: UserPlus,
  logIn: LogIn,
  logOut: LogOut,
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  calendar: Calendar,
  calendarPlus: CalendarPlus,
  clock: Clock,
  mapPin: MapPin,
  monitor: Monitor,
  ticket: Ticket,
  tag: Tag,
  qr: QrCode,
  share: Share2,
  check: Check,
  alert: TriangleAlert,
  info: Info,
  lock: Lock,
  mail: Mail,
  phone: Phone,
  building: Building2,
  trophy: Trophy,
  handshake: Handshake,
  wrench: Wrench,
  rocket: Rocket,
  target: Target,
  monitorPlay: MonitorPlay,
  mic: Mic,
  code: Code,
  users: Users,
  message: MessageSquare,
  store: Store,
  cloud: Cloud,
  cpu: Cpu,
  terminal: Terminal,
  star: Star,
  flag: Flag,
  download: Download,
  print: Printer,
  plus: Plus,
  minus: Minus,
  edit: Pencil,
  trash: Trash2,
  layoutDashboard: LayoutDashboard,
  settings: Settings,
  chart: ChartColumn,
  fileText: FileText,
  package: Package,
  globe: Globe,
} as const;

export type IconName = keyof typeof iconRegistry;

export type IconTone =
  | 'texto'
  | 'suave'
  | 'accion'
  | 'compite'
  | 'crea'
  | 'conecta'
  | 'exito'
  | 'advertencia'
  | 'error'
  | 'inverso';

/** Clases de token por tono. Las tres líneas usan su variante `-texto`, que se redefine en el tema oscuro (D-58); el turquesa puro no es texto sobre fondo claro. */
const toneClass: Record<IconTone, string> = {
  texto: 'text-texto',
  suave: 'text-texto-suave',
  accion: 'text-accion',
  compite: 'text-compite-texto',
  crea: 'text-crea-texto',
  conecta: 'text-conecta-texto',
  exito: 'text-exito',
  advertencia: 'text-advertencia',
  error: 'text-error',
  inverso: 'text-texto-inverso',
};

type IconProps = Readonly<{
  name: IconName;
  /** Con etiqueta el icono tiene significado propio (role="img"); sin ella es decorativo y se oculta. */
  label?: string;
  size?: 16 | 20 | 24;
  /** Sin tono hereda el color del texto que lo rodea (currentColor). */
  tone?: IconTone;
  className?: string;
}>;

export function Icon({ name, label, size = 20, tone, className }: IconProps) {
  const Glyph = iconRegistry[name];
  const accessibility = label ? ({ role: 'img', 'aria-label': label } as const) : ({ 'aria-hidden': true } as const);

  return (
    <Glyph
      data-icon={name}
      width={size}
      height={size}
      strokeWidth={2}
      className={cn('shrink-0', tone && toneClass[tone], className)}
      {...accessibility}
    />
  );
}
