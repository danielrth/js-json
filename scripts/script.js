var allData=null, locations=null, roles=null, employees=null, shifts=null;

$(document).ready(function(){
	for (var i = 0; i < 24; i++) {
		var text = i % 12 + (i < 12 ? " am" : " pm");
		if (i == 12) text = "12 pm"
		$("#sel_start_time").append(new Option( text, i));
		$("#sel_end_time").append(new Option( text, i));
	}

	$.ajax({
	  	url: "./backend/rota_data.json",
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
	Role dropdown change event
	==========================*/
	$('#sel_role').on('change', function() {
  		$('#sel_emp').find('option[value!="-1"]').remove();
  		if (this.value == -1)	return;
  		var emps = dhxUnits[parseInt(this.value)+1]['children'];
  		for (var i=0; i<emps.length; i++)
			$("#sel_emp").append(new Option( emps[i]['label'], emps[i]['key'] % EmployeeLimit ));
	});

	$('#sel_location').on('change', function() {
		dhxUnits = getUnits(roles, employees);
		console.log(dhxUnits);
		dhxSlots = getShiftSlots(roles, employees, shifts);
		console.log(dhxSlots);
		scheduler.clearAll();
		initScheduler();
	});
});