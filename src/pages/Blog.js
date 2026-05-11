import React from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import blogSearchIndex from '../data/blogSearchIndex.json';

const entries = Array.isArray(blogSearchIndex) ? blogSearchIndex : [];

export default function Blog() {
  const { slug } = useParams();
  const post = slug ? entries.find((e) => e.slug === slug) : null;

  if (slug && !post) {
    return (
      <>
        <SEO title="Article not found" noIndex />
        <header className="page-header">
          <div className="container">
            <h1 className="page-header__title">Not found</h1>
            <p className="page-header__subtitle">This article does not exist.</p>
            <ol className="breadcrumb" aria-label="Breadcrumb">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li className="active" aria-current="page">
                Missing
              </li>
            </ol>
          </div>
        </header>
        <main className="section blog-page" id="main-content">
          <div className="container blog-page__body">
            <Link to="/blog" className="btn btn-primary btn-sm">
              Back to blog
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (post) {
    return (
      <>
        <SEO
          title={`${post.title} — Nova Shop Blog`}
          description={post.excerpt}
          canonicalUrl={`/blog/${encodeURIComponent(post.slug)}`}
        />
        <header className="page-header">
          <div className="container">
            <h1 className="page-header__title">{post.title}</h1>
            <p className="page-header__subtitle">{post.excerpt}</p>
            <ol className="breadcrumb" aria-label="Breadcrumb">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li className="active" aria-current="page">
                Article
              </li>
            </ol>
          </div>
        </header>
        <main className="section blog-page" id="main-content">
          <article className="container blog-page__body blog-article">
            <div className="blog-article__content text-muted">
              <p>{post.excerpt}</p>
              <p>
                Nova Shop editorial — practical tips for shopping in Pakistan. For orders and support, visit the{' '}
                <Link to="/shop">shop</Link> or use the site chat.
              </p>
            </div>
            <p className="blog-article__foot">
              <Link to="/blog">← All articles</Link>
            </p>
          </article>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Blog"
        description="News, tips, and updates from Nova Shop."
        canonicalUrl="/blog"
      />
      <header className="page-header">
        <div className="container">
          <h1 className="page-header__title">Blog</h1>
          <p className="page-header__subtitle">Stories, delivery tips, and style notes from Nova Shop.</p>
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li className="active" aria-current="page">
              Blog
            </li>
          </ol>
        </div>
      </header>
      <main className="section blog-page" id="main-content">
        <div className="container blog-page__body">
          <ul className="blog-index">
            {entries.map((e) => (
              <li key={e.slug} className="blog-index__item">
                <Link to={`/blog/${encodeURIComponent(e.slug)}`} className="blog-index__link">
                  <span className="blog-index__title">{e.title}</span>
                  <span className="blog-index__excerpt">{e.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-muted blog-page__lead" style={{ marginTop: '1.5rem' }}>
            Looking for products? <Link to="/shop">Browse the shop</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
