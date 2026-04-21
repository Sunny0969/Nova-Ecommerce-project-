import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Blog() {
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
          <p className="page-header__subtitle">Stories and style notes from Nova — more posts coming soon.</p>
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
          <p className="text-muted blog-page__lead">
            We are preparing articles on products, care guides, and seasonal picks. In the meantime, browse the{' '}
            <Link to="/shop">shop</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
