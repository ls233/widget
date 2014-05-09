<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file runs R script that return RNA-seq diff analysis of the dataset passed
 */

$debug = 1; 

if($debug){
  //include reporting problems to browsers
  try {
    require_once('browser_reporting.php');  
  } catch (Exception $e) {
    // report $e->getMessage()
  }
}

if (!empty($_GET['jsonString'])) {
    $params1 = $_GET["jsonString"];
}

$myFile = "inSilicoDB" . DIRECTORY_SEPARATOR . "getDiff_cuffDif_Settings.txt";
$fh1 = fopen($myFile, 'w') or die("can't open file");
fwrite($fh1, $params1);


$params1 = preg_replace('/"/', '\"', $params1);

$pathToR = '"c:\Program Files\R\R-3.0.1\bin\x64\R"';

$pathToRScript = "inSilicoDB" . DIRECTORY_SEPARATOR . "getDiff_cuffDif.R";

$cmd = "$pathToR  --vanilla --quiet --slave --args \"$params1\"  <  $pathToRScript" ;

$ret = exec($cmd, $out = array(), $status);


$firephp->log($ret, 'ret');
$firephp->log($out, 'out');
$firephp->log($status, 'status');
$firephp->log($cmd, 'cmd');


if ($status != 0) {
    // Command execution failed
//    echo "Error running R";
} else {
    // Command executed OK.
//    echo "OK!";
    $folder = substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], "/") + 1);
    $host = $_SERVER['HTTP_HOST'];
    $baseURL = "http://" . $host . $folder;
    $decodedRet = json_decode($ret);
    $updatedRet = array('ret' => $decodedRet, 'baseURL' => $baseURL);
    $ret = json_encode($updatedRet);    
//    var_dump($updatedRet);
//    $decoded = json_decode($ret);
//    var_dump($decoded);
//    $info = $decoded->info;
//    $info->new = 'baseURL';
//    $info->baseURL = '1234';
//    $decoded->info = $info;
//    var_dump($decoded);
//    $ret = json_encode($decoded);
}



echo isset($_GET['callback']) ? "{$_GET['callback']}($ret)" : $ret;
?>
