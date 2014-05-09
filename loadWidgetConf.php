<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file reads and returns the main widget configuration (widget_conf.json) 
 */

session_start();

$debug = 0; 

if($debug){
  //setup reporting problems to browsers
  require_once($_SERVER['DOCUMENT_ROOT'] . '/php-console/src/PhpConsole/__autoload.php');
// Call debug from PhpConsole\Handler
  $handler = PhpConsole\Handler::getInstance();
  $handler->start();

  require_once($_SERVER['DOCUMENT_ROOT'] . '/FirePHPCore/FirePHP.class.php');
  $firephp = FirePHP::getInstance(true);
  $firephp->log($_SERVER['DOCUMENT_ROOT'], '$_SERVER["DOCUMENT_ROOT"]');
}

$arr = array("status" => "failed");//change to success if everything is ok
$toolWebTitle2toolName = array("Misty Mountain" => "Flow Cytometry", "flowPeaks" => "Flow Cytometry", "Tidal" => "insilico");
if (!empty($_GET['tool_title'])) {
    $tool_title = $_GET['tool_title'];
} else {
    die ( $_GET['callback'] . '(' . json_encode($arr) . ')' );
}

$file = "widget_conf.json"; //conf file
$json = json_decode(file_get_contents($file),true);
if($debug){ /* $firephp->log($json, '$json'); */ }   
$widget_type = $json['default_widget_type'];

foreach ($toolWebTitle2toolName as $tool => $type) {
    if (preg_match("/$tool/i", $tool_title)) {
    	if($debug){ $firephp->log($tool, 'tool matched'); }   
        break;
    } 
}

if( is_null($widget_type) ){ //couldn't read configuration
	$arr['error'] = "couldn't read configuration";
} else{ //success reading conf
	$arr['status'] = 'ok';        
	$arr['widget_type'] = $widget_type;
	if($debug){ $firephp->log($widget_type, '$widget_type'); }   
	$settings = $json['widget_settings'];
	$arr['conf'] = $settings[$widget_type];
  $arr['system_settings'] = $json['system_settings'];
}

echo $_GET['callback'] . '(' . json_encode($arr) . ')';
?>



