function getMonday(d) {
  	d = new Date(d);
  	var day = d.getDay(),
      	diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  	return new Date(d.setDate(diff));
}

function saveServerShift(ev) {
	var isNew = ev.shift_id == undefined;
	var newShiftId = ( isNew ? "new" : ev.shift_id );
	var newShift = {
		id: newShiftId,
		employee: ev.emp, task: ev.text, 
		start_date: moment(ev.start_date).format('YYYY-MM-DD HH:mm'), 
		end_date: moment(ev.end_date).format('YYYY-MM-DD HH:mm'), 
		break: ev.break };

	if ( ev.emp == -1 ) {
		newShift['role'] = ev.role;
	}

	$.ajax({
	    type: 'POST',
	    url: 'edit_data.php',
	    data: { 'data': newShift },
	    success: function(msg) {
	      	if (isNew)
	      		ev.shift_id = msg;
	    }
	});
}

function deleteServerShift(shiftId) {
	$.ajax({
	    type: 'POST',
	    url: 'edit_data.php',
	    data: { 'data': {delId: shiftId} },
	    success: function(msg) {
	    	console.log(msg);
	    }
	});
}

function getUnits(roles, employees) {
	var unitOpenShift = {key: -1, label: "Open Shifts"};
	var units = [unitOpenShift];
	for (var i = 0; i < roles.length; i++) {
		var unit = {key: i, label: roles[i]['name'], open: true, children: []};
		units.push(unit);
	}

	var selLocId = parseInt( $('#sel_location').val() );
	for (var i = 0; i < employees.length; i++) {
		//filter employees of selected location
		if ( selLocId != -1 ) {
			var arrEmpLocations = employees[i]['locations'];
			if ( arrEmpLocations.indexOf(selLocId) == -1 ) {
				continue;
			}
		}

		var defaultRole = employees[i]['defaultrole'];
		var unit = {key: generateSectionId(defaultRole, i), label: employees[i]['name']};
		units[defaultRole + 1]['children'].push(unit);
	}
	return units;
}

function getShiftSlots(roles, employees, shifts) {
	var shiftSlots = [];
	for (var i = 0; i < shifts.length; i++) {
		//filter with location
		var emp = shifts[i]['employee'];
		var selLocId = parseInt( $('#sel_location').val() );
		if ( emp != -1 && selLocId != -1 ) {
			var arrEmpLocations = employees[emp]['locations'];
			if ( arrEmpLocations.indexOf(selLocId) == -1 ) {
				continue;
			}	
		}

		var sectionId;
		var color;
		var role;
		if (emp != -1) {
			role = employees[shifts[i]['employee']]['defaultrole'];
			sectionId = generateSectionId( role, shifts[i]['employee'] );
		}
		else {
			role = shifts[i]['role'];
			sectionId = -1;
		}
		if (role == -1)
			color = OpenShiftColor
		else
			color = roles[role]['color'];

		var shiftSlot = { 
			shift_id: shifts[i]['id'], 
			start_date: shifts[i]['start_date'], 
			end_date: shifts[i]['end_date'], 
			text: shifts[i]['task'], 
			section_id: sectionId, 
			color: color, 
			break: shifts[i]['break'], 
			role: role, emp: emp 
		};
		shiftSlots.push(shiftSlot);
	}
	return shiftSlots;
}

function generateSectionId( roleId, employeeId ) {
	/*if emp is open, shift section is open shift*/
	if ( employeeId == -1 )
		return -1;
	else
		return ( roleId + 1 ) * EmployeeLimit + employeeId;
}
