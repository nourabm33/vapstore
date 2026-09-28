import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { categories, products, specifications, type Product } from '@/data/products';

type CartItem = { productId: string; quantity: number };
type View = 'home' | 'shop' | 'detail' | 'cart' | 'checkout' | 'success';
type Sort = 'featured' | 'price-low' | 'price-high' | 'name';

const formatPrice = (price: number) => `${price.toFixed(0)} DT`;

function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div className={`product-visual visual-${product.image} ${large ? 'product-visual-large' : ''}`} role="img" aria-label={`Visuel ${product.name}`}>
      <span className="visual-glow" />
      <span className="visual-spec">{product.specification}</span>
      <span className="visual-brand">{product.name}</span>
      <span className="visual-shape" />
      <span className="visual-shine" />
    </div>
  );
}

function App() {
  const [view, setView] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [specification, setSpecification] = useState(specifications[0]);
  const [sort, setSort] = useState<Sort>('featured');
  const [priceLimit, setPriceLimit] = useState(70);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch = !normalizedSearch || `${product.name} ${product.specification}`.toLowerCase().includes(normalizedSearch);
      const matchesCategory = category === categories[0] || product.category === category;
      const matchesSpecification = specification === specifications[0] || product.specification === specification;
      return matchesSearch && matchesCategory && matchesSpecification && product.price <= priceLimit;
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return products.indexOf(a) - products.indexOf(b);
    });
  }, [category, priceLimit, search, sort, specification]);

  const cartProducts = cart
    .map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }))
    .filter((item): item is CartItem & { product: Product } => Boolean(item.product));
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartProducts.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const addToCart = (productId: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) return current.map((item) => item.productId === productId ? { ...item, quantity: Math.min(item.quantity + quantity, 20) } : item);
      return [...current, { productId, quantity: Math.min(Math.max(quantity, 1), 20) }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) => current.map((item) => item.productId === productId ? { ...item, quantity: Math.max(0, Math.min(20, item.quantity + delta)) } : item).filter((item) => item.quantity > 0));
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goShop = () => {
    setView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearch('');
    setCategory(categories[0]);
    setSpecification(specifications[0]);
    setPriceLimit(70);
    setSort('featured');
  };

  return (
    <div className="app-shell">
      <div className="topline"><span><BadgeCheck size={14} /> Livraison rapide dans toute la Tunisie</span><span className="topline-desktop">Paiement à la livraison disponible</span><span className="topline-desktop">Support client 7j/7</span></div>
      <header className="site-header">
        <button className="brand" onClick={() => setView('home')} aria-label="Retour à l'accueil"><span className="brand-mark">V</span><span>VAPPINO</span></button>
        <nav className="main-nav" aria-label="Navigation principale">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Accueil</button>
          <button className={view === 'shop' ? 'active' : ''} onClick={goShop}>Boutique</button>
          <button onClick={() => { setView('shop'); setCategory('Kits'); }}>Nouveautés</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button" onClick={goShop} aria-label="Rechercher"><Search size={19} /></button>
          <button className="cart-button" onClick={() => setView('cart')} aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}><ShoppingBag size={19} /><span>Panier</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
        </div>
      </header>

      {view === 'home' && <Home goShop={goShop} openProduct={openProduct} addToCart={addToCart} />}
      {view === 'shop' && <Shop search={search} setSearch={setSearch} category={category} setCategory={setCategory} specification={specification} setSpecification={setSpecification} sort={sort} setSort={setSort} priceLimit={priceLimit} setPriceLimit={setPriceLimit} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} filteredProducts={filteredProducts} openProduct={openProduct} addToCart={addToCart} resetFilters={resetFilters} />}
      {view === 'detail' && selectedProduct && <Detail product={selectedProduct} addToCart={addToCart} goShop={goShop} />}
      {view === 'cart' && <Cart cartProducts={cartProducts} cartTotal={cartTotal} cartCount={cartCount} updateQuantity={updateQuantity} setView={setView} setCart={setCart} />}
      {view === 'checkout' && <Checkout cartProducts={cartProducts} cartTotal={cartTotal} cartCount={cartCount} setView={setView} onSubmitted={() => { setOrderSubmitted(true); setView('success'); }} />}
      {view === 'success' && <Success orderSubmitted={orderSubmitted} setView={setView} goShop={goShop} />}
      <Footer />
    </div>
  );
}

