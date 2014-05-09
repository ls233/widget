<?php

    $arr = array('status' => "failed");
    $jsonEncodedURL = json_encode($arr);
    echo isset($_GET['callback'])
    ? "{$_GET['callback']}($jsonEncodedURL)"
    : $baseURL;
   
?>
