import React, { lazy, Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';
import { unwrapCategoriesResponse, apiMessage } from '../lib/api';
import HomeBannerSlider from '../components/HomeBannerSlider';
import HomeCategoryMobileRow from '../components/HomeCategoryMobileRow';
import HomeHero from '../components/HomeHero';
import HomeCategoriesGrid from '../components/HomeCategoriesGrid';
import LazySection from '../components/LazySection';
import HomeSectionFallback from '../components/HomeSectionFallback';
import { homeRouteSeo } from '../config/routeSeo';
import { hidePrerenderFallback } from '../lib/prerenderFallback';
import { buildBreadcrumbListSchema } from '../utils/seo';
import {
  buildFAQPageSchema,
  buildSpeakableSpecificationSchema,
  editorialAuthorName,
  editorialAuthorSameAs
} from '../utils/jsonLd';
import api from '../api/client';

const HomeFlashSale = lazy(() => import('../components/HomeFlashSale'));
const HomePopularBrands = lazy(() => import('../components/HomePopularBrands'));
const HomeCategorySaleRows = lazy(() => import('../components/HomeCategorySaleRows'));
const HomeWhyChoose = lazy(() => import('../components/HomeWhyChoose'));
const HomeTopSummary = lazy(() => import('../components/HomeTopSummary'));
const HomeFaq = lazy(() => import('../components/HomeFaq'));

/** FAQ data for schema — imported statically so schema is immediate */
const HOME_FAQ_SCHEMA_DATA = [
  { question: 'How do I order online from Bazaar in Hyderabad?', answer: 'Browse products on bazaar-pk.com, add items to your cart, fill in your Hyderabad delivery address, choose cash on delivery or bank transfer (Easypaisa / JazzCash), and place your order. You get an order confirmation instantly. No account is required — guest checkout is available.' },
  { question: 'What payment methods does Bazaar accept?', answer: 'Bazaar accepts cash on delivery (COD) across Pakistan. For online payment, you can use Easypaisa or JazzCash mobile wallets by transferring to our registered number. This keeps your transaction simple and secure without needing a credit card.' },
  { question: 'How fast is delivery in Hyderabad and the rest of Pakistan?', answer: 'Orders within Hyderabad are typically delivered in 1–2 business days. For the rest of Pakistan, standard delivery takes 3–5 business days. Express and next-day options are available at checkout for faster delivery.' },
  { question: 'What is Bazaar\'s return and refund policy?', answer: 'Bazaar offers a 7-day return window from the date of delivery. If your item is damaged, defective, or not as described, contact our support team and we will arrange a free return pickup. Refunds are credited to your Bazaar wallet or original payment method within 3–5 business days.' },
  { question: 'Is Bazaar a trusted online store in Pakistan?', answer: 'Yes. Bazaar uses SSL-encrypted checkout, verifies all sellers, and provides a transparent return policy. Our customer support team is available via WhatsApp and phone in Hyderabad. Every order includes tracking so you know exactly when your delivery arrives.' },
  { question: 'Can I buy school bags and supplies on Bazaar?', answer: 'Absolutely. Bazaar stocks a wide range of school bags, stationery, and educational supplies with competitive pricing. Search "school bag" on our shop page to browse options with detailed images, specs, and customer reviews. Delivery is available across Hyderabad and Pakistan.' }
];

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const { addToCart } = useCart();

  const fetchCategories = useCallback(async (attempt = 1) => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await api.get('/api/categories');
      const list = unwrapCategoriesResponse(res);
      setCategories(list);
    } catch (error) {
      console.error('Categories fetch error:', error);
      if (attempt < 3) {
        setTimeout(() => fetchCategories(attempt + 1), 3000);
      } else {
        setCategoriesError(String(apiMessage(error, 'Failed to load categories') || 'Failed to load categories'));
        setCategories([]);
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!categoriesLoading) hidePrerenderFallback();
  }, [categoriesLoading]);

  const handleAddToCart = async (product) => {
    await addToCart(product, 1);
  };

  /** Homepage schema: BreadcrumbList + FAQPage + WebPage/Speakable + Article */
  const homeSchema = useMemo(() => {
    const schemas = [];

    // BreadcrumbList
    const breadcrumb = buildBreadcrumbListSchema([{ name: 'Home', path: '/' }]);
    if (breadcrumb) schemas.push(breadcrumb);

    // FAQPage
    const faq = buildFAQPageSchema(HOME_FAQ_SCHEMA_DATA);
    if (faq) schemas.push(faq);

    // Speakable
    const speakable = buildSpeakableSpecificationSchema(
      'https://www.bazaar-pk.com/',
      ['.rozana-hero__title', '.home-top-summary__answer']
    );
    if (speakable) schemas.push(speakable);

    // WebPage with dateModified
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': 'https://www.bazaar-pk.com/#webpage',
      name: 'Online Shopping Hyderabad — Groceries & Essentials | Bazaar',
      description: 'Shop groceries, homecare, fashion & electronics with fast delivery in Hyderabad. Bazaar is the best online store in Hyderabad, Pakistan.',
      url: 'https://www.bazaar-pk.com/',
      datePublished: '2024-01-15',
      dateModified: new Date().toISOString().slice(0, 10),
      inLanguage: 'en',
      isPartOf: { '@id': 'https://www.bazaar-pk.com/#website' },
      about: {
        '@type': 'Organization',
        '@id': 'https://www.bazaar-pk.com/#organization'
      },
      author: {
        '@type': 'Organization',
        name: editorialAuthorName,
        sameAs: editorialAuthorSameAs
      },
      publisher: {
        '@id': 'https://www.bazaar-pk.com/#organization'
      }
    });

    return schemas;
  }, []);

  return (
    <>
      <SEO
        title={homeRouteSeo.title}
        description={homeRouteSeo.description}
        keywords={homeRouteSeo.keywords}
        canonicalUrl="/"
        schema={homeSchema}
      />

      <div className="home-top-stack">
        <div className="home-top-stack__lead">
          <HomeBannerSlider />
          <HomeCategoryMobileRow categories={categories} loading={categoriesLoading} />
        </div>
        <HomeHero />
      </div>

      <section className="section home-categories-browse" id="categories" aria-label="Shop categories">
        <div className="container">
          <HomeCategoriesGrid
            categories={categories}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={fetchCategories}
          />
        </div>
      </section>

      <LazySection minHeight="280px">
        <Suspense fallback={<HomeSectionFallback label="Loading flash sale" />}>
          <HomeFlashSale />
        </Suspense>
      </LazySection>

      <LazySection minHeight="220px">
        <Suspense fallback={<HomeSectionFallback label="Loading brands" />}>
          <HomePopularBrands />
        </Suspense>
      </LazySection>

      <LazySection minHeight="360px">
        <Suspense fallback={<HomeSectionFallback label="Loading category deals" />}>
          <HomeCategorySaleRows onAddToCart={handleAddToCart} />
        </Suspense>
      </LazySection>

      <LazySection minHeight="240px">
        <Suspense fallback={<HomeSectionFallback label="Loading features" />}>
          <HomeWhyChoose />
        </Suspense>
      </LazySection>

      {/* New sections AFTER "Why Bazaar" */}
      <LazySection minHeight="320px">
        <Suspense fallback={<HomeSectionFallback label="Loading summary" />}>
          <HomeTopSummary />
        </Suspense>
      </LazySection>

      <LazySection minHeight="400px">
        <Suspense fallback={<HomeSectionFallback label="Loading FAQ" />}>
          <HomeFaq />
        </Suspense>
      </LazySection>
    </>
  );
};

export default Home;