function Home({ goShop, openProduct, addToCart }: { goShop: () => void; openProduct: (product: Product) => void; addToCart: (id: string) => void }) {
  const featured = products.slice(0, 4);
  return <main>
    <section className="hero section-wrap">
      <div className="hero-copy"><div className="eyebrow"><Sparkles size={15} /> La sélection qui fait la différence</div><h1>Le goût de<br /><em>l'exception.</em></h1><p>Découvrez VAPPINO, votre destination premium pour vapes, pods et e-liquides sélectionnés avec exigence.</p><div className="hero-actions"><button className="button button-primary" onClick={goShop}>Découvrir la boutique <ArrowRight size={17} /></button><button className="text-button" onClick={() => document.getElementById('selection')?.scrollIntoView({ behavior: 'smooth' })}>Voir la sélection <ChevronDown size={16} /></button></div><div className="hero-trust"><span><Zap size={16} /> Arrivages réguliers</span><span><PackageCheck size={16} /> Stock vérifié</span></div></div>
      <div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-product product-hero"><span>VAPPINO</span><strong>80K</strong><small>PREMIUM SELECTION</small></div><div className="hero-label"><span>N°01</span><small>SHOP<br />IN TUNISIA</small></div></div>
    </section>
    <section className="stats section-wrap"><div><strong>27</strong><span>références choisies</span></div><div><strong>6</strong><span>univers à explorer</span></div><div><strong>7/7</strong><span>conseils disponibles</span></div><div><strong>100%</strong><span>sélection VAPPINO</span></div></section>
    <section className="selection section-wrap" id="selection"><div className="section-heading"><div><span className="eyebrow">À ne pas manquer</span><h2>La sélection VAPPINO</h2></div><button className="text-button" onClick={goShop}>Voir tout <ArrowRight size={16} /></button></div><div className="product-grid">{featured.map((product) => <ProductCard key={product.id} product={product} openProduct={openProduct} addToCart={addToCart} />)}</div></section>
    <section className="category-banner section-wrap"><div><span className="eyebrow">Trouvez votre univers</span><h2>Votre style.<br /><em>Votre rythme.</em></h2><p>Des formats nomades aux essentiels du quotidien, composez une sélection qui vous ressemble.</p><button className="button button-light" onClick={goShop}>Explorer les produits <ArrowRight size={17} /></button></div><div className="banner-disc"><span>V</span><small>VAPPINO<br />CURATED</small></div></section>
  </main>;
}

function Shop(props: { search: string; setSearch: (value: string) => void; category: string; setCategory: (value: string) => void; specification: string; setSpecification: (value: string) => void; sort: Sort; setSort: (value: Sort) => void; priceLimit: number; setPriceLimit: (value: number) => void; filtersOpen: boolean; setFiltersOpen: (value: boolean) => void; filteredProducts: Product[]; openProduct: (product: Product) => void; addToCart: (id: string) => void; resetFilters: () => void }) {
  return <main className="shop-page section-wrap"><div className="shop-heading"><div><span className="eyebrow">Le catalogue</span><h1>Trouvez votre <em>prochaine</em> favorite.</h1></div><p>Une sélection précise, des informations claires, rien de superflu.</p></div><div className="shop-toolbar"><label className="search-field"><Search size={18} /><input value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="Rechercher un produit ou une capacité" aria-label="Rechercher un produit ou une capacité" /></label><button className="filter-toggle" onClick={() => props.setFiltersOpen(!props.filtersOpen)}><SlidersHorizontal size={17} /> Filtres</button><label className="sort-field"><span>Trier par</span><select value={props.sort} onChange={(event) => props.setSort(event.target.value as Sort)}><option value="featured">Notre sélection</option><option value="price-low">Prix croissant</option><option value="price-high">Prix décroissant</option><option value="name">Nom A–Z</option></select><ChevronDown size={15} /></label></div><div className="shop-layout"><aside className={`filters ${props.filtersOpen ? 'filters-open' : ''}`}><div className="filters-title"><strong>Affiner la sélection</strong><button onClick={() => props.setFiltersOpen(false)} aria-label="Fermer les filtres"><X size={18} /></button></div><FilterGroup title="Catégorie"><div className="filter-list">{categories.map((item) => <button className={props.category === item ? 'selected' : ''} key={item} onClick={() => props.setCategory(item)}>{item}<span>{item === categories[0] ? products.length : products.filter((product) => product.category === item).length}</span></button>)}</div></FilterGroup><FilterGroup title="Capacité"><select className="wide-select" value={props.specification} onChange={(event) => props.setSpecification(event.target.value)}>{specifications.map((item) => <option key={item}>{item}</option>)}</select></FilterGroup><FilterGroup title={`Prix maximum · ${formatPrice(props.priceLimit)}`}><input className="range" type="range" min="15" max="70" step="1" value={props.priceLimit} onChange={(event) => props.setPriceLimit(Number(event.target.value))} /><div className="range-labels"><span>15 DT</span><span>70 DT</span></div></FilterGroup><button className="reset-button" onClick={props.resetFilters}>Réinitialiser les filtres</button></aside><div className="results"><div className="results-meta"><span><strong>{props.filteredProducts.length}</strong> produits</span>{props.search && <span className="active-filter">Recherche : {props.search} <button onClick={() => props.setSearch('')}><X size={12} /></button></span>}</div>{props.filteredProducts.length > 0 ? <div className="product-grid">{props.filteredProducts.map((product) => <ProductCard key={product.id} product={product} openProduct={props.openProduct} addToCart={props.addToCart} />)}</div> : <div className="empty-state"><Search size={32} /><h2>Aucun produit trouvé</h2><p>Essayez une autre recherche ou réinitialisez vos filtres.</p><button className="button button-primary" onClick={props.resetFilters}>Réinitialiser</button></div>}</div></div></main>;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) { return <div className="filter-group"><h3>{title}</h3>{children}</div>; }

