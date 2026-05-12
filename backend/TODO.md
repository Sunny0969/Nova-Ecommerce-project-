# TODO - Blog frontend/backend fix

## Goal
Frontend blog cards click → Blog detail page open karna (backend se data load).

## Steps
1. **Repo understanding**: Blog list + Blog detail routing + API calls verify.
2. **Backend**: BlogPost model + routes (`/api/blog/posts`, `/api/blog/posts/:slug`) confirm.
3. **Backend Seed**: `lib/sampleBlogsSeed.js` ensure blog posts me `slug` + `featuredImage` + `sections` data present ho.
4. **Frontend Blog listing**: `src/pages/Blog.js` ko backend fetch se enable (already partially done) + ensure category/search/sort params map ho rahe hain.
5. **Frontend Blog details**: `src/pages/BlogDetailsPage.js` ensure backend GET uses slug param correctly.
6. **BlogCard click href**: `/src/components/BlogCard.js` ensure `Link to=/blog/:slug` uses `blog.slug`.
7. **Run & test**:
   - backend: server start
   - curl/axios check for `GET /api/blog/posts` and `GET /api/blog/posts/:slug`
   - frontend: click card verify

## Progress
- [x] Repo understanding + confirm existing Blog list/details/pages.
- [x] Confirm backend routes + model exist.
- [x] Confirm sampleBlogsSeed present.
- [ ] Verify blog seed contains correct `slug`/`sections`/`featuredImage` and that frontend expects same fields.
- [ ] Fix any mismatches found.
- [ ] Run backend + test endpoints.
- [ ] Run frontend and verify card click navigation.

