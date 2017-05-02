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
$(".dhx_cal_event_line.dhx_in_move").css('opacity', '0.1');
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
	// console.log(ev);
	return "<div class=custom-eventline-content>" + format(sd)+" - "+format(ed) + "<br>" + ev.text + "<br>(" + (ev.break || 0) + " min break)</div>"
}

var dragged_event;
var roleBeforeDrag, sectionIdBeforeDrag;
scheduler.attachEvent("onBeforeDrag", function (id, mode, e){
    if ( mode == "move")
    	dragged_event=scheduler.getEvent(id);
    roleBeforeDrag = dragged_event.role;
    sectionIdBeforeDrag = dragged_event.section_id;
    console.log(sectionIdBeforeDrag);
    return true;
});
scheduler.attachEvent("onDragEnd", function(){
    var ev = dragged_event;
    var newRole;
 	if (ev.section_id == -1)
		newRole = -1;
	else {
		newRole = parseInt(ev.section_id / EmployeeLimit) - 1;
		if (roleBeforeDrag != newRole) {
			ev.section_id = sectionIdBeforeDrag;
			scheduler.updateEvent(ev.id);
		}
	}
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

	e.stopPropagation();
	e.preventDefault();
	return false;
});

scheduler.showLightbox = function(id) {
	var ev = scheduler.getEvent(id);
	scheduler.startLightbox(id, document.getElementById("shift_form"));
	
	$("#description").val( ev.text );
	$("#break").val( ev.break || 0 );
	$("#sel_start_time").val( ev.start_date.getHours() );
	$("#sel_end_time").val( ev.end_date.getHours() );

	if (ev.role == undefined) { //click empty event
		if (ev.section_id == -1)
			ev.role = -1;
		else
			ev.role = parseInt(ev.section_id / EmployeeLimit) - 1 ;
		ev.emp = ev.section_id % EmployeeLimit;

		$('.btn#delete').hide();
		$('#event_form_title').html("Add Shift");
		// $('#row_for_emp_select').hide();
	}
	else { //click event bar already created
		$('.btn#delete').show();
		$('#event_form_title').html("Edit Shift");
		// $('#row_for_emp_select').show();
	}
	$('#sel_role').val( ev.role );

	$('#sel_emp').find('option').remove();
	if (ev.role > -1) {
		var emps = dhxUnits[ev.role+1]['children'];
		for (var i=0; i<emps.length; i++)
			$("#sel_emp").append(new Option( emps[i]['label'], emps[i]['key'] % EmployeeLimit ));
		$("#sel_emp").val(ev.emp);
	}
	console.log(ev);
};

function save_form() {
	var ev = scheduler.getEvent(scheduler.getState().lightbox_id);
	ev.text = $("#description").val();
	ev.break = $("#break").val();
	ev.end_date.setDate(ev.start_date.getDate());
	ev.start_date.setHours($("#sel_start_time").val());
	ev.end_date.setHours($("#sel_end_time").val());
	
	ev.role = parseInt($("#sel_role").val());
	ev.emp = parseInt($("#sel_emp").val());
	if (ev.role == -1) {
		ev.section_id = -1;
		ev.color = OpenShiftColor
	}
	else {
		ev.section_id = generateSectionID( ev.role, ev.emp )
		ev.color = roles[ev.role]['color'];
	}
	console.log(ev);

	scheduler.endLightbox(true, document.getElementById("shift_form"));
}
function close_form() {
	scheduler.endLightbox(false, document.getElementById("shift_form"));
}

function delete_event() {
	var event_id = scheduler.getState().lightbox_id;
	scheduler.endLightbox(false, document.getElementById("shift_form"));
	scheduler.deleteEvent(event_id);
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
		var unit = {key: generateSectionID(defaultRole, i), label: employees[i]['name']};
		units[defaultRole + 1]['children'].push(unit);
	}
	return units;
}

function getShiftSlots(roles, employees, shifts) {
	var shiftSlots = [];
	for (var i = 0; i < shifts.length; i++) {
		var sectionId = EmployeeLimit;
		var color = OpenShiftColor;
		var role = -1;
		if (shifts[i]['employee'] >= 0) {
			role = employees[shifts[i]['employee']]['defaultrole'];
			sectionId = generateSectionID( role, shifts[i]['employee'] );
			color = roles[employees[shifts[i]['employee']]['defaultrole']]['color'];
		}
		else {
			sectionId = -1;
		}
		var shiftSlot = {start_date: shifts[i]['start_date'], end_date: shifts[i]['end_date'], text: shifts[i]['task'], section_id: sectionId, color: color, break: shifts[i]['break'], role: role, emp:shifts[i]['employee']}
		shiftSlots.push(shiftSlot);
	}
	return shiftSlots;
}

function generateSectionID(roleId, employeeId) {
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

	$('#sel_role').on('change', function() {
  		$('#sel_emp').find('option').remove();
  		if (this.value == -1)	return;
  		var emps = dhxUnits[parseInt(this.value)+1]['children'];
  		for (var i=0; i<emps.length; i++)
			$("#sel_emp").append(new Option( emps[i]['label'], emps[i]['key'] % EmployeeLimit ));
	})
});
