var EmployeeLimit = 100000;
var OpenShiftColor = "lightgray";

var dhxUnits, dhxSlots;

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
		 + "<span class=custom-event-title>" + format(sd)+" - "+format(ed) + "</span><br>"
		 + ev.text + "<br>"
		 + ( ev.role == undefined ? "" : (ev.role < 0 ? "Open Shift" : roles[ev.role]['name']) )
		 + " (" + (ev.break || 0) + " min break)</div>"
}

var dragged_event;
var roleBeforeDrag, sectionIdBeforeDrag;
var lastEventMode, lastEventDate = [];
scheduler.attachEvent("onBeforeDrag", function (id, mode, e){
	lastEventMode = mode;
    if ( mode != "move")
    	return;
    dragged_event=scheduler.getEvent(id);
    roleBeforeDrag = dragged_event.role;
    sectionIdBeforeDrag = dragged_event.section_id;
    lastEventDate[0] = dragged_event.start_date.getMonth();
    lastEventDate[1] = dragged_event.start_date.getDate();
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
 	if (ev.section_id > -1)
 	{
		newRole = parseInt(ev.section_id / EmployeeLimit) - 1;
		if (roleBeforeDrag != newRole) {
			ev.section_id = sectionIdBeforeDrag;
			ev.start_date.setMonth(lastEventDate[0]);
			ev.start_date.setDate(lastEventDate[1]);
			ev.end_date.setMonth(lastEventDate[0]);
			ev.end_date.setDate(lastEventDate[1]);
			scheduler.updateEvent(ev.id);
			return;
		}
	}

    ev.emp = ev.section_id == -1 ? -1 : ev.section_id % EmployeeLimit;
	saveServerShift (ev);
});
scheduler.attachEvent("onBeforeTodayDisplayed", function (){
    initScheduler();
    return false;
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
			$("#sel_emp").append(new Option( emps[i]['emp_name'], emps[i]['key'] % EmployeeLimit ));
		
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

	// scheduler.matrix.timeline.y_unit = dhxUnits;
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
