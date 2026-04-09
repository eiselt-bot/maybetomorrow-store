import type { ComponentType } from 'react';
import type { LayoutVariant } from '@/lib/db/schema';
import type { ShopLayoutProps } from '@/components/layouts/types';

import { EarthyArtisan, EarthyHome } from '@/components/layouts/EarthyArtisan';
import { VibrantMarket, VibrantHome } from '@/components/layouts/VibrantMarket';
import { OceanCalm, OceanHome } from '@/components/layouts/OceanCalm';
import { HeritageStory, HeritageHome } from '@/components/layouts/HeritageStory';
import { BoldMaker, BoldHome } from '@/components/layouts/BoldMaker';

type HomeProps = Pick<ShopLayoutProps, 'shop' | 'products' | 'rates'>;

export const layoutRegistry: Record<LayoutVariant, ComponentType<ShopLayoutProps>> = {
  'earthy-artisan': EarthyArtisan,
  'vibrant-market': VibrantMarket,
  'ocean-calm': OceanCalm,
  'heritage-story': HeritageStory,
  'bold-maker': BoldMaker,
};

const homeRegistry: Record<LayoutVariant, ComponentType<HomeProps>> = {
  'earthy-artisan': EarthyHome,
  'vibrant-market': VibrantHome,
  'ocean-calm': OceanHome,
  'heritage-story': HeritageHome,
  'bold-maker': BoldHome,
};

export function resolveLayout(
  variant: LayoutVariant | null | undefined,
): ComponentType<ShopLayoutProps> {
  if (variant && variant in layoutRegistry) {
    return layoutRegistry[variant];
  }
  return EarthyArtisan;
}

export function resolveHomeComponent(
  variant: LayoutVariant | null | undefined,
): ComponentType<HomeProps> {
  if (variant && variant in homeRegistry) {
    return homeRegistry[variant];
  }
  return EarthyHome;
}
