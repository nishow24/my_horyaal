// Copyright (c) 2026, nishow and contributors
// For license information, please see license.txt
/* eslint-disable */

// Nurses Monthly Report: an infographic drawn above the standard report table.
// The figures come from get_dashboard() in my_report1.py.
(function () {
	const REPORT = "my report1";
	const METHOD = "horyaal.horyaal.report.my_report1.my_report1.get_dashboard";
	const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	// chart colours: series in fixed order, status colours kept apart
	const C = { present: "#2a78d6", leave: "#eb6834", absent: "#d03b3b", third: "#1baf7a", grid: "#e3e9f2", axis: "#b9c4d6", ink: "#10233f", muted: "#64748b" };

	const esc = (v) => frappe.utils.escape_html(v == null ? "" : String(v));
	const num = (v, digits) => {
		v = Number(v) || 0;
		return v.toLocaleString("en-US", { maximumFractionDigits: digits == null ? (Number.isInteger(v) ? 0 : 1) : digits });
	};
	const pct = (v) => (v == null ? "–" : num(v, 1) + "%");
	const share = (part, whole) => (whole ? pct((part / whole) * 100) : "–");

	const ICONS = {
		nurses: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
		check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>',
		leave: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
		calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
		star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
		chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
		trend: '<path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
		bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
		list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
		flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
		bulb: '<path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
		pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
		arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
		tick: '<path d="M20 6 9 17l-5-5"/>',
	};
	const icon = (name, size) =>
		`<svg class="nmr-ico" width="${size || 18}" height="${size || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

	const CSS = `
.nmr{--navy:#0b3d91;--navy2:#082c6c;--blue:#1565d8;--ink:#10233f;--muted:#64748b;--line:#d9e3f2;--soft:#f3f7fd;
	font-family:Inter,"Segoe UI",Arial,sans-serif;color:var(--ink);background:linear-gradient(180deg,#eef4fd 0,#f8fbff 240px);
	border:1px solid var(--line);border-radius:14px;padding:18px;margin:0 0 18px;line-height:1.35;font-size:13px}
.nmr *{box-sizing:border-box}
.nmr-head{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:16px}
.nmr-brand{display:flex;align-items:center;gap:12px;min-width:220px}
.nmr-brand img{height:62px;max-width:180px;object-fit:contain}
.nmr-brand b{display:block;font-size:22px;color:var(--navy);letter-spacing:-.2px}
.nmr-brand span{color:var(--blue);font-size:12.5px}
.nmr-title{flex:1;min-width:260px;background:linear-gradient(135deg,var(--navy) 0,var(--blue) 100%);color:#fff;border-radius:12px;
	padding:12px 22px;text-align:center;box-shadow:0 6px 18px rgba(11,61,145,.22)}
.nmr-title h1{margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:.2px}
.nmr-title p{margin:2px 0 0;font-size:16px;font-weight:600;color:#dbe8ff}
.nmr-note{background:#fff7e6;border:1px solid #f5d48a;color:#6b4a00;border-radius:8px;padding:7px 12px;margin-bottom:12px;font-size:12.5px}
.nmr-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px}
.nmr-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:center;
	box-shadow:0 1px 3px rgba(16,35,63,.05);border-top:3px solid var(--k,#1565d8)}
.nmr-kpi-ico{flex:none;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
	background:var(--kb,#e6effc);color:var(--k,#1565d8)}
.nmr-kpi small{display:block;color:var(--muted);font-size:12px;font-weight:600}
.nmr-kpi strong{display:block;font-size:27px;font-weight:800;color:var(--ink);line-height:1.15}
.nmr-kpi em{font-style:normal;color:var(--muted);font-size:11.5px}
.nmr-up{color:#006300;font-weight:700}.nmr-down{color:#b42318;font-weight:700}
.nmr-row{display:grid;gap:12px;margin-bottom:14px}
.nmr-r3{grid-template-columns:1fr 1.25fr 1.25fr}
.nmr-r2{grid-template-columns:1.9fr 1fr}
.nmr-r3b{grid-template-columns:1.7fr 1fr 1fr}
.nmr-card{background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(16,35,63,.05);display:flex;flex-direction:column}
.nmr-card>header{background:var(--navy);color:#fff;font-weight:700;font-size:14px;padding:8px 14px;display:flex;align-items:center;gap:9px}
.nmr-card>header small{margin-left:auto;font-weight:500;font-size:11.5px;color:#cfe0ff}
.nmr-body{padding:12px 14px;flex:1}
.nmr-donut{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center}
.nmr-legend{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.nmr-legend.h{flex-direction:row;flex-wrap:wrap;gap:6px 16px;justify-content:center;margin-top:4px}
.nmr-legend li{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ink)}
.nmr-legend i{width:10px;height:10px;border-radius:50%;flex:none}
.nmr-legend b{font-weight:700}
.nmr-foot{margin-top:8px;color:var(--muted);font-size:11.5px}
.nmr svg text{font-family:inherit}
.nmr-hb{display:grid;grid-template-columns:minmax(90px,auto) 1fr auto;gap:6px 10px;align-items:center;font-size:12.5px}
.nmr-hb span{color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.nmr-hb div{height:14px;background:var(--soft);border-radius:0 4px 4px 0}
.nmr-hb div i{display:block;height:100%;min-width:2px;border-radius:0 4px 4px 0;background:var(--c,#2a78d6)}
.nmr-hb b{font-weight:700;text-align:right}
.nmr-sub{font-weight:700;color:var(--navy);font-size:12px;text-transform:uppercase;letter-spacing:.5px;margin:12px 0 7px}
.nmr-sub:first-child{margin-top:0}
.nmr-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:12px}
.nmr-stat{background:var(--soft);border-radius:9px;padding:8px 6px;text-align:center}
.nmr-stat b{display:block;font-size:20px;font-weight:800;color:var(--navy)}
.nmr-stat small{color:var(--muted);font-size:11px}
.nmr-table{width:100%;border-collapse:collapse;font-size:12.5px}
.nmr-table th{background:#e9f0fb;color:var(--navy);text-align:left;padding:6px 9px;font-weight:700;border-bottom:1px solid var(--line)}
.nmr-table td{padding:6px 9px;border-bottom:1px solid #edf1f7;color:var(--ink)}
.nmr-table .n{text-align:right;font-variant-numeric:tabular-nums}
.nmr-table tfoot td{font-weight:800;background:#f6f9fe;border-top:2px solid var(--line)}
.nmr-table tr:last-child td{border-bottom:0}
.nmr-pill{display:inline-block;padding:2px 10px;border-radius:99px;font-size:11.5px;font-weight:700;white-space:nowrap}
.nmr-p-excellent{background:#dcf5dc;color:#0a5c0a}.nmr-p-very-good{background:#e6f6ea;color:#17663a}
.nmr-p-good{background:#dfeafc;color:#184f95}.nmr-p-needs-attention{background:#fde6d8;color:#9a3a0b}
.nmr-p-on-leave{background:#eef1f6;color:#475569}
.nmr-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
.nmr-list li{display:flex;gap:9px;align-items:flex-start;font-size:13px}
.nmr-list li>span{flex:none;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:1px}
.nmr-list.ok li>span{background:#0c8a0c;color:#fff}
.nmr-list.go li>span{background:#e6effc;color:var(--blue)}
.nmr-empty{text-align:center;color:var(--muted);padding:22px 10px}
.nmr-empty b{display:block;color:var(--ink);font-size:14px;margin-bottom:4px}
.nmr-btn{display:inline-block;margin-top:10px;background:var(--blue);color:#fff!important;border-radius:7px;padding:6px 14px;font-weight:600;text-decoration:none}
.nmr-seg{display:flex;height:14px;gap:2px;margin-bottom:7px}
.nmr-seg i{display:block;height:100%;border-radius:3px;min-width:3px}
.nmr-sign{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;border-top:1px solid var(--line);margin-top:4px;padding-top:14px}
.nmr-sign>div{padding:0 16px;border-left:1px solid var(--line);display:flex;gap:10px;align-items:center;min-height:62px}
.nmr-sign>div:first-child{border-left:0;padding-left:4px}
.nmr-sign .nmr-ico{color:var(--blue);flex:none}
.nmr-sign b{display:block;font-size:13px}.nmr-sign span{color:var(--muted);font-size:12.5px}
.nmr-sig{flex-direction:column;justify-content:flex-end;text-align:center;gap:3px!important}
.nmr-sig u{display:block;width:80%;border-bottom:1.5px solid var(--ink);height:30px;text-decoration:none;font-weight:600;font-size:12.5px;line-height:38px;color:var(--ink);white-space:nowrap}
.nmr-motto{margin:14px -18px -18px;background:var(--navy);color:#fff;text-align:center;padding:9px;border-radius:0 0 13px 13px;
	font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:19px;letter-spacing:.4px}
.nmr-motto:before,.nmr-motto:after{content:"";display:inline-block;width:14%;border-top:1px solid #9db9ea;vertical-align:middle;margin:0 18px}
.nmr-loading{padding:40px;text-align:center;color:var(--muted)}
.nmr-listhead{font-weight:700;color:var(--navy);font-size:14px;margin:4px 0 8px}
@media (max-width:1100px){.nmr-kpis{grid-template-columns:repeat(3,1fr)}.nmr-r3,.nmr-r2,.nmr-r3b{grid-template-columns:1fr 1fr}.nmr-wide{grid-column:1/-1}}
@media (max-width:700px){.nmr-kpis,.nmr-r3,.nmr-r2,.nmr-r3b,.nmr-sign{grid-template-columns:1fr}.nmr-stats{grid-template-columns:repeat(3,1fr)}.nmr-sign>div{border-left:0;padding:6px 4px}}
.nmr.printing{border:0;margin:0;border-radius:0;padding:10px;font-size:11.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.nmr.printing .nmr-noprint{display:none}
.nmr.printing .nmr-card,.nmr.printing .nmr-kpi{break-inside:avoid;box-shadow:none}
.nmr.printing .nmr-kpis{grid-template-columns:repeat(5,1fr)}
.nmr.printing .nmr-r3{grid-template-columns:1fr 1.25fr 1.25fr}.nmr.printing .nmr-r2{grid-template-columns:1.9fr 1fr}.nmr.printing .nmr-r3b{grid-template-columns:1.7fr 1fr 1fr}
.nmr.printing .nmr-motto{margin:12px 0 0;border-radius:0}
`;

	const dash = {
		$host: null,
		token: 0,
		last: null,

		mount(report) {
			$("#nmr-style").remove();
			$("<style id='nmr-style'>").text(CSS).appendTo(document.head);
			if (!this.$host || !this.$host.closest("body").length) {
				this.$host = $('<div class="nmr"></div>');
				if (report.$summary && report.$summary.length) this.$host.insertBefore(report.$summary);
				else this.$host.prependTo(report.page.main);
				this.last = null;
			}
			report.page.add_inner_button(__("Print Report"), () => this.print());

			if (!report.__nmr_refresh) {
				// the query-report page object is shared by all reports
				report.__nmr_refresh = true;
				const refresh = report.refresh;
				report.refresh = function () {
					if (frappe.query_report && frappe.query_report.report_name === REPORT) dash.load();
					return refresh.apply(this, arguments);
				};
				frappe.router.on("change", () => {
					const route = frappe.get_route();
					if (route[0] === "query-report" && route[1] !== REPORT) dash.unmount();
				});
			}
		},

		unmount() {
			this.token++;
			this.$host && this.$host.remove();
			this.$host = null;
			this.last = null;
		},

		load() {
			if (!this.$host) return;
			const get = (name) => frappe.query_report.get_filter_value(name);
			const filters = { period: get("period"), date: get("date"), month: get("month"), year: get("year"), designation: get("designation") };
			const key = JSON.stringify(filters);
			// refresh and the table render both ask for the same thing
			if (this.last && this.last.key === key && Date.now() - this.last.at < 1500) return;
			this.last = { key, at: Date.now() };
			const token = ++this.token;
			if (!this.$host.children().length) this.$host.html(`<div class="nmr-loading">${esc(__("Loading the report…"))}</div>`);
			frappe.call({ method: METHOD, args: { filters } }).then(
				(r) => token === this.token && this.$host && r && r.message && this.$host.html(this.render(r.message, filters)),
				() => token === this.token && this.$host && this.$host.html(`<div class="nmr-loading">${esc(__("The report could not be loaded."))}</div>`)
			);
		},

		// ------------------------------------------------------------ pieces

		card(title, icon_name, body, opts) {
			opts = opts || {};
			return `<section class="nmr-card ${opts.cls || ""}"><header>${icon(icon_name, 17)}<span>${esc(title)}</span>${
				opts.note ? `<small>${esc(opts.note)}</small>` : ""
			}</header><div class="nmr-body">${body}</div></section>`;
		},

		kpi(label, value, sub, icon_name, color, tint) {
			return `<div class="nmr-kpi" style="--k:${color};--kb:${tint}"><div class="nmr-kpi-ico">${icon(icon_name, 22)}</div>
				<div><small>${esc(label)}</small><strong>${value}</strong><em>${sub || "&nbsp;"}</em></div></div>`;
		},

		donut(parts, big, small) {
			const total = parts.reduce((a, p) => a + p.value, 0);
			const r = 58, circ = 2 * Math.PI * r;
			let offset = 0;
			const gap = parts.filter((p) => p.value > 0).length > 1 ? 2 : 0;
			const arcs = parts
				.filter((p) => p.value > 0)
				.map((p) => {
					const len = (p.value / total) * circ;
					const arc = `<circle cx="80" cy="80" r="${r}" fill="none" stroke="${p.color}" stroke-width="20"
						stroke-dasharray="${Math.max(len - gap, 0.5)} ${circ}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)">
						<title>${esc(p.label)}: ${num(p.value)} (${share(p.value, total)})</title></circle>`;
					offset += len;
					return arc;
				})
				.join("");
			return `<svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${esc(small)} ${esc(big)}">
				<circle cx="80" cy="80" r="${r}" fill="none" stroke="#edf1f7" stroke-width="20"/>${total ? arcs : ""}
				<text x="80" y="80" text-anchor="middle" font-size="24" font-weight="800" fill="${C.ink}">${esc(big)}</text>
				<text x="80" y="99" text-anchor="middle" font-size="11.5" fill="${C.muted}">${esc(small)}</text></svg>`;
		},

		legend(parts, horizontal) {
			return `<ul class="nmr-legend ${horizontal ? "h" : ""}">${parts
				.map((p) => `<li><i style="background:${p.color}"></i><span>${esc(p.label)}${p.text != null ? ` <b>${esc(p.text)}</b>` : ""}</span></li>`)
				.join("")}</ul>`;
		},

		line_chart(points, series) {
			const W = points.length > 8 ? 520 : 440, H = 210, L = 34, R = 14, T = 20, B = 26;
			const max_value = Math.max(1, ...points.flatMap((p) => series.map((s) => Number(p[s.key]) || 0)));
			const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((s) => max_value / s <= 4) || Math.ceil(max_value / 4);
			const top = Math.ceil((max_value * 1.08) / step) * step;
			const x = (i) => L + (points.length > 1 ? (i * (W - L - R)) / (points.length - 1) : (W - L - R) / 2);
			const y = (v) => T + (H - T - B) * (1 - v / top);
			let out = "";
			for (let v = 0; v <= top; v += step) {
				out += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? C.grid : C.axis}" stroke-width="1"/>
					<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10.5" fill="${C.muted}">${num(v)}</text>`;
			}
			points.forEach((p, i) => {
				out += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${C.muted}">${esc(p.label)}</text>`;
			});
			series.forEach((s, si) => {
				const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(Number(p[s.key]) || 0).toFixed(1)}`).join(" ");
				out += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
				points.forEach((p, i) => {
					const v = Number(p[s.key]) || 0;
					// labels of the lower series go under the point when two lines run close together
					const below = si > 0 && Math.abs(y(v) - y(Number(p[series[0].key]) || 0)) < 22;
					out += `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="${s.color}" stroke="#fff" stroke-width="2"><title>${esc(p.month)} – ${esc(s.label)}: ${num(v)}</title></circle>
						<text x="${x(i)}" y="${y(v) + (below ? 16 : -9)}" text-anchor="middle" font-size="11" font-weight="700" fill="${C.ink}">${num(v)}</text>`;
				});
			});
			return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(series.map((s) => s.label).join(", "))}">${out}</svg>`;
		},

		hbars(rows, color) {
			if (!rows.length) return `<div class="nmr-empty">${esc(__("Nothing recorded for this period."))}</div>`;
			const max_value = Math.max(...rows.map((r) => r.value), 1);
			return `<div class="nmr-hb" style="--c:${color || C.present}">${rows
				.map(
					(r) => `<span title="${esc(r.label)}">${esc(r.label)}</span><div title="${esc(r.label)}: ${esc(r.text || num(r.value))}"><i style="width:${(
						(r.value / max_value) * 100
					).toFixed(1)}%"></i></div><b>${esc(r.text || num(r.value))}</b>`
				)
				.join("")}</div>`;
		},

		segments(parts) {
			const total = parts.reduce((a, p) => a + p.value, 0);
			if (!total) return "";
			return `<div class="nmr-seg">${parts
				.filter((p) => p.value > 0)
				.map((p) => `<i style="background:${p.color};width:${(p.value / total) * 100}%" title="${esc(p.label)}: ${num(p.value)}"></i>`)
				.join("")}</div>${this.legend(parts.map((p) => Object.assign({ text: `${num(p.value)} (${share(p.value, total)})` }, p)), true)}`;
		},

		pill(remark) {
			if (!remark) return "";
			return `<span class="nmr-pill nmr-p-${remark.toLowerCase().replace(/\s+/g, "-")}">${esc(__(remark))}</span>`;
		},

		list(items, cls, icon_name) {
			return `<ul class="nmr-list ${cls}">${items.map((t) => `<li><span>${icon(icon_name, 12)}</span><div>${esc(t)}</div></li>`).join("")}</ul>`;
		},

		ward(d) {
			const w = d.ward, t = w.totals;
			if (!w.documents) {
				return `<div class="nmr-empty"><b>${esc(__("No ward report documents for {0}", [d.period.label]))}</b>
					${esc(__("Admissions, transfers, discharges and deaths appear here as soon as the wards save a Nurses Monthly Report dated in this period."))}<br>
					<a class="nmr-btn nmr-noprint" href="${esc(d.new_document_url)}">${esc(__("Create Nurses Monthly Report"))}</a></div>`;
			}
			const stat = (label, value) => `<div class="nmr-stat"><b>${num(value)}</b><small>${esc(label)}</small></div>`;
			const rows = w.departments
				.map(
					(x) => `<tr><td>${esc(x.department)}</td><td class="n">${num(x.admissions)}</td><td class="n">${num(x.transfers)}</td>
					<td class="n">${num(x.discharges)}</td><td class="n">${num(x.deaths)}</td><td class="n"><b>${num(x.total)}</b></td><td class="n">${share(x.total, t.total)}</td></tr>`
				)
				.join("");
			return `<div class="nmr-stats">${stat(__("Admissions"), t.admissions)}${stat(__("Transfers"), t.transfers)}${stat(__("Discharges"), t.discharges)}
				${stat(__("Deaths"), t.deaths)}${stat(__("Total Patients"), t.total)}${stat(__("Reports Filed"), w.documents)}</div>
				<table class="nmr-table"><thead><tr><th>${esc(__("Department"))}</th><th class="n">${esc(__("Admission"))}</th><th class="n">${esc(__("Transfer"))}</th>
				<th class="n">${esc(__("Discharge"))}</th><th class="n">${esc(__("Death"))}</th><th class="n">${esc(__("Total"))}</th><th class="n">${esc(__("Share"))}</th></tr></thead>
				<tbody>${rows}</tbody><tfoot><tr><td>${esc(__("All departments"))}</td><td class="n">${num(t.admissions)}</td><td class="n">${num(t.transfers)}</td>
				<td class="n">${num(t.discharges)}</td><td class="n">${num(t.deaths)}</td><td class="n">${num(t.total)}</td><td class="n">100%</td></tr></tfoot></table>
				<div class="nmr-foot">${esc(__("Filed by"))}: ${w.nurses.map((n) => `${esc(n.nurse)} (${num(n.reports)})`).join(", ")}</div>`;
		},

		// ------------------------------------------------------------ page

		render(d, filters) {
			const s = d.summary;
			const prev = d.previous_attendance;
			const diff = s.attendance != null && prev != null ? Math.round((s.attendance - prev) * 10) / 10 : null;
			const delta =
				diff == null || !diff
					? ""
					: `<span class="${diff > 0 ? "nmr-up" : "nmr-down"}">${diff > 0 ? "▲" : "▼"} ${num(Math.abs(diff), 1)}</span> ${esc(__("pts vs {0}", [d.period.previous_name]))}`;

			const head = `<div class="nmr-head">
				<div class="nmr-brand">${d.logo ? `<img src="${esc(d.logo)}" alt="">` : ""}
					<div><b>Hodan Hospital</b><span>${esc(__("Care Today… Healthier Tomorrow"))}</span></div></div>
				<div class="nmr-title"><h1>${esc(d.period.heading)}</h1><p>${esc(d.period.title)}${
				filters.designation ? " · " + esc(filters.designation) : ""
			}</p></div></div>`;

			const note = d.period.future
				? `<div class="nmr-note">${esc(__("This {0} has not started yet, so there are no attendance figures.", [d.period.noun]))}</div>`
				: d.period.partial
				? `<div class="nmr-note">${esc(__("This {0} is still in progress: duty days are counted up to today.", [d.period.noun]))}</div>`
				: "";

			const kpis = `<div class="nmr-kpis">
				${this.kpi(__("Total Nurses"), num(s.total), s.left ? esc(__("{0} left this {1}", [s.left, d.period.noun])) : esc(__("{0} roles", [d.roles.length])), "nurses", "#1565d8", "#e6effc")}
				${this.kpi(__("Active Nurses"), num(s.active), `(${share(s.active, s.total)})`, "check", "#0c8a0c", "#e0f4e0")}
				${this.kpi(__("Nurses on Leave"), num(s.on_leave), `(${share(s.on_leave, s.active)}) · ${num(s.leave_days)} ${esc(__("days"))}`, "leave", "#eb6834", "#fdebe2")}
				${this.kpi(__("Duty Days Covered"), num(s.present_days), `${esc(__("of"))} ${num(s.scheduled_days)} (${share(s.present_days, s.scheduled_days)})`, "calendar", "#1565d8", "#e6effc")}
				${this.kpi(__("Overall Performance"), pct(s.performance), esc(__("present on expected duty days")), "star", "#c98500", "#fdf3d7")}
			</div>`;

			const att_parts = [
				{ label: __("Present"), value: s.present_days, color: C.present },
				{ label: __("On Leave"), value: s.leave_days, color: C.leave },
				{ label: __("Absent"), value: s.absent_days, color: C.absent },
			];
			const attendance = this.card(
				__("Attendance Overview"),
				"chart",
				`<div class="nmr-donut">${this.donut(att_parts, pct(s.attendance), __("Attendance Rate"))}
				${this.legend(att_parts.map((p) => Object.assign({ text: `${num(p.value)} ${__("days")}` }, p)))}</div>
				<div class="nmr-foot">${delta || esc(__("Nurse-days in the period"))}</div>`
			);

			const trend_series = [
				{ key: "available", label: __("On duty"), color: C.present },
				{ key: "on_leave", label: __("On leave"), color: C.leave },
			];
			const trend = this.card(
				d.period.kind === "Daily" ? __("Daily Attendance Trend") : __("Monthly Attendance Trend"),
				"trend",
				this.line_chart(d.trend, trend_series) + this.legend(trend_series, true),
				{ note: d.period.trend_note }
			);

			const roles = this.card(
				__("Nurses by Department / Role"),
				"nurses",
				this.hbars(d.roles.map((r) => ({ label: r.label, value: r.count }))),
				{ note: __("{0} active", [num(s.active)]) }
			);

			const ward = this.card(__("Ward Activity"), "bed", this.ward(d), {
				cls: "nmr-wide",
				note: __("from Nurses Monthly Report documents"),
			});

			const gender_colors = { Female: C.present, Male: C.third };
			const remark_colors = { Excellent: "#0c8a0c", "Very Good": C.third, Good: C.present, "Needs Attention": C.leave, "On Leave": "#94a3b8" };
			const mix = this.card(
				__("Leave & Team Mix"),
				"calendar",
				`<div class="nmr-sub">${esc(__("Leave days by type"))}</div>
				${this.hbars(d.leave_types.map((l) => ({ label: l.label, value: l.days })), C.leave)}
				<div class="nmr-sub">${esc(__("Gender"))}</div>
				${this.segments(d.gender.map((g, i) => ({ label: __(g.label), value: g.count, color: gender_colors[g.label] || "#94a3b8" })))}
				<div class="nmr-sub">${esc(__("Performance rating"))}</div>
				${this.segments(d.remarks.filter((r) => r.count).map((r) => ({ label: __(r.label), value: r.count, color: remark_colors[r.label] })))}`
			);

			const nurse_rows = d.nurses
				.map(
					(n, i) => `<tr><td>${i + 1}</td><td>${esc(n.employee_name)}</td><td>${esc(n.designation)}</td>
					<td class="n">${num(n.leave_days)}</td><td class="n">${num(n.absent_days)}</td><td class="n">${pct(n.attendance)}</td><td>${this.pill(n.remark)}</td></tr>`
				)
				.join("");
			const details = this.card(
				__("Nurses Performance Details"),
				"list",
				d.nurses.length
					? `<table class="nmr-table"><thead><tr><th>#</th><th>${esc(__("Name"))}</th><th>${esc(__("Role"))}</th><th class="n">${esc(__("Leave"))}</th>
					<th class="n">${esc(__("Absent"))}</th><th class="n">${esc(__("Attendance"))}</th><th>${esc(__("Remarks"))}</th></tr></thead><tbody>${nurse_rows}</tbody></table>
					<div class="nmr-foot">${esc(__("The {0} nurses with the lowest attendance. All {1} nurses are in the table below.", [d.nurses.length, s.total]))}</div>`
					: `<div class="nmr-empty">${esc(__("No duty days in this period yet."))}</div>`,
				{ cls: "nmr-wide" }
			);

			const highlights = this.card(__("Key Highlights"), "flag", this.list(d.highlights, "ok", "tick"));
			const recommendations = this.card(__("Recommendations"), "bulb", this.list(d.recommendations, "go", "arrow"));

			const sign = `<div class="nmr-sign">
				<div>${icon("calendar", 30)}<div><b>${esc(__("Report Period"))}:</b><span>${esc(d.period.label)}</span></div></div>
				<div>${icon("pin", 30)}<div><b>${esc(__("Prepared By"))}:</b><span>${esc(__("Nursing Department"))}${d.prepared_by ? " · " + esc(d.prepared_by) : ""}</span></div></div>
				<div class="nmr-sig"><u>${esc(d.head_of_nursing || "")}</u><span>${esc(__("Head of Nursing"))}</span></div>
				<div class="nmr-sig"><u></u><span>${esc(__("Hospital Administrator"))}</span></div>
			</div><div class="nmr-motto">${esc(__("Together for Better Care"))}</div>`;

			return (
				head + note + kpis +
				`<div class="nmr-row nmr-r3">${attendance}${trend}${roles}</div>` +
				`<div class="nmr-row nmr-r2">${ward}${mix}</div>` +
				`<div class="nmr-row nmr-r3b">${details}${highlights}${recommendations}</div>` +
				sign
			);
		},

		print() {
			if (!this.$host) return;
			const w = window.open("", "_blank");
			if (!w) {
				frappe.msgprint(__("Allow pop-ups for this site to print the report."));
				return;
			}
			const $copy = this.$host.clone().addClass("printing");
			w.document.write(
				`<!doctype html><html><head><meta charset="utf-8"><title>${esc(this.$host.find(".nmr-title h1").text() + " " + this.$host.find(".nmr-title p").text())}</title>
				<base href="${esc(window.location.origin)}/">
				<style>@page{size:A4 landscape;margin:7mm}body{margin:0}${CSS}</style></head>
				<body>${$copy.prop("outerHTML")}</body></html>`
			);
			w.document.close();
			w.onload = () => {
				w.focus();
				w.print();
			};
		},
	};

	const this_year = new Date().getFullYear();
	const years = [];
	for (let y = this_year + 1; y >= 2023; y--) years.push(String(y));

	frappe.query_reports[REPORT] = {
		filters: [
			{ fieldname: "period", label: __("Report Type"), fieldtype: "Select", options: ["Daily", "Monthly", "Yearly"], default: "Monthly", reqd: 1 },
			{ fieldname: "date", label: __("Date"), fieldtype: "Date", default: frappe.datetime.get_today(), depends_on: "eval:doc.period=='Daily'" },
			{ fieldname: "month", label: __("Month"), fieldtype: "Select", options: MONTHS, default: MONTHS[new Date().getMonth()], depends_on: "eval:doc.period=='Monthly'" },
			{ fieldname: "year", label: __("Year"), fieldtype: "Select", options: years, default: String(this_year), depends_on: "eval:doc.period!='Daily'" },
			{ fieldname: "designation", label: __("Role"), fieldtype: "Link", options: "Designation" },
		],

		onload: function (report) {
			dash.mount(report);
			dash.load();
		},

		after_datatable_render: function () {
			dash.load();
		},

		formatter: function (value, row, column, data, default_formatter) {
			value = default_formatter(value, row, column, data);
			if (column.fieldname === "remark" && data && data.remark) return dash.pill(data.remark);
			return value;
		},
	};
})();
