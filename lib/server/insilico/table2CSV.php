<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file writes passed csv text to a file
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

$csv_text= $_POST['arg']['csv_text'];
$args= $_POST['arg'];
//$firephp->log($args, 'args');
$csv_text= stripslashes($csv_text);

$ret = write2file($csv_text);

$ret = array('status' => $ret);
$rtnjsonobj = $ret;    
echo json_encode($rtnjsonobj);

function write2file($csv_text) {
	global $firephp;
	$folder = $_POST['arg']['folder'];
	$file = $_POST['arg']['file'];
	//$folder= stripslashes($folder);
	//$firephp->log($folder, 'folder');
	$csvFileName = $file . "__csv_text.txt";
	$myFile = $folder . DIRECTORY_SEPARATOR . $csvFileName;
	$fh = fopen($myFile, 'w') or die( "can't open file");
	fwrite($fh, $csv_text);
	fclose($fh);
	return "ok";
}
?>



