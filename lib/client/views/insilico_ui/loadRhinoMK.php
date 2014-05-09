<?php
$str = <<< EOT
<div action="" id="sliderForm">  <!--used to be a form  -->
    <div id="slider">
        <div class="form-step" >
            <div class="info cleardiv">
                <div class="info_about">
                    <span class="title">Info: </span>
                    <p class="about"> </p>   
                </div>
                <div class="info_instructions">
                    <span class="title">Instructions:</span> 
                    <p class="instructions">Search for the dataset of interest.</p>
                </div>
                <div id='tmPphenoData'> </div>                
            </div>

        </div>
        <div class="form-step" >
         <div class="info cleardiv">
            <div class="info_about">
                <span class="title">Info: </span>
                <p class="about"> This step is not not yet ready! </p>   
            </div>
            <div class="info_instructions">
                <span class="title">Instructions:</span> 
                <div class="instrNavBtns">
                    <button class="navBtn back">Back</button>
                    <button class="navBtn proceed">Proceed</button>
                </div>
                <p class="instructions"> Go to the prevouse step.</p>
            </div>
        </div>
        <div id='phenoData'> 
            <div id='expinfo'> 
                <span class="label">Study:</span>
                <span class="studyTitle">Title - </span>
                <span class="studyID"> , ID - </span>
            </div>
            <div class="tableHolder"></div>
        </div>
    </div>

    <div class="form-step">
        <div class="info cleardiv">
            <div class="info_about">
                <span class="title">Info: </span>
                <p class="about"> This step is not not yet ready!</p>   
            </div>
            <div class="info_instructions">
                <span class="title">Instructions:</span> 
                <p class="instructions">Go to the prevouse step.</p>
            </div>
        </div>

        <div id="infoplots">
            <div id="barplot">
               <!-- <div id='DEGstat'><
                   <span class="DEGstat">
                        <a class="DEGstat ui-helper-hidden" href="">Download Differentially Expressed (DE) gene statistics </a>
                    </span>
               /div> -->
               <div id='barplotImage'></div>
           </div>
           <div id="heatmap" class='hidden'>
            <button class="generateHeatmapBtn">Generate Heatmap</button>
            <div id='heatmapImage'></div>
        </div>
    </div>        

    <div id="density_item" >        
        <div id="FDR_cuttof" >
            <div class="sliderBox">
                <label for="FDR" class="" title="FDR cutoff">FDR corrected p-value cutoff <span>[?]</span>:</label>
                <input type="text" class="editBox" id="FDR" name="FDR" disabled="disabled" />
                <div id="FDRSlider"></div>
            </div>
        </div>
        <div id="density_cuttof" >
            <div class="sliderBox">
                <label for="tol" class="tTip" title="tol">background cutoff <span>[?]</span>:</label>
                <input type="text" class="editBox" id="tol" name="tol" disabled="disabled" />
                <div id="tolSlider"></div>
            </div>
            <div id='densityImage'>
            </div>
        </div>
            <div class='cleardiv'> </div>
        <button class="backDensNavBtn">Back to gene statistics</button>
        <button class="updateDensNavBtn hidden">Apply cutoff</button>
        <div id="boxplot">
            <div id='boxplotImage'>  </div>
        </div>
    </div>
</div>    
</div>   


EOT;

$rtnjsonobj['html'] = $str;
$ret = json_encode($rtnjsonobj);
echo isset($_GET['callback']) ? "{$_GET['callback']}($ret)" : $ret;
?>




