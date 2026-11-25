# Copyright (c) 2026, nishow and contributors
# For license information, please see license.txt

"""Nurses Monthly Report.

Ward activity (admissions, transfers, discharges, deaths) is read from the
"Nurses Monthly Report" doctype. Head-count, leave and attendance come from
Employee, Leave Application and Attendance, because the doctype has no fields
for them.

The table below the infographic lists every nurse; the infographic itself is
drawn by my_report1.js from get_dashboard().
"""

import calendar
from datetime import date

import frappe
from frappe import _
from frappe.utils import add_days, add_months, cint, flt, get_first_day, get_last_day, getdate, today

REPORT = "my report1"
SOURCE_DOCTYPE = "Nurses Monthly Report"
TREND_MONTHS = 6
TREND_DAYS = 7
# remark thresholds on the performance percentage: days present out of the days a
# nurse was expected to work (approved leave is not held against the nurse)
REMARKS = ((98, "Excellent"), (95, "Very Good"), (90, "Good"), (0, "Needs Attention"))


def execute(filters=None):
	filters = frappe._dict(filters or {})
	period = get_period(filters)
	nurses = get_nurse_rows(period.from_date, period.to_date, filters.get("designation"))
	return get_columns(), nurses


def get_columns():
	return [
		{"fieldname": "employee", "label": _("Employee"), "fieldtype": "Link", "options": "Employee", "width": 130},
		{"fieldname": "employee_name", "label": _("Nurse"), "fieldtype": "Data", "width": 220},
		{"fieldname": "designation", "label": _("Role"), "fieldtype": "Data", "width": 150},
		{"fieldname": "gender", "label": _("Gender"), "fieldtype": "Data", "width": 90},
		{"fieldname": "scheduled_days", "label": _("Duty Days"), "fieldtype": "Float", "precision": 1, "width": 100},
		{"fieldname": "present_days", "label": _("Present"), "fieldtype": "Float", "precision": 1, "width": 100},
		{"fieldname": "leave_days", "label": _("On Leave"), "fieldtype": "Float", "precision": 1, "width": 100},
		{"fieldname": "absent_days", "label": _("Absent"), "fieldtype": "Float", "precision": 1, "width": 90},
		{"fieldname": "attendance", "label": _("Attendance %"), "fieldtype": "Percent", "width": 120},
		{"fieldname": "performance", "label": _("Performance %"), "fieldtype": "Percent", "width": 125},
		{"fieldname": "remark", "label": _("Remarks"), "fieldtype": "Data", "width": 140},
	]


# ---------------------------------------------------------------- period


def get_period(filters):
	"""The selected day, month or year, the period before it and the trend buckets."""
	now = getdate(today())
	kind = filters.get("period") if filters.get("period") in ("Daily", "Monthly", "Yearly") else "Monthly"
	year = cint(filters.get("year")) or now.year
	month = filters.get("month")
	if month in list(calendar.month_name):
		month = list(calendar.month_name).index(month)
	month = cint(month) or now.month
	day_label = lambda d: f"{d.day} {d.strftime('%B %Y')}"

	p = frappe._dict(kind=kind)
	if kind == "Daily":
		day = getdate(filters.get("date") or now)
		p.update(
			from_date=day, to_date=day, title=day.strftime("%A, ") + day_label(day), label=day_label(day),
			heading=_("Nurses Daily Report"), noun=_("day"), this=_("today") if day == now else _("on this day"),
			previous=(add_days(day, -1), add_days(day, -1)), previous_name=day_label(getdate(add_days(day, -1))),
			trend_note=_("nurses per day, last 7 days"),
		)
		# the six days before the selected one, oldest first
		p.buckets = [
			(d, d, f"{d.day} {d.strftime('%b')}", day_label(d))
			for d in (getdate(add_days(day, -back)) for back in range(TREND_DAYS - 1, -1, -1))
		]
	elif kind == "Yearly":
		first, last = date(year, 1, 1), date(year, 12, 31)
		p.update(
			from_date=first, to_date=last, title=str(year), label=f"1 January – 31 December {year}",
			heading=_("Nurses Annual Report"), noun=_("year"), this=_("this year"),
			previous=(date(year - 1, 1, 1), date(year - 1, 12, 31)), previous_name=str(year - 1),
			trend_note=_("nurses per month"),
		)
		# every month of the year that has started
		p.buckets = [
			(m, getdate(get_last_day(m)), m.strftime("%b"), m.strftime("%B %Y"))
			for m in (date(year, i, 1) for i in range(1, 13))
			if m <= now
		]
	else:
		first = date(year, month, 1)
		last = getdate(get_last_day(first))
		before = getdate(add_months(first, -1))
		p.update(
			from_date=first, to_date=last, title=first.strftime("%B %Y"),
			label=f"{first.day} – {last.day} {last.strftime('%B %Y')}",
			heading=_("Nurses Monthly Report"), noun=_("month"), this=_("this month"),
			previous=(before, getdate(get_last_day(before))), previous_name=before.strftime("%B %Y"),
			trend_note=_("nurses per month, last 6 months"),
		)
		p.buckets = [
			(m, getdate(get_last_day(m)), m.strftime("%b"), m.strftime("%B %Y"))
			for m in (getdate(add_months(first, -back)) for back in range(TREND_MONTHS - 1, -1, -1))
		]
	return p


