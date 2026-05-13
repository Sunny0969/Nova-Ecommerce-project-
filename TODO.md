- [ ] Confirm staff redirect bug root cause
- [ ] Patch staff auth redirect to never go to public home
- [ ] Add/adjust guard so staff auth failures redirect only to /staff-login
- [ ] Ensure StaffLogin always navigates to /staff/dashboard
- [ ] Quick manual test steps:
  - [ ] Open /staff/categories without staff login → must go to /staff-login
  - [ ] Login as staff → must land on /staff/dashboard (or requested /staff/route)
  - [ ] Lack permission → must stay in staff UI (no / redirect)

