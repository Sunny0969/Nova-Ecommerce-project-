import React, { useEffect, useMemo, useState } from 'react';
import './BlogDetailsPage.css';

import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Link2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Facebook,
  Twitter,
  Linkedin,
} from 'lucide-react';
import SEO from '../components/SEO';
import { getCanonicalUrl } from '../utils/seo';
import { buildBlogDetailSchemas } from '../utils/jsonLd';
import BlogCard from '../components/BlogCard';
import ProductCard from '../components/ProductCard';
import OptimizedImage from '../components/OptimizedImage';
import { buildBlogImageAlt, buildCategoryImageAlt } from '../utils/imageAlt';
import { optimizeImageUrl } from '../utils/optimizedImageUrl';
import toast from 'react-hot-toast';
import { blogAPI } from '../api';
import InternalLinksBlock from '../components/InternalLinksBlock';
import { getBlogRelatedLinks } from '../data/seoInternalLinks';
import { bodyHasFaqSection, extractFaqItemsFromHtml } from '../utils/blogContentUtils';

function patchSchemaDescriptions(schemas, description) {
  const desc = String(description || '').trim();
  if (!desc || !schemas) return schemas;
  const patch = (node) => {
    if (!node || typeof node !== 'object') return;
    const type = node['@type'];
    if (type === 'BlogPosting' || type === 'Article' || type === 'WebPage') {
      node.description = desc;
    }
  };
  if (Array.isArray(schemas)) {
    schemas.forEach(patch);
    return schemas;
  }
  patch(schemas);
  return schemas;
}

function shopCardTitle(label) {
  const clean = String(label || '').trim().replace(/^shop\s+/i, '').trim();
  if (!clean || /^shop\s*now$/i.test(clean)) return 'Shop related products';
  return clean;
}

function shopCardButtonText(label) {
  const name = shopCardTitle(label);
  if (name === 'Shop related products') return 'Browse all products at Bazaar';
  return `Browse ${name} at Bazaar`;
}

