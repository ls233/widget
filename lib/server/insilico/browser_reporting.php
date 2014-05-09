<?php
/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file sets up reporting problems to browsers
 */

  require_once($_SERVER['DOCUMENT_ROOT'] . '/php-console/src/PhpConsole/__autoload.php');
  // Call debug from PhpConsole\Handler
  $handler = PhpConsole\Handler::getInstance();
  $handler->start();

  require_once($_SERVER['DOCUMENT_ROOT'] . '/FirePHPCore/FirePHP.class.php');
  $firephp = FirePHP::getInstance(true);

?>
