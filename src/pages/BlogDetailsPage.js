import React, { useEffect, useMemo, useState } from 'react';
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
import BlogCard from '../components/BlogCard';
import toast from 'react-hot-toast';
import { blogAPI } from '../api';

export default function BlogDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setBlog(null);
      try {
        const res = await blogAPI.getBySlug(slug);
        if (!mounted) return;
        setBlog(res?.data?.post || null);
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

  const relatedBlogs = useMemo(() => {
    if (!blog) return [];
    // Lightweight fallback: fetch same category list (first page)
    // (UI only needs a few related cards.)
    return [];
  }, [blog]);

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

  useEffect(() => {
    if (blog) {
      document.title = blog.title ? `${blog.title} | Nova` : 'Nova Blog';
    }
  }, [blog]);

  const formattedDate = blog?.dateISO
    ? new Date(blog.dateISO).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  if (loading) return null;
  if (!blog) return null;

  return (
    <>
      <SEO
        title={blog.title}
        description={blog.description}
        canonicalUrl={`/blog/${blog.slug}`}
        image={blog.featuredImage}
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
                    <div className="blog-detail-meta__name">Nova Editorial Team</div>
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

              <p className="blog-detail-hero__description">{blog.description}</p>
            </div>
          </div>
        </section>

        <section className="blog-detail-featured">
          <div className="container">
            <div className="blog-detail-featured__image">
              <img src={blog.featuredImage} alt={blog.imageAlt || blog.title} loading="eager" />
            </div>
          </div>
        </section>

        <section className="blog-detail-content-section">
          <div className="container">
            <div className="blog-detail-layout">
              <article className="blog-detail-article">
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
                        Whether you're looking to maintain your essentials, upgrade your daily routine, or discover new
                        techniques, this guide provides practical advice that actually works. Let's dive into the details
                        and transform your approach to {String(blog.category || '').toLowerCase()}.
                      </p>
                    )}
                  </div>
                ))}

                <div className="blog-detail-shop-card">
                  <div className="blog-detail-shop-card__image">
                    <img src={blog.featuredImage} alt={blog.destinationLabel} loading="lazy" />
                  </div>
                  <div className="blog-detail-shop-card__content">
                    <div className="blog-detail-shop-card__tag">{blog.tag}</div>
                    <h3 className="blog-detail-shop-card__title">Shop {blog.destinationLabel}</h3>
                    <p className="blog-detail-shop-card__description">
                      Discover our curated collection of products perfect for this guide
                    </p>
                    <a href={blog.destinationUrl} className="blog-detail-shop-card__btn">
                      View Collection
                      <ChevronRight size={18} />
                    </a>
                  </div>
                </div>

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
                        <img src={cat.image} alt={cat.name} loading="lazy" />
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
                            <img src={latestBlog.featuredImage} alt={latestBlog.title} loading="lazy" />
                            {latestBlog.tag && <span className="sidebar-blog-item__tag">{latestBlog.tag}</span>}
                          </div>
                          <div className="sidebar-blog-item__content">
                            <h4 className="sidebar-blog-item__title">{latestBlog.title}</h4>
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
                <a href="/blog" className="blog-detail-related__view-all">
                  View all
                  <ChevronRight size={18} />
                </a>
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
                <h2 className="blog-detail-about__title">About Nova Shop</h2>
                <p className="blog-detail-about__description">
                  Nova Shop is your destination for curated products and expert guides across care, tech, home, fashion,
                  beauty, and sports.
                </p>
                <a href="/about" className="blog-detail-about__btn">
                  Learn more
                </a>
              </div>
              <div className="blog-detail-about__illustration">
                <img
                  src="https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=600&auto=format&fit=crop&q=80"
                  alt="Shopping illustration"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="blog-detail-next">
          <div className="container">
            <h2 className="blog-detail-next__title">Where to Go Next</h2>
            <div className="blog-detail-next__grid">
              <a href="/shop?category=home" className="blog-detail-next__btn">Shoe Care</a>
              <a href="/shop?category=home" className="blog-detail-next__btn">Laundry Care</a>
              <a href="/shop?category=electronics" className="blog-detail-next__btn">Device Care</a>
              <a href="/shop?category=electronics" className="blog-detail-next__btn">Chargers</a>
              <a href="/shop?category=home" className="blog-detail-next__btn">Home Lighting</a>
              <a href="/shop?category=home" className="blog-detail-next__btn">Storage</a>
              <a href="/shop?category=beauty" className="blog-detail-next__btn">Skincare</a>
              <a href="/shop?category=beauty" className="blog-detail-next__btn">Hair Care</a>
              <a href="/shop?category=sport" className="blog-detail-next__btn">Fitness</a>
              <a href="/shop?category=sport" className="blog-detail-next__btn">Recovery</a>
              <a href="/shop?category=fashion" className="blog-detail-next__btn">Style Guide</a>
              <a href="/shop?category=fashion" className="blog-detail-next__btn">Seasonal</a>
              <a href="/shop?category=home" className="blog-detail-next__btn">Cleaning</a>
              <a href="/shop?category=electronics" className="blog-detail-next__btn">Air Care</a>
              <a href="/shop?category=electronics" className="blog-detail-next__btn">Desk Setup</a>
              <a href="/shop?category=home" className="blog-detail-next__btn">Kitchen</a>
              <a href="/shop?category=home" className="blog-detail-next__btn">Coffee Corner</a>
              <a href="/shop?category=fashion" className="blog-detail-next__btn">Wardrobe</a>
              <a href="/shop?category=beauty" className="blog-detail-next__btn">Glow Routine</a>
              <a href="/shop?category=sport" className="blog-detail-next__btn">Essentials</a>
              <a href="/shop?category=home" className="blog-detail-next__btn">Fresh Storage</a>
              <a href="/shop?category=electronics" className="blog-detail-next__btn">Tech Tips</a>
              <a href="/blog" className="blog-detail-next__btn">All Guides</a>
              <a href="/shop" className="blog-detail-next__btn">Shop All</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

