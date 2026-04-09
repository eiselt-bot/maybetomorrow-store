import type { ComponentType } from 'react';
import type { LayoutVariant } from '@/lib/db/schema';
import type { ShopLayoutProps } from '@/components/layouts/types';

import { EarthyArtisan } from '@/components/layouts/EarthyArtisan';
import { VibrantMarket } from '@/components/layouts/VibrantMarket';
import { OceanCalm } from '@/components/layouts/OceanCalm';
import { HeritageStory } from '@/components/layouts/HeritageStory';
import { BoldMaker } from '@/components/layouts/BoldMaker';

/**
 * Maps `layout_variant` enum strings from the DB to their React layout component.
 */
export const layoutRegistry: Record<LayoutVariant, ComponentType<ShopLayoutProps>> = {
  'earthy-artisan': EarthyArtisan,
  'vibrant-market': VibrantMarket,
  'ocean-calm': OceanCalm,
  'heritage-story': HeritageStory,
  'bold-maker': BoldMaker,
};

/**
 * Resolve a layout component by variant string, with a safe fallback.
 * Unknown/null variants fall back to EarthyArtisan.
 */
export function resolveLayout(
  variant: LayoutVariant | null | undefined,
): ComponentType<ShopLayoutProps> {
  if (variant && variant in layoutRegistry) {
    return layoutRegistry[variant];
  }
  return EarthyArtisan;
}
