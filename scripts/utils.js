var EmployeeLimit = 100000;
var OpenShiftColor = "lightgray";

var allData=null, locations=null, roles=null, employees=null, shifts=null;
var dhxUnits, dhxSlots;

function getMonday(d) {
  	d = new Date(d);
  	var day = d.getDay(),
      	diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  	return new Date(d.setDate(diff));
}

function initScheduler() {
	scheduler.locale.labels.timeline_tab = "Timeline";
	scheduler.locale.labels.section_custom="Section";
	scheduler.config.details_on_create=true;
	scheduler.config.details_on_dblclick=true;
	scheduler.config.xml_date="%Y-%m-%d %H:%i";
	
	
	//===============
	//Configuration
	//===============	

	scheduler.createTimelineView({
		section_autoheight: false,
		name:	"timeline",
		x_unit:	"day",
		x_date:	"%j %D",
		x_step:	1,
		x_size: 7,
		y_unit: dhxUnits,
		y_property:	"section_id",
		round_position: true,
		render: "tree",
		folder_dy:20,
		dy:60
	});
	
	//===============
	//Data loading
	//===============
	scheduler.init('scheduler_here',getMonday(new Date()),"timeline");
	scheduler.parse(dhxSlots,"json");
}

var format = scheduler.date.date_to_str("%H:%i");
scheduler.templates.event_bar_text = function(sd, ed, ev){
	return "<div class=custom-eventline-content>"
		 + format(sd)+" - "+format(ed) + "<br>"
		 + ev.text + "<br>"
		 + ( ev.role == undefined ? "" : (ev.role < 0 ? "Open Shift" : roles[ev.role]['name']) )
		 + "(" + (ev.break || 0) + " min break)</div>"
}

var dragged_event;
var roleBeforeDrag, sectionIdBeforeDrag;
var lastEventMode;
scheduler.attachEvent("onBeforeDrag", function (id, mode, e){
	lastEventMode = mode;
    if ( mode != "move")
    	return;
    dragged_event=scheduler.getEvent(id);
    roleBeforeDrag = dragged_event.role;
    sectionIdBeforeDrag = dragged_event.section_id;
    return true;
});

var lastDraggingEventSectionId;
scheduler.attachEvent("onEventDrag", function (id, mode, e){
	if ( mode != "move")
		return;
	var ev = scheduler.getEvent(id);
	if (lastDraggingEventSectionId == ev.section_id)
		return;
	var newRole;
	if (ev.section_id == -1) {
		$(".dhx_cal_event_line").css('opacity', '1');
		$(".dhx_matrix_line td").css('opacity', '1');
	}
	else {
		newRole = parseInt(ev.section_id / EmployeeLimit) - 1 ;
		if (roleBeforeDrag != newRole) {
			$(".dhx_cal_event_line").css('opacity', '0.1');
			$(".dhx_matrix_line td").css('opacity', '0.1');
			console.log('ahhhhhh..............');
		}
		else {
			$(".dhx_cal_event_line").css('opacity', '1');
			$(".dhx_matrix_line td").css('opacity', '1');
		}
	}
	lastDraggingEventSectionId = ev.section_id;
});

scheduler.attachEvent("onDragEnd", function(){
	if (lastEventMode != "move")
		return;
    var ev = dragged_event;
    var newRole;
 	if (ev.section_id > -1)
 	{
		newRole = parseInt(ev.section_id / EmployeeLimit) - 1;
		if (roleBeforeDrag != newRole) {
			ev.section_id = sectionIdBeforeDrag;
			scheduler.updateEvent(ev.id);
		}
	}
});