# ---------------------------------------------------------------- nurses


def get_nursing_departments():
	return frappe.get_all("Department", filters={"name": ["like", "%Nurs%"]}, pluck="name")


def get_nurse_rows(from_date, to_date, designation=None):
	"""One row per nurse employed at any time in the period, worst attendance first."""
	departments = get_nursing_departments()
	if not departments:
		return []

	conditions = ""
	values = {"departments": departments, "from_date": from_date, "to_date": to_date}
	if designation:
		conditions = " and designation = %(designation)s"
		values["designation"] = designation

	employees = frappe.db.sql(
		f"""
		select name as employee, employee_name, designation, gender, status,
			date_of_joining, relieving_date
		from `tabEmployee`
		where department in %(departments)s
			and (date_of_joining is null or date_of_joining <= %(to_date)s)
			and (status = 'Active' or relieving_date >= %(from_date)s)
			{conditions}
		order by employee_name
		""",
		values,
		as_dict=True,
	)
	if not employees:
		return []

	names = [e.employee for e in employees]
	# nothing after today has happened yet
	last_day = min(to_date, getdate(today()))

	leaves = frappe.db.sql(
		"""
		select employee, leave_type, from_date, to_date, half_day, total_leave_days
		from `tabLeave Application`
		where docstatus = 1 and status = 'Approved'
			and employee in %(names)s
			and from_date <= %(to_date)s and to_date >= %(from_date)s
		""",
		{"names": names, "from_date": from_date, "to_date": to_date},
		as_dict=True,
	)
	absences = dict(
		frappe.db.sql(
			"""
			select employee, sum(if(status = 'Half Day', 0.5, 1))
			from `tabAttendance`
			where docstatus = 1 and status in ('Absent', 'Half Day')
				and ifnull(leave_type, '') = ''
				and employee in %(names)s
				and attendance_date between %(from_date)s and %(to_date)s
			group by employee
			""",
			{"names": names, "from_date": from_date, "to_date": last_day},
		)
	)

	rows = []
	for e in employees:
		start = max(from_date, getdate(e.date_of_joining)) if e.date_of_joining else from_date
		end = last_day
		left = e.status != "Active" and e.relieving_date and getdate(e.relieving_date) <= to_date
		if left:
			end = min(end, getdate(e.relieving_date))
		scheduled = max((end - start).days + 1, 0)

		leave_days = 0.0
		leave_types = {}
		on_leave = False
		for l in leaves:
			if l.employee != e.employee:
				continue
			on_leave = True
			a, b = max(start, getdate(l.from_date)), min(end, getdate(l.to_date))
			days = max((b - a).days + 1, 0)
			if l.half_day and flt(l.total_leave_days) < 1:
				days = min(days, 0.5)
			leave_days += days
			leave_types[l.leave_type] = leave_types.get(l.leave_type, 0) + days
		leave_days = min(leave_days, scheduled)
		absent = min(flt(absences.get(e.employee)), scheduled - leave_days)
		present = scheduled - leave_days - absent
		attendance = round(present / scheduled * 100, 1) if scheduled else None
		expected = scheduled - leave_days
		performance = round(present / expected * 100, 1) if expected else None

		rows.append(
			frappe._dict(
				employee=e.employee,
				employee_name=e.employee_name,
				designation=e.designation or _("Not set"),
				gender=e.gender or _("Not set"),
				scheduled_days=scheduled,
				present_days=present,
				leave_days=leave_days,
				absent_days=absent,
				attendance=attendance,
				performance=performance,
				remark=get_remark(performance, scheduled, leave_days),
				on_leave=on_leave,
				left=bool(left),
				leave_types=leave_types,
			)
		)

	rows.sort(key=lambda r: (r.attendance if r.attendance is not None else 101, r.employee_name or ""))
	return rows


def get_remark(performance, scheduled, leave_days):
	if not scheduled:
		return ""
	if performance is None:
		return "On Leave"  # away for the whole period
	for limit, label in REMARKS:
		if performance >= limit:
			return label


