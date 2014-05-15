<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file fetches remote data (file)
 */
session_start();
$debug = 1; 

if($debug){
  //setup reporting problems to browsers
  try {
    require_once('browser_reporting.php');  
  } catch (Exception $e) {
    // report $e->getMessage()
  }
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


$_SESSION['progress'] = 0;
#echo 'session_id: ' . session_id() . '<br>';
$status = 'failed';
$errors = array();
if (!empty($_GET['url'])) {
    $remoteFile = $_GET['url'];
    $targetPath = getTargetPath() ;
    if($debug){ /* $firephp->log($targetPath, '$targetPath'); */}   
    //  $targetFile =  str_replace('//','/',$targetPath) . $_FILES['Filedata']['name'];
    if (!file_exists($targetPath)) { // make the directory if it doesn't exist      
      mkdir(str_replace('//', '/', $targetPath), 0777, true);
    }
    
    /*   
    $path_parts = pathinfo($remoteFile);
    $fileName = "cp_" . $path_parts['filename'] . '.' . $path_parts['extension'];
    */
 
    $fileName = md5($remoteFile) . '.RData';

    $targetFile = $targetPath . DIRECTORY_SEPARATOR . $fileName;
    if($debug){
      //$firephp->log($remoteFile, '$remoteFile');
      //$firephp->log($targetFile, '$targetFile');
    }

    $cURLstatus = 'ok';

    $ch = curl_init($remoteFile);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); //not necessary unless the file redirects (like the PHP example we're using here)
    $data = curl_exec($ch);
    curl_close($ch);
    if($data === false) {
      $cURLstatus = 'failed';
      //exit;
    }

    if($cURLstatus != 'failed'){
        $contentLength = 'unknown';
        $cURL_ret = 'unknown';
        if (preg_match('/^HTTP\/1\.[01] (\d\d\d)/', $data, $matches)) {
          $cURL_ret = (int)$matches[1];
          //$firephp->log($cURL_ret, 'HTTP Status');
        }
        if (preg_match('/Content-Length: (\d+)/', $data, $matches)) {
          $contentLength = (int)$matches[1];
          //$firephp->log($contentLength, '$contentLength');
        }

        $remote = fopen($remoteFile, 'r');
        $local = fopen($targetFile, 'w');

        $read_bytes = 0;
        $chunk_size = 2048;
        while(!feof($remote)) {
          $buffer = fread($remote, $chunk_size);
          fwrite($local, $buffer);
          $read_bytes += $chunk_size;

      //Use $filesize as calculated earlier to get the progress percentage
          $progress = min(50, 50 * $read_bytes / $contentLength);
          //session_start();
          $_SESSION['progress'] = $progress;
          //session_write_close();

          //$firephp->log($progress, '$progress');

      //you'll need some way to send $progress to the browser.
      //maybe save it to a file and then let an Ajax call check it?
        }
        fclose($remote);
        fclose($local);
        $status = 'ok';
        //session_start();
    }else{

    }


/*
    if (copy($remoteFile, $targetFile)) {
        $status = 'ok';
#        echo "File copied from remote!";
    } else {
        $errors = error_get_last();
    }
*/

/*
    $files = glob($targetPath . DIRECTORY_SEPARATOR . "*.*");
    $files = array_combine($files, array_map("filemtime", $files));
    $firephp->log($files, 'files');
    arsort($files);
    $latest_file = key($files);
    $firephp->log($latest_file, 'latest_file');
    */
}

/*
  echo $path_parts['dirname'], "\n";
  echo $path_parts['basename'], "\n";
  echo $path_parts['extension'], "\n";
  echo $path_parts['filename'], "\n"; // since PHP 5.2.0
 */

//array_push($_SESSION['filenames'], $fileName);
$tatgetURL = getTargetURL();
$dataFileInfo = array('filename'=>$fileName,'folder'=>$targetPath,'session_id'=>session_id(), 'outDir_url'=>$tatgetURL);
$arr = array('status'=>$status,'dataFileInfo'=>$dataFileInfo,'errors'=>$errors);

echo isset($_GET['callback'])? 
$_GET['callback'] . '(' . json_encode($arr) . ')' :
    json_encode($arr);

?>