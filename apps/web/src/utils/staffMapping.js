// Staff & Leave mapping utilities between backend snake_case and frontend camelCase layer.

export function mapStaffFromApi(s) {
	if(!s) return null;
	return {
		id: s.id,
		staff_code: s.staff_code,
		name: s.name,
		role: s.role,
		department: s.department,
		grade: s.grade,
		email: s.email,
		phone: s.phone,
		doj: s.date_of_joining,
		birthday: s.birthday,
		reportsTo: s.reports_to,
		status: s.status,
		attendance30: s.attendance_30 ?? 0,
		leavesTakenYTD: s.leaves_taken_ytd ?? 0,
		leaveBalance: s.leave_balance ?? 0,
		lastAppraisal: s.last_appraisal,
		nextAppraisal: s.next_appraisal,
		resignationDate: s.resignation_date || null,
		resignationReason: s.resignation_reason || null,
		// Derived/UI only placeholders
		onLeaveToday: false,
	};
}

export function mapStaffToCreatePayload(form) {
	return {
		staff_code: form.staff_code, // caller must ensure uniqueness
		name: form.name,
		role: form.role,
		department: form.department || null,
		grade: form.role === 'Teacher' ? (form.grade || null) : null,
		email: form.email || null,
		phone: form.phone || null,
		date_of_joining: form.doj || null,
		reports_to: form.reportsTo || null,
		birthday: form.birthday || null,
	};
}

export function mapLeaveRequestFromApi(r, staffIndex) {
	if(!r) return null;
	const staff = staffIndex?.get(r.staff_id);
	return {
		id: r.id,
		staffId: r.staff_id,
		type: r.leave_type,
		from: r.date_from,
		to: r.date_to,
		days: r.days,
		reason: r.reason,
		status: r.status,
		name: staff?.name,
		role: staff?.role,
	};
}

export function deriveOnLeaveToday(leaveRequests, todayISO = new Date().toISOString().slice(0,10)) {
	const ids = new Set();
	leaveRequests?.forEach(r => {
		if(r.status === 'Approved' && r.from <= todayISO && r.to >= todayISO) {
			ids.add(r.staffId);
		}
	});
	return ids; // set of staffIds on leave today
}