def summarise(rows):
	scheduled = sum(r.scheduled_days for r in rows)
	leave = sum(r.leave_days for r in rows)
	absent = sum(r.absent_days for r in rows)
	present = scheduled - leave - absent
	total = len(rows)
	active = len([r for r in rows if not r.left])
	on_leave = len([r for r in rows if r.on_leave])
	return frappe._dict(
		total=total,
		active=active,
		left=total - active,
		on_leave=on_leave,
		available=max(active - on_leave, 0),
		scheduled_days=scheduled,
		present_days=present,
		leave_days=leave,
		absent_days=absent,
		attendance=round(present / scheduled * 100, 1) if scheduled else None,
		performance=round(present / (scheduled - leave) * 100, 1) if scheduled - leave else None,
	)


# ---------------------------------------------------------------- ward activity


def get_ward_activity(from_date, to_date):
	"""Totals of the Nurses Monthly Report documents that start in the period.

	A document is counted once, in the period its From date falls in. For a single
	day only documents written for that one day count, so a whole month's figures
	never show up as one day's work.
	"""
	single_day = "and ifnull(p.`to`, p.`from`) <=> p.`from`" if from_date == to_date else ""
	rows = frappe.db.sql(
		f"""
		select p.name, p.nurse, p.`from` as from_date, p.`to` as to_date,
			c.deparment as department, c.no_admission, c.no_transfer, c.discharge, c.total, c.no_death
		from `tabNurses Monthly Report` p
		left join `tabMonthly` c on c.parent = p.name and c.parenttype = 'Nurses Monthly Report'
		where p.docstatus < 2
			and coalesce(p.`from`, p.`to`, date(p.creation)) between %(from_date)s and %(to_date)s
			{single_day}
		""",
		{"from_date": from_date, "to_date": to_date},
		as_dict=True,
	)

	departments, nurses, documents = {}, {}, set()
	totals = frappe._dict(admissions=0, transfers=0, discharges=0, deaths=0, total=0)
	for r in rows:
		if r.name not in documents:
			documents.add(r.name)
			nurses[r.nurse or ""] = nurses.get(r.nurse or "", 0) + 1
		if not r.department and not (r.no_admission or r.no_transfer or r.discharge or r.total or r.no_death):
			continue
		adm, tra, dis = cint(r.no_admission), cint(r.no_transfer), cint(r.discharge)
		deaths = cint(r.no_death)  # stored as text on the form
		total = cint(r.total) or (adm + tra + dis)
		d = departments.setdefault(
			r.department or _("Not set"),
			frappe._dict(department=r.department or _("Not set"), admissions=0, transfers=0, discharges=0, deaths=0, total=0),
		)
		for key, value in (("admissions", adm), ("transfers", tra), ("discharges", dis), ("deaths", deaths), ("total", total)):
			d[key] += value
			totals[key] += value

	full_names = {}
	users = [u for u in nurses if u]
	if users:
		full_names = dict(frappe.get_all("User", filters={"name": ["in", users]}, fields=["name", "full_name"], as_list=True))

	return frappe._dict(
		documents=len(documents),
		totals=totals,
		departments=sorted(departments.values(), key=lambda d: -d.total),
		nurses=sorted(
			[{"nurse": full_names.get(u) or u or _("Not set"), "reports": n} for u, n in nurses.items()],
			key=lambda x: -x["reports"],
		),
	)


# ---------------------------------------------------------------- dashboard


