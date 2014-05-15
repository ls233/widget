<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file handles upload of local files (uploaded via a browser)
 */
session_start();
$debug = 1; 

if($debug){
  //include reporting problems to browsers
  try {
    require_once('browser_reporting.php');  
  } catch (Exception $e) {
    // report $e->getMessage()
  }
}


$status = 'failed';
$errors = array();
$errors = '';

if($debug){
  //$firephp->log($_FILES, '$_FILES');
  //$firephp->log($_POST, '$_POST');
}

function getServerURL(){
    if(isset($_SERVER['HTTPS'])){
        $protocol = ($_SERVER['HTTPS'] && $_SERVER['HTTPS'] != "off") ? "https" : "http";
    }
    else{
        $protocol = 'http';
    }
    return $protocol . "://" . $_SERVER['HTTP_HOST'];
}

function getOutDir() { 
    $file = "../../../widget_conf.json"; //conf file
    $json = json_decode(file_get_contents($file),true);
    $outdir = $json['outdir'];
    $outdir = $outdir['outdir'];
    return $outdir;
}

function getTargetPath() { 
    $outdir = getOutDir();
    $doc_root = $_SERVER['DOCUMENT_ROOT'];
    $targetPath = $doc_root . DIRECTORY_SEPARATOR . $outdir . DIRECTORY_SEPARATOR . session_id() ;
    return $targetPath;
} 

function getTargetURL() { 
    $outdir = getOutDir();
    //$server_url = $_SERVER['SERVER_NAME'];
    $server_url = getServerURL();
    $targetURL = $server_url . '/' . $outdir . '/' . session_id() ;
    return $targetURL;
}

if (!empty($_FILES)) { //upload via input type = file
    if($debug){ /*$firephp->log('upload via input type = file');*/}   

    if($_FILES['img']['error'] > 0) 
      $errors = error_get_last();
    if(empty($_FILES['img']['name'])) 
        $errors = 'No file sent.';

    $tmp = $_FILES['img']['tmp_name'];

    if(is_uploaded_file($tmp)) {
      $targetPath = getTargetPath() ;
      if($debug){ /* $firephp->log($targetPath, '$targetPath'); */ }   
      //  $targetFile =  str_replace('//','/',$targetPath) . $_FILES['Filedata']['name'];
      if (!file_exists($targetPath)) { // make the directory if it doesn't exist      
        mkdir(str_replace('//', '/', $targetPath), 0777, true);
      }

       $fileName = $_FILES['img']['name'];
       $targetFileName = $targetPath. DIRECTORY_SEPARATOR . $fileName;
       if(!move_uploaded_file($tmp, $targetFileName )) {
           $errors = error_get_last();
       }
       else {
           $status = 'ok';
       }
    }
}
else{//upload via input type = text
    // Upload file from a remote server to output dir
    if($debug){ /*$firephp->log('upload via input type = text');*/}   
    if(isset($_POST['img'])) { //remote filename is set
       $remoteFile = $_POST['img'];
       if($debug){ /* $firephp->log($remoteFile, '$remoteFile'); */}  
       $path_parts = pathinfo($remoteFile);
       $fileName = $path_parts['filename'] . '.' . $path_parts['extension'];
       $targetPath = getTargetPath() ;
       $target = $targetPath. DIRECTORY_SEPARATOR . $fileName;
       //$firephp->log($target, '$target');   
       if (!file_exists($targetPath)) {
            mkdir(str_replace('//', '/', $targetPath), 0777, true);
            //$firephp->log('created folder');   
       }
        if (copy($remoteFile, $target)) {
            //$firephp->log('remote file copied ok');   
            $status = 'ok';
        } else {
            $errors = error_get_last();
            //$firephp->log($errors, 'failed to copy remote file');   
        }
    } else{ //remote filename is not set
        $errors = "remote filename is not set";
        if($debug){ $firephp->log('remote filename is not set'); }
    }

}


$folder = substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], "/") + 1);
$host = $_SERVER['HTTP_HOST'];
$getBaseURL = "http://".$host . $folder;
$tatgetURL = getTargetURL();

$data_file_url = ($errors == '')? $tatgetURL . '/' . $fileName : "error" ;
$outArray = array('filename'=>$fileName,'folder'=>$targetPath,'session_id'=>session_id(), 'data_file_url'=>$data_file_url, 'outDir_url'=>$tatgetURL);
$dataFileInfo = ($errors == '')? $outArray : "error" ;

$arr = array('status'=>$status,'dataFileInfo'=>$dataFileInfo,'errors'=>$errors);

echo isset($_GET['callback'])? 
$_GET['callback'] . '(' . json_encode($arr) . ')' :
json_encode($arr);

?>





