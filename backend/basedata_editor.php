<?
	$data = $_POST['data'];

	if ( !isset($data['req']) )
		return;
	
	$inp = file_get_contents('rota_data.json');
	$tempArray = json_decode($inp);

	if ( $data['req'] == 'loc' ) {
		array_push($tempArray->locations, $data['name']);
	}
	else if ( $data['req'] == 'role' ) {
		array_push( $tempArray->roles, array("name"=>$data['name'], "color"=>$data['color']) );
	}
	else if ( $data['req'] == 'emp' ) {
		if ( !isset($data["otherroles"]) )
			$data["otherroles"] = array();
		if ( !isset($data["locations"]) )
			$data["locations"] = array();

		array_push( $tempArray->employees, array("name"=>$data['name'], "defaultrole"=>$data['defaultrole'], "otherroles"=>$data['otherroles'], "locations"=>$data['locations']));
	}
	else
		return;

	$jsonData = json_encode($tempArray);
	file_put_contents('rota_data.json', $jsonData);
	echo "OK";
?>