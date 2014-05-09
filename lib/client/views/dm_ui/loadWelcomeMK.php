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

        <div class='titleContainer'><h3 id="widget_title">Flow cytometry Data Import and Processing Wizard</h3></div>
        <div class="info header cleardiv" class="info cleardiv">
            <p > 
                This user-friendly interface imports Flow cytometry datasets. 
            </p>            
            <p>
                The interface allows to search and automatically import Flow cytometry datasets from Contur DB to the analysis tool.
            </p> 

            <p> Note, Contur DB is password protected.
            </p>   

        </div>

        <form class="conturLoginForm" method="post" action="" id="login_form">
            <div align="center">
                <h2>Login to Contur DB</h2>
                <div>
                    User Name : <input name="username" type="text" id="username" value="" maxlength="20" />
                </div>
                <div style="margin-top:5px" >
                    Password :
                    &nbsp;&nbsp;
                    <input name="password" type="password" id="password" value="" maxlength="20" />
                </div>
                <div class="buttondiv">
                    <input name="Submit" type="submit" id="contur_submit" value="Login"/> <span id="msgbox" style="display:none"></span>
                </div>
            </div>
        </form>

        <div class="slider_container"> </div>
    </div>
</div>





EOT;

$rtnjsonobj['html'] = $str;

// Wrap and write a JSON-formatted object with a function call, using the supplied value of parm 'callback' in the URL:
echo $_GET['callback'] . '(' . json_encode($rtnjsonobj) . ')';
?>


