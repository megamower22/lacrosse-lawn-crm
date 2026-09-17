# Lacrosse Lawn & Landscape — Customer CRM

Phone-friendly static web app for customer records and email drafts (quote, follow-ups, thank-you + Google review).

**Brand:** Sharp cuts. Clean yards.  
**Gmail:** lacrosselawnandlandscape@gmail.com  
**Phone:** 608-461-2181  
**Site:** https://lacrosse-lawn-and-landscape.netlify.app/

No build step. No auth. No paid APIs. Data stays in the browser (`localStorage`) with CSV import/export.

## Open locally

```bash
cd lacrosse-customers
# Option A — open the file
open index.html          # macOS
# start index.html       # Windows
xdg-open index.html      # Linux

# Option B — tiny local server (recommended if clipboard/file APIs act up)
python3 -m http.server 5173
# then visit http://localhost:5173
```

Or drag `index.html` into a browser tab.

## Deploy to Netlify (free)

1. Push this repo to GitHub (`megamower22/lacrosse-customers`).
2. Netlify → **Add new site** → **Import an existing project** → pick the repo.
3. Build settings:
   - **Build command:** leave empty
   - **Publish directory:** `/` (repo root)
4. Deploy. You’ll get a `*.netlify.app` URL.

Drag-and-drop also works: Netlify → **Sites** → **Deploy manually** → drop this folder.

Optional `netlify.toml` is included; defaults are fine for a static site.

## How to use

1. **Add** a customer (or **Import** a CSV matching the front-desk columns).
2. Optional: **Load EXAMPLE rows** on the empty state — clearly labeled, not real people. Delete when you have real leads.
3. Tap a customer card.
4. Under **Draft email**, pick:
   - **Quote**
   - **Follow-up #1**
   - **Follow-up #2**
   - **Thank-you + review**
5. Templates fill with name, address, quote amount, etc.
6. **Open mailto** (opens the device mail app / Gmail with To + subject + body), or **Copy subject + body** and paste into Gmail as `lacrosselawnandlandscape@gmail.com`.
7. **Export** anytime for a backup CSV.

### CSV columns

`name, phone, email, address, city, lawn_size_or_notes, last_service_date, next_due, status, quote_amount, quote_sent_date, follow_up_date, source, notes`

`status` should be `active`, `quote`, or `lead`.

Compatible with `/workspace/lacrosse-front-desk/customers.csv` / the front-desk sheet.

### Email templates

Aligned with the email-first copy in `quote-and-followups.md`:

- Weekly mow guide: **$40–$65**
- Review link: https://g.page/r/Ced6S_x206QhEBM/review
- Does **not** auto-send — you always review before send.

## Privacy

Customers live only on the device/browser that uses the app (and any CSV you export). Clearing site data clears the CRM. Export regularly if this is your source of truth.

## Repo

Intended remote: https://github.com/megamower22/lacrosse-customers  
Do not commit secrets — there are none required for this app.
