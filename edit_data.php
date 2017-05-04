<?
	$data = $_POST['data'];

	$inp = file_get_contents('rota_data.json');
	$tempArray = json_decode($inp);
	$shifts = $tempArray->shifts;

	if ( isset($data['delId']) ) {
		//delete shift from JSON file
		for($i = 0; $i < count($tempArray->shifts); $i++) {
		    if ($data['delId'] == $tempArray->shifts[$i]->id) {
		        array_splice( $tempArray->shifts, $i, 1 );
		        break;
		    }
		}

		$jsonData = json_encode($tempArray);
		file_put_contents('rota_data.json', $jsonData);

		echo "OK";
		return;
	}
	else {
		if ( isset($data['role']) )
			$data['role'] = (int)$data['role'];
		if ( isset($data['employee']) )
			$data['employee'] = (int)$data['employee'];

		if ( $data['id'] === "new" ) {
			//insert new shift to JSON file
			$newShiftId = 0;
			if ( count($shifts) > 0 ) {
				usort($shifts, function($a, $b) {
				    if ($a->id == $b->id) {
				        return 0;
				    }
				    return $a->id < $b->id ? -1 : 1;
				});
				$newShiftId = $shifts[count($shifts)-1]->id + 1;
			}
			
			$data['id'] = $newShiftId;
			array_push($tempArray->shifts, $data);

			$jsonData = json_encode($tempArray);
			file_put_contents('rota_data.json', $jsonData);

			echo ($newShiftId);
			return;
		}
		else {
			//update shift in JSON file
			for( $i = 0; $i < count($tempArray->shifts); $i++ ) {
			    if ( $data['id'] == $tempArray->shifts[$i]->id ) {
			        // unset( ($tempArray->shifts)[$i] );
			        $tempArray->shifts[$i] = $data;
			        break;
			    }
			}
			
			$jsonData = json_encode($tempArray);
			file_put_contents('rota_data.json', $jsonData);
			// echo $jsonData;
			echo "OK";
			return;
		}
	}
?>