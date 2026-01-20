import { Link } from '@/lib/navigation';
import Image from 'next/image';
import ProductCard from '@/components/storefront/ProductCard';
import { supabase } from '@/lib/supabase';
import * as motion from "framer-motion/client";
import { getTranslations } from 'next-intl/server';

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
  const featuredProducts = await getFeaturedProducts();
  const t = await getTranslations('Home');

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden h-[90vh] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpg"
            alt="RA Sports Supplies Hero"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold font-heading uppercase tracking-tighter leading-none mb-6">
              {t('heroTitlePre')} <br />
              <span className="text-accent">{t('heroTitleAccent')}</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-4 text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light"
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/bundler"
              className="px-8 py-4 bg-accent text-white text-lg font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
            >
              {t('buildBundle')}
            </Link>
            <Link
              href="/products"
              className="px-8 py-4 border-2 border-white text-white text-lg font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
            >
              {t('shopAll')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-heading uppercase tracking-wide text-gray-900">{t('featured')}</h2>
            <div className="h-1 w-24 bg-accent mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/products" className="inline-block border-b-2 border-black pb-1 text-lg font-bold uppercase tracking-wide hover:text-accent hover:border-accent transition-colors">
              {t('viewAllProducts')}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <h3 className="text-2xl font-bold font-heading uppercase mb-2">{t('badge1Title')}</h3>
              <p className="text-gray-500">{t('badge1Text')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading uppercase mb-2">{t('badge2Title')}</h3>
              <p className="text-gray-500">{t('badge2Text')}</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading uppercase mb-2">{t('badge3Title')}</h3>
              <p className="text-gray-500">{t('badge3Text')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
