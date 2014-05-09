<?php

    $baseURL = "http://146.203.29.123:8080/Java_Example/";//22156
    $jsonEncodedURL = json_encode($baseURL);
    echo isset($_GET['callback'])
    ? "{$_GET['callback']}($jsonEncodedURL)"
    : $baseURL;
   
?>
