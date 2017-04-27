
<!doctype html>
<head>
	<meta http-equiv="Content-type" content="text/html; charset=utf-8">
	<title>Edit data</title>

	<script src="https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.2.0.min.js"></script>
	
	<style type="text/css" >
	</style>
	<script>
		$(document).ready(function(){
			var allData;
			var locations=null, roles=null, employees=null, shifts=null;
			$.ajax({
			  	url: "rota_data.json",
			  	type: 'GET'
			})
			.done(function(data) {
				allData = JSON.parse(data);
				// console.log(allData);
			})
			.fail(function(error) {
				console.log(error);
			});

			$('button').click(function(){
				locations = allData.locations;
				roles = allData.roles;
				employees = allData.employees;
				shifts = allData.shifts;
				console.log(getUnits(roles, employees));
				console.log(getShiftSlots(roles, employees, shifts));
			});

			function getUnits(roles, employees) {
				var unitOpenShift = {key: 100000, label: "Open Shifts"};
				var units = [unitOpenShift];
				for (var i = 0; i < roles.length; i++) {
					var unit = {key: i+1, label: roles[i]['name'], open: true, children: []};
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
					var sectionId = 100000;
					var color = "lightgray";
					if (shifts[i]['employee'] >= 0) {
						sectionId = generateSectionID( employees[shifts[i]['employee']]['defaultrole'], shifts[i]['employee'] );
						color = roles[employees[shifts[i]['employee']]['defaultrole']]['color'];
					}
					var shiftSlot = {start_date: shifts[i]['start_date'], end_date: shifts[i]['end_date'], text: shifts[i]['task'], section_id: sectionId, color: color, break: shifts[i]['break']}
					shiftSlots.push(shiftSlot);
				}
				return shiftSlots;
			}

			function generateSectionID(roleId, employeeId) {
				return (roleId + 1) * 100000 + employeeId + 1;
			}
		});
	</script>
</head>
<body>
<button>Load</button>
</body>