scheduler.showLightbox = function(id) {
	var ev = scheduler.getEvent(id);
	scheduler.startLightbox(id, document.getElementById("shift_form"));
	
	$("#description").val( ev.text );
	$("#break").val( ev.break || 0 );
	$("#sel_start_time").val( ev.start_date.getHours() );
	$("#sel_end_time").val( ev.end_date.getHours() );

	var newRole;
	var newEmp;
	if (ev.role == undefined) { // click new event
		if (ev.section_id == -1) {// click on open section
			newRole = -1;
			newEmp = -1;
		}
		else {//click on role section
			newRole = parseInt(ev.section_id / EmployeeLimit) - 1 ;
			newEmp = ev.section_id % EmployeeLimit;
		}

		$('.btn#delete').hide();
		$('#event_form_title').html("Add Shift");
		$('#row_for_emp_select').hide();
	}
	else { //click edit event
		newRole = ev.role;
		newEmp = ev.section_id % EmployeeLimit;

		$('.btn#delete').show();
		$('#event_form_title').html("Edit Shift");
		$('#row_for_emp_select').show();
	}

	$('#sel_role').val( newRole );
	$('#sel_emp').find('option[value!="-1"]').remove();
	if (newRole > -1) {
		var emps = dhxUnits[newRole+1]['children'];
		for (var i=0; i<emps.length; i++)
			$("#sel_emp").append(new Option( emps[i]['label'], emps[i]['key'] % EmployeeLimit ));
		
	}
	$("#sel_emp").val(newEmp);
};

function save_form() {
	var ev = scheduler.getEvent(scheduler.getState().lightbox_id);
	ev.text = $("#description").val();
	ev.break = $("#break").val();
	ev.end_date.setDate(ev.start_date.getDate());
	ev.start_date.setHours($("#sel_start_time").val());
	ev.end_date.setHours($("#sel_end_time").val());
	
	var newRole = parseInt($("#sel_role").val());
	var newEmp = parseInt($("#sel_emp").val());
	if ( newRole == -1 ) { //user selected empty role
		ev.section_id = -1;
		ev.role = -1;
		ev.emp = -1;
		ev.color = OpenShiftColor;
	}
	else {
		if ( newEmp == -1 ) { //user selected open shift
			ev.section_id = -1;
			ev.role = newRole;
			ev.emp = -1;
		}
		else {
			ev.section_id = generateSectionId(newRole, newEmp);
			ev.role = newRole;
			ev.emp = newEmp;
		}
		ev.color = roles[newRole]['color'];
	}

	saveServerShift (ev);
	scheduler.endLightbox(true, document.getElementById("shift_form"));
}
function close_form() {
	scheduler.endLightbox(false, document.getElementById("shift_form"));
}

function delete_event() {
	var event_id = scheduler.getState().lightbox_id;
	var ev = scheduler.getEvent(scheduler.getState().lightbox_id);
	deleteServerShift(ev.shift_id);

	scheduler.endLightbox(false, document.getElementById("shift_form"));
	scheduler.deleteEvent(event_id);
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

	for (var i = 0; i < employees.length; i++) {
		var defaultRole = employees[i]['defaultrole'];
		var unit = {key: generateSectionId(defaultRole, i), label: employees[i]['name']};
		units[defaultRole + 1]['children'].push(unit);
	}
	return units;
}

function getShiftSlots(roles, employees, shifts) {
	var shiftSlots = [];
	for (var i = 0; i < shifts.length; i++) {
		var sectionId;
		var color;
		var role;
		if (shifts[i]['employee'] >= 0) {
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

		var emp = shifts[i]['employee'];
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

$(document).ready(function(){
	for (var i = 0; i < 24; i++) {
		var text = i % 12 + (i < 12 ? " am" : " pm");
		if (i == 12) text = "12 pm"
		$("#sel_start_time").append(new Option( text, i));
		$("#sel_end_time").append(new Option( text, i));
	}

	$.ajax({
	  	url: "rota_data.json",
	  	type: 'GET'
	})
	.done(function(data) {
		allData = JSON.parse(data);
		// allData = data;
		locations = allData.locations;
		roles = allData.roles;
		employees = allData.employees;
		shifts = allData.shifts;
		dhxUnits = getUnits(roles, employees);
		console.log(dhxUnits);
		dhxSlots = getShiftSlots(roles, employees, shifts);
		console.log(dhxSlots);
		initScheduler();

		for (var i=0; i<roles.length; i++) {
			$("#sel_role").append(new Option( roles[i]['name'], i));
		}
	})
	.fail(function(error) {
		console.log(error);
	});

	/*=========================
	Role dropdown change event
	==========================*/
	$('#sel_role').on('change', function() {
  		$('#sel_emp').find('option[value!="-1"]').remove();
  		if (this.value == -1)	return;
  		var emps = dhxUnits[parseInt(this.value)+1]['children'];
  		for (var i=0; i<emps.length; i++)
			$("#sel_emp").append(new Option( emps[i]['label'], emps[i]['key'] % EmployeeLimit ));
	})
});
