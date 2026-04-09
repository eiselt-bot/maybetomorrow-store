import { describe, it, expect, vi, beforeEach } from 'vitest';

// All mock state must live inside vi.hoisted so it survives the
// top-of-file hoisting that vitest applies to vi.mock calls.
const state = vi.hoisted(() => {
  type DbState = {
    shops: Array<Record<string, unknown>>;
    products: Array<Record<string, unknown>>;
    deliveryFees: Array<{ zone: string; label: string; feeKes: number }>;
    ordersInserted: Array<Record<string, unknown>>;
    orderItemsInserted: Array<Record<string, unknown>>;
    nextOrderId: number;
    transactionShouldFail: boolean;
  };
  const dbState: DbState = {
    shops: [],
    products: [],
    deliveryFees: [
      { zone: 'diani-strip', label: 'Diani Strip', feeKes: 200 },
      { zone: 'south-coast', label: 'South Coast', feeKes: 500 },
      { zone: 'mombasa', label: 'Mombasa', feeKes: 1500 },
      { zone: 'further', label: 'Further', feeKes: 3000 },
    ],
    ordersInserted: [],
    orderItemsInserted: [],
    nextOrderId: 1000,
    transactionShouldFail: false,
  };

  // Minimal schema sentinels (by-reference identity).
  const schema = {
    shops: { __tbl: 'shops' },
    products: { __tbl: 'products' },
    deliveryFees: { __tbl: 'delivery_fees' },
    orders: { __tbl: 'orders' },
    orderItems: { __tbl: 'order_items' },
  };

  // Chainable query builder stub — every method returns the same object
  // that is also awaitable. The final await resolves to `rows`.
  const chainable = (rows: unknown[]): any => ({
    from: () => chainable(rows),
    where: () => chainable(rows),
    orderBy: () => chainable(rows),
    innerJoin: () => chainable(rows),
    leftJoin: () => chainable(rows),
    groupBy: () => chainable(rows),
    limit: () => chainable(rows),
    returning: () => Promise.resolve(rows),
    then: (resolve: (v: unknown[]) => unknown) =>
      Promise.resolve(rows).then(resolve),
  });

  const db = {
    select: () => ({
      from: (table: unknown) => {
        if (table === schema.shops) return chainable(dbState.shops);
        if (table === schema.products) return chainable(dbState.products);
        if (table === schema.deliveryFees)
          return chainable(
            dbState.deliveryFees.map((f) => ({
              zone: f.zone,
              label: f.label,
              feeKes: f.feeKes,
            })),
          );
        return chainable([]);
      },
    }),
    insert: (table: unknown) => ({
      values: (row: unknown) => ({
        returning: () => {
          const id = dbState.nextOrderId++;
          if (table === schema.orders) {
            dbState.ordersInserted.push({ id, ...(row as object) });
            return Promise.resolve([{ id }]);
          }
          if (table === schema.orderItems) {
            dbState.orderItemsInserted.push(row as Record<string, unknown>);
            return Promise.resolve([{ id }]);
          }
          return Promise.resolve([{ id }]);
        },
        then: (resolve: (v: unknown) => unknown) => {
          if (table === schema.orderItems) {
            const rows = Array.isArray(row) ? row : [row];
            for (const r of rows) {
              dbState.orderItemsInserted.push(
                r as Record<string, unknown>,
              );
            }
          }
          return Promise.resolve([]).then(resolve);
        },
      }),
    }),
    delete: () => ({ where: () => Promise.resolve() }),
    transaction: async function <T>(
      fn: (tx: unknown) => Promise<T>,
    ): Promise<T> {
      if (dbState.transactionShouldFail) {
        throw new Error('simulated transaction failure');
      }
      return fn(db);
    },
  };

  return { dbState, schema, db };
});

vi.mock('@/lib/db/client', () => ({
  db: state.db,
  schema: state.schema,
}));

