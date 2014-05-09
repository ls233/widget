<?php

// create response object
$json = array();
$json['expID'] = "new";
$json['notes'] = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
$json['files'] = array();
$json['relatedExpts'] = array();
$json['files'][] = 'http://tsb.mssm.edu/primeportal/buildwidget/data/data4dt.txt';
$json['files'][] = 'http://tsb.mssm.edu/primeportal/buildwidget/data/datafile1.txt';
$json['relatedExpts'][] = 'EXP-08-AA0708';
$json['relatedExpts'][] = 'EXP-08-AA0709';

 
// encode array $json to JSON string
$encoded = json_encode($json);
 
// send response back to index.html
// and end script execution
die($encoded);

?>
