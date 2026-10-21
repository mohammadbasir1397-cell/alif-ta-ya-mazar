import {
  Laptop,
  Smartphone,
  Shirt,
  Watch,
  SprayCan,
  Package,
  Baby,
  Plug,
  type LucideIcon,
} from 'lucide-react';

interface CategoryIconConfig {
  slug: string;
  Icon: LucideIcon;
}

export const CATEGORY_ICONS: CategoryIconConfig[] = [
  { slug: 'electric-electronic', Icon: Plug },
  { slug: 'mobile-accessories', Icon: Smartphone },
  { slug: 'computer-accessories', Icon: Laptop },
  { slug: 'women-clothing', Icon: Shirt },
  { slug: 'men-clothing', Icon: Shirt },
  { slug: 'kids-clothing', Icon: Baby },
  { slug: 'watches', Icon: Watch },
  { slug: 'perfume-cosmetics', Icon: SprayCan },
  { slug: 'other-products', Icon: Package },
];

const iconMap = new Map(CATEGORY_ICONS.map((c) => [c.slug, c.Icon]));

export function getCategoryIcon(slug: string): LucideIcon {
  return iconMap.get(slug) || Package;
}
