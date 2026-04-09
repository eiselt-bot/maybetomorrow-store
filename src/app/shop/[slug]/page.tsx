import { loadShop } from './_loaders';
import { resolveHomeComponent } from '@/lib/layout-registry';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Shop home page. Renders the variant-specific Home component (top-5 grid
 * + about teaser). The surrounding chrome (header/hero/footer) is rendered
 * by layout.tsx via the matching layout component.
 */
export default async function ShopHomePage({ params }: PageProps) {
  const { slug } = await params;
  const { shop, products, rates } = await loadShop(slug);
  const Home = resolveHomeComponent(shop.layoutVariant);
  return <Home shop={shop} products={products} rates={rates} />;
}
