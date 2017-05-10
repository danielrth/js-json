<?
	$data = $_POST['data'];

	$inp = file_get_contents('rota_data.json');
	$tempArray = json_decode($inp);

	for ($i = 0; $i < count($data); $i++) {
		if ( isset($data[$i]['role']) )
			$data[$i]['role'] = (int)$data[$i]['role'];
		if ( isset($data[$i]['employee']) )
			$data[$i]['employee'] = (int)$data[$i]['employee'];
		if ( isset($data[$i]['id']) )
			$data[$i]['id'] = (int)$data[$i]['id'];
		if ( isset($data[$i]['break']) )
			$data[$i]['break'] = (int)$data[$i]['break'];

		if ( $data[$i]['req'] == "new" ) {
			$dataToUpdate = $data[$i];
			unset($dataToUpdate['req']);
			array_push($tempArray->shifts, $dataToUpdate);
		}
		else if ( $data[$i]['req'] == "update" ){
			for( $j = 0; $j < count($tempArray->shifts); $j++ ) {
			    if ( $data[$i]['id'] == $tempArray->shifts[$j]->id ) {
			    	$dataToUpdate = $data[$i];
					unset($dataToUpdate['req']);
			        $tempArray->shifts[$j] = $dataToUpdate;
			        break;
			    }
			}
		}
		else if ( $data[$i]['req'] == "delete" ) {
			for( $j = 0; $j < count($tempArray->shifts); $j++ ) {
			    if ( $data[$i]['id'] == $tempArray->shifts[$j]->id ) {
			        array_splice( $tempArray->shifts, $j, 1 );
		        	break;
			    }
			}
		}
	}
	$jsonData = json_encode($tempArray);
	file_put_contents('rota_data.json', $jsonData);
	echo "OK";
?>