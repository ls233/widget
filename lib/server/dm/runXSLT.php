<?php

$xml= $_POST['xml'];

    $xml= stripslashes($xml);

$xhtml = xslt($xml);

$rtnjsonobj['xsltResult'] = $xhtml;

echo json_encode($rtnjsonobj);

function xslt($xml) {

    $xmlDoc = new DOMDocument();

    $xmlDoc->loadXML($xml);

    $xslDoc = new DOMDocument();
    $xslDoc->load("widget/css/xml2xhtml.xsl");

    $proc = new XSLTProcessor();
    $proc->importStylesheet($xslDoc);
    return $proc->transformToXML($xmlDoc);
}
?>