vi.mock('drizzle-orm', () => ({
  eq: (...args: unknown[]) => ({ op: 'eq', args }),
  and: (...args: unknown[]) => ({ op: 'and', args }),
  desc: (arg: unknown) => ({ op: 'desc', arg }),
}));

import {
  createOrder,
  createOrderFromCart,
  getDeliveryFeeKes,
  getAllDeliveryFees,
  invalidateDeliveryFeeCache,
  type CreateOrderInput,
  type CreateCartOrderInput,
} from './order-service';
import type { Shop, Product } from '@/lib/db/schema';

function makeShop(id = 1): Shop {
  return {
    id,
    slug: 'test',
    title: 'Test Shop',
    status: 'live',
  } as unknown as Shop;
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 100,
    shopId: 1,
    name: 'Test Product',
    priceKes: 1000,
    discountPct: 0,
    status: 'active',
    photos: [],
    sizes: null,
    colors: null,
    isTop5: true,
    soldCount: 0,
    deliveryDays: 1,
    ...overrides,
  } as unknown as Product;
}

beforeEach(() => {
  state.dbState.ordersInserted.length = 0;
  state.dbState.orderItemsInserted.length = 0;
  state.dbState.nextOrderId = 1000;
  state.dbState.transactionShouldFail = false;
  invalidateDeliveryFeeCache();
  process.env.PLATFORM_MARGIN_PCT = '10';
});