function ProductCard({ product, openProduct, addToCart }: { product: Product; openProduct: (product: Product) => void; addToCart: (id: string) => void }) {
  return <article className="product-card"><button className="product-image-button" onClick={() => openProduct(product)} aria-label={`Voir ${product.name} ${product.specification}`}><ProductVisual product={product} /><span className="card-badge">VAPPINO PICK</span><span className="wishlist"><Heart size={16} /></span></button><div className="product-card-body"><button className="product-name" onClick={() => openProduct(product)}>{product.name}</button><span className="product-spec">{product.specification}</span><div className="product-card-footer"><strong>{formatPrice(product.price)}</strong><button className="add-button" onClick={() => addToCart(product.id)} aria-label={`Ajouter ${product.name} au panier`}><Plus size={17} /></button></div></div></article>;
}

function Detail({ product, addToCart, goShop }: { product: Product; addToCart: (id: string, quantity?: number) => void; goShop: () => void }) {
  const [quantity, setQuantity] = useState(1);
  return <main className="detail-page section-wrap"><button className="back-button" onClick={goShop}><ChevronLeft size={17} /> Retour à la boutique</button><div className="detail-layout"><div className="detail-visual"><ProductVisual product={product} large /><span className="detail-visual-caption">VAPPINO / {product.sku}</span></div><div className="detail-copy"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><span className="detail-spec">{product.specification}</span><div className="detail-price">{formatPrice(product.price)}</div><div className="detail-divider" /><p>{product.description}</p><div className="availability"><CircleCheck size={18} /><span>En stock · Expédition rapide</span></div><div className="detail-actions"><div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Diminuer la quantité"><Minus size={16} /></button><strong>{quantity}</strong><button onClick={() => setQuantity(Math.min(20, quantity + 1))} aria-label="Augmenter la quantité"><Plus size={16} /></button></div><button className="button button-primary" onClick={() => addToCart(product.id, quantity)}>Ajouter au panier <ShoppingBag size={17} /></button></div><div className="detail-notes"><span><PackageCheck size={17} /> Livraison à domicile</span><span><BadgeCheck size={17} /> Produit vérifié</span></div></div></div></main>;
}

function Cart({ cartProducts, cartTotal, cartCount, updateQuantity, setView, setCart }: { cartProducts: (CartItem & { product: Product })[]; cartTotal: number; cartCount: number; updateQuantity: (id: string, delta: number) => void; setView: (view: View) => void; setCart: (items: CartItem[]) => void }) {
  if (cartProducts.length === 0) return <main className="simple-page section-wrap"><div className="empty-state cart-empty"><ShoppingBag size={38} /><span className="eyebrow">Votre sélection</span><h1>Votre panier est vide.</h1><p>Les pièces qui vous plaisent apparaîtront ici.</p><button className="button button-primary" onClick={() => setView('shop')}>Découvrir la boutique <ArrowRight size={17} /></button></div></main>;
  return <main className="cart-page section-wrap"><div className="page-heading"><span className="eyebrow">Votre sélection</span><h1>Le panier.</h1><span className="muted">{cartCount} article{cartCount > 1 ? 's' : ''}</span></div><div className="cart-layout"><div className="cart-list">{cartProducts.map(({ product, quantity }) => <div className="cart-item" key={product.id}><ProductVisual product={product} /><div className="cart-item-info"><button onClick={() => setView('detail')}>{product.name}</button><span>{product.specification}</span><strong>{formatPrice(product.price)}</strong></div><div className="quantity-control"><button onClick={() => updateQuantity(product.id, -1)} aria-label="Diminuer la quantité"><Minus size={15} /></button><strong>{quantity}</strong><button onClick={() => updateQuantity(product.id, 1)} aria-label="Augmenter la quantité"><Plus size={15} /></button></div><strong className="line-total">{formatPrice(product.price * quantity)}</strong><button className="remove-button" onClick={() => updateQuantity(product.id, -quantity)} aria-label={`Retirer ${product.name}`}><Trash2 size={17} /></button></div>)}<button className="clear-button" onClick={() => setCart([])}>Vider le panier</button></div><aside className="summary-card"><span className="eyebrow">Résumé</span><div className="summary-row"><span>Sous-total</span><strong>{formatPrice(cartTotal)}</strong></div><div className="summary-row"><span>Livraison</span><span className="free">À confirmer</span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></div><button className="button button-primary full-width" onClick={() => setView('checkout')}>GET MY ORDER <ArrowRight size={17} /></button><p className="summary-note">Le montant final est confirmé par VAPPINO lors du traitement de la commande.</p></aside></div></main>;
}

