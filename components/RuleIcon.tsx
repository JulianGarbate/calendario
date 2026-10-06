import {
  Activity, Bike, BookOpen, Brain, Briefcase, Coffee, Droplets, Dumbbell, Flame, Footprints, Gamepad2, Goal,
  GraduationCap, HeartPulse, Mountain, Moon, Music, Palette, Pill, Pin, Salad, Sparkles, Sun, Swords, Target,
  Timer, Trophy, Utensils, Volleyball, Waves, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, { Icon: LucideIcon; label: string }> = {
  Dumbbell: { Icon: Dumbbell, label: "Pesas" },
  Goal: { Icon: Goal, label: "Fútbol" },
  Volleyball: { Icon: Volleyball, label: "Vóley" },
  Footprints: { Icon: Footprints, label: "Caminar" },
  Bike: { Icon: Bike, label: "Bici" },
  Waves: { Icon: Waves, label: "Natación" },
  Mountain: { Icon: Mountain, label: "Montaña" },
  Swords: { Icon: Swords, label: "Artes marciales" },
  Trophy: { Icon: Trophy, label: "Competencia" },
  Activity: { Icon: Activity, label: "Cardio" },
  HeartPulse: { Icon: HeartPulse, label: "Salud" },
  Flame: { Icon: Flame, label: "Intensidad" },
  Timer: { Icon: Timer, label: "Tiempo" },
  Salad: { Icon: Salad, label: "Comida sana" },
  Utensils: { Icon: Utensils, label: "Comida" },
  Droplets: { Icon: Droplets, label: "Agua" },
  Coffee: { Icon: Coffee, label: "Café" },
  Pill: { Icon: Pill, label: "Suplementos" },
  Moon: { Icon: Moon, label: "Sueño" },
  Sun: { Icon: Sun, label: "Mañana" },
  Brain: { Icon: Brain, label: "Mente" },
  BookOpen: { Icon: BookOpen, label: "Lectura" },
  GraduationCap: { Icon: GraduationCap, label: "Estudio" },
  Briefcase: { Icon: Briefcase, label: "Trabajo" },
  Music: { Icon: Music, label: "Música" },
  Palette: { Icon: Palette, label: "Arte" },
  Gamepad2: { Icon: Gamepad2, label: "Juegos" },
  Target: { Icon: Target, label: "Objetivo" },
  Sparkles: { Icon: Sparkles, label: "Especial" },
  Pin: { Icon: Pin, label: "Otro" },
};

/** `value` es el nombre de un ícono; si es un emoji viejo, se muestra tal cual. */
export default function RuleIcon({ value, className = "size-3.5" }: { value: string; className?: string }) {
  const entry = ICONS[value];
  if (!entry) return <span aria-hidden>{value}</span>;
  return <entry.Icon className={`${className} shrink-0`} strokeWidth={2.25} aria-hidden />;
}
