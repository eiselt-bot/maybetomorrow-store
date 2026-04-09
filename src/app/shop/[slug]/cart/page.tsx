import { CartPage } from '@/components/ui/CartPage';
import { loadShop } from '../_loaders';
import { getAllDeliveryFees } from '@/lib/services/order-service';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ShopCartPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop } = await loadShop(slug);

  const fees = await getAllDeliveryFees();
  const deliveryFees: Record<string, { label: string; feeKes: number }> = {};
  for (const f of fees) {
    deliveryFees[f.zone] = { label: f.label, feeKes: f.feeKes };
  }

  const marginPct = Number(process.env.PLATFORM_MARGIN_PCT ?? '10');

  return (
    <CartPage
      slug={slug}
      shopTitle={shop.title}
      shopId={shop.id}
      marginPct={marginPct}
      deliveryFees={deliveryFees}
    />
  );
}
