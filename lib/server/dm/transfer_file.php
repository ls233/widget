<?php
session_start();

$file_path = $_GET['file_path'];
$file_name = $_GET['file_name'];

sleep(2);
         
$rtnjsonobj['status'] = 'ok';
$rtnjsonobj['fileURL'] = $file_path;
$rtnjsonobj['msg'] = "$file_name. was succefully prepared for use";

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';
?>


