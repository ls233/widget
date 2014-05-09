<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file runs R script that return RNA-seq meta-data of the dataset passed
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

$myFile = "inSilicoDB" . DIRECTORY_SEPARATOR . "get_pData_Settings_cufDiff.txt";
$fh1 = fopen($myFile, 'w') or die("can't open file");
fwrite($fh1, $params1);


//fwrite($fh, "$params1\n");
//$firephp->log($params1, '$params');
$params1 = preg_replace('/"/', '\"', $params1);
//$firephp->log($params1, '$params after replace');

//$stringData = "Bobby Bopper\n";
//fwrite($fh, "$params1\n");

$pathToR = '"c:\Program Files\R\R-3.0.1\bin\x64\R"';

$pathToRScript = "inSilicoDB" . DIRECTORY_SEPARATOR . "get_pData_cufDiff.R";

$cmd = "$pathToR  --vanilla --quiet --slave --args \"$params1\"  <  $pathToRScript" ;

/*
$myFile = "get_pData.php--testFile.txt";
$fh = fopen($myFile, 'w') or die("can't open file");
fwrite($fh, $cmd);
*/

//$firephp->log($cmd, '$cmd');
//$firephp->log(getcwd(), 'cwd');

$ret = exec($cmd, $out = array(), $status);
/*
$firephp->log($ret, 'ret');
$firephp->log($out, 'out');
$firephp->log($status, 'status');
$firephp->log($cmd, 'cmd');
*/

if ($status != 0) {
    // Command execution failed
    $ret = array('status' => 'failed');
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
