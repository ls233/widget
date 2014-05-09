<?php
$str = <<< EOT
<div id="uploadRDataWraper">
	<div class="sampleDatasetContainer">

		<table cellpadding="0" cellspacing="0" border="0" class="res_table" >
		<caption>For demo and testing purposes sample datasets can be loaded</caption>
			<thead>
				<tr>
					<th>Study</th>
					<th>Data type</th>
					<th>ID</th>
					<th>Dataset</th>
				</tr>
			</thead>
			<!--<tfoot>
				<tr>
					<td></td>
					<td></td>
				</tr>
			</tfoot> -->
			<tbody class='MA_data'>
				<tr>
					<td>Antiviral response dictated by choreographed cascade of transcription factors</td>
					<td>Microarray</td>
					<td>GSE18791</td>
					<td><span><a class="loadTestRData" href="http://slapp04.mssm.edu/widgetdev/sample_data/MA/268087e2997a26ab3d93a24e56edb7b6.RData" title="Test microarray data">Load</a></span></td>
				</tr>
				<tr>
					<td>Time Course of TGF-beta treatment of A549 lung adenocarcinoma cell line</td>
					<td>Microarray</td>
					<td>GSE17708</td>
					<td><span><a class="loadTestRData" href="http://slapp04.mssm.edu/widgetdev/sample_data/MA/GSE17708GPL570_RNA_FRMAGENE_21781.RData" title="Test microarray data RData">Load</a></span></td>
				</tr>
			</tbody class='rna-seq_data'>
			<tbody>
				<tr>
					<td>RNA-seq test dataset</td>
					<td>RNA-seq</td>
					<td>NA</td>
					<td><span><a class="loadTestRData" href="http://slapp04.mssm.edu/widgetdev/sample_data/rna-seq/cuffData.db" title="Test data rna-seq RData">Load</a></span></td>
				</tr>
			</tbody>

		</table>


	</div>
	<div id="uploadRDataformWraper">
		<form id="uploadRDataform" method="post" action="uploadLocalRDataFile.php" enctype="multipart/form-data">
			<div id="dataTypeWraper">
			<span>Select data type:</span>
			<input type="radio" name="dataType" id="MAOption" value="Microarray" checked="checked"/> <label for="MAOption">Microarray</label>
			<input type="radio" name="dataType" id="rnaseqOption" value="rnaseq"/> <label for="rnaseqOption">RNA-seq</label>
			</div>
			<input type="file" placeholder='Currently R/Bioconductor eSets only supported' name="img" id="myfile"/>
			<!-- <input type="submit" value="Upload" id="uploadRDataformSubmit"/> -->
		</form>
		<div id="uploadStatus" > Currently R/Bioconductor eSets only supported
		</div> 
	</div> 
</div>

EOT;

$rtnjsonobj['html'] = $str;
$ret = json_encode($rtnjsonobj);
echo isset($_GET['callback']) ? "{$_GET['callback']}($ret)" : $ret;
?>




