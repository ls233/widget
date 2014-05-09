<?php
$str = <<< EOT


<div id="dm-widget-container" class="dm-widget-container">
    <div id="dm-wraper" class="dm-wraper">
        <a id="dm_home" style="float:left" href="#">
            <img width="95" height="57" border="0" align="middle" title="To return to the main PRIME website, 
            click here" src="//slapp04.mssm.edu/widget/lib/client/imgs/home-icon.png">
        </a>

        <a style="float:right" target="_blank" href="http://tsb.mssm.edu/primeportal/">
            <img width="115" height="57" border="0" align="middle" title="To return to the main PRIME website, click here" 
            src="//slapp04.mssm.edu/widget/lib/client/imgs/PRIMElogo.JPG">
        </a>

        <div class='titleContainer'><h3 id="widget_title">TiDAL High-throughput Data Import and Processing Wizard</h3></div>
        <div class="info header cleardiv" class="info cleardiv">
            <p > To build a regulatory network responsible for the global gene expression changes encapsulated in each time-course, datasets must first be pre-processed.
            This user-friendly interface both imports and pre-processes gene expression datasets prior to the analysis. 
            </p>
            <br><br>
            <p>
            The interface allows to search and automatically import gene expression datasets (currently microarray only) from InSilico DB to the analysis tool. It also allows local upload of R/Bioconductor eSets
                (including those previously retrieved from InSilico DB).
            </p>   <br><br>

            <p> Select the gene expression dataset source:
            </p>   



        </div>

        <div class="dm_main_link_container">
            <div class="dm_main_link">
                <div>
                    <img src="https://insilicodb.org/wp-content/themes/twentyten/images/insilico_o_shadow.png" alt="" />
                    <span title='insilicoDB'> Search/retrieve Microarray datasets from InSilico DB </span>
                    <p class="txt">
                        InSilico DB is a complete web-based solution for finding and exporting uniformly processed and curated genomics datasets.
                    </p>
                </div>
            </div>

            <div class="dm_main_link">
                <div>
                    <img src="//slapp04.mssm.edu/widget/lib/client/imgs/RLogo.png" alt="" />
                    <span title="RData"> Upload microarray datasets as R/Bioconductor eSets or RNA-seq datasets as cummeRbund objects</span>
                    <p class="txt">
                        eSets can be private or public (previously retrieved from InSilico DB). Disclamer, we don't store the uploaded data.
                    </p>
                </div>
            </div>

        </div>
        <div class="slider_container"> </div>
    </div>
</div>


EOT;

$rtnjsonobj['html'] = $str;

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';
?>




