import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * @typedef {{ label: string, href?: string }} BreadcrumbItem
 * @param {object} props
 * @param {BreadcrumbItem[]} props.items
 * @param {string} [props.className]
 */

function isExternal(href) {
  return /^https?:\/\//i.test(href || '');
}

export default function Breadcrumb({ items = [], className = '' }) {
  const list = Array.isArray(items) ? items.filter((i) => i && i.label) : [];

  if (list.length === 0) return null;

  return (
    <nav
      className={`w-full overflow-x-auto ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs sm:gap-1.5 sm:text-sm">
        {list.map((item, index) => {
          const isLast = index === list.length - 1;
          const hasHref = Boolean(item.href) && !isLast;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1 sm:gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-neutral-400 sm:h-4 sm:w-4"
                  aria-hidden
                />
              )}
              {hasHref && item.href && !isExternal(item.href) ? (
                <Link
                  to={item.href}
                  className="truncate font-medium text-neutral-600 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 rounded-sm"
                >
                  {item.label}
                </Link>
              ) : hasHref && item.href && isExternal(item.href) ? (
                <a
                  href={item.href}
                  className="truncate font-medium text-neutral-600 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 rounded-sm"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={`truncate ${isLast ? 'font-semibold text-neutral-900' : 'text-neutral-500'}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
