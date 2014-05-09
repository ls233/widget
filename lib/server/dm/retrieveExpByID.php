<?php

//$user_name = $_POST['id'];
$id = $_GET['id'];
$xmlDoc = new DOMDocument();
$xmlDoc->load("data/exp".$id.".xml");
echo $xmlDoc->saveXML();
?>