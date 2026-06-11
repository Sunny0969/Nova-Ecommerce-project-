import React from 'react';
import { Link } from 'react-router-dom';
import { optimizeImageUrl } from '../utils/optimizedImageUrl';
import { buildBlogImageAlt } from '../utils/imageAlt';
import OptimizedImage from './OptimizedImage';

/**
 * BlogCard
 * - Reusable blog listing card for both grid and horizontal sections.
 * - Clicking the card now opens BlogDetailsPage.
 * - Accessibility maintained.
 */
export default function BlogCard({
  blog,
  variant = 'grid',
  loading = false,
  onRetry,
  priority = false
}) {

  if (loading) {
    return (
      <article
        className={`blog-card blog-card--skeleton blog-card--${variant}`}
        aria-hidden="true"
      >
        <div className="blog-card__img-skel" />
        <div className="blog-card__body-skel">
          <div className="blog-card__cat-skel" />
          <div className="blog-card__title-skel" />
          <div className="blog-card__desc-skel" />
          <div className="blog-card__meta-skel" />
        </div>
      </article>
    );
  }

  // ✅ Always navigate to BlogDetailsPage
  // App routes support: /blog (shows Blog page) and /blog/:slug (shows Blog details)
  // Prefer slug (backend uses /api/blog/posts/:slug). Fallback to id for cases where slug isn't present.
  // BlogDetailsPage supports fetching by slug only, so if only id exists we still route to /blog/:id
  // (backend returns 404 unless you add an id->slug lookup; this is still better than dead links).
  const detailsHref = blog?.slug
    ? `/blog/${encodeURIComponent(blog.slug)}`
    : blog?._id
      ? `/blog/${encodeURIComponent(blog._id)}`
      : blog?.id
        ? `/blog/${encodeURIComponent(blog.id)}`
        : '/blog';

  return (
    <article className={`blog-card blog-card--${variant}`}>
      <Link
        to={detailsHref}
        className="blog-card__link"
        aria-label={`Read more: ${blog?.title || 'Blog post'}`}
      >
        <div className="blog-card__img">
          <OptimizedImage
            src={optimizeImageUrl(blog?.featuredImage, { width: 900, quality: 80 })}
            alt={buildBlogImageAlt(blog)}
            width={900}
            height={675}
            priority={priority}
            optimize={false}
          />

          <div className="blog-card__img-scrim" aria-hidden="true" />

          {blog?.tag && (
            <span className="blog-card__tag">
              {blog.tag}
            </span>
          )}
        </div>

        <div className="blog-card__body">
          {blog?.category && (
            <div className="blog-card__cat">
              {blog.category}
            </div>
          )}

          <h3 className="blog-card__title">
            {blog?.title}
          </h3>

          <p className="blog-card__desc">
            {blog?.description}
          </p>

          <div className="blog-card__meta" aria-label="Post meta">
            <span>
              {blog?.readingMinutes
                ? `${blog.readingMinutes} min read`
                : 'Quick read'}
            </span>
            <span className="blog-card__meta-dot" aria-hidden="true">
              •
            </span>
            <span className="blog-card__dest">
              {blog?.destinationLabel || 'Explore'}
            </span>
          </div>
        </div>
      </Link>

      {onRetry && (
        <button
          type="button"
          className="visually-hidden"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </article>
  );
}