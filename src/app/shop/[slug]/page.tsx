import { loadShop } from './_loaders';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Shop home page.
 *
 * The layout at `./layout.tsx` already renders the chosen shop-layout component
 * (EarthyArtisan / VibrantMarket / ...), and each of those layouts renders their
 * own "default home" block (Hero-ish + Top-5 grid + About teaser) when `children`
 * is null.
 *
 * So the home page simply ensures the shop exists (cached, deduped with the
 * layout's fetch) and returns `null`, letting the layout own the home content.
 */
export default async function ShopHomePage({ params }: PageProps) {
  const { slug } = await params;
  // Triggers notFound() if the shop doesn't exist; dedupes with layout's call.
  await loadShop(slug);
  return null;
}
