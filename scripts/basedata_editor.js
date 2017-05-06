var allData=null, locations=null, roles=null, employees=null, shifts=null;
var arrEmpLocations = [];
var arrEmpRoles = [];

$(document).ready(function(){
	/*========================
	Load data from backend
	=========================*/
	$.ajax({
	  	url: "./backend/rota_data.json",
	  	type: 'GET'
	})
	.done(function(data) {
		allData = JSON.parse(data);
		locations = allData.locations;
		loadDataToTable ('location', locations, $("#tbl_locations"));
		roles = allData.roles;
		loadDataToTable ('role', roles, $("#tbl_roles"));
		employees = allData.employees;
		loadDataToTable ('employee', employees, $("#tbl_employees"));
	})
	.fail(function(error) {
		console.log(error);
	});

	$.ajax({
	  	url: "./backend/csscolors.json",
	  	type: 'GET'
	})
	.done(function(data) {
		var arrCssColors = JSON.parse(data);
		for (var i = 0; i < arrCssColors.length; i++) {
			$("#mnu_color").append("<li style='background-color:" + arrCssColors[i]['Name'] + "'><a href='#'>"+arrCssColors[i]['Name']+"</a></li>");
		}
	})
	.fail(function(error) {
		console.log(error);
	});

	/*=========================================
	Dropdown selector with available css colors
	==========================================*/
	$('.dropdown-menu').on( 'click', 'a', function() {
	    var text = $(this).html();
	    var htmlText = text + ' <span class="caret"></span>';
	    $('.dropdown-toggle').html(htmlText);
	    $('.dropdown-toggle').css('background-color', text);
	});

	/*===============
	Save new Location
	===============*/
	$('#btn_save_loc').on('click', function() {
		var name = $('#txt_loc_name').val();
		if (!name)	alert ("Location name is required!");
		sendDataToServer({'req': 'loc', 'name': name});
	});
	/*===============
	Save new Role
	===============*/
	$('#btn_save_role').on('click', function() {
		var name = $('#txt_role_name').val();
		var color = $('.dropdown-toggle').html();
		if (!name)	alert ("Role name is required!");
		if (!color)	alert ("Color of a role is required!");
		sendDataToServer ( {'req': 'role', 'name': name, 'color': color} );
	});
	
	/*==================================================
	Insert location, other role in editing new employee
	==================================================*/
	$('#btn_emp_loc').on('click', function() {
		if (arrEmpLocations.indexOf($('#sel_emp_loc option:selected').val()) != -1)
			return;
		arrEmpLocations.push( $('#sel_emp_loc option:selected').val() );
		$("#tbl_emp_locations").append("<tr><td>" + $('#sel_emp_loc option:selected').text() + "</td></tr>");
	});
	$('#btn_emp_other_role').on('click', function() {
		if (arrEmpRoles.indexOf($('#sel_other_role option:selected').val()) != -1)
			return;
		arrEmpRoles.push( $('#sel_other_role option:selected').val() );
		$("#tbl_emp_roles").append("<tr><td>" + $('#sel_other_role option:selected').text() + "</td></tr>");
	});

	/*===============
	Save new Employee
	===============*/
	$('#btn_save_emp').on('click', function() {
		var name = $('#txt_emp_name').val();
		if (!name)	alert ("Employee name is required!");
		if (sendDataToServer ({
			'req': 'emp', 
			'name': name, 
			'defaultrole': $('#sel_emp_role option:selected').val(),
			'otherroles': arrEmpRoles,
			'locations': arrEmpLocations
		}) == "OK" ) {
		};
	});
});

function loadDataToTable(dataType, data, ele) {
	ele.html('');
	for (var i = 0; i < data.length; i++) {
		var name = dataType == 'location' ? data[i] : data[i]['name'];
		ele.append("<tr><td>" + name + "</td></tr>");

		if (dataType == 'location')
			$('#sel_emp_loc').append("<option value=" + i + ">" + name + "</option>");
		if (dataType == 'role') {
			$('#sel_other_role').append("<option value=" + i + ">" + name + "</option>");
			$('#sel_emp_role').append("<option value=" + i + ">" + name + "</option>");
		}
	}
}

function sendDataToServer (data) {
	$.ajax({
	    type: 'POST',
	    url: './backend/basedata_editor.php',
	    data: { 'data': data },
	    success: function(msg) {
	    	if (data['req'] == 'emp') {
				employees.push({
					'name': $('#txt_emp_name').val(), 
					'defaultrole': $('#sel_emp_role option:selected').val(),
					'otherroles': arrEmpRoles,
					'locations': arrEmpLocations});
				loadDataToTable ('employee', employees, $("#tbl_employees"));
				$('#tbl_emp_roles').html('');
				$('#tbl_emp_locations').html('');
				$('#txt_emp_name').val('');
	    	}
	    },
	});
}