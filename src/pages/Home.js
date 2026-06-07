import React, { useEffect, useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';
import { unwrapCategoriesResponse, apiMessage } from '../lib/api';
import HomeBannerSlider from '../components/HomeBannerSlider';
import HomeHero from '../components/HomeHero';
import HomeCategoriesGrid from '../components/HomeCategoriesGrid';
import HomeFlashSale from '../components/HomeFlashSale';
import HomeCategorySaleRows from '../components/HomeCategorySaleRows';
import HomePopularBrands from '../components/HomePopularBrands';
import HomeWhyChoose from '../components/HomeWhyChoose';
import { buildMetaDescription, buildPageTitle } from '../utils/pageSeo';
import api from 'api';

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

  const handleAddToCart = async (product) => {
    await addToCart(product, 1);
  };

  return (
    <>
      <SEO
        title={buildPageTitle('Online Shopping Pakistan', 'Groceries & Handicrafts')}
        description={buildMetaDescription(
          'online shopping Pakistan',
          'Shop groceries, cleaning, tea, rice, fashion & electronics with fast delivery from Hyderabad.',
          'Souvenir Handicraft Shop — quality products, secure checkout, nationwide delivery.'
        )}
      />

      <div className="home-top-stack">
        <HomeBannerSlider />
        <HomeHero />
      </div>

      <section className="section home-categories-browse" id="categories" aria-label="Shop categories">
        <div className="container">
          <h2 className="home-categories-browse__title">Categories</h2>
          <HomeCategoriesGrid
            categories={categories}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={fetchCategories}
          />
        </div>
      </section>

      <HomeFlashSale />

      <HomePopularBrands />

      <HomeCategorySaleRows onAddToCart={handleAddToCart} />

      <HomeWhyChoose />
    </>
  );
};

export default Home;
