<?php

if($debug){
  //setup reporting problems to browsers
  try {
    require_once('browser_reporting.php');  
  } catch (Exception $e) {
    // report $e->getMessage()
  }
}


$status = 'failed';
$errors = array();
$progress = 0;

/*
try {
      $progress = $_SESSION['progress'];
      $firephp->log($progress, '$progress');
} catch (Exception $e) {
    $firephp->log($e->getMessage(), 'Caught exception: ');
    $errors = $e->getMessage()
}
*/

$arr = array('status'=>$status,'progress'=>$progress,'errors'=>$errors,'$_SESSION'=>$_SESSION);

echo isset($_GET['callback'])? 
$_GET['callback'] . '(' . json_encode($arr) . ')' :
    json_encode($arr);

?>