@frappe.whitelist()
def get_dashboard(filters=None):
	if not frappe.get_doc("Report", REPORT).is_permitted():
		frappe.throw(_("You are not allowed to view this report."), frappe.PermissionError)

	filters = frappe._dict(frappe.parse_json(filters) or {})
	period = get_period(filters)
	from_date, to_date = period.from_date, period.to_date
	designation = filters.get("designation")

	rows = get_nurse_rows(from_date, to_date, designation)
	summary = summarise(rows)
	ward = get_ward_activity(from_date, to_date)

	trend = []
	for first, last, label, name in period.buckets:
		if (first, last) == (from_date, to_date):
			s, w = summary, ward
		else:
			s = summarise(get_nurse_rows(first, last, designation))
			w = get_ward_activity(first, last)
		trend.append(
			{
				"label": label,
				"month": name,
				"available": s.available,
				"on_leave": s.on_leave,
				"attendance": s.attendance,
				"leave_days": s.leave_days,
				"admissions": w.totals.admissions,
				"discharges": w.totals.discharges,
				"documents": w.documents,
			}
		)
	previous = {
		"month": period.previous_name,
		"attendance": summarise(get_nurse_rows(period.previous[0], period.previous[1], designation)).attendance,
	}

	leave_types = {}
	for r in rows:
		for leave_type, days in r.leave_types.items():
			leave_types[leave_type] = leave_types.get(leave_type, 0) + days

	return {
		"period": {
			"kind": period.kind,
			"from_date": str(from_date),
			"to_date": str(to_date),
			"title": period.title,
			"label": period.label,
			"heading": period.heading,
			"noun": period.noun,
			"previous_name": period.previous_name,
			"trend_note": period.trend_note,
			"future": from_date > getdate(today()),
			"partial": from_date <= getdate(today()) < to_date,
		},
		"summary": summary,
		"previous_attendance": previous["attendance"],
		"trend": trend,
		"roles": count_by(rows, "designation"),
		"gender": count_by(rows, "gender"),
		"remarks": [
			{"label": label, "count": len([r for r in rows if r.remark == label])}
			for label in [x[1] for x in REMARKS] + ["On Leave"]
		],
		"leave_types": sorted(
			[{"label": k, "days": v} for k, v in leave_types.items() if v], key=lambda x: -x["days"]
		),
		"ward": ward,
		"nurses": [
			{k: r[k] for k in ("employee", "employee_name", "designation", "attendance", "performance", "leave_days", "absent_days", "remark")}
			for r in rows
			if r.scheduled_days
		][:8],
		"highlights": get_highlights(summary, ward, previous, period),
		"recommendations": get_recommendations(summary, ward, rows),
		"prepared_by": frappe.utils.get_fullname(frappe.session.user),
		"head_of_nursing": frappe.db.get_value(
			"Employee", {"designation": "Nursing Director", "status": "Active"}, "employee_name"
		),
		"logo": frappe.db.get_value("Letter Head", "logo", "image"),
		"new_document_url": "/app/nurses-monthly-report/new",
	}


def count_by(rows, key):
	counts = {}
	for r in rows:
		if not r.left:
			counts[r[key]] = counts.get(r[key], 0) + 1
	return [{"label": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]


def number(value):
	return f"{value:,.0f}" if float(value).is_integer() else f"{value:,.1f}"


def get_highlights(s, ward, previous, period):
	out = []
	if s.attendance is not None:
		line = _("Attendance rate was {0}% {1}").format(s.attendance, period.this)
		if previous and previous["attendance"] is not None:
			diff = round(s.attendance - previous["attendance"], 1)
			if diff:
				line += " " + (_("(up {0} points on {1})") if diff > 0 else _("(down {0} points on {1})")).format(
					abs(diff), previous["month"]
				)
		out.append(line + ".")
	out.append(_("{0} of {1} nurses were active at the end of the period.").format(s.active, s.total))
	if s.on_leave:
		out.append(
			_("{0} nurses were on approved leave, {1} leave days in total.").format(s.on_leave, number(s.leave_days))
		)
	else:
		out.append(_("No approved leave was recorded for the nursing team."))
	if s.absent_days:
		out.append(_("{0} days of absence without leave were recorded.").format(number(s.absent_days)))
	if s.left:
		out.append(_("{0} nurses left the department during the {1}.").format(s.left, period.noun))
	if ward.documents:
		t = ward.totals
		out.append(
			_("Wards reported {0} admissions, {1} transfers, {2} discharges and {3} deaths in {4} ward reports.").format(
				t.admissions, t.transfers, t.discharges, t.deaths, ward.documents
			)
		)
		if ward.departments:
			top = ward.departments[0]
			out.append(_("{0} was the busiest department with {1} patients.").format(top.department, top.total))
	else:
		out.append(_("No Nurses Monthly Report was submitted by the wards for this period."))
	return out


def get_recommendations(s, ward, rows):
	out = []
	low = [r for r in rows if r.performance is not None and r.performance < 90]
	if s.attendance is not None and s.attendance >= 95:
		out.append(_("Continue to maintain the high attendance level."))
	elif s.attendance is not None:
		out.append(_("Review the duty roster: attendance is below the 95% target."))
	if low:
		out.append(_("Follow up with the {0} nurses who missed more than 10% of their duty days without leave.").format(len(low)))
	if s.active and s.on_leave / s.active > 0.1:
		out.append(_("More than 10% of the team took leave; stagger annual leave to keep every ward covered."))
	elif s.on_leave:
		out.append(_("Monitor staff on leave and ensure smooth shift coverage."))
	if s.absent_days:
		out.append(_("Record the reason for every absence and convert approved ones into leave applications."))
	if not ward.documents:
		out.append(_("Ask every ward to submit its Nurses Monthly Report so that patient activity appears here."))
	elif ward.totals.deaths:
		out.append(_("Review the {0} reported deaths in the mortality meeting.").format(ward.totals.deaths))
	out.append(_("Provide regular training on patient care and documentation."))
	return out
