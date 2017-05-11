var shiftsDiffQueue = [];
/*=====================================
Get date of Monday with given date
======================================*/
function getMonday(d) {
  	d = new Date(d);
  	var day = d.getDay(),
      	diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  	return new Date(d.setDate(diff));
}
/*=========================================
Make shifts modification queue to udpate db
=========================================*/
function updateShiftsDiffQueue(ev, reqType) {
	var reqData = {
		req: reqType, id: ev.shift_id, 
		employee: ev.emp, task: ev.text, 
		start_date: moment(ev.start_date).format('YYYY-MM-DD HH:mm'), 
		end_date: moment(ev.end_date).format('YYYY-MM-DD HH:mm'), 
		break: ev.break 
	};
	if ( ev.emp == -1 ) {
		reqData['role'] = ev.role;
	}

	if (reqType == "update") {
		reqData['id'] = ev.shift_id;
		for (var i = shiftsDiffQueue.length - 1; i >= 0; i--) {
			if ( shiftsDiffQueue[i]['req'] == "update" 
				&& shiftsDiffQueue[i]['id'] == reqData['id'] )
				shiftsDiffQueue.splice(i, 1);
		}
	}

	shiftsDiffQueue.push(reqData);
}

function deleteFromShiftsDiffQueue(shiftId) {
	for (var i = shiftsDiffQueue.length - 1; i >= 0; i--) {
		if ( shiftsDiffQueue[i]['id'] == shiftId )
			shiftsDiffQueue.splice(i, 1);
	}
	shiftsDiffQueue.push( {req: "delete", id:shiftId} );
}
/*=================================================
Make units data from base data to draw x-axis items
=================================================*/
function getUnits(roles, employees) {
	var unitOpenShift = {key: -1, label: "<span id='lbl_section_role_-1'>Open Shifts</span>", role_name: "Open Shifts"};
	var units = [unitOpenShift];
	for (var i = 0; i < roles.length; i++) {
		var id = "lbl_section_role_" + i;
		var unit = {
			key: i, 
			label: "<span id='" + id + "'>" + roles[i]['name'] + "</span>", 
			role_name: roles[i]['name'], open: true, children: []
		};
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

		var defaultRole = parseInt(employees[i]['defaultrole']);
		var id = generateSectionId(defaultRole, i);
		var unit = { 
			key: id, 
			label: "<span id='lbl_section_emp_"+id+"'>" + employees[i]['name'] + "</span>", 
			photo: employees[i]['photo'],
			emp_name: employees[i]['name'] 
		};
		units[defaultRole + 1]['children'].push(unit);
	}
	return units;
}
/*=================================================
Show shift summaries on y-axis headers
=================================================*/
function updateSectionLabels(units) {
	var minDate = scheduler.getState().min_date;
	var maxDate = scheduler.getState().max_date;
	var evs = scheduler.getEvents(minDate,maxDate);
	// if (evs.length == 0)	return;

	var arrDurations = {}, arrNumShifts = {};
	for (var i = 0; i < evs.length; i++) {
		var hours = ( evs[i]['end_date'].getTime() - evs[i]['start_date'].getTime() ) / ( 1000 * 3600 );
		if ( arrDurations[evs[i]['section_id']] == undefined )
			arrDurations[evs[i]['section_id']] = hours;
		else
			arrDurations[evs[i]['section_id']] += hours;

		if ( arrNumShifts[evs[i]['section_id']] == undefined )
			arrNumShifts[evs[i]['section_id']] = 1;
		else
			arrNumShifts[evs[i]['section_id']] += 1;
	}

	var totalHours = 0, totalNumShifts = 0;
	for (var i = 0; i < units.length; i++) {
		var unitHours = 0, unitShifts = 0;
		var childUnits = units[i]['children'];
		if (childUnits == undefined) {
			if ( units[i]['key'] == -1 ) {
				unitHours = arrDurations[-1] == undefined ? 0 : arrDurations[-1];
				unitShifts = arrNumShifts[-1] == undefined ? 0 : arrNumShifts[-1];
			}
		}
		else {
			for (var j = 0; j < childUnits.length; j++) {
				var hours = arrDurations[childUnits[j]['key']] == undefined ? 0 : arrDurations[childUnits[j]['key']];
				var numShifts = arrNumShifts[childUnits[j]['key']] == undefined ? 0 : arrNumShifts[childUnits[j]['key']];
				generateLabelHtml( childUnits[j], hours, numShifts );
				unitHours += hours;
				unitShifts += numShifts;
			}	
		}
		generateLabelHtml(units[i], unitHours, unitShifts);
		totalHours += unitHours;
		totalNumShifts += unitShifts;
	}
	$('#total_hours').html(totalHours + " hours, " + totalNumShifts + " shifts");
}

function generateLabelHtml(unit, hours, numOfShifts) {
	if (hours == undefined) hours = 0;
	if (numOfShifts == undefined) numOfShifts = 0;
	if ( unit['role_name'] != undefined ) {
		var label = unit['role_name'] +  " - " 
					+ hours + " hours, " + numOfShifts + " shifts";
		$('#lbl_section_role_' + unit['key']).html(label);
	}
	else if ( unit['emp_name'] != undefined ) {
		var label = "<img class='img-emp-avatar' src='./backend/photos/" 
					+ unit['photo'] + "' /><span class=custom-employee-name>" 
					+ unit['emp_name'] + "</span><br>" 
					+ hours + " hours, " 
					+ numOfShifts + " shifts";
		$('#lbl_section_emp_' + unit['key']).html(label);				
	}
}
/*=================================================
Make dhx events data from shifts data
=================================================*/
var lastShiftId  =  -1;
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
		if ( shifts[i]['id'] > lastShiftId)
			lastShiftId = shifts[i]['id'];
		shiftSlots.push(shiftSlot);
	}
	return shiftSlots;
}
/*==================================
Generate section ID
====================================*/
function generateSectionId( roleId, employeeId ) {
	/*if emp is open, shift section is open shift*/
	if ( employeeId == -1 )
		return -1;
	else
		return ( roleId + 1 ) * EmployeeLimit + employeeId;
}
