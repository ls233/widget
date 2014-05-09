<?php

//error_reporting(-1);
ini_set('display_errors', '0');     # don't show any errors...
error_reporting(E_ALL | E_STRICT);  # ...but do log them

require_once('FirePHPCore/FirePHP.class.php');
$firephp = FirePHP::getInstance(true);

$myFile = "testFile.txt";
$fh = fopen($myFile, 'w') or die("can't open file");

if (!empty($_GET['args'])) {
    $params1 = $_GET["args"];
}
fwrite($fh, "$params1\n");
$params1 = preg_replace('/"/', '\"', $params1);

//$stringData = "Bobby Bopper\n";
//fwrite($fh, "$params1\n");

$pathToPython = "python";

//$pathToFetchFromBioModelsScript = "c:\Users\nudelg01\Documents\mssm\EclipseWorkspace\fetchFromBioModels\src\fetchFromBioModels.py";
$pathToFetchFromBioModelsScript = "fetchFromBioModels.py";
#$pathToRScript = "inSilicoDB" . DIRECTORY_SEPARATOR . "scriptTMP.R";

$cmd = "$pathToPython $pathToFetchFromBioModelsScript \"$params1\" ";
//$cmd = "$pathToPython  \"$params1\"  <  $pathToFetchFromBioModelsScript" ;
fwrite($fh, $cmd);

$ret = exec($cmd, $out = array(), $status);
fwrite($fh, $ret);
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
