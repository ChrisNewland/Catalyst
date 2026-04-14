# Catalyst — UI tour

Screenshots captured with Playwright on a Pixel 7 viewport (412×915). Tap-target minimum is 44 px throughout.

## 1. Login

![Login](./01-login.png)

## 2. Login — wrong password

![Login error](./02-login-error.png)

## 3. Volunteer dashboard — fresh shelter, no visits yet

![Volunteer dashboard](./03-dashboard-empty.png)

## 4. The critical screen — log visit form, filled in

Food = Some, Water = Normal, urinated on, defecated on → Bristol picker appears, 4 selected, Condition = Concern.

![Log form filled](./05-log-form.png)

## 5. Dashboard after saving

Green toast confirms the save; the cat moves from "Needs visit today" to "Visited today" with a "Log again" CTA.

![Dashboard after log](./06-dashboard-after.png)

## 6. Cat profile — last 7 days

Shows the entry we just saved, the volunteer who recorded it, and a condition chip.

![Cat profile](./07-cat-profile.png)

## 7. Admin dashboard

Same cats view as a volunteer sees, but the header grows extra "Cats" and "Users" nav links.

![Admin dashboard](./08-admin-dashboard.png)

## 8. Admin → Manage cats

![Manage cats](./09-admin-cats.png)

## 9. Admin → Manage volunteers

![Manage volunteers](./10-admin-users.png)

---

To regenerate these locally:

```bash
PORT=3100 npx playwright test e2e/_screenshots.spec.ts
# outputs PNGs to test-results/
```
