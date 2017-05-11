<?
	$data = $_POST['data'];

	$inp = file_get_contents('rota_data.json');
	$tempArray = json_decode($inp);

	if ( $data['req'] == 'loc' ) {
		array_push($tempArray->locations, $data['name']);
	}
	else if ( $data['req'] == 'role' ) {
		array_push( $tempArray->roles, array("name"=>$data['name'], "color"=>$data['color']) );
	}
	else if ( $data['req'] == 'emp' ) {
		if ( !isset($data["otherroles"]) ) {
			$data["otherroles"] = array();
		}
		else {
			for ($i = 0; $i < count($data["otherroles"]); $i++ )
				$data["otherroles"][$i] = (int)$data["otherroles"][$i];
		}
		if ( !isset($data["locations"]) )
			$data["locations"] = array();
		else {
			for ($i = 0; $i < count($data["locations"]); $i++ )
				$data["locations"][$i] = (int)$data["locations"][$i];
		}
		$data['defaultrole'] = (int)$data['defaultrole'];

		$photoFile = rand(1, 10) . ".jpg";
		array_push( $tempArray->employees, array("name"=>$data['name'], "defaultrole"=>$data['defaultrole'], "otherroles"=>$data['otherroles'], "locations"=>$data['locations'], "photo"=>$photoFile) );
	}
	else
		return;

	$jsonData = json_encode($tempArray);
	file_put_contents('rota_data.json', $jsonData);
	// echo $jsonData;
	echo "OK";
?>