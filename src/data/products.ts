export type Product = {
  id: string;
  name: string;
  specification: string;
  description: string;
  price: number;
  currency: 'TND';
  image: string;
  category: string;
  sku: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

const product = (
  id: string,
  name: string,
  specification: string,
  price: number,
  category: string,
  visual: string,
  stock = 12
): Product => ({
  id,
  name,
  specification,
  price,
  currency: 'TND',
  image: visual,
  category,
  sku: `VAP-${id.toUpperCase()}`,
  stock,
  description: `${name} — ${specification}. Une sélection VAPPINO pensée pour celles et ceux qui recherchent une expérience fiable et soignée.`,
  createdAt: '2026-09-28T00:00:00.000Z',
  updatedAt: '2026-09-28T00:00:00.000Z',
});

export const products: Product[] = [
  product('mazaya-80k', 'Mazaya', '80K', 65, 'Disposables', 'lime'),
  product('fakher-60k', 'Fakher', '60K', 60, 'Disposables', 'gold'),
  product('pava-pod', 'Pava Pod', 'Pod', 70, 'Pods', 'cyan'),
  product('nexpod-30k-kit', 'Nexpod', '30K Kit', 50, 'Pods', 'mint'),
  product('nexpod-30k-capsule', 'Nexpod', '30K Capsule', 40, 'Capsules', 'mint'),
  product('capsule-15k', 'Capsule', '15K', 37, 'Capsules', 'rose'),
  product('fakher-25k', 'Fakher', '25K', 45, 'Disposables', 'red'),
  product('nexbar-10k', 'Nexbar', '10K', 38, 'Disposables', 'orange'),
  product('vozol-50k-click', 'Vozol', '50K Click', 50, 'Disposables', 'blue'),
  product('salt-wotofo-30ml', 'Salt Wotofo', '30ml', 30, 'E-liquides', 'teal'),
  product('salt-vozol-30ml', 'Salt Vozol', '30ml', 30, 'E-liquides', 'blue'),
  product('capsule-nexpod-20k', 'Capsule Nexpod', '20K', 38, 'Capsules', 'mint'),
  product('nexpod-20k', 'Nexpod', '20K', 45, 'Pods', 'green'),
  product('fakher-15k', 'Fakher', '15K', 40, 'Disposables', 'red'),
  product('salt-jnr-10ml', 'Salt JNR', '10ml', 15, 'E-liquides', 'yellow'),
  product('mech-pava', 'Mech Pava', 'Mech', 18, 'Accessoires', 'slate'),
  product('elfbar-30k-shisha', 'Elfbar', '30K Shisha', 40, 'Disposables', 'purple'),
  product('capsule-5k', 'Capsule', '5K', 20, 'Capsules', 'rose'),
  product('snus-standard', 'Snus', 'Standard', 18, 'Snus', 'navy'),
  product('jnr-40k', 'JNR', '40K', 48, 'Disposables', 'orange'),
  product('jnr-60k', 'JNR', '60K', 55, 'Disposables', 'orange'),
  product('jnr-42k', 'JNR', '42K', 50, 'Disposables', 'orange'),
  product('dragbar-s2-12k', 'Dragbar S2', '12K', 35, 'Disposables', 'cyan'),
  product('vozol-8k', 'Vozol', '8K', 30, 'Disposables', 'blue'),
  product('nano-1k', 'Nano', '1K', 23, 'Disposables', 'silver'),
  product('fighter-fuel-32k', 'Fighter Fuel', '32K + 2 Salt', 45, 'Kits', 'lime'),
  product('salt-wotofo-15ml', 'Salt Wotofo', '15ml', 20, 'E-liquides', 'teal'),
];

export const categories = ['Tous les produits', ...Array.from(new Set(products.map(({ category }) => category)))];
export const specifications = ['Toutes les capacités', ...Array.from(new Set(products.map(({ specification }) => specification)))];
