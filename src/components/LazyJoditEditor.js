import React, { lazy, Suspense, useEffect } from 'react';

const JoditEditor = lazy(() =>
  import(
    /* webpackChunkName: "admin-jodit" */
    'jodit-react'
  )
);

let cssLoaded = false;

function ensureJoditCss() {
  if (cssLoaded) return;
  cssLoaded = true;
  void import(
    /* webpackChunkName: "admin-jodit" */
    'jodit/es2021/jodit.min.css'
  );
}

/**
 * Rich text editor — Jodit (~750KB) loads only when admin opens product form.
 */
export default function LazyJoditEditor(props) {
  useEffect(() => {
    ensureJoditCss();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="admin-rich-editor-loading" aria-busy="true">
          Loading editor…
        </div>
      }
    >
      <JoditEditor {...props} />
    </Suspense>
  );
}
