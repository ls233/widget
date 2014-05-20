<?php
$str = <<< EOT


<div id="taxonChoiceDialog-container" class="taxonChoiceDialog-container">
    <div id="taxonChoice-info" class="taxonChoice-info">
    <span>We were not able to retrieve the taxonomy information from the dataset. Please select the specie and "Proceed"
    </div>
    <div id="radioBtnHolder" class="radioBtnHolderTaxon">
        <label for="human">Human</label>
        <input type="radio" name="taxon" value="male" id="human">
        <label for="mouse">Mouse</label>
        <input type="radio" name="taxon" value="female" id="mouse">
    </div>
</div>


EOT;

$rtnjsonobj['html'] = $str;

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';
?>