export default function BlogDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setBlog(null);
      try {
        const res = await blogAPI.getBySlug(slug);
        if (!mounted) return;
        const post = res?.data?.post || null;
        setBlog(post);
        if (Array.isArray(post?.relatedPosts) && post.relatedPosts.length) {
          setRelatedBlogs(post.relatedPosts.filter((p) => p.slug !== slug));
        } else {
          setRelatedBlogs([]);
        }

        if (!post) {
          setBlog(null);
        }
      } catch (e) {
        if (!mounted) return;
        toast.error('Blog post not found');
        navigate('/blog');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [slug, navigate]);

  const blogRelatedLinks = useMemo(
    () => (blog ? getBlogRelatedLinks(blog) : []),
    [blog]
  );

  const articleSections = useMemo(() => {
    if (!blog) return [];

    // Prefer DB-driven structured sections.
    if (Array.isArray(blog.sections) && blog.sections.length > 0) {
      return blog.sections.map((s, idx) => ({
        id: idx + 1,
        title: s?.title || `Section ${idx + 1}`,
        content: s?.content || ''
      }));
    }

    // Fallback to previous placeholder rendering if sections not available.
    return [
      {
        id: 1,
        title: `Understanding ${blog.category}`,
        content: `${blog.description} This comprehensive guide will walk you through everything you need to know to get started and see real results.`
      },
      {
        id: 2,
        title: 'The Essential Steps',
        content: `When it comes to ${String(blog.title || '').toLowerCase()}, following a systematic approach makes all the difference. We've broken down the process into simple, actionable steps that anyone can follow.`
      },
      {
        id: 3,
        title: 'Expert Tips & Best Practices',
        content:
          'Our experts have compiled the most effective techniques that deliver consistent results. These insights come from years of experience and real-world testing.'
      },
      {
        id: 4,
        title: 'Common Mistakes to Avoid',
        content:
          "Learn from others' experiences and avoid the pitfalls that can slow your progress. We'll show you what NOT to do and why it matters."
      },
      {
        id: 5,
        title: 'Next Steps & Recommendations',
        content:
          "Ready to take action? Here's how to implement what you've learned and where to find the products that will help you succeed."
      }
    ];
  }, [blog]);

  const faqItems = useMemo(() => {
    if (!blog) return [];

    if (blog.body && bodyHasFaqSection(blog.body)) {
      const extracted = extractFaqItemsFromHtml(blog.body);
      if (extracted.length) {
        return extracted.map((item, idx) => ({
          id: idx + 1,
          question: item.question,
          answer: item.answer
        }));
      }
      return [];
    }

    return [
      {
        id: 1,
        question: `How often should I follow this ${String(blog.category || '').toLowerCase()} routine?`,
        answer:
          'For best results, we recommend following this routine consistently. Depending on your specific needs, this could be daily, weekly, or as needed. Start with the suggested frequency and adjust based on your results.',
      },
      {
        id: 2,
        question: 'What products do I need to get started?',
        answer: `We've curated a collection of essential products in our shop. Check out the "${blog.destinationLabel}" section for our recommended items that work perfectly with this guide.`,
      },
      {
        id: 3,
        question: 'Is this suitable for beginners?',
        answer:
          'Absolutely! This guide is designed to be accessible for everyone, whether you are just starting out or looking to refine your existing routine. We break down each step in simple, easy-to-follow language.',
      },
      {
        id: 4,
        question: 'How long until I see results?',
        answer:
          "Most people start seeing noticeable improvements within the first few weeks of consistent practice. However, everyone's experience is different, so be patient and stick with it.",
      },
    ];
  }, [blog]);

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = blog?.title || 'Check out this article';

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: url,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const blogCanonicalUrl = useMemo(() => {
    if (!blog?.slug) return getCanonicalUrl('/blog');
    return getCanonicalUrl(`/blog/${encodeURIComponent(String(blog.slug))}`);
  }, [blog]);

  const seoTitle = blog?.metaTitle || (blog?.title ? `${blog.title} | Bazaar` : '');
  const seoDescription = blog?.metaDescription || blog?.description || '';
  const seoKeywords = Array.isArray(blog?.tags) && blog.tags.length ? blog.tags.join(', ') : blog?.tag;

  const shopPreview = blog?.shopCategory;
  const shopProducts = Array.isArray(shopPreview?.products) ? shopPreview.products : [];
  const shopCategoryName = shopCardTitle(blog?.destinationLabel || shopPreview?.name);
  const shopHref = blog?.destinationUrl || (shopPreview?.slug ? `/${shopPreview.slug}` : '/shop');
  const shopCardImage =
    shopPreview?.imageUrl || blog?.featuredImage || '';

  useEffect(() => {
    if (!blog) return undefined;

    const desc = String(seoDescription || '').trim();
    const canonical = blogCanonicalUrl;

    const setMeta = (selector, attr, value) => {
      if (!value) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const match = selector.match(/\[(.+?)=(?:'|")(.+?)(?:'|")\]$/);
        if (match) {
          el.setAttribute(match[1], match[2]);
          document.head.appendChild(el);
        }
      }
      if (el) el.setAttribute(attr, value);
    };

    if (desc) {
      document.querySelectorAll('meta[name="description"]').forEach((node, i) => {
        if (i === 0) node.setAttribute('content', desc);
        else node.remove();
      });
      setMeta('meta[property="og:description"]', 'content', desc);
      setMeta('meta[name="twitter:description"]', 'content', desc);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
      setMeta('meta[property="og:url"]', 'content', canonical);
    }

    return undefined;
  }, [blog, blogCanonicalUrl, seoDescription]);

  const formattedDate = blog?.dateISO
    ? new Date(blog.dateISO).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const blogJsonLd = useMemo(() => {
    if (!blog) return null;
    const autoSchemas = buildBlogDetailSchemas({
      blog,
      canonicalUrl: blogCanonicalUrl,
      articleSections,
      faqItems
    });

    let storedArticle = null;
    if (blog.schemaMarkup && String(blog.schemaMarkup).trim()) {
      try {
        storedArticle = JSON.parse(String(blog.schemaMarkup));
      } catch {
        storedArticle = null;
      }
    }

    if (!autoSchemas && storedArticle) {
      return patchSchemaDescriptions(storedArticle, seoDescription);
    }
    if (!autoSchemas) return null;

    const list = Array.isArray(autoSchemas) ? [...autoSchemas] : [autoSchemas];
    if (storedArticle) {
      storedArticle.description = seoDescription || storedArticle.description;
      const withoutArticle = list.filter(
        (s) => s && s['@type'] !== 'BlogPosting' && s['@type'] !== 'Article'
      );
      return patchSchemaDescriptions([storedArticle, ...withoutArticle], seoDescription);
    }
    return patchSchemaDescriptions(list, seoDescription);
  }, [blog, blogCanonicalUrl, articleSections, faqItems, seoDescription]);

  const showFaqAccordion = Boolean(blog?.body && !bodyHasFaqSection(blog.body) && faqItems.length > 0);

  const hasHtmlBody =
    blog?.body &&
    /<(h2|h3|p|ul|ol|li|strong|a)\b/i.test(String(blog.body));

  const handleBodyClick = (e) => {
    const anchor = e.target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigate(href);
    }
  };

  useEffect(() => {
    if (!blog?.body || !hasHtmlBody) return undefined;
    const root = document.querySelector('.blog-detail-body.blog-content');
    if (!root) return undefined;
    root.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('blog-table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'blog-table-wrap';
      table.parentNode?.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
    return undefined;
  }, [blog, hasHtmlBody]);

  if (loading) return null;
  if (!blog) return null;

  return (
    <>
      {/* react-helmet-async via SEO — title, meta description, canonical, OG, JSON-LD */}
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={`/blog/${blog.slug}`}
        ogImage={blog.featuredImage}
        ogType="article"
        schema={blogJsonLd}
      />

      <div className="blog-detail-page">
        <div className="blog-detail-breadcrumb">
          <div className="container">
            <ol className="breadcrumb" aria-label="Breadcrumb">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li>
                <Link to={`/blog?category=${encodeURIComponent(blog.category)}`}>{blog.category}</Link>
              </li>
              <li className="active" aria-current="page">
                {blog.title}
              </li>
            </ol>
          </div>
        </div>

        <section className="blog-detail-hero">
          <div className="container">
            <div className="blog-detail-hero__content">
              <h1 className="blog-detail-hero__title">{blog.title}</h1>

              <div className="blog-detail-meta">
                <div className="blog-detail-meta__author">
                  <div className="blog-detail-meta__avatar">
                    <User size={20} />
                  </div>
                  <div className="blog-detail-meta__info">
                    <div className="blog-detail-meta__name">Bazaar Editorial Team</div>
                    <div className="blog-detail-meta__details">
                      <span className="blog-detail-meta__date">
                        <Calendar size={14} />
                        {formattedDate}
                      </span>
                      <span className="blog-detail-meta__reading">
                        <Clock size={14} />
                        {blog.readingMinutes} min read
                      </span>
                    </div>
                  </div>
                </div>

                <div className="blog-detail-meta__share">
                  <span className="blog-detail-meta__share-label">Share:</span>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="blog-detail-meta__share-btn"
                    aria-label="Share on Facebook"
                  >
                    <Facebook size={18} />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="blog-detail-meta__share-btn"
                    aria-label="Share on Twitter"
                  >
                    <Twitter size={18} />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="blog-detail-meta__share-btn"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin size={18} />
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="blog-detail-meta__share-btn"
                    aria-label="Copy link"
                  >
                    <Link2 size={18} />
                  </button>
                </div>
              </div>

              <p className="blog-detail-hero__description">
                {blog.metaDescription || blog.description}
              </p>
            </div>
          </div>
        </section>

        <section className="blog-detail-content-section">
          <div className="container">
            <div className="blog-detail-layout">
              <article className="blog-detail-article">
                {hasHtmlBody ? (
                  <div
                    className="blog-detail-body blog-content"
                    dangerouslySetInnerHTML={{ __html: blog.body }}
                    onClick={handleBodyClick}
                  />
                ) : (
                  <>
                    <div className="blog-detail-toc">
                      <h2 className="blog-detail-toc__title">Table of contents</h2>
                      <ol className="blog-detail-toc__list">
                        {articleSections.map((section) => (
                          <li key={section.id} className="blog-detail-toc__item">
                            <a
                              href={`#section-${section.id}`}
                              className="blog-detail-toc__link"
                              onClick={(e) => {
                                e.preventDefault();
                                document
                                  .getElementById(`section-${section.id}`)
                                  ?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              <span className="blog-detail-toc__number">
                                {String(section.id).padStart(2, '0')}
                              </span>
                              <span className="blog-detail-toc__text">{section.title}</span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {articleSections.map((section, index) => (
                      <div key={section.id} id={`section-${section.id}`} className="blog-detail-section">
                        <h2 className="blog-detail-section__title">
                          {section.id}. {section.title}
                        </h2>
                        <p className="blog-detail-section__content">{section.content}</p>
                        {index === 0 && (
                          <p className="blog-detail-section__content">
                            Whether you're looking to maintain your essentials, upgrade your daily routine, or discover
                            new techniques, this guide provides practical advice that actually works. Let's dive into the
                            details and transform your approach to {String(blog.category || '').toLowerCase()}.
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}

                <div className="blog-detail-shop-card">
                  <div className="blog-detail-shop-card__head">
                    <div className="blog-detail-shop-card__intro">
                      <div className="blog-detail-shop-card__tag">
                        {blog.category || blog.tag || 'Bazaar picks'}
                      </div>
                      <h3 className="blog-detail-shop-card__title">{shopCategoryName}</h3>
                      <p className="blog-detail-shop-card__description">
                        {shopPreview?.productCount
                          ? `${shopPreview.productCount}+ products in this category — order online with fast delivery across Pakistan.`
                          : 'Discover curated products that match this guide — secure checkout and nationwide delivery.'}
                      </p>
                      <Link to={shopHref} className="blog-detail-shop-card__btn">
                        {shopCardButtonText(blog?.destinationLabel || shopPreview?.name)}
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                    {shopCardImage ? (
                      <div className="blog-detail-shop-card__image">
                        <OptimizedImage
                          src={optimizeImageUrl(shopCardImage, { width: 600, quality: 80 })}
                          alt={`${shopCategoryName} — Bazaar`}
                          width={600}
                          height={400}
                          optimize={false}
                        />
                      </div>
                    ) : null}
                  </div>

                  {shopProducts.length > 0 ? (
                    <div className="blog-detail-shop-card__products">
                      <h4 className="blog-detail-shop-card__products-title">Popular in this category</h4>
                      <div className="blog-detail-shop-card__grid">
                        {shopProducts.map((product) => (
                          <ProductCard key={product._id || product.id || product.slug} product={product} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {showFaqAccordion ? (
                <div className="blog-detail-faq">
                  <h2 className="blog-detail-faq__title">Frequently Asked Questions</h2>
                  <p className="blog-detail-faq__subtitle">
                    Common questions about {blog.title.toLowerCase()}
                  </p>

                  <div className="blog-detail-faq__list">
                    {faqItems.map((faq) => (
                      <div key={faq.id} className={`blog-detail-faq__item ${openFAQ === faq.id ? 'active' : ''}`}>
                        <button
                          className="blog-detail-faq__question"
                          onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                          aria-expanded={openFAQ === faq.id}
                        >
                          <span>{faq.question}</span>
                          {openFAQ === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                        {openFAQ === faq.id && <div className="blog-detail-faq__answer">{faq.answer}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                ) : null}

                <InternalLinksBlock
                  title="Related shopping guides & categories"
                  links={blogRelatedLinks}
                />
              </article>

              <aside className="blog-detail-sidebar">
                <div className="blog-detail-sidebar__section">
                  <h3 className="blog-detail-sidebar__title">Popular Topics</h3>
                  <div className="blog-detail-sidebar__cards">
                    {[
                      {
                        name: 'Care',
                        image:
                          'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80',
                        url: '/blog?category=Care',
                      },
                      {
                        name: 'Tech',
                        image:
                          'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
                        url: '/blog?category=Tech',
                      },
                      {
                        name: 'Home',
                        image:
                          'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&auto=format&fit=crop&q=80',
                        url: '/blog?category=Home',
                      },
                      {
                        name: 'Fashion',
                        image:
                          'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
                        url: '/blog?category=Fashion',
                      },
                      {
                        name: 'Beauty',
                        image:
                          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
                        url: '/blog?category=Beauty',
                      },
                    ].map((cat) => (
                      <a key={cat.name} href={cat.url} className="sidebar-category-card">
                        <OptimizedImage
                          src={optimizeImageUrl(cat.image, { width: 400, quality: 75 })}
                          alt={buildCategoryImageAlt(cat.name)}
                          width={400}
                          height={300}
                          optimize={false}
                        />
                        <div className="sidebar-category-card__overlay">
                          <span className="sidebar-category-card__name">{cat.name}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="blog-detail-sidebar__section">
                  <h3 className="blog-detail-sidebar__title">Latest Blogs</h3>
                  <div className="blog-detail-sidebar__latest">
                    {relatedBlogs.length === 0 ? (
                      <div style={{ color: '#777', fontSize: 14 }}>More posts coming soon.</div>
                    ) : (
                      relatedBlogs.map((latestBlog) => (
                        <Link
                          key={latestBlog.slug}
                          to={`/blog/${latestBlog.slug}`}
                          className="sidebar-blog-item"
                        >
                          <div className="sidebar-blog-item__image">
                            <OptimizedImage
                              src={optimizeImageUrl(latestBlog.featuredImage, { width: 120, quality: 70 })}
                              alt={buildBlogImageAlt(latestBlog)}
                              width={120}
                              height={90}
                              optimize={false}
                            />
                            {latestBlog.tag && <span className="sidebar-blog-item__tag">{latestBlog.tag}</span>}
                          </div>
                          <div className="sidebar-blog-item__content">
                            <p className="sidebar-blog-item__title">{latestBlog.title}</p>
                            <p className="sidebar-blog-item__meta">
                              <Calendar size={12} />
                              {new Date(latestBlog.dateISO).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {relatedBlogs.length > 0 && (
          <section className="blog-detail-related">
            <div className="container">
              <div className="blog-detail-related__header">
                <h2 className="blog-detail-related__title">Related articles</h2>
                <Link to="/blog" className="blog-detail-related__view-all">
                  Browse all shopping guides
                  <ChevronRight size={18} />
                </Link>
              </div>
              <div className="blog-detail-related__grid">
                {relatedBlogs.map((relatedBlog) => (
                  <BlogCard key={relatedBlog.slug} blog={relatedBlog} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="blog-detail-about">
          <div className="container">
            <div className="blog-detail-about__content">
              <div className="blog-detail-about__text">
                <h2 className="blog-detail-about__title">About Bazaar</h2>
                <p className="blog-detail-about__description">
                 Bazaar is your destination for curated products and expert guides across care, tech, home, fashion,
                  beauty, and sports.
                </p>
                <Link to="/about-us" className="blog-detail-about__btn">
                  About Bazaar online grocery Pakistan
                </Link>
              </div>
              <div className="blog-detail-about__illustration">
                <OptimizedImage
                  src="https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=600&auto=format&fit=crop&q=80"
                  alt="Online shopping at Bazaar — groceries and essentials"
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="blog-detail-next">
          <div className="container">
            <InternalLinksBlock
              title="Where to shop next"
              links={blogRelatedLinks}
              variant="pills"
            />
          </div>
        </section>
      </div>
    </>
  );
}

