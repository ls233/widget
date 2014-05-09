<?php

session_start();
//compare the password
$token = $_GET['token'];
if (strcmp($token, session_id()) == 0) {
    session_destroy();
}
else
    $rtnjsonobj['status'] = "no";

echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';
?>