import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db, schema } from './client';

// -------- Helpers --------
const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const today = new Date().toISOString().slice(0, 10);

async function main() {
// -------- 1. Clear existing data --------
console.log('Clearing existing data...');
await db.execute(
  sql`TRUNCATE TABLE order_items, orders, products, shops, drivers, currency_rates, users RESTART IDENTITY CASCADE`,
);

// -------- 2. Create admin user --------
console.log('Creating admin user...');
const [admin] = await db
  .insert(schema.users)
  .values({
    role: 'admin',
    phone: '+254700000001',
    name: 'Claurice',
    email: 'claurice@maybetomorrow.store',
    hashedPassword: bcrypt.hashSync('mt2026demo', 10),
    mpesaNumber: '+254700000001',
  })
  .returning();

// -------- 3. Define and insert shops --------
console.log('Creating shops...');

type ShopSeed = {
  slug: string;
  title: string;
  tagline: string;
  vendorPhone: string;
  vendorMpesaNumber: string;
  aboutPhotoUrl: string;
  aboutName: string;
  aboutOffering: string;
  aboutPurpose: string;
  aboutProduction: string;
  brandValues: string[];
  layoutVariant:
    | 'earthy-artisan'
    | 'vibrant-market'
    | 'ocean-calm'
    | 'heritage-story'
    | 'bold-maker';
  designTokens: {
    primary: string;
    secondary: string;
    accent: string;
    font_display: string;
    font_body: string;
    radius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    hero_treatment:
      | 'warm-overlay'
      | 'cool-overlay'
      | 'polaroid'
      | 'clean'
      | 'pattern-bg';
  };
  copyTone: string;
};

const shopSeeds: ShopSeed[] = [
  {
    slug: 'shoezaa',
    title: 'Shoezaa',
    tagline: 'Barefoot leather, grown by the tide.',
    vendorPhone: '+254711234501',
    vendorMpesaNumber: '+254711234501',
    aboutPhotoUrl: unsplash('1507003211169-0a1dd7228f2d', 800),
    aboutName: 'John Mwangi',
    aboutOffering:
      'Hand-stitched leather sandals and kofia slippers, shaped to each customer\'s foot on Diani beach.',
    aboutPurpose:
      'To keep Swahili shoemaking alive so the next generation of coastal boys has a trade to walk into.',
    aboutProduction:
      'Each pair is cut from locally tanned cowhide and finished under the palms using awl, waxed thread and recycled tyre soles.',
    brandValues: ['Handcrafted', 'Coastal', 'Grounded', 'Reclaimed', 'Personal'],
    layoutVariant: 'earthy-artisan',
    designTokens: {
      primary: '#8B4A1F',
      secondary: '#D9A066',
      accent: '#3E2A14',
      font_display: 'Fraunces',
      font_body: 'Work Sans',
      radius: 'md',
      hero_treatment: 'warm-overlay',
    },
    copyTone: 'Warm, grounded, quietly proud -- like an old craftsman who lets the work speak.',
  },
  {
    slug: 'mzizi',
    title: 'Mzizi Carvings',
    tagline: 'Roots carved slow, stories kept long.',
    vendorPhone: '+254722345602',
    vendorMpesaNumber: '+254722345602',
    aboutPhotoUrl: unsplash('1531384441138-2736e62e0919', 800),
    aboutName: 'Musa Mwakio',
    aboutOffering:
      'Hand-carved mahogany and wild olive wood animals, masks and table pieces from the forests behind Diani.',
    aboutPurpose:
      'To carry the Wakamba carving tradition forward and make sure each piece carries a name and a story, not just a price.',
    aboutProduction:
      'Seasoned fallen hardwoods are carved by hand over days, then oiled with coconut wax -- no stain, no shortcuts.',
    brandValues: ['Rooted', 'Patient', 'Ancestral', 'Wild', 'Silent'],
    layoutVariant: 'heritage-story',
    designTokens: {
      primary: '#1F3A2E',
      secondary: '#F3EADC',
      accent: '#B8863A',
      font_display: 'Cormorant Garamond',
      font_body: 'Inter',
      radius: 'sm',
      hero_treatment: 'polaroid',
    },
    copyTone: 'Contemplative and elder-like, as if told around a fire after dusk.',
  },
  {
    slug: 'pwani-beads',
    title: 'Pwani Beads',
    tagline: 'Color you can hear.',
    vendorPhone: '+254733456703',
    vendorMpesaNumber: '+254733456703',
    aboutPhotoUrl: unsplash('1508214751196-bcfd4ca60f91', 800),
    aboutName: 'Neema Leparmarai',
    aboutOffering:
      'Maasai-inspired beaded jewelry and hammered silver pieces, strung by the sea in Ukunda.',
    aboutPurpose:
      'To give the women in my family a steady income and turn our bead language into something travellers can wear home.',
    aboutProduction:
      'Every bracelet, collar and earring is hand-strung on waxed nylon with Czech glass beads and recycled silver from Mombasa workshops.',
    brandValues: ['Color', 'Rhythm', 'Strength', 'Heritage', 'Joy'],
    layoutVariant: 'vibrant-market',
    designTokens: {
      primary: '#E4362E',
      secondary: '#FFD23F',
      accent: '#1F4ED8',
      font_display: 'Outfit',
      font_body: 'DM Sans',
      radius: 'lg',
      hero_treatment: 'pattern-bg',
    },
    copyTone: 'Bright, playful, full of drumbeat -- like a market stall that sings back.',
  },
  {
    slug: 'kanga-dreams',
    title: 'Kanga Dreams',
    tagline: 'The ocean, wrapped in cloth.',
    vendorPhone: '+254744567804',
    vendorMpesaNumber: '+254744567804',
    aboutPhotoUrl: unsplash('1531123897727-8f129e1688ce', 800),
    aboutName: 'Asha Juma',
    aboutOffering:
      'Soft kanga and kikoy textile goods -- wraps, slings, pillows and totes -- sewn in the old Swahili way.',
    aboutPurpose:
      'To keep kanga as a living language for women on the coast, with every proverb stitched still readable.',
    aboutProduction:
      'Fabrics are sourced from Mombasa mills, washed in sea-salt water, then cut and hand-finished on a treadle Singer under a coconut roof.',
    brandValues: ['Soft', 'Flow', 'Voice', 'Indigo', 'Wrapped'],
    layoutVariant: 'ocean-calm',
    designTokens: {
      primary: '#1D4E7F',
      secondary: '#F7F3E9',
      accent: '#E6D3A3',
      font_display: 'Playfair Display',
      font_body: 'Inter',
      radius: 'xl',
      hero_treatment: 'cool-overlay',
    },
    copyTone: 'Soft, tidal, unhurried -- like a breeze through a kanga line at noon.',
  },
  {
    slug: 'coco-grove',
    title: 'Coco Grove',
    tagline: 'Nothing wasted. Everything loved.',
    vendorPhone: '+254755678905',
    vendorMpesaNumber: '+254755678905',
    aboutPhotoUrl: unsplash('1519741497674-611481863552', 800),
    aboutName: 'Ali Kombo',
    aboutOffering:
      'Coconut-shell bowls, lamps, holders and spoons inlaid with pieces of seashell from the Diani reef.',
    aboutPurpose:
      'To prove that coast waste is coast treasure -- every husk and shell I pick up walks into someone\'s kitchen.',
    aboutProduction:
      'Fallen coconuts and beach-combed shells are cleaned, cut with a hand saw, sanded and finished with food-safe coconut oil.',
    brandValues: ['Honest', 'Raw', 'Zero-Waste', 'Ocean', 'Slow'],
    layoutVariant: 'bold-maker',
    designTokens: {
      primary: '#0D0D0D',
      secondary: '#F8F5EE',
      accent: '#F26A4F',
      font_display: 'Space Grotesk',
      font_body: 'Inter',
      radius: 'none',
      hero_treatment: 'clean',
    },
    copyTone: 'Direct, confident, maker-talk -- short sentences, honest claims, no fluff.',
  },
];

const insertedShops = await db
  .insert(schema.shops)
  .values(
    shopSeeds.map((s) => ({
      slug: s.slug,
      title: s.title,
      tagline: s.tagline,
      vendorUserId: admin.id,
      vendorPhone: s.vendorPhone,
      vendorMpesaNumber: s.vendorMpesaNumber,
      aboutPhotoUrl: s.aboutPhotoUrl,
      aboutName: s.aboutName,
      aboutOffering: s.aboutOffering,
      aboutPurpose: s.aboutPurpose,
      aboutProduction: s.aboutProduction,
      brandValues: s.brandValues,
      layoutVariant: s.layoutVariant,
      designTokens: s.designTokens,
      copyTone: s.copyTone,
      status: 'live' as const,
    })),
  )
  .returning();

// -------- 4. Products per shop --------
console.log('Creating products...');

type ProductSeed = {
  name: string;
  description: string;
  productionInfo: string;
  priceKes: number;
  photos: string[];
  discountPct: number;
};

const productsByShop: Record<string, ProductSeed[]> = {
  shoezaa: [
    {
      name: 'Zaa Sandals',
      description:
        'Classic flat leather beach sandals with a braided toe-strap, made to soften with every wave.',
      productionInfo:
        'Vegetable-tanned cowhide upper, hand-stitched onto a recycled tyre sole in about four hours per pair.',
      priceKes: 3200,
      photos: [unsplash('1595950653106-6c9ebd614d3a'), unsplash('1542291026-7eec264c27ff')],
      discountPct: 0,
    },
    {
      name: 'Kofia Slipper',
      description:
        'Soft house-slipper cut in the round shape of a Swahili kofia cap, perfect for veranda evenings.',
      productionInfo:
        'Lined with undyed cotton, finished with beeswax and sewn by hand on the beach workbench.',
      priceKes: 2800,
      photos: [unsplash('1603808033192-082d6919d3e1'), unsplash('1515347619252-60a4bf4fff4f')],
      discountPct: 0,
    },
    {
      name: 'Ocean Walker',
      description:
        'Sturdy closed-toe leather walking sandal for long days exploring the south coast cliffs.',
      productionInfo:
        'Double-layer sole, waxed thread, hand-burnished edges -- built to take saltwater and coral dust.',
      priceKes: 4500,
      photos: [unsplash('1520256862855-398228c41684'), unsplash('1560343090-f0409e92791a')],
      discountPct: 0,
    },
    {
      name: 'Kid Zaa',
      description:
        'Tiny version of our Zaa sandal for little feet aged 2 to 8, with an adjustable ankle strap.',
      productionInfo:
        'Made from offcuts of the adult range so nothing from the hide is wasted.',
      priceKes: 1500,
      photos: [unsplash('1551107696-a4b0c5a0d9a2'), unsplash('1519415510236-718bdfcd89c8')],
      discountPct: 20,
    },
    {
      name: 'Tire-Sole Boot',
      description:
        'Low ankle boot with a reclaimed truck-tyre sole, cut for riding the matatu or the boda.',
      productionInfo:
        'Upper hand-stitched over a wooden last, sole section pulled from a Mombasa scrapyard.',
      priceKes: 4200,
      photos: [unsplash('1520639888713-7851133b1ed0'), unsplash('1449505278894-297fdb3edbc1')],
      discountPct: 0,
    },
  ],
  mzizi: [
    {
      name: 'Standing Elephant',
      description:
        'A grown bull elephant carved in a single block of mahogany, 30 cm tall, tusks inlaid with bone.',
      productionInfo:
        'Carved over three days from a fallen mahogany branch, oiled and rubbed with coconut wax.',
      priceKes: 3800,
      photos: [unsplash('1560343090-f0409e92791a'), unsplash('1549887534-1541e9326642')],
      discountPct: 0,
    },
    {
      name: 'Sleeping Hippo',
      description:
        'A round, heavy hippo dozing on its belly, shaped from a single piece of wild olive wood.',
      productionInfo:
        'Carved freehand with gouge and mallet, then sanded to satin and finished with beeswax.',
      priceKes: 2500,
      photos: [unsplash('1516912481808-3406841bd33c'), unsplash('1564419320461-6870880221ad')],
      discountPct: 15,
    },
    {
      name: 'Giraffe Mask',
      description:
        'A wall mask that reads as a giraffe in profile when seen from the side, 40 cm tall.',
      productionInfo:
        'Carved from reclaimed mninga board, lightly burned to bring out the grain, waxed twice.',
      priceKes: 4500,
      photos: [unsplash('1530631673369-bc20fdd17b30'), unsplash('1506806732259-39c2d0268443')],
      discountPct: 0,
    },
    {
      name: 'Sunbird Carving',
      description:
        'A tiny coastal sunbird, wings lifted, sitting on a twist of wild olive root.',
      productionInfo:
        'The root stays natural and wild, only the bird is carved -- no two pieces are alike.',
      priceKes: 1800,
      photos: [unsplash('1519681393784-d120267933ba'), unsplash('1516339901601-2e1b62dc0c45')],
      discountPct: 0,
    },
    {
      name: 'Table Lion',
      description:
        'A sitting lion the size of a mango, made to live on a desk or windowsill.',
      productionInfo:
        'Hand-carved from seasoned mahogany, signed with a small M on the underside.',
      priceKes: 2900,
      photos: [unsplash('1546182990-dffeafbe841d'), unsplash('1534567110353-1f46d62ffa4c')],
      discountPct: 0,
    },
  ],
  'pwani-beads': [
    {
      name: 'Shuka Necklace',
      description:
        'A multi-strand collar in the classic Maasai shuka palette of red, white and cobalt blue.',
      productionInfo:
        'Hand-strung on waxed nylon with Czech glass beads, finished with a silver hook clasp.',
      priceKes: 3600,
      photos: [unsplash('1515562141207-7a88fb7ce338'), unsplash('1535632066927-ab7c9ab60908')],
      discountPct: 0,
    },
    {
      name: 'Warrior Bracelet',
      description:
        'A wide cuff of tight bead rows in red and yellow with a thin silver rim, built to last.',
      productionInfo:
        'Beads are loomed row by row, then stitched onto a soft leather backing for comfort.',
      priceKes: 2200,
      photos: [unsplash('1611591437281-460bfbe1220a'), unsplash('1588444837495-c6c5f38c4e2e')],
      discountPct: 0,
    },
    {
      name: 'Layered Anklet',
      description:
        'Three thin beaded anklets tied together with a single silver bell, for walks along the tide line.',
      productionInfo:
        'Hand-strung in sets of three, knotted between each bead so they never fall apart.',
      priceKes: 1400,
      photos: [unsplash('1590736969955-71cc94901144'), unsplash('1572635148818-ef6fd45eb394')],
      discountPct: 0,
    },
    {
      name: 'Bead-Silver Earrings',
      description:
        'Hammered silver hoops with a small beaded fringe in the colors of the Kenyan flag.',
      productionInfo:
        'Silver is hammered in a Mombasa workshop; the bead fringe is added by hand in Ukunda.',
      priceKes: 3200,
      photos: [unsplash('1535632787350-4e68ef0ac584'), unsplash('1605100804763-247f67b3557e')],
      discountPct: 25,
    },
    {
      name: 'Twin Collar',
      description:
        'Two matching beaded disk collars -- one wider, one thinner -- worn together for ceremony days.',
      productionInfo:
        'Each disk is built on a rigid wire frame so it stands away from the neck like a shuka fan.',
      priceKes: 5200,
      photos: [unsplash('1601121141461-9d6647bca1ed'), unsplash('1602173574767-37ac01994b2a')],
      discountPct: 0,
    },
  ],
  'kanga-dreams': [
    {
      name: 'Wrap Kikoy',
      description:
        'A soft striped kikoy wrap long enough to use as a skirt, a shawl or a picnic cloth.',
      productionInfo:
        'Cotton woven in Mombasa, hemmed by hand on a treadle Singer and washed before shipping.',
      priceKes: 2400,
      photos: [unsplash('1493236296276-d17357e28088'), unsplash('1516762689617-e1cffcef479d')],
      discountPct: 0,
    },
    {
      name: 'Baby Sling Kanga',
      description:
        'A full kanga sized and reinforced to carry a baby on the back in the traditional way.',
      productionInfo:
        'Double-stitched at stress points and washed twice so it softens from the very first day.',
      priceKes: 2800,
      photos: [unsplash('1544005313-94ddf0286df2'), unsplash('1518806118471-f28b20a1d79d')],
      discountPct: 0,
    },
    {
      name: 'Beach Sarong Duo',
      description:
        'A matched pair of light beach sarongs in indigo and sand -- one for each of you.',
      productionInfo:
        'Light cotton, cut straight, hand-hemmed and folded with a sprig of dried frangipani.',
      priceKes: 3600,
      photos: [unsplash('1507525428034-b723cf961d3e'), unsplash('1528127269322-539801943592')],
      discountPct: 18,
    },
    {
      name: 'Hand-Stitched Pillow',
      description:
        'A square cushion cover made from a vintage kanga with its proverb still on the hem.',
      productionInfo:
        'Backed with undyed cotton, zipped, and stitched by hand over two evenings.',
      priceKes: 1800,
      photos: [unsplash('1519710164239-da123dc03ef4'), unsplash('1555041469-a586c61ea9bc')],
      discountPct: 0,
    },
    {
      name: 'Kanga Tote',
      description:
        'A roomy market tote cut from a bold red kanga, lined with plain cotton and long enough to hold a kikoi.',
      productionInfo:
        'Shoulder straps are folded four times for strength, and each bag carries a different proverb.',
      priceKes: 2200,
      photos: [unsplash('1590874103328-eac38a683ce7'), unsplash('1544816155-12df9643f363')],
      discountPct: 0,
    },
  ],
  'coco-grove': [
    {
      name: 'Half-Moon Bowl',
      description:
        'A deep coconut-shell bowl polished inside and left raw outside, just right for dip or rice.',
      productionInfo:
        'Cut from a fallen coconut with a hand saw, sanded through four grits, finished with coconut oil.',
      priceKes: 800,
      photos: [unsplash('1578985545062-69928b1d9587'), unsplash('1565193566173-7a0ee3dbe261')],
      discountPct: 0,
    },
    {
      name: 'Shell Pendant Lamp',
      description:
        'A hanging lamp made of dozens of small seashells strung around a coconut-shell dome.',
      productionInfo:
        'Each shell is beach-combed, drilled by hand and tied with natural twine -- no glue, no plastic.',
      priceKes: 4200,
      photos: [unsplash('1524634126442-357e0eac3c14'), unsplash('1513506003901-1e6a229e2d15')],
      discountPct: 0,
    },
    {
      name: 'Candle Holder Set',
      description:
        'A set of three graduated coconut-shell tea-light holders, inlaid with chips of blue shell.',
      productionInfo:
        'Inlays are set into small pockets cut with a Dremel and smoothed until flush with the shell.',
      priceKes: 1600,
      photos: [unsplash('1519710164239-da123dc03ef4'), unsplash('1511920170033-f8396924c348')],
      discountPct: 0,
    },
    {
      name: 'Soap Dish',
      description:
        'A small drained coconut-shell soap dish that lets your bar dry without sitting in water.',
      productionInfo:
        'Drain holes are drilled from beneath so they do not show; finished with food-safe oil.',
      priceKes: 900,
      photos: [unsplash('1585386959984-a4155224a1ad'), unsplash('1556228852-80b6e5eeff06')],
      discountPct: 15,
    },
    {
      name: 'Spoon Pair',
      description:
        'Two long coconut-shell spoons, one for serving and one for tasting, no two alike.',
      productionInfo:
        'Carved from the ridged side of the husk so each spoon has a natural grip built in.',
      priceKes: 1100,
      photos: [unsplash('1506368083636-6defb67639a7'), unsplash('1502741338009-cac2772e18bc')],
      discountPct: 0,
    },
  ],
};

const allProductInserts: typeof schema.products.$inferInsert[] = [];
for (const shop of insertedShops) {
  const seeds = productsByShop[shop.slug];
  if (!seeds) continue;
  for (const p of seeds) {
    allProductInserts.push({
      shopId: shop.id,
      name: p.name,
      description: p.description,
      productionInfo: p.productionInfo,
      deliveryDays: rand(1, 3),
      priceKes: p.priceKes,
      photos: p.photos,
      isTop5: true,
      discountPct: p.discountPct,
      soldCount: rand(0, 12),
    });
  }
}

const insertedProducts = await db
  .insert(schema.products)
  .values(allProductInserts)
  .returning();

// -------- 5. Boda-Boda driver --------
console.log('Creating driver...');
await db.insert(schema.drivers).values({
  name: 'Hassan',
  phone: '+254700000002',
  mpesaNumber: '+254700000002',
  status: 'active',
});

// -------- 6. Currency rates --------
console.log('Seeding currency rates...');
await db.insert(schema.currencyRates).values({
  date: today,
  usd: '0.007700',
  eur: '0.007100',
  chf: '0.007000',
  source: 'seed',
});

// -------- 7. Summary --------
console.log(
  `Seeded ${insertedShops.length} shops, ${insertedProducts.length} products, 1 admin, 1 driver, 1 currency rate`,
);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
