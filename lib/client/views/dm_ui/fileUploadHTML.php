<?php

$str = <<< EOT
        <p class="">Use this section for for submitting info to your ELN. The drop-down menu below lists all the experiments files were pulled from in this session.</p>
        <div id="notes"> <textarea autofocus="autofocus" placeholder="Enter brief description of the record being submited." ></textarea> </div>
        <div id="fileupload">
                        <div class="fileupload-buttonbar ui-widget-header ui-corner-top">
                    <label class="fileinput-button">
                        <span>Add files...</span>
                    </label>
                    
                </div>
                <div class='fileupload-content ui-widget-content ui-corner-bottom'>
                                        <input id="fileupload" type="file" name="files[]" multiple>
                                        <span><input id="Remove_selected_files" type="button" value="Remove selected files"/></span>
                                        </div>
                    <div>
                                       
                    </div>


        </div>
        <div class="submitRecord">
                    <input id="btnGet" type="button" value="Append info"/>
                    <span> to: </span>    
                    <select id="submitTo">
                      <option value="new">New experiment</option>
                    </select>
                    <span id="submitMsgbox" style="display:none"></span>
                </div>


EOT;

$rtnjsonobj['html'] = $str;

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';
?>


