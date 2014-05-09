<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file returns base url of the widget
 */

$debug = 1; 

if($debug){
  //setup reporting problems to browsers
  try {
    require_once('browser_reporting.php');  
  } catch (Exception $e) {
    // report $e->getMessage()
  }
}

function siteURL() {
    $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off') || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $domainName = $_SERVER['HTTP_HOST'];
    return $protocol.$domainName;
}

$folder = substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], "/") + 1);
$siteURL = siteURL();
$baseURL = $siteURL . $folder;
$jsonEncodedURL = json_encode($baseURL);
echo isset($_GET['callback'])
? "{$_GET['callback']}($jsonEncodedURL)"
: $baseURL;
   
?>
