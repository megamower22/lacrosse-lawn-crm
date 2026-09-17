/* Lacrosse Lawn & Landscape — Customer CRM (static, localStorage) */
(function () {
  "use strict";

  const STORAGE_KEY = "lacrosse-customers-v1";
  const FROM_EMAIL = "lacrosselawnandlandscape@gmail.com";
  const PHONE = "608-461-2181";
  const SITE = "https://lacrosse-lawn-and-landscape.netlify.app/";
  const REVIEW = "https://g.page/r/Ced6S_x206QhEBM/review";
  const YOUR_NAME = "Lacrosse Lawn"; // signature name placeholder

  const CSV_HEADERS = [
    "name", "phone", "email", "address", "city", "lawn_size_or_notes",
    "last_service_date", "next_due", "status", "quote_amount",
    "quote_sent_date", "follow_up_date", "source", "notes"
  ];

  const EXAMPLES = [
    {
      id: "ex-jordan",
      name: "EXAMPLE - Jordan Sample",
      phone: "608-555-0100",
      email: "jordan.example@email.com",
      address: "123 Example St",
      city: "La Crosse",
      lawn_size_or_notes: "Typical city lot ~0.2 acre",
      last_service_date: "",
      next_due: "",
      status: "quote",
      quote_amount: "55",
      quote_sent_date: "2026-09-10",
      follow_up_date: "2026-09-14",
      source: "website",
      notes: "EXAMPLE ROW — replace with real customer; not a real person."
    },
    {
      id: "ex-sam",
      name: "EXAMPLE - Sam Neighbor",
      phone: "608-555-0199",
      email: "sam.neighbor.example@email.com",
      address: "456 Demo Ave",
      city: "Onalaska",
      lawn_size_or_notes: "Bigger yard / ridge-ish",
      last_service_date: "",
      next_due: "",
      status: "lead",
      quote_amount: "",
      quote_sent_date: "",
      follow_up_date: "",
      source: "door hanger",
      notes: "EXAMPLE ROW — fill real info when you get a lead; delete when ready."
    }
  ];

  /** @type {Array<Object>} */
  let customers = [];
  /** @type {string|null} */
  let selectedId = null;
  let filterStatus = "all";
  let searchQuery = "";
  let activeTpl = "quote";
  let toastTimer = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  function uid() {
    return "c-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        customers = [];
        return;
      }
      const parsed = JSON.parse(raw);
      customers = Array.isArray(parsed) ? parsed.map(normalizeCustomer) : [];
    } catch {
      customers = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  }

  function normalizeCustomer(row) {
    const c = {};
    for (const h of CSV_HEADERS) c[h] = row[h] != null ? String(row[h]).trim() : "";
    c.id = row.id || uid();
    const st = (c.status || "lead").toLowerCase();
    c.status = ["active", "quote", "lead"].includes(st) ? st : "lead";
    return c;
  }

  function isExample(c) {
    return /^EXAMPLE\b/i.test(c.name || "") || /EXAMPLE ROW/i.test(c.notes || "");
  }

  function firstName(full) {
    const cleaned = (full || "").replace(/^EXAMPLE\s*-\s*/i, "").trim();
    return cleaned.split(/\s+/)[0] || "there";
  }

  function money(n) {
    const s = String(n || "").replace(/[^0-9.]/g, "");
    if (!s) return "[Price]";
    const num = Number(s);
    return Number.isFinite(num) ? String(Math.round(num)) : "[Price]";
  }

  function addressLine(c) {
    const parts = [c.address, c.city].filter(Boolean);
    return parts.join(", ") || "[Address]";
  }

  function serviceGuess(c) {
    const n = (c.lawn_size_or_notes + " " + c.notes).toLowerCase();
    if (/leaf/.test(n)) return "Fall leaf cleanup";
    if (/snow/.test(n)) return "Driveway & sidewalk snow";
    if (/biweekly|bi-weekly/.test(n)) return "Biweekly mowing";
    return "Weekly mowing";
  }

  function buildTemplates(c) {
    const name = firstName(c.name);
    const addr = addressLine(c);
    const price = money(c.quote_amount);
    const service = serviceGuess(c);
    const sig = YOUR_NAME;

    return {
      quote: {
        subject: `Quote for ${addr} — Lacrosse Lawn & Landscape`,
        body: [
          `Hi ${name},`,
          ``,
          `Thanks for reaching out. Here’s a straightforward quote for ${addr}:`,
          ``,
          `Service: ${service}`,
          `Price: $${price} per visit`,
          `What’s included: cut, trim, edge, and blow off hard surfaces`,
          ``,
          `Most La Crosse city lots land in the $40–$65 range for weekly mowing; bigger yards get a custom number — this one is based on your place.`,
          ``,
          `No long mowing contract — stop anytime. We’ll show up when we say we will and leave it looking locked in.`,
          ``,
          `If that works, reply with a preferred weekday and we’ll get you on the route. Or call/text ${PHONE} if that’s easier.`,
          ``,
          `— ${sig}`,
          `Lacrosse Lawn & Landscape`,
          SITE
        ].join("\n")
      },
      follow1: {
        subject: `Still thinking it over? — ${addr} lawn quote`,
        body: [
          `Hi ${name},`,
          ``,
          `Checking in on the quote I sent for ${addr} ($${price}/visit for ${service.toLowerCase()}).`,
          ``,
          `Happy to tweak the schedule or answer anything about the yard. If you’re set either way, a quick yes or no helps us keep the route tight.`,
          ``,
          `— ${sig}`,
          `Lacrosse Lawn & Landscape`,
          PHONE
        ].join("\n")
      },
      follow2: {
        subject: `Closing the loop on your lawn quote`,
        body: [
          `Hi ${name},`,
          ``,
          `Last note from me on the $${price} quote for ${addr}. If you want to get on the weekday route, reply and we’ll lock it in. If not, no worries — I’ll mark it closed so we don’t keep pinging you.`,
          ``,
          `Appreciate you considering us.`,
          ``,
          `— ${sig}`,
          `Lacrosse Lawn & Landscape`,
          PHONE
        ].join("\n")
      },
      thanks: {
        subject: `Thanks for trusting Lacrosse Lawn — quick review?`,
        body: [
          `Hi ${name},`,
          ``,
          `Thanks for having us at ${addr}. Glad we could leave it looking sharp.`,
          ``,
          `If you’re happy with the work, a short Google review means a lot for a small local crew — takes about 30 seconds:`,
          ``,
          REVIEW,
          ``,
          `Stars + a sentence is perfect. Thanks again — see you on the next visit.`,
          ``,
          `— ${sig}`,
          `Lacrosse Lawn & Landscape`,
          PHONE,
          SITE
        ].join("\n")
      }
    };
  }

  function filtered() {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (!q) return true;
      const hay = [
        c.name, c.phone, c.email, c.address, c.city, c.source, c.notes, c.lawn_size_or_notes
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function selected() {
    return customers.find((c) => c.id === selectedId) || null;
  }

  function showToast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.textContent = ""; }, 2500);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  function renderList() {
    const list = $("#customer-list");
    const empty = $("#empty-state");
    const rows = filtered();
    $("#count-label").textContent =
      `${rows.length} customer${rows.length === 1 ? "" : "s"}` +
      (searchQuery || filterStatus !== "all" ? " (filtered)" : "");

    if (customers.length === 0) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    if (rows.length === 0) {
      list.innerHTML = `<p class="empty-copy" style="padding:12px">No matches. Clear search or filters.</p>`;
      return;
    }

    list.innerHTML = rows.map((c) => {
      const meta = [c.city || c.address, c.phone || c.email].filter(Boolean).join(" · ");
      const price = c.quote_amount ? ` · $${money(c.quote_amount)}` : "";
      return `
        <button type="button" class="card ${c.id === selectedId ? "selected" : ""}" data-id="${escapeAttr(c.id)}">
          <div class="card-top">
            <p class="card-name">${escapeHtml(c.name || "Unnamed")}</p>
            <span class="status-pill ${escapeAttr(c.status)}">${escapeHtml(c.status)}</span>
          </div>
          <p class="card-meta">${escapeHtml(meta || "No contact yet")}${escapeHtml(price)}</p>
          ${isExample(c) ? `<span class="example-badge">Example — not real</span>` : ""}
        </button>`;
    }).join("");
  }

  function renderDetail() {
    const layout = $(".layout");
    const c = selected();
    const detailEmpty = $("#detail-empty");
    const detail = $("#detail");

    if (!c) {
      layout.classList.remove("showing-detail");
      detailEmpty.classList.remove("hidden");
      detail.classList.add("hidden");
      return;
    }

    layout.classList.add("showing-detail");
    detailEmpty.classList.add("hidden");
    detail.classList.remove("hidden");

    $("#d-name").textContent = c.name || "Unnamed";
    const pill = $("#d-status");
    pill.textContent = c.status;
    pill.className = "status-pill " + c.status;

    const facts = [
      ["Phone", c.phone],
      ["Email", c.email],
      ["Address", [c.address, c.city].filter(Boolean).join(", ")],
      ["Lawn / notes", c.lawn_size_or_notes],
      ["Quote $", c.quote_amount ? `$${money(c.quote_amount)}` : ""],
      ["Quote sent", c.quote_sent_date],
      ["Follow-up", c.follow_up_date],
      ["Last service", c.last_service_date],
      ["Next due", c.next_due],
      ["Source", c.source],
      ["Notes", c.notes]
    ];

    $("#d-facts").innerHTML = facts.map(([label, val], i) => {
      const span = (label === "Notes" || label === "Lawn / notes" || label === "Address") ? " span-2" : "";
      return `<div class="${span.trim()}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(val || "—")}</dd></div>`;
    }).join("");

    renderEmail(c);
  }

  function renderEmail(c) {
    const tpls = buildTemplates(c);
    const t = tpls[activeTpl] || tpls.quote;
    $("#email-subject").value = t.subject;
    $("#email-body").value = t.body;

    $$(".tpl-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tpl === activeTpl);
    });

    const to = (c.email || "").trim();
    const mailto = buildMailto(to, t.subject, t.body);
    const link = $("#btn-mailto");
    link.href = mailto;
    link.title = to
      ? `Opens mail client to ${to} (from: set Gmail as ${FROM_EMAIL})`
      : "No customer email — mailto still opens; add To: in your client";
  }

  function buildMailto(to, subject, body) {
    const params = new URLSearchParams();
    params.set("subject", subject);
    params.set("body", body);
    // Some clients support cc of our own address as a reminder of the send-from account
    params.set("cc", FROM_EMAIL);
    const qs = params.toString().replace(/\+/g, "%20");
    return `mailto:${encodeURIComponent(to)}?${qs}`;
  }

  function renderAll() {
    renderList();
    renderDetail();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  /* ---------- Modal form ---------- */
  function openModal(customer) {
    const modal = $("#modal");
    $("#modal-title").textContent = customer ? "Edit customer" : "Add customer";
    $("#f-id").value = customer ? customer.id : "";
    $("#f-name").value = customer?.name || "";
    $("#f-status").value = customer?.status || "lead";
    $("#f-phone").value = customer?.phone || "";
    $("#f-email").value = customer?.email || "";
    $("#f-address").value = customer?.address || "";
    $("#f-city").value = customer?.city || "";
    $("#f-source").value = customer?.source || "";
    $("#f-lawn").value = customer?.lawn_size_or_notes || "";
    $("#f-quote-amount").value = customer?.quote_amount || "";
    $("#f-quote-sent").value = customer?.quote_sent_date || "";
    $("#f-follow-up").value = customer?.follow_up_date || "";
    $("#f-last-service").value = customer?.last_service_date || "";
    $("#f-next-due").value = customer?.next_due || "";
    $("#f-notes").value = customer?.notes || "";
    modal.showModal();
    setTimeout(() => $("#f-name").focus(), 50);
  }

  function closeModal() {
    $("#modal").close();
  }

  function readForm() {
    return normalizeCustomer({
      id: $("#f-id").value || uid(),
      name: $("#f-name").value,
      status: $("#f-status").value,
      phone: $("#f-phone").value,
      email: $("#f-email").value,
      address: $("#f-address").value,
      city: $("#f-city").value,
      source: $("#f-source").value,
      lawn_size_or_notes: $("#f-lawn").value,
      quote_amount: $("#f-quote-amount").value,
      quote_sent_date: $("#f-quote-sent").value,
      follow_up_date: $("#f-follow-up").value,
      last_service_date: $("#f-last-service").value,
      next_due: $("#f-next-due").value,
      notes: $("#f-notes").value
    });
  }

  /* ---------- CSV ---------- */
  function toCsv(rows) {
    const escape = (v) => {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [CSV_HEADERS.join(",")];
    for (const r of rows) {
      lines.push(CSV_HEADERS.map((h) => escape(r[h])).join(","));
    }
    return lines.join("\n") + "\n";
  }

  function parseCsv(text) {
    const rows = [];
    let i = 0;
    const len = text.length;

    function readCell() {
      if (text[i] === '"') {
        i++;
        let out = "";
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { out += '"'; i += 2; continue; }
            i++;
            break;
          }
          out += text[i++];
        }
        if (text[i] === ",") i++;
        return out;
      }
      let out = "";
      while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
        out += text[i++];
      }
      if (text[i] === ",") i++;
      return out;
    }

    function readRow() {
      if (i >= len) return null;
      const cells = [];
      if (text[i] === "\n" || text[i] === "\r") {
        if (text[i] === "\r") i++;
        if (text[i] === "\n") i++;
        return cells;
      }
      while (i < len) {
        cells.push(readCell());
        if (text[i] === "\r") { i++; if (text[i] === "\n") i++; break; }
        if (text[i] === "\n") { i++; break; }
        if (i >= len) break;
      }
      return cells;
    }

    const headerCells = readRow();
    if (!headerCells || !headerCells.length) return [];
    const headers = headerCells.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

    while (i < len) {
      const cells = readRow();
      if (!cells) break;
      if (cells.every((c) => !String(c).trim())) continue;
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = cells[idx] ?? ""; });
      // tolerate alternate header names
      if (obj.lawn_size && !obj.lawn_size_or_notes) obj.lawn_size_or_notes = obj.lawn_size;
      rows.push(normalizeCustomer(obj));
    }
    return rows;
  }

  function exportCsv() {
    const csv = toCsv(customers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lacrosse-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV downloaded.");
  }

  function importCsvFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseCsv(String(reader.result || ""));
        if (!imported.length) {
          showToast("No rows found in CSV.");
          return;
        }
        const replace = confirm(
          `Import ${imported.length} row(s)?\n\nOK = replace all current customers\nCancel = merge (add/update by name+email)`
        );
        if (replace) {
          customers = imported.map((c) => ({ ...c, id: c.id || uid() }));
        } else {
          for (const row of imported) {
            const key = (row.email || row.name || "").toLowerCase();
            const idx = customers.findIndex((c) =>
              (c.email && row.email && c.email.toLowerCase() === row.email.toLowerCase()) ||
              (key && c.name.toLowerCase() === (row.name || "").toLowerCase() && c.email === row.email)
            );
            if (idx >= 0) customers[idx] = { ...customers[idx], ...row, id: customers[idx].id };
            else customers.push({ ...row, id: uid() });
          }
        }
        save();
        selectedId = null;
        renderAll();
        showToast(`Imported ${imported.length} row(s).`);
      } catch (e) {
        console.error(e);
        showToast("Could not parse CSV.");
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Events ---------- */
  function bind() {
    $("#search").addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderList();
    });

    $$(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        filterStatus = chip.dataset.status;
        $$(".chip").forEach((c) => c.classList.toggle("active", c === chip));
        renderList();
      });
    });

    $("#customer-list").addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      selectedId = card.dataset.id;
      activeTpl = "quote";
      renderAll();
    });

    $("#btn-back").addEventListener("click", () => {
      selectedId = null;
      renderAll();
    });

    $("#btn-add").addEventListener("click", () => openModal(null));
    $("#btn-add-empty").addEventListener("click", () => openModal(null));
    $("#btn-load-examples").addEventListener("click", () => {
      customers = EXAMPLES.map((c) => ({ ...c }));
      save();
      selectedId = customers[0].id;
      activeTpl = "quote";
      renderAll();
      showToast("Loaded 2 EXAMPLE rows (not real customers).");
    });

    $("#btn-edit").addEventListener("click", () => {
      const c = selected();
      if (c) openModal(c);
    });

    $("#btn-delete").addEventListener("click", () => {
      const c = selected();
      if (!c) return;
      if (!confirm(`Delete “${c.name}”? This can’t be undone.`)) return;
      customers = customers.filter((x) => x.id !== c.id);
      selectedId = null;
      save();
      renderAll();
      showToast("Deleted.");
    });

    $("#btn-modal-close").addEventListener("click", closeModal);
    $("#btn-cancel").addEventListener("click", closeModal);

    $("#customer-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const row = readForm();
      if (!row.name) {
        showToast("Name is required.");
        return;
      }
      const idx = customers.findIndex((c) => c.id === row.id);
      if (idx >= 0) customers[idx] = row;
      else customers.unshift(row);
      selectedId = row.id;
      save();
      closeModal();
      renderAll();
      showToast("Saved.");
    });

    $("#template-buttons").addEventListener("click", (e) => {
      const btn = e.target.closest(".tpl-btn");
      if (!btn) return;
      activeTpl = btn.dataset.tpl;
      const c = selected();
      if (c) renderEmail(c);
    });

    $("#btn-copy-subject").addEventListener("click", async () => {
      const ok = await copyText($("#email-subject").value);
      showToast(ok ? "Subject copied." : "Copy failed.");
    });
    $("#btn-copy-body").addEventListener("click", async () => {
      const ok = await copyText($("#email-body").value);
      showToast(ok ? "Body copied." : "Copy failed.");
    });
    $("#btn-copy-all").addEventListener("click", async () => {
      const sub = $("#email-subject").value;
      const body = $("#email-body").value;
      const ok = await copyText(`Subject: ${sub}\n\n${body}`);
      showToast(ok ? "Subject + body copied — paste into Gmail." : "Copy failed.");
    });

    $("#btn-mailto").addEventListener("click", (e) => {
      const c = selected();
      if (!c) {
        e.preventDefault();
        return;
      }
      if (!c.email) {
        const go = confirm("This customer has no email. Open mailto anyway?");
        if (!go) e.preventDefault();
      }
    });

    $("#btn-export").addEventListener("click", exportCsv);
    $("#input-import").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importCsvFile(file);
      e.target.value = "";
    });
  }

  /* ---------- Boot ---------- */
  load();
  bind();
  renderAll();
})();
