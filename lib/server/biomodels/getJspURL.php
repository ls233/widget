<?php

    $baseURL = "http://71.188.127.9:22154/webAPI/";//22156
    $jsonEncodedURL = json_encode($baseURL);
    echo isset($_GET['callback'])
    ? "{$_GET['callback']}($jsonEncodedURL)"
    : $baseURL;
   
?>
