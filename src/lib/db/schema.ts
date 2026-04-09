import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  numeric,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ ENUMS ============

export const roleEnum = pgEnum('role', ['admin', 'vendor']);
export const shopStatusEnum = pgEnum('shop_status', ['draft', 'live', 'paused', 'archived']);
export const layoutVariantEnum = pgEnum('layout_variant', [
  'earthy-artisan',
  'vibrant-market',
  'ocean-calm',
  'heritage-story',
  'bold-maker',
]);
export const orderStatusEnum = pgEnum('order_status', [
  'new',
  'confirmed',
  'picked_up',
  'delivered',
  'cancelled',
  'refunded',
]);
export const deliveryZoneEnum = pgEnum('delivery_zone', [
  'diani-strip',
  'south-coast',
  'mombasa',
  'further',
]);
export const incidentSeverityEnum = pgEnum('incident_severity', ['yellow', 'red']);
export const incidentSubjectEnum = pgEnum('incident_subject', ['vendor', 'driver']);
export const rootCauseEnum = pgEnum('root_cause', [
  'vendor_fault',
  'driver_fault',
  'customer_fault',
  'unclear',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'stripe', 'mpesa']);
export const driverStatusEnum = pgEnum('driver_status', ['active', 'blocked']);
export const productStatusEnum = pgEnum('product_status', ['active', 'archived']);

// ============ TABLES ============

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  role: roleEnum('role').notNull(),
  phone: text('phone').notNull().unique(),
  name: text('name').notNull(),
  email: text('email'),
  hashedPassword: text('hashed_password'),
  mpesaNumber: text('mpesa_number'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const shops = pgTable(
  'shops',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    tagline: text('tagline'),
    vendorUserId: integer('vendor_user_id').references(() => users.id),
    vendorPhone: text('vendor_phone').notNull(),
    vendorMpesaNumber: text('vendor_mpesa_number'),
    aboutPhotoUrl: text('about_photo_url'),
    aboutName: text('about_name'),
    aboutOffering: text('about_offering'),
    aboutPurpose: text('about_purpose'),
    aboutProduction: text('about_production'),
    brandValues: jsonb('brand_values').$type<string[]>(),
    layoutVariant: layoutVariantEnum('layout_variant'),
    designTokens: jsonb('design_tokens').$type<{
      primary: string;
      secondary: string;
      accent: string;
      font_display: string;
      font_body: string;
      radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
      hero_treatment: 'warm-overlay' | 'cool-overlay' | 'polaroid' | 'clean' | 'pattern-bg';
    }>(),
    copyTone: text('copy_tone'),
    status: shopStatusEnum('status').notNull().default('draft'),
    yellowCardCount: integer('yellow_card_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('shops_status_idx').on(t.status),
  }),
);

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    shopId: integer('shop_id')
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    productionInfo: text('production_info'),
    deliveryDays: integer('delivery_days').default(1),
    priceKes: integer('price_kes').notNull(),
    photos: jsonb('photos').$type<string[]>().default([]),
    isTop5: boolean('is_top5').notNull().default(true),
    discountPct: integer('discount_pct').notNull().default(0),
    soldCount: integer('sold_count').notNull().default(0),
    status: productStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    shopIdx: index('products_shop_idx').on(t.shopId, t.isTop5),
  }),
);

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone').notNull(),
    customerEmail: text('customer_email'),
    deliveryZone: deliveryZoneEnum('delivery_zone').notNull(),
    deliveryAddress: text('delivery_address').notNull(),
    deliveryDate: text('delivery_date').notNull(),
    deliveryTimeNote: text('delivery_time_note'),
    deliveryFeeKes: integer('delivery_fee_kes').notNull(),
    initialShopId: integer('initial_shop_id')
      .notNull()
      .references(() => shops.id),
    productsSubtotalKes: integer('products_subtotal_kes').notNull(),
    marginKes: integer('margin_kes').notNull(),
    totalKes: integer('total_kes').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
    status: orderStatusEnum('status').notNull().default('new'),
    newsletterOptin: boolean('newsletter_optin').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('orders_status_idx').on(t.status, t.createdAt),
    initialShopIdx: index('orders_initial_shop_idx').on(t.initialShopId),
  }),
);

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    shopId: integer('shop_id')
      .notNull()
      .references(() => shops.id),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    qty: integer('qty').notNull().default(1),
    unitPriceKes: integer('unit_price_kes').notNull(),
    discountPct: integer('discount_pct').notNull().default(0),
    lineTotalKes: integer('line_total_kes').notNull(),
    marginKes: integer('margin_kes').notNull(),
    isCrossSell: boolean('is_cross_sell').notNull().default(false),
  },
  (t) => ({
    orderIdx: index('order_items_order_idx').on(t.orderId),
    shopIdx: index('order_items_shop_idx').on(t.shopId),
  }),
);

