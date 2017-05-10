var allData=null, locations=null, roles=null, employees=null, shifts=null;

$(document).ready(function(){
	for (var i = 0; i < 24; i++) {
		var text = i % 12 + (i < 12 ? " am" : " pm");
		if (i == 12) text = "12 pm"
		$("#sel_start_time").append(new Option( text, i));
		$("#sel_end_time").append(new Option( text, i));
	}

	/*======================================
	Load base data and shifts data from db
	======================================*/
	$.ajax({
	  	url: "./backend/data_loader.php",
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
		scheduler.config.readonly = true;

		for (var i=0; i<locations.length; i++) {
			$("#sel_location").append(new Option( locations[i], i));
		}
		for (var i=0; i<roles.length; i++) {
			$("#sel_role").append(new Option( roles[i]['name'], i));
		}
	})
	.fail(function(error) {
		console.log(error);
	});

	/*=========================
	Role dropdown change event in lightbox
	==========================*/
	$('#sel_role').on('change', function() {
  		$('#sel_emp').find('option[value!="-1"]').remove();
  		if (this.value == -1)	return;
  		var emps = dhxUnits[parseInt(this.value)+1]['children'];
  		for (var i=0; i<emps.length; i++)
			$("#sel_emp").append(new Option( emps[i]['label'], emps[i]['key'] % EmployeeLimit ));
	});
	/*=========================
	Location change event
	==========================*/
	$('#sel_location').on('change', function() {
		dhxUnits = getUnits(roles, employees);
		dhxSlots = getShiftSlots(roles, employees, shifts);
		scheduler.clearAll();
		initScheduler();
	});
	/*=========================
	Read only toggle event
	==========================*/
	$('#toggle_readonly').change(function() {
		var editable = $(this).prop('checked');
		scheduler.config.readonly = !editable;
		if (!editable)
			$('#btn_save').addClass('disabled');
		else
			$('#btn_save').removeClass('disabled');
    });
    /*=========================
	Save button click event
	==========================*/
	$('#btn_save').click(function() {
		if ( !$('#toggle_readonly').prop('checked') || shiftsDiffQueue.length == 0 )
			return;
		console.log(shiftsDiffQueue);
		$.ajax({
		    type: 'POST',
		    url: './backend/edit_shifts.php',
		    data: { 'data': shiftsDiffQueue },
		    success: function(msg) {
		      	if (msg == "OK")
		      		shiftsDiffQueue = [];
		    }
		});
	})
});