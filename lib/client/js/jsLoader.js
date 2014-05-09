/*
* Data Import Widget front-end
*
* This document is licensed as free software under the terms of the
* MIT License: http://www.opensource.org/licenses/mit-license.php
*
* To use Data Import Widget front end include this javascript file in your index file. 
* This file loads the lazy loader (labjs), which loads the necessary libraries and 
* invokes the "main" function implemented in the widget.js along with all the business logics of the widget
*/ 


// load LABjs itself dynamically!
(function (global, oDOC, handler) {
    var head = oDOC.head || oDOC.getElementsByTagName("head");
    function LABjsLoaded() {
        
        var requestURL = document.getElementById("dm_script_7").getAttribute("src");

        //next use substring() to get querystring part of src
        var queryString = requestURL.substring(requestURL.indexOf("?") + 1, requestURL.length);

        //Next split the querystring into array
        var protocol=unescape(queryString).split("protocol=")[1].split("&")[0];

        //console.log(protocol);

        // set base URL for the widget
        //var baseURL = "http://146.203.29.123/widget/";
        var baseURL = protocol + "://slapp04.mssm.edu/widgetdev/";        
        //var baseURL = protocol + "://slapp04.mssm.edu/widget/";        
        

        link_tag = document.createElement('link');
        link_tag.setAttribute("rel","stylesheet");
        link_tag.setAttribute("type","text/css");        
        link_tag.setAttribute("href",
        //"http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css");        
            baseURL + "lib/client/css/redmond/jquery-ui-1.10.3.custom.css");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);                

        link_tag = document.createElement('link');
        link_tag.setAttribute("rel","stylesheet");
        link_tag.setAttribute("type","text/css");        
        link_tag.setAttribute("href",
            baseURL + "lib/client/js/DataTables/media/css/jquery.dataTables.css");
        //"//cdn.datatables.net/1.10.0-beta.2/css/jquery.dataTables.css"); 
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);                

        link_tag = document.createElement('link');
        link_tag.setAttribute("rel","stylesheet");
        link_tag.setAttribute("type","text/css");        
        link_tag.setAttribute("href",
            baseURL + "lib/client/js/DataTables/extras/ColVis/media/css/ColVis.css");
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);                


        link_tag = document.createElement('link');
        link_tag.setAttribute("rel","stylesheet");
        link_tag.setAttribute("type","text/css");        
        link_tag.setAttribute("href",
            baseURL + 'lib/client/js/rhinoslider/css/rhinoslider-1.05.css');
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);                

        link_tag = document.createElement('link');
        link_tag.setAttribute("rel","stylesheet");
        link_tag.setAttribute("type","text/css");        
        link_tag.setAttribute("href",
            baseURL + 'lib/client/js/jReject/jquery.reject.css');
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);                

        link_tag = document.createElement('link');
        link_tag.setAttribute("rel","stylesheet");
        link_tag.setAttribute("type","text/css");        
        link_tag.setAttribute("href",
            baseURL + 'lib/client/js/custom-scrollbar/jquery.mCustomScrollbar.css');
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);                

        link_tag = document.createElement('link');
        link_tag.setAttribute("rel","stylesheet");
        link_tag.setAttribute("type","text/css");        
        link_tag.setAttribute("href",
            baseURL + 'lib/client/js/jQuery-contextMenu/jquery.contextMenu.css');
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);                

        var needs_jquery = typeof jQuery === "undefined" || jQuery().jquery < "1.8.2";
        var needs_jquery_ui = needs_jquery || typeof jQuery.ui === "undefined" || $.ui.version < "1.10.3";
        /*
        var $ = (!needs_jquery_142) ? jQuery : null; // if we need to load jQuery 1.4.2, leave alias empty for now, otherwise set alias
        var $ui = (!needs_jquery_ui_172) ? $.ui : null; // if we need to load jQuery-UI 1.7.2, leave alias empty for now, otherwise set alias
  */      
        $LAB
        .script(function(){
            if (needs_jquery) {
                //console.log("loading jQuery 1.6.x");
                //return "http://code.jquery.com/jquery-latest.js";
                //return "http://slapp04.mssm.edu/widget/lib/client/js/jquery-1.7.2.min.js";
                return protocol + "://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.js";
            }
            else {
                //console.log("jQuery " + jQuery().jquery + " already loaded");
                return null; // no need to load anything
            }       
        })
        //        .script("http://code.jquery.com/jquery-1.6.3.js") //no need to change as is usually already cashed by all browsers
        .script(baseURL + "lib/client/js/jReject/jquery.reject.min.js").wait(function(){
            $.reject({  
                reject: {  
                    msie5: true, msie6: true, msie7: true, msie8: true, msie9: true, // Microsoft Internet Explorer  
                    //                    konqueror: true, // Konqueror (Linux)  
                    unknown: true // Everything else  
                } ,
                imagePath: baseURL + "lib/client/js/jReject/images/", // Path where images are located
                display: ['firefox','chrome','safari','opera'] // What browsers to display and their order
            }); // 

        })
        //needs to be updated per widjet setup                        
        //        .script("http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.15/jquery-ui.min.js") //no need to change as is usually already cashed by all browsers
        .script(function(){
            if (needs_jquery_ui) {
                //console.log("loading jQuery UI 1.8.0, with jQuery");
                //return "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.22/jquery-ui.min.js";
                return baseURL + "lib/client/js/jquery-ui-1.10.3.custom.min.js";
            }
            else{
                //console.log("jQuery UI " + jQuery.ui.version + " already loaded");
                return null; // no need to load anything
            }
        })        
        .script(baseURL + "lib/client/js/dialogextend/jquery.dialogextend.1_0_1.js")  //is web readable so no need to change unltill move to production              
        .script(baseURL + "lib/client/js/jquery.json2xml.js")  //is web readable so no need to change unltill move to production              //
        .script(baseURL + "lib/client/js/jquery.json-1.3.js")  //is web readable so no need to change unltill move to production              //        
        .script(baseURL + "lib/client/js/DataTables/media/js/jquery.dataTables.js")  //is web readable so no need to change unltill move to production              //        
        //.script("//cdn.datatables.net/1.10.0-beta.2/js/jquery.dataTables.js")  //is web readable so no need to change unltill move to production              //        
        .script(baseURL + "lib/client/js/DataTables/extras/jquery.dataTables.rowReordering.js")  //is web readable so no need to change unltill move to production              //                
        .script(baseURL + "lib/client/js/DataTables/extras/ColVis/media/js/ColVis.js")  //is web readable so no need to change unltill move to production              //                        
        .script(baseURL + "lib/client/js/DataTables/extras/Editable/media/js/jquery.dataTables.editable.js")  //is web readable so no need to change unltill move to production              //                                
        .script(baseURL + "lib/client/js/DataTables/extras/Editable/media/js/jquery.jeditable.js")  //is web readable so no need to change unltill move to production              //                                        
        .script(baseURL + "lib/client/js/DataTables/extras/FixedHeader/js/FixedHeader.min.js")
        //.script($('body').data('baseURL') + "/widget/js/jquery.dataTables.rowGrouping.js")  //is web readable so no need to change unltill move to production              //                        
        //.script("http://slapp04.mssm.edu/widget/lib/client/js/datatables.Selectable.js")  //is web readable so no need to change unltill move to production              //                                
        .script(baseURL + "lib/client/js/custom-scrollbar/jquery.mCustomScrollbar.concat.min.js")
        .script(baseURL + "lib/client/js/table2CSV.js")
        .script(baseURL + "lib/client/js/jQuery-contextMenu/jquery.contextMenu.js")
        .script(baseURL + "lib/client/js/jQuery-contextMenu/jquery.ui.position.js")
        //.script(baseURL + "lib/client/js/nodegraph-standalone.min.js")
        .script(baseURL + "lib/client/js/widget.js").wait(function(){            


            main(baseURL);
        })                //needs to be updated per widjet setup
        
    }

    // loading the LABjs script loader
    setTimeout(function () {
        if ("item" in head) { // check if ref is still a live node list
            if (!head[0]) { // append_to node not yet ready
                setTimeout(arguments.callee, 25);
                return;
            }
            head = head[0]; // reassign from live node list ref to pure node ref -- avoids nasty IE bug where changes to DOM invalidate live node lists
        }
        var scriptElem = oDOC.createElement("script"),
        scriptdone = false;
        scriptElem.onload = scriptElem.onreadystatechange = function () {
            if ((scriptElem.readyState && scriptElem.readyState !== "complete" && scriptElem.readyState !== "loaded") || scriptdone) {
                return false;
            }
            scriptElem.onload = scriptElem.onreadystatechange = null;
            scriptdone = true;
            LABjsLoaded();
        };
        
        scriptElem.src = "https://slapp04.mssm.edu/widget/lib/client/js/LAB.js"; //will be always avaiable so no need to change unltill move to production        
        head.insertBefore(scriptElem, head.firstChild);
    }, 0);

    // required: shim for FF <= 3.5 not having document.readyState
    if (oDOC.readyState == null && oDOC.addEventListener) {
        oDOC.readyState = "loading";
        oDOC.addEventListener("DOMContentLoaded", handler = function () {
            oDOC.removeEventListener("DOMContentLoaded", handler, false);
            oDOC.readyState = "complete";
        }, false);
    }
})(window, document);