function Checkout({ cartProducts, cartTotal, cartCount, setView, onSubmitted }: { cartProducts: (CartItem & { product: Product })[]; cartTotal: number; cartCount: number; setView: (view: View) => void; onSubmitted: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (!/^\+?[0-9\s-]{8,18}$/.test(phone.trim())) { setError('Veuillez renseigner un numéro de téléphone valide.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }, body: JSON.stringify({ customerName: name.trim(), customerPhone: phone.trim(), notes: notes.trim() || undefined, items: cartProducts.map(({ product, quantity }) => ({ productId: product.id, quantity })) }) });
      if (!response.ok) throw new Error('order_failed');
      onSubmitted();
    } catch { setError('La commande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.'); setSubmitting(false); }
  };
  return <main className="checkout-page section-wrap"><button className="back-button" onClick={() => setView('cart')}><ChevronLeft size={17} /> Retour au panier</button><div className="checkout-heading"><span className="eyebrow">Dernière étape</span><h1>Finalisez votre <em>commande.</em></h1><p>Nous vous recontactons rapidement pour confirmer la livraison.</p></div><div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><label>Nom complet<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Votre nom et prénom" /></label><label>Numéro de téléphone<input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+216 00 000 000" inputMode="tel" /></label><label>Notes <span className="optional">Facultatif</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Une précision pour la livraison ?" rows={4} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary full-width" disabled={submitting}>{submitting ? 'ENVOI EN COURS…' : 'GET MY ORDER'} {!submitting && <ArrowRight size={17} />}</button><p className="form-privacy">Vos informations servent uniquement à traiter votre commande.</p></form><aside className="summary-card order-summary"><span className="eyebrow">Votre commande · {cartCount} article{cartCount > 1 ? 's' : ''}</span>{cartProducts.map(({ product, quantity }) => <div className="order-line" key={product.id}><div><strong>{product.name}</strong><span>{product.specification} · Qté {quantity}</span></div><strong>{formatPrice(product.price * quantity)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></div></aside></div></main>;
}

function Success({ setView, goShop }: { orderSubmitted: boolean; setView: (view: View) => void; goShop: () => void }) { return <main className="simple-page section-wrap"><div className="success-card"><div className="success-icon"><CircleCheck size={34} /></div><span className="eyebrow">Commande reçue</span><h1>Merci pour votre confiance.</h1><p>Votre demande a bien été transmise à VAPPINO. Notre équipe vous contactera bientôt pour confirmer les détails de la livraison.</p><div className="success-actions"><button className="button button-primary" onClick={goShop}>Continuer mes achats <ArrowRight size={17} /></button><button className="text-button" onClick={() => setView('home')}>Retour à l'accueil</button></div></div></main>; }

function Footer() { return <footer className="site-footer"><div className="section-wrap footer-grid"><div><button className="brand footer-brand"><span className="brand-mark">V</span><span>VAPPINO</span></button><p>La sélection vape, pensée avec goût.<br />Vape gros & détail en Tunisie.</p></div><div><h3>Découvrir</h3><a href="#selection">La sélection</a><a href="#">Nouveautés</a><a href="#">Nos univers</a></div><div><h3>Besoin d'aide ?</h3><a href="#">Livraison</a><a href="#">Contactez-nous</a><a href="#">Questions fréquentes</a></div><div><h3>Suivez-nous</h3><p className="footer-note">Des arrivages, des conseils<br />et de bonnes découvertes.</p><div className="socials"><span>IG</span><span>FB</span><span>WA</span></div></div></div><div className="section-wrap footer-bottom"><span>© 2026 VAPPINO. Tous droits réservés.</span><span>Conçu pour la Tunisie · DT</span></div></footer>; }

export default App;