describe('getDeliveryFeeKes', () => {
  it('returns the fee for each known zone', async () => {
    expect(await getDeliveryFeeKes('diani-strip')).toBe(200);
    expect(await getDeliveryFeeKes('south-coast')).toBe(500);
    expect(await getDeliveryFeeKes('mombasa')).toBe(1500);
    expect(await getDeliveryFeeKes('further')).toBe(3000);
  });

  it('caches the DB lookup after the first call', async () => {
    const spy = vi.spyOn(state.db, 'select');
    await getDeliveryFeeKes('diani-strip');
    const callsAfterFirst = spy.mock.calls.length;
    await getDeliveryFeeKes('mombasa');
    expect(spy.mock.calls.length).toBe(callsAfterFirst);
    spy.mockRestore();
  });

  it('invalidateDeliveryFeeCache re-queries next call', async () => {
    await getDeliveryFeeKes('diani-strip');
    invalidateDeliveryFeeCache();
    const spy = vi.spyOn(state.db, 'select');
    await getDeliveryFeeKes('south-coast');
    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});

describe('getAllDeliveryFees', () => {
  it('returns all 4 zones', async () => {
    const fees = await getAllDeliveryFees();
    expect(fees).toHaveLength(4);
    expect(fees.map((f) => f.zone).sort()).toEqual([
      'diani-strip',
      'further',
      'mombasa',
      'south-coast',
    ]);
  });
});

describe('createOrder', () => {
  const baseInput: CreateOrderInput = {
    shop: makeShop(),
    product: makeProduct(),
    qty: 2,
    customerName: 'Alice',
    customerPhone: '+254700000001',
    customerEmail: 'alice@example.com',
    deliveryZone: 'diani-strip',
    deliveryAddress: 'Diani beach',
    deliveryDate: '2026-04-20',
    deliveryTimeNote: null,
    newsletterOptin: false,
    notes: null,
    variantSelection: null,
  };

  it('computes margin + delivery + total correctly (no discount)', async () => {
    const result = await createOrder(baseInput);

    // 2 × 1000 = 2000 subtotal, 10% margin = 200, diani fee = 200
    expect(result.productsSubtotalKes).toBe(2000);
    expect(result.marginKes).toBe(200);
    expect(result.deliveryFeeKes).toBe(200);
    expect(result.totalKes).toBe(2400);
  });

  it('applies product discount before computing line total', async () => {
    const discounted = makeProduct({ priceKes: 1000, discountPct: 20 });
    const result = await createOrder({ ...baseInput, product: discounted, qty: 1 });

    // 1 × 800 (20% off) = 800, 10% margin = 80, delivery = 200, total = 1080
    expect(result.productsSubtotalKes).toBe(800);
    expect(result.marginKes).toBe(80);
    expect(result.totalKes).toBe(1080);
  });

  it('generates an order number matching MT-YYYYMMDD-XXXX', async () => {
    const result = await createOrder(baseInput);
    expect(result.orderNumber).toMatch(/^MT-\d{8}-[A-Z0-9]{4}$/);
  });

  it('rejects qty below 1', async () => {
    await expect(
      createOrder({ ...baseInput, qty: 0 }),
    ).rejects.toThrow(/Invalid quantity/);
  });

  it('rejects qty above 50', async () => {
    await expect(
      createOrder({ ...baseInput, qty: 51 }),
    ).rejects.toThrow(/Invalid quantity/);
  });

  it('rejects product from a different shop', async () => {
    const otherShop = makeShop(2);
    await expect(
      createOrder({ ...baseInput, shop: otherShop }),
    ).rejects.toThrow(/does not belong/);
  });

  it('rejects an archived product', async () => {
    await expect(
      createOrder({
        ...baseInput,
        product: makeProduct({ status: 'archived' }),
      }),
    ).rejects.toThrow(/not available/);
  });

  it('uses PLATFORM_MARGIN_PCT env var if set', async () => {
    process.env.PLATFORM_MARGIN_PCT = '15';
    const result = await createOrder(baseInput);
    expect(result.marginKes).toBe(300); // 2000 * 15%
  });
});

describe('createOrderFromCart', () => {
  const lines = [
    { productId: 100, qty: 1 },
    { productId: 101, qty: 2, variantSize: 'M', variantColor: 'Blue' },
    { productId: 102, qty: 3 },
  ];

  const baseInput: CreateCartOrderInput = {
    shop: makeShop(),
    lines,
    customerName: 'Bob',
    customerPhone: '+254700000002',
    customerEmail: null,
    deliveryZone: 'south-coast',
    deliveryAddress: 'Ukunda',
    deliveryDate: '2026-04-25',
    deliveryTimeNote: null,
    newsletterOptin: false,
    notes: null,
  };

  beforeEach(() => {
    state.dbState.products = [
      makeProduct({ id: 100, priceKes: 1000, discountPct: 0 }),
      makeProduct({ id: 101, priceKes: 2000, discountPct: 10 }),
      makeProduct({ id: 102, priceKes: 500, discountPct: 0 }),
    ];
  });

  it('aggregates subtotal across all lines', async () => {
    const result = await createOrderFromCart(baseInput);
    // 1×1000 + 2×1800 (10% off 2000) + 3×500 = 1000 + 3600 + 1500 = 6100
    expect(result.productsSubtotalKes).toBe(6100);
  });

  it('aggregates margin across all lines (round per line)', async () => {
    const result = await createOrderFromCart(baseInput);
    // line1 margin = 100, line2 margin = 360, line3 margin = 150 → 610
    expect(result.marginKes).toBe(610);
  });

  it('applies south-coast delivery fee', async () => {
    const result = await createOrderFromCart(baseInput);
    expect(result.deliveryFeeKes).toBe(500);
  });

  it('total = subtotal + margin + delivery', async () => {
    const result = await createOrderFromCart(baseInput);
    expect(result.totalKes).toBe(6100 + 610 + 500);
  });

  it('rejects empty cart', async () => {
    await expect(
      createOrderFromCart({ ...baseInput, lines: [] }),
    ).rejects.toThrow(/empty/i);
  });

  it('rejects cart line with unknown productId', async () => {
    await expect(
      createOrderFromCart({
        ...baseInput,
        lines: [{ productId: 999, qty: 1 }],
      }),
    ).rejects.toThrow(/not found|unavailable/);
  });

  it('rejects cart line with qty out of range', async () => {
    await expect(
      createOrderFromCart({
        ...baseInput,
        lines: [{ productId: 100, qty: 100 }],
      }),
    ).rejects.toThrow(/Invalid quantity/);
  });
});