export const currencyRates = pgTable('currency_rates', {
  date: text('date').primaryKey(),
  usd: numeric('usd', { precision: 12, scale: 6 }).notNull(),
  eur: numeric('eur', { precision: 12, scale: 6 }).notNull(),
  chf: numeric('chf', { precision: 12, scale: 6 }).notNull(),
  source: text('source').notNull().default('exchangerate.host'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
});

export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  mpesaNumber: text('mpesa_number'),
  yellowCardCount: integer('yellow_card_count').notNull().default(0),
  status: driverStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const incidentCards = pgTable('incident_cards', {
  id: serial('id').primaryKey(),
  subjectType: incidentSubjectEnum('subject_type').notNull(),
  subjectId: integer('subject_id').notNull(),
  orderId: integer('order_id').references(() => orders.id),
  severity: incidentSeverityEnum('severity').notNull(),
  rootCause: rootCauseEnum('root_cause').notNull(),
  evidencePhotoUrl: text('evidence_photo_url'),
  description: text('description'),
  resolutionNotes: text('resolution_notes'),
  settlementKes: integer('settlement_kes').default(0),
  issuedBy: integer('issued_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const crossSellImpressions = pgTable('cross_sell_impressions', {
  id: serial('id').primaryKey(),
  triggerOrderId: integer('trigger_order_id')
    .notNull()
    .references(() => orders.id),
  suggestedProductId: integer('suggested_product_id')
    .notNull()
    .references(() => products.id),
  clicked: boolean('clicked').notNull().default(false),
  converted: boolean('converted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payouts = pgTable('payouts', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  grossKes: integer('gross_kes').notNull(),
  marginKes: integer('margin_kes').notNull(),
  deductionsKes: integer('deductions_kes').notNull().default(0),
  netKes: integer('net_kes').notNull(),
  mpesaRef: text('mpesa_ref'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const newsletterOptins = pgTable('newsletter_optins', {
  id: serial('id').primaryKey(),
  email: text('email'),
  phone: text('phone'),
  sourceShopId: integer('source_shop_id').references(() => shops.id),
  sourceOrderId: integer('source_order_id').references(() => orders.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiGenerations = pgTable('ai_generations', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id').references(() => shops.id),
  purpose: text('purpose').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  costUsd: numeric('cost_usd', { precision: 10, scale: 4 }),
  promptHash: text('prompt_hash'),
  responseJson: jsonb('response_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cardScans = pgTable('card_scans', {
  id: serial('id').primaryKey(),
  shopId: integer('shop_id')
    .notNull()
    .references(() => shops.id),
  cardVariant: text('card_variant'),
  sessionId: text('session_id'),
  userAgent: text('user_agent'),
  referer: text('referer'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============ RELATIONS ============

export const shopsRelations = relations(shops, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  initialShop: one(shops, {
    fields: [orders.initialShopId],
    references: [shops.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  shop: one(shops, {
    fields: [orderItems.shopId],
    references: [shops.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ============ TYPE EXPORTS ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type LayoutVariant = (typeof layoutVariantEnum.enumValues)[number];
export type DesignTokens = NonNullable<Shop['designTokens']>;
