import { Link } from '@/lib/navigation';
import Image from 'next/image';
import ProductCard from '@/components/storefront/ProductCard';
import { supabase } from '@/lib/supabase';
import * as motion from "framer-motion/client";
import { getTranslations } from 'next-intl/server';
import { getAdminBundles } from '@/lib/actions/bundleActions';
import BundleCard from '@/components/storefront/BundleCard';
import { getHeroSlides } from '@/lib/actions/hero';
import HeroSlider from '@/components/storefront/HeroSlider';

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .limit(4);

  if (!data) return [];

  return data.map(p => {
    let imageUrl = '';

    // Handle images array (Postgres array or JSONb) or JSON string
    if (Array.isArray(p.images) && p.images.length > 0) {
      imageUrl = p.images[0];
    } else if (typeof p.images === 'string') {
      try {
        const parsed = JSON.parse(p.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          imageUrl = parsed[0];
        }
      } catch (e) {
        // If not JSON, assume it's a single URL string (legacy/fallback)
        if (p.images.startsWith('http')) {
          imageUrl = p.images;
        }
      }
    }

    // Fallback to legacy image_url if still empty
    if (!imageUrl && p.image_url) {
      imageUrl = p.image_url;
    }

    return {
      id: p.id,
      name: p.name,
      name_ar: p.name_ar,
      price: p.base_price,
      category: p.category,
      image: imageUrl,
      variants: p.variants || []
    };
  });
}

export default async function Home() {
  const [featuredProducts, adminBundles, heroSlides] = await Promise.all([
    getFeaturedProducts(),
    getAdminBundles(),
    getHeroSlides()
  ]);
  const t = await getTranslations('Home');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      {/* Hero Section */}
      <HeroSlider slides={heroSlides} />

      {/* Featured Products */}
      <section className="py-24 bg-background transition-colors duration-300">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-heading uppercase tracking-wide text-foreground">{t('featured')}</h2>
            <div className="h-1 w-24 bg-accent mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Featured Bundles Section */}
          <div className="text-center mt-24 mb-16">
            <h2 className="text-4xl font-bold font-heading uppercase tracking-wide text-foreground">Featured Bundles</h2>
            <div className="h-1 w-24 bg-accent mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {adminBundles.length > 0 ? (
              adminBundles.map((bundle: any) => (
                <BundleCard key={bundle.id} {...bundle} />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8 font-light italic">
                {t('noBundles')}
              </div>
            )}
          </div>


          <div className="mt-16 text-center">
            <Link href="/products" className="inline-block border-b-2 border-foreground pb-1 text-lg font-bold uppercase tracking-wide hover:text-accent hover:border-accent transition-colors text-foreground">
              {t('viewAllProducts')}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20 bg-secondary/10 border-t border-border transition-colors duration-300">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <h3 className="text-2xl font-bold font-heading uppercase mb-2 text-foreground">{t('badge1Title')}</h3>
              <p className="text-muted-foreground">{t('badge1Text')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading uppercase mb-2 text-foreground">{t('badge2Title')}</h3>
              <p className="text-muted-foreground">{t('badge2Text')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading uppercase mb-2 text-foreground">{t('badge3Title')}</h3>
              <p className="text-muted-foreground">{t('badge3Text')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
