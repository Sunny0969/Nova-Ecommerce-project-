import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
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
import api from '../api/client';

const HomeFlashSale = lazy(() => import('../components/HomeFlashSale'));
const HomePopularBrands = lazy(() => import('../components/HomePopularBrands'));
const HomeCategorySaleRows = lazy(() => import('../components/HomeCategorySaleRows'));
const HomeWhyChoose = lazy(() => import('../components/HomeWhyChoose'));

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const { addToCart } = useCart();

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await api.get('/api/categories');
      const list = unwrapCategoriesResponse(res);
      setCategories(list);
    } catch (error) {
      console.error('Categories fetch error:', error);
      setCategoriesError(String(apiMessage(error, 'Failed to load categories') || 'Failed to load categories'));
      setCategories([]);
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

  return (
    <>
      <SEO
        title={homeRouteSeo.title}
        description={homeRouteSeo.description}
        keywords={homeRouteSeo.keywords}
        canonicalUrl="/"
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
    </>
  );
};

export default Home;
