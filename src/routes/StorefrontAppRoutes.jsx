import React from 'react';
import StorefrontRoutes from './StorefrontRoutes';

/** Storefront route table — imported eagerly (RouteTree already code-splits the shell). */
export default function StorefrontAppRoutes() {
  return <StorefrontRoutes />;
}
