/**
 * @package Data Import Widget
 * @author German Nudelman
 * 
 * This file contains all the business logics of the widget
 */




// called from jsLoader.js, provides the base widget URL
function main(baseURL) {
    $().ready(function ($) {

        addJQueryPagins(); // add auxiliary functions to jQuery's scope

        $('body').data('debug_mode', true);//true for testing

        $.ajaxSetup({ cache:false, timeout:200000 }); // change default ajax settings
        
        setBaseURL(baseURL);  //set base url and continue widget loading      
     });
}


// add auxiliary functions to jQuery's scope
function addJQueryPagins(){ 

    //check if click event is already bound
    $.fn.isBound = function (type, fn) {
        var data = this.data('events')[type];
        if (data === undefined || data.length === 0) {
            return false;
        }
        return (-1 !== $.inArray(fn, data));
    };

    //copy CSS style
    $.fn.copyCSS = function (source) {
        var dom = $(source).get(0);
        var dest = {};
        var style, prop;
        if (window.getComputedStyle) {
            var camelize = function (a, b) {
                return b.toUpperCase();
            };
            if (style = window.getComputedStyle(dom, null)) {
                var camel, val;
                if (style.length) {
                    for (var i = 0, l = style.length; i < l; i++) {
                        prop = style[i];
                        camel = prop.replace(/\-([a-z])/, camelize);
                        val = style.getPropertyValue(prop);
                        dest[camel] = val;
                    }
                } else {
                    for (prop in style) {
                        camel = prop.replace(/\-([a-z])/, camelize);
                        val = style.getPropertyValue(prop) || style[prop];
                        dest[camel] = val;
                    }
                }
                return this.css(dest);
            }
        }
        if (style = dom.currentStyle) {
            for (prop in style) {
                dest[prop] = style[prop];
            }
            return this.css(dest);
        }
        if (style = dom.style) {
            for (prop in style) {
                if (typeof style[prop] != 'function') {
                    dest[prop] = style[prop];
                }
            }
        }
        return this.css(dest);
    };

}


//setting widget base url for resourse loading and server side scripts
function setBaseURL(baseURL) {
    $('body').data('baseURL', baseURL);

    prepareStartWidget(); //continue widget loading      

    /*
    var jsonp_url = baseURL + "getBaseURL.php?callback=?";
    $.getJSON(jsonp_url, function (data) {
        $('body').data('baseURL', data);
        jsonp_url = $('body').data('baseURL') + "getCWD.php?callback=?";
        $.getJSON(jsonp_url, function (data) {
            $('body').data('CWD', data.cwd);
            $('body').data('dataDir', data.dataDir);
            prepareStartWidget();
        });
    });
    */
}


//find file upload element and add the widget load button next to it
function prepareStartWidget() {
    $('input[type=file]').parent().append('<button class="dmlink" href="#" >Load data</button>');
    $(".dmlink")
        .button({ icons: { primary: "ui-icon-arrowthick-1-n", secondary: "ui-icon-arrowthick-1-n" } })
        .click(function (e) {
            e.preventDefault();
            $(this).siblings('input:first').addClass('inputFileTarget');
            startWidget(this);
        });

        if($('body').data('debug_mode')){
            setTimeout("$('.dmlink').trigger('click')", 1000);
        }
}

// load widget style/configuration and continue loading widget
function startWidget(tag) {
    loadWidgetStyle();
    
    //overwrire onbeforeunload in production
    if(! $('body').data('debug_mode')){ 
        window.onbeforeunload = function(){ 
            return "Are you sure you wanna leave my site?";
        }
    }

    $(tag).hide(); //hide the start widget link

    // load widget configuration 
    var $dm_wrap = $('<div id="dm_wrap" class="dm_wrap">dialog placeholder</div>')
        .appendTo('body');
    var $loading = $('<img class=centeredSpin src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
    $dm_wrap.html($loading.clone());
    var jsonp_url = $('body').data('baseURL') + "loadWidgetConf.php?callback=?";
    $.getJSON(jsonp_url, {
        tool_title: $(document).attr('title')
    }, function (data) {
        if (data.status == 'ok') {
            $('body').data('widget_conf', data);
            loadWidget(data); //continue loading widget
        }else{
            console.log('problem loading configuration');
        }    
    });   
}


function loadWidgetStyle() {
    //load main widget CSS
    var link_tag = document.createElement('link');
    link_tag.setAttribute("rel", "stylesheet");
    link_tag.setAttribute("type", "text/css");
    link_tag.setAttribute("href", $('body').data('baseURL') + "lib/client/css/style.css");    
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(link_tag);     // Try to find the head, otherwise default to the documentElement    
    //prepare style tag for dynamic CSS (style groups)
    var style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'dynamicStyle';
    document.getElementsByTagName('head')[0].appendChild(style);
}

//load widget per configuration passed
function loadWidget(data) {
    
    /*** local functions definiton ***/

    //creates dialog using html passed 
    var makeDialog = function ($dialog){
        var dialogOpts = {
            title: 'Data import widget V1.1',  
            modal: false,
            // bgiframe: true,
            closeOnEscape: false,
            position: "top",
            maxWidth: "1400px",
            width: "95%",
            height: "auto",
            draggable: false,
            resizeable: false,
            beforeClose: function( event, ui ) {
                $('.dmlink').show('slow'); //to enable widget be started again
                displayUserFormMsg();// success if finished, failure otherwise
                filterMappingFiles(); //filter out all irrelevant taxon mappings
            },
            close: function (ev, ui) {
                $(this).empty().remove();//remove this dialog from DOM
            }
        };
        // allow additional dialog features
        $dialog.dialog(dialogOpts) 
        //.parents('.ui-dialog:eq(0)')
        //.wrap('<div class="myScope"></div>')
        .dialogExtend({
            "close": true,
            "maximize": false,
            "minimize": false,
            "dblclick": "collapse",
            "titlebar": "transparent",
            "icons": {
                "close": "ui-icon-circle-close",
                "maximize": "ui-icon-circle-plus",
                "minimize": "ui-icon-circle-minus",
                "restore": "ui-icon-bullet"
            },
            "events": {
                /*
              "load" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "beforeCollapse" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "beforeMaximize" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "beforeMinimize" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "beforeRestore" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "collapse" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "maximize" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "minimize" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); },
              "restore" : function(evt, dlg){ alert(evt.type+"."+evt.handleObj.namespace); }*/
            }
        });
    }


    //pre-authententicate user
    var insilico_authententicate = function(conf){        
        //define frame, define form and submit form into the iframe

        var iframe = $('<iframe />', {
            name: 'insilico_authententicateFrame',
            id: 'insilico_authententicateFrame',
            height: '300px',
            width: '300px',
            border: '0 none'
        })
        .appendTo('body')
        .load(function () {
            //console.log('insilico_authententicateFrame load fired');
            $('#insilico_authententicateFrame').remove();
            $('#insilico_authententicateForm').remove();  
        });

        var url = conf.auth_url;
        var hash = CryptoJS.MD5("widget").toString();
        $('<form>', {
            'action': url,
            'target': 'insilico_authententicateFrame',
            'method' :'post',
            id: 'insilico_authententicateForm',
        }).append($('<input>', {
            'name': 'login',
            'value': 'german.nudelman@mssm.edu',
            'type': 'text'                
        })).append($('<input>', {
            'name': 'password',
            'value': hash,
            'type': 'password'
        })).appendTo('body')
        //.submit()
        ;

        $('#insilico_authententicateForm').submit();

    /*
        var url = 'https://insilicodb.org/app/login/login';
        var form1 = $('<form>', {
            'action': url,
            'target': 'insilico_authententicateFrame',
            'method' :'post',
            id: 'insilico_authententicateForm1',
        }).append($('<input>', {
            'name': 'login',
            'value': 'german.nudelman@mssm.edu',
            'type': 'text'                
        })).append($('<input>', {
            'name': 'remember',
            'value': '1',
            'type': 'text'
        })).append($('<input>', {
            'name': 'password',
            'value': 'widget',
            'type': 'password'
        }))
        .appendTo('body').submit();
      */  

    };

    //inits the insilico widget per conf passed
    var load_insilicoWidget = function(conf){
        var jsonp_url = $('body').data('baseURL') + conf.views +  "/loadWelcomeMK.php?callback=?";        
        $.getJSON(jsonp_url, function (data) {
            $('#dm_wrap').remove();

            $('body').data('welcome', data.html); // cash markup            
            $('body').append(data.html); //Load welcome markup
            var $dialog = $('#dm-widget-container');
            $dialog.data('widgetFinishedSuccesfully',false);            
            makeDialog($dialog); // create the widget dialog 
            
            bind_click_to_main_links(); // bind action to main links 

            /*
            $('.main .iconLink').click( function (e) {
                e.stopPropagation();
                $('.info.header').html('');
            });
            */
        });

        $LAB.script('//crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js')
        .wait(function () {
            insilico_authententicate(conf);//so users don't have to authententicate                                
        });

        if($('body').data('debug_mode')){ //automate testing
            setTimeout("loadMK('RData')", 1000);
        }
    }


    //inits the contur widget per conf passed
    var load_conturWidget = function(conf){
        var jsonp_url = $('body').data('baseURL') + conf.views +  "loadWelcomeMK.php?callback=?";        
        $.getJSON(jsonp_url, function (data) {

            $('#dm_wrap').remove();

            $('body').data('welcome', data.html);
            /******* Load welcome HTML *******/     
            $('body').append(data.html);
            var $dialog = $('#dm-widget-container');
            $dialog.data('widgetFinishedSuccesfully',false);
            /*--------------------------*/        

             makeDialog($dialog);

             $LAB.script('//crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js')
             .wait(function () {
                bindConturLogin();  
            });
        });

        if($('body').data('debug_mode')){
            //setTimeout("loadMK('RData')", 1000);//automate debug
        }

    }    

    //inits the BioModels widget per conf passed
    var load_BioModels = function(conf){
        createBioM_UI();
    }
    /*-- end local functions definiton --*/


    //currently three widget types are supported 
    switch (data.widget_type) {
        case 'insilico':
            load_insilicoWidget(data.conf);
            break;
        case 'dm':
            load_conturWidget(data.conf);
            break;
        case 'BioModels':
            load_BioModels(data.conf);
            break;

        default:
            console.log("Widget type isn't specified.");
    }
}


// bind action to main links of the insilico widget
function bind_click_to_main_links(){
    $('.dm_main_link').click( function(){
        var resource = $('span',this).attr('title');
        loadMK(resource);        
    });
}


//load markup for either remote or local data upload
function loadMK(source) {
    $('#dm_home').click(function (e) { //bind on home click
        e.preventDefault();
        $('#dm-widget-container').html($('body').data('welcome')); // load markup
        bind_click_to_main_links(); // bind action to main links of the insilico widget
    });

    switch (source) {

    case 'insilicoDB': // load insilico DB markup

        /*** local functions definition ***/

        //load the insilico UI in the iframe
        var on_insilico_authententicate = function(){
            //load insilicoDB UI in iframe
            var iframeUIsrc = $('body').data('widget_conf').conf.iframeUIsrc;
            var iframe = $('<iframe />', {
                name: 'myFrame',
                id: 'myFrame',
                height: '350px',
                /*width: '96%',*/
                border: '0 none'
            }).attr('src', iframeUIsrc)
            //}).attr('src', 'https://insilicodb.org/app/browse?p=GPL570&n=2&mc=1')
//            }).attr('src', 'http://nisilico.ulb.ac.be/app/browse?p=GPL96,GPL97,GPL570,GPL571,GPL85,GPL91,GPL8300,GPL1261,GPL1355,GPL3921,GPL6947&n=2&mc=1')            
            .load(function () {
                var html = 'insilicoDB loaded! You should now be automatically logged in to InSilico DB. If not, you can use \
                <span class="insilicoFile_credentials_link tooltip" titleold="username:german.nudelman@mssm.edu, password: widget" > these credentials.</span>';
                $(".form-step:first p.about").html(html);
                $('.insilicoFile_credentials_link').tooltipster({
                    //content: $('<span><strong>username:german.nudelman@mssm.edu, password: widget</strong></span>')
                    content: $('<div><strong>username: german.nudelman@mssm.edu</strong></div><div><strong>password: widget</strong></div>'),
                    interactive:true
                }); 

                var html = '<ol> \
                 <li>After succesful login, enter your search query i.e. "time course emt".</li> \
                 <li>Click the "Analyze" button on the dataset of interest and select the "R" option. "Open with R" button will appear.</li> \
                 <li>Clicking "Open with R" button will download the data as R/Bioconductor eSet file.</li> \
                 <li>Depending on the InsilicoDB seetings, if the analysis does not start autoamtically, use the <a class="upload_insilicoFile_link" href="#" >file upload module</a></li> \
                 </ol>';
/*
                //-------------------- work around the insilico bug with invoking direct data download -----------
                 var html = '<ol> \
                 <li style="color:;">Use the following credentials to login: user - german.nudelman@mssm.edu, password- widget.</li> \
                 <li>After succesful login, enter your search query i.e. "time course emt".</li> \
                 <li>Click the "Analyze" button on the dataset of interest <del>to retrieve the dataset.</del> \
                 <span style="color:navy;"> Note, due to the changes in the insilicoDB API, automatic data transfer is temporarily not available. Use the following instructions to proceed:</span></li> \
                 <ul style="color:navy;"> \
                 <li>After clicking the "Analyze" button on the dataset of interest, select the "R" option.</li> \
                 <li>"Open with R" button will download the data as R/Bioconductor eSet, which than can be <a class="upload_insilicoFile_link" href="#" >uploaded</a>  for the analysis.</li> \
                 </ul> \
                 </ol>';
*/

                $(".form-step:first p.instructions").html(html);                        
                $('.upload_insilicoFile_link')
                    .button({ icons: { primary: "ui-icon-arrowthick-1-n", secondary: "ui-icon-arrowthick-1-n" } })
                    .click(function (e) {
                        e.preventDefault();
                        loadMK('RData');
                    });

//                $(".form-step:first p.instructions").html("Search for the dataset of interest.");
                $('.form-submit').hide('slow');
            });

            $("<div id='insilico_wrapper'>").appendTo('.form-step:first').html(iframe);
            $('.form-submit').hide();
        };
        
        //load markup and scripts needed for the insilico UI
        var load_insilicoDB = function(){
            $("h1[id=widget_title]").text("Resource selected: insilicoDB");        
            var jsonp_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.views + 
                    "/loadRhinoMK.php?callback=?";
            $.getJSON(jsonp_url, function (data) {//on load main widget markup
                $('.info.header.cleardiv').remove();
                $(".dm_main_link_container").remove();
                $(".slider_container").html(data.html);
                LoadRhinosliderScripts();
                $(".form-step:first p.about").html("Loading insilicoDB...");
                var $loading = $('<span class="ajax-loader-spinner"> <img src=' + $('body').data('baseURL') + 'lib/client/imgs/ajax-loader-spinner.gif alt="loading"> </span>')
                .clone().appendTo('.form-step:first p.about');

                $(".form-step:first p.instructions").html("Please wait...");
                $('.form-submit').hide();

                on_insilico_authententicate();// load insilicoDB UI

            });
        };

        /*** end local functions definition ***/

        load_insilicoDB();
        break;


    case 'RData': //load local file upload UI

        /*** local functions definition ***/

        //loads file upload view and controller
        var load_localFileUploadUI = function(){

            //$("h1[id=widget_title]").text("Resource selected: insilicoDB");
            var jsonp_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.views + 
                    "/loadRhinoMK.php?callback=?";
            $.getJSON(jsonp_url, function (data) { //on load main widget markup
                $('.info.header.cleardiv').remove();
                $(".dm_main_link_container").remove();
                $(".slider_container").html(data.html);

                LoadRhinosliderScripts();

                $(".form-step:first p.about").html("Loading insilicoDB...");
                $(".form-step:first p.instructions").html("Please wait...");
              
                var jsonp_url = $('body').data('baseURL') + 
                    $('body').data('widget_conf').conf.views + 
                        "/loadFileUploadMK.php?callback=?";
                $.getJSON(jsonp_url, function (data) {
                    var html = 'This form allows to upload for analysis R/Bioconductor eSets. Public gene expressioncan data eSets can be automaticaly retrieved using the <a class="loadinsilicoDB_link_tmp" href="#">InsilicoDB import module</a>';
                    $(".form-step:first p.about").html(html);
                    html = 'Select data type and upload your file below.';
                    $(".form-step:first p.instructions").html(html);                        

                    $('.loadinsilicoDB_link_tmp')
                        //.button()
                        .click(function (e) {
                            e.preventDefault();
                            loadMK('insilicoDB');
                        });

                    $("<div id='insilico_wrapper'>").appendTo('.form-step:first').html(data.html);
                    $('.loadTestRData')
                    .button({ icons: { primary: "ui-icon-document", secondary: "ui-icon-arrowthick-1-n" } })
                    .click(function (e) {
                        e.preventDefault();
                        /******** update webtool form  ************/
                        var fileURL = $(this).attr('href');
                        var dataType = 'MA';
                        if ($(this).attr('title').match(/rna/) != null) {
                            $("#rnaseqOption").prop("checked", true);
                            $('#dataTypeWraper').buttonset("refresh");
                        }
     
                        var marker = $('<span class="tmp_insert_marker"/>').insertBefore('#myfile');
                        $('#myfile').detach().attr('type', 'text').insertAfter(marker).val(fileURL).css('background-color', '#99FF33').show().prop('disabled', false).focus();
                        marker.remove();

                        $('#myfile').trigger('change');
                    });

                    $('.form-submit').hide();
                    $('#myfile')
                    .button({ icons: { primary: "ui-icon-arrowthick-1-n", secondary: "ui-icon-folder-open" } })
                    .change(function () {
                        $('.form-submit').hide();
                        $('#uploadRDataform').submit();
                     });

                    $('.form-submit').hide();

                    $('#dataTypeWraper').buttonset();
                    $('#dataTypeWraper input[type=radio]').change(function() {
                        if(this.value === 'rnaseq'){
                            $('#uploadStatus').text('Currently cummeRbund database objects only supported')
                        }else{
                           $('#uploadStatus').text('Currently R/Bioconductor eSets only supported')
                        }
                    });

                    $('#uploadRDataform').submit(function(e) {
                        //upload file
                            e.preventDefault();

                            set_dataType();
                            
                            data = new FormData($('#uploadRDataform')[0]);

                            $('#myfile').prop('disabled',true);
                            //console.log('Submitting');
                            $(".form-step:first p.about").html("uploading file...");
                            $(".form-step:first p.instructions").html("Please wait, uploading file...   ");
                            var $loading = $('<span class="ajax-loader-spinner"> <img src=' + $('body').data('baseURL') + 'lib/client/imgs/ajax-loader-spinner.gif alt="loading"> </span>')
                                .clone().appendTo('.form-step:first p.instructions');
                            
                            //upload file via ajax
                            var url = $('body').data('baseURL') + 
                                $('body').data('widget_conf').conf.server_scripts + 'uploadLocalRDataFile.php';
                            $.ajax({
                                type: 'POST',
                                url: url, 
                                data: data,
                                cache: false,
                                contentType: false,
                                processData: false,
                                timeout: 100000000,
                            })
                            .done(function(data) {
                                var marker = $('<span class="tmp_insert_marker"/>').insertBefore('#myfile');
                                $('#myfile').detach().attr('type', 'file').insertAfter(marker).show();
                                marker.remove();

                                data = $.parseJSON(data);
                                if (data.status == 'ok')  {//if uploadRemoteFile ok                               
                                    if($('body').data('debug_mode')){
                                        //console.log('session_id:',data.dataFileInfo.session_id);
                                    }
                                    $(".ajax-loader-spinner").remove();
                                    $(".form-step:first p.about").html("file uploaded!");
                                    $(".form-step:first p.instructions").html("Please wait as we are preparing the uploaded dataset...   ");
                                    $('#uploadStatus').html("uploaded");                        
                                    $('.sampleDatasetContainer').hide('slow');
                                    setTimeout("initDataFetch('" + data.dataFileInfo.data_file_url + "')", 100);
                                }else{
                                    reset_form_element( $('#myfile') );        
                                    $('#uploadRDataformWraper #uploadStatus').html(data.errors);                        
                                    $(".form-step:first p.instructions").html('There was a problem with the upload, try <a class="loadMK_insilicoDB" href="#" >downloading</a> another dataset. ' );
                                } 
                                $(".loadMK_insilicoDB")
                                        .button({ icons: { primary: "ui-icon-arrowthick-1-n", secondary: "ui-icon-arrowthick-1-n" } })
                                        .click(function (e) {
                                            e.preventDefault();
                                            loadMK('insilicoDB');
                                        });
                            })
                            .fail(function(jqXHR,status, errorThrown) {
                                console.log(errorThrown);
                                console.log(jqXHR.responseText);
                                console.log(jqXHR.status);
                            });

                            e.preventDefault();
                            return false;
                        });
                });
            });       
        
        };// end of load_localFileUI
        
        /*** end local functions definition ***/
        
        load_localFileUploadUI();
        break;

        default:
        console.log("Can't load markup for insilicoDB.")
    }
}

//fetch remote file by url passed
function initDataFetch(url) {
    var $loading = $('<span class="ajax-loader-spinner"> <img src=' + $('body').data('baseURL') + 'lib/client/imgs/ajax-loader-spinner.gif alt="loading"> </span>')
    $(".form-step:first p.instructions").append($loading.clone());                        

    var $loading = $('<img class=centeredSpin src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
    $('#densityImage').html($loading.clone());
    $('#PhenoData').html($loading.clone());

    $(".form-step:nth-child(2) p.about").html("Loading insilicoDB dataset...");
    $(".form-step:nth-child(2) p.instructions").html("Please wait...");

    $('#myFrame').hide('slow');

    // Set this to true when the initail POST request is complete to stop polling the server for progress updates
    var postComplete = false;

    var ask = function() {
        //var time = new Date().getTime();
        var url = $('body').data('baseURL') + 
            $('body').data('widget_conf').conf.server_scripts + 'getRemoteFileUploadProgress.php?callback=?';
        $.ajax({
          type: 'get',
          dataType: 'json',
          url: url,
          success: function(data) {
            $("#progress").html(data);
            //console.log('progress: ', data.$_SESSION.progress)
            if (!postComplete)
              setTimeout(ask, 500);            
          },
          error: function() {
            // We need an error handler as well, to ensure another attempt gets scheduled
            if (!postComplete)
              setTimeout(ask, 500);
            }
         });
    }

    var obj = {
        url: url
    };
    var encoded = $.toJSON(obj);
    var jsonp_url = $('body').data('baseURL') + 
        $('body').data('widget_conf').conf.server_scripts + 'uploadRemoteFile.php?callback=?';
    $.getJSON(jsonp_url, {
        url: obj.url
    },function(data) {
      //console.log(JSON.stringify(data));
    })
    .done(function(data) { 
        //console.log('getJSON request succeeded!'); 
        processInitDataFetch(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) { console.log('getJSON request failed! ' + textStatus); })
    .always(function() { 
        //console.log('getJSON request ended!'); 
        postComplete = true;
    });

    /*
    $.getJSON(jsonp_url, {
        url: obj.url
    }, function(data) {
        postComplete = true;
        processInitDataFetch(data);
    });
*/

    //if (!postComplete)
       //setTimeout(ask, 300);
       //ask();
}

//on fetch remote file finish
function processInitDataFetch(data) {
    if (data.status == 'ok') { //if uploadRemoteFile ok    

        $("#rhino-item0-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/TwittInSilico_normal.png');
        $("#rhino-item1-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/dataset.gif'); //.removeClass("step-success")
        $("#rhino-item2-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/research-results.png'); //$("#rhino-item1-bullet").removeClass("step-success");
        $("#rhino-item1-bullet").removeClass("step-error");
        $("#rhino-item2-bullet").removeClass("step-error");
        $('.instrNavBtns').css({'display':'none'});
        $('.tableHolder').html('');


        $('body').data('dataFileInfo', data.dataFileInfo);
        $(".form-step:nth-child(2) p.about").html("Dataset loaded! Extructing pheno data (Generating gene expression density function)");
        $(".form-step:nth-child(2) p.instructions").html("Please wait...");

        var $loading = $('<img src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
        $('#densityImage').html($loading.clone());

        $(".form-step:first p.instructions").html('Please wait as we are processing the uploaded dataset');                        
        var $loading = $('<span class="ajax-loader-spinner"> <img src=' + $('body').data('baseURL') + 'lib/client/imgs/ajax-loader-spinner.gif alt="loading"> </span>');
        $(".form-step:first p.instructions").append($loading.clone());                        

        var selectedVal = $('body').data('data_type');
        if(selectedVal=='rnaseq'){
            var data = $.toJSON(data);
            var jsonp_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.server_scripts + "get_pData.php?callback=?";
            $.getJSON(jsonp_url, {
                jsonString: data
            }, processFetch_rnaseq_pData);
        }else{
            var data = $.toJSON(data);
            var jsonp_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.server_scripts + "get_pData.php?callback=?";
            $.getJSON(jsonp_url, {
                jsonString: data
            }, processFetch_pData);
        }
    } else {
        $(".form-step:nth-child(2) p.about").html("Dataset failed loading");
        $(".form-step:first p.instructions").html('Loading ExpresssionSet failed. Make sure your file contains ExpresssionSet or try <a class="loadMK_insilicoDB" href="#" >downloading</a> another dataset. ' );
        $(".loadMK_insilicoDB")
            .button({ icons: { primary: "ui-icon-arrowthick-1-n", secondary: "ui-icon-arrowthick-1-n" } })
            .click(function (e) {
                e.preventDefault();
                loadMK('insilicoDB');
            });
            //$('#myFrame').show('slow');
            //$(".form-step:first p.about").html('InSilico is loaded.');                        
    }

}

function processFetch_rnaseq_pData(data) {
    //console.log(data);   

    if (data.ret.output.status == 'success') //if extracted pData ok    
    {
        $('#expinfo span.studyTitle').append(data.ret.output.expinfo.title || 'Test RNA-seq title');     
        $('#expinfo span.studyID').append(data.ret.output.expinfo.name || 'NA');         
        $("#tolSlider").slider({
            //value: 0.1,
            min: data.ret.output.densData.min || 0.1,
            max: data.ret.output.densData.max || 1,
            step: 0.1,
            slide: function (event, ui) {
                $("#tol").val(ui.value);
            }
        });
        $("#tol").val(data.ret.output.densData.bg_intensity_cutoff  || 0.1);
        $("#tolSlider").slider("value", data.ret.output.densData.bg_intensity_cutoff  || 0.1)
        
        defaultFDR = 0.01; minFDR = 0.001; ; maxFDR = 0.5; FDRstep = 0.005;
        $("#FDRSlider").slider({
            value: defaultFDR, 
            min: minFDR,
            max: maxFDR,
            step: FDRstep,
            slide: function (event, ui) {
                $("#FDR").val(ui.value);
            }
        });
        $("#FDR").val(defaultFDR);
        $("#FDRSlider").slider("value", defaultFDR);

        var density = $('<img src= ' + $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.densData.densImage + ' alt="density">');
        $("#densityImage").html(density);

        var src = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.densData.boxplot;
        var img = $('<img src=' + src + ' alt="boxPlot">');
        var boxPlot = $('<a href="' + src + '">' + img + '</a>');
        $("#boxplotImage").html(boxPlot);
        $('#boxplotImage a').attr('rel', "lightbox");
        $("#boxplot").hide();
        $("#density_item").hide();
        var html = "Gene expression density plot was generated.";
        //        var html = "Gene expression <a href='#' class='densityPlotLink'>density</a> and <a href='#' class='boxPlotLink'>box</a> plots were generated.";        
        $(".form-step:nth-child(3) p.density_about").html(html);
        $(".form-step:nth-child(3) p.density_instructions").html("Move the slider over the gene expression density function to define background cutoff. Then 'Apply cutoff'.");
        $(".form-step:nth-child(3) p.density_about a").bind('click', function (e) {
            e.preventDefault();
            if ($(this).text() == 'box') {
                $('#density_cutoff').hide('slow');
                $('#boxplot').show('slow');
                $("p.density_instructions").html("This global genes expression box plot is part of the quality control. Tidal assumes the data is normalized.");
            } else {
                $('#density_cuttof').show('slow');
                $('#boxplot').hide('slow');
                $("p.density_instructions").html("Move the slider over the gene expression density function to define background cutoff. Then proceed.");
            }
        });

        $(".form-step:nth-child(2) p.about").html("Metadata extructed! Obtaining pheno data");
        $(".form-step:nth-child(2) p.instructions").html("Please wait...");


        $(".form-step:first p.instructions").html('Metadata extructed! Please wait as we are obtaining the pheno data');                        
        var $loading = $('<span class="ajax-loader-spinner"> <img src=' + $('body').data('baseURL') + 'lib/client/imgs/ajax-loader-spinner.gif alt="loading"> </span>')
        $(".form-step:first p.instructions").append($loading.clone());                        


        var obj = {
            'file': data.ret.output.dataFileInfo.filename,
            'folder': data.ret.output.dataFileInfo.folder
        };
        $('#dm-widget-container').data('data', obj);
        var data = $.toJSON(obj);
        var jsonp_url = $('body').data('baseURL') + 
            $('body').data('widget_conf').conf.server_scripts + "dataTXT2HTML_cufDiff.php?callback=?";
        $.getJSON(jsonp_url, {
            jsonString: data
        }, process_dataTXT2HTML);
    } else {
        reset_form_element( $('#myfile') );
        $(".form-step:nth-child(1) p.instructions").html("Please try again or select a different dataset." + data.ret.output.message);

        $(".form-step:nth-child(2) p.about").html("Failed extracting dataset.");
        $(".form-step:nth-child(2) p.instructions").html("Please try again or select a different dataset.");
    }
}


function processFetch_pData(data) {

    var formateTaxon = function(taxon) {
        var specie='null'
        switch (taxon) {
            case 'Homo sapiens':
                specie="Human";
                break;
            case 'Mus musculus':
                specie="Mouse";
                break;

            default:
                console.log("taxon isn't specified.");
        }        
        return specie;
    }
    //console.log(data);   

    if (data.ret.output.status == 'success') {//if extracted pData ok    
        var taxon= {
            specie : formateTaxon(data.ret.output.taxon),
            type : "auto"
        }                            
        $('body').data('taxon', taxon);
        $('#expinfo span.studyTitle').append(data.ret.output.expinfo.title);     
        $('#expinfo span.studyID').append(data.ret.output.expinfo.name);     
        $("#tolSlider").slider({
            //value: 0.1,
            min: data.ret.output.densData.min,
            max: data.ret.output.densData.max,
            step: 0.1,
            slide: function (event, ui) {
                $("#tol").val(ui.value);
            }
        });
        $("#tol").val(data.ret.output.densData.bg_intensity_cutoff);
        $("#tolSlider").slider("value", data.ret.output.densData.bg_intensity_cutoff)
        
        defaultFDR = 0.01; minFDR = 0.001; ; maxFDR = 0.5; FDRstep = 0.005;
        $("#FDRSlider").slider({
            value: defaultFDR, 
            min: minFDR,
            max: maxFDR,
            step: FDRstep,
            slide: function (event, ui) {
                $("#FDR").val(ui.value);
            }
        });
        $("#FDR").val(defaultFDR);
        $("#FDRSlider").slider("value", defaultFDR);

        var density = $('<img src= ' + $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.densData.densImage + ' alt="density">');
        $("#densityImage").html(density);

        var src = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.densData.boxplot;
        var img = $('<img src=' + src + ' alt="boxPlot">');
        var boxPlot = $('<a href="' + src + '">' + img + '</a>');
        $("#boxplotImage").html(boxPlot);
        $('#boxplotImage a').attr('rel', "lightbox");
        $("#boxplot").hide();
        $("#density_item").hide();
        var html = "Gene expression density plot was generated.";
        //        var html = "Gene expression <a href='#' class='densityPlotLink'>density</a> and <a href='#' class='boxPlotLink'>box</a> plots were generated.";        
        $(".form-step:nth-child(3) p.density_about").html(html);
        $(".form-step:nth-child(3) p.density_instructions").html("Move the slider over the gene expression density function to define background cutoff. Then 'Apply cutoff'.");
        $(".form-step:nth-child(3) p.density_about a").bind('click', function (e) {
            e.preventDefault();
            if ($(this).text() == 'box') {
                $('#density_cutoff').hide('slow');
                $('#boxplot').show('slow');
                $("p.density_instructions").html("This global genes expression box plot is part of the quality control. Tidal assumes the data is normalized.");
            } else {
                $('#density_cuttof').show('slow');
                $('#boxplot').hide('slow');
                $("p.density_instructions").html("Move the slider over the gene expression density function to define background cutoff. Then proceed.");
            }
        });

        $(".form-step:nth-child(2) p.about").html("Metadata extructed! Obtaining pheno data");
        $(".form-step:nth-child(2) p.instructions").html("Please wait...");


        $(".form-step:first p.instructions").html('Metadata extructed! Please wait as we are obtaining the pheno data');                        
        var $loading = $('<span class="ajax-loader-spinner"> <img src=' + $('body').data('baseURL') + 'lib/client/imgs/ajax-loader-spinner.gif alt="loading"> </span>')
        $(".form-step:first p.instructions").append($loading.clone());                        


        var obj = {
            'file': data.ret.output.dataFileInfo.filename,
            'folder': data.ret.output.dataFileInfo.folder
        };
        $('#dm-widget-container').data('data', obj);
        var data = $.toJSON(obj);
        var jsonp_url = $('body').data('baseURL') + 
            $('body').data('widget_conf').conf.server_scripts + "dataTXT2HTML.php?callback=?";
        $.getJSON(jsonp_url, {
            jsonString: data
        }, process_dataTXT2HTML);
    } else {
        reset_form_element( $('#myfile') );
        $(".form-step:nth-child(1) p.instructions").html("Please try again or select a different dataset." + data.ret.output.message);

        $(".form-step:nth-child(2) p.about").html("Failed extracting dataset.");
        $(".form-step:nth-child(2) p.instructions").html("Please try again or select a different dataset.");
    }
}


function reset_form_element (e) {
    e.wrap('<form>').parent('form').trigger('reset');
    e.unwrap();
    $('#myfile').prop('disabled',false)
}


function process_dataTXT2HTML(data) {
    //    console.log(data);
    if (data.status == 'ok') //if HTML table  with pData  has arrived
    {
        $(".form-step:first p.about").html('OK, the sample annotation was successfully extructed');                        
        
        //var html = 'Try downloading <a class="loadinsilicoDB_link" href="#" >additional</a> datasets or upload a different dataset below.'
        var html = 'Try searching for a different dataset below.'
        $(".form-step:first p.instructions").html(html);                        
        $('.loadinsilicoDB_link')
            .button({ icons: { primary: "ui-icon-arrowthick-1-s", secondary: "ui-icon-arrowthick-1-s" } })
            .click(function (e) {
                e.preventDefault();
                loadMK('insilicoDB');
            });
        $('#uploadStatus').html('Currently R/Bioconductor eSets only supported');
        $('.sampleDatasetContainer').show('');
        reset_form_element( $('#myfile') );

        var myString = ['<li>Inspect the meta-data below and, if needed, <a class="show_proceed_instructions" href="#" >proceed</a> to complete a few quick steps to define the dataset for the analysis.</li>', 
        //'<li>Select the columns that are defining for the experimental samples by marking the <a class="mark_checkboxes" href="#" > checkboxes </a> for the corresponding columns. The <a class="twinkle_group_name_header" href="#" > Group Name </a> column will reflect changes in your selection.</li>', '<li><a class="twinkle_sort icon" href="#" > Sort </a> the arrays in according to their logical time-line. The first group in the table will be used as the control arrays for DE analysis. If needed, manual group reordering is available if <a class="show_proceed_instructions" href="#" >proceed</a>. Press the <a class="twinkle_Next step" href="#" > Next step </a> button to execute the DE analysis.</li>',
        '<li>Select the columns that are defining for the experimental samples by marking the <a class="mark_checkboxes" href="#" > checkboxes </a> for the corresponding columns. The <a class="twinkle_group_name_header" href="#" > Group Name </a> column will reflect changes in your selection.</li>', '<li><a class="twinkle_sort icon" href="#" > Sort </a> the arrays in according to their logical time-line. The first group in the table will be used as the control arrays for DE analysis. Press the <a class="twinkle_Next step" href="#" > Next step </a> button to execute the DE analysis.</li>',
        //'<li>This steps allows to manually set the cantrol group by dragging it to the beginining of the table. Press the <a class="twinkle_Next step" href="#" > Next step </a> button to execute the DE analysis.</li>'        
        /*'<li>Define the control arrays for the dataset of interest by dragging all the control rows for your dataset to be first in the table</li>', 
        '<li>Sort the remaining rows of your data-subset so they are organized according to their logical time-line. </li>', 
        '<li>Group the associated arrays (i.e. multiplicates) by selecting the corresponding rows, then pressing the "group" button</li>', 
        */ //enable when regroup is enabled and the reorder column activation doesn't break ecxisting sortsort
        ].join('\n');
        var html = '<ol>' + myString + '</ol>';

        $(".form-step:nth-child(2) p.about").html("The table below summarizes the dataset phenotypic information. \
            Columns correspond to the experimental conditions and rows list grouped samples, sorted per <a class='twinkle_checked_radio' href='#'> criteria selected</a>.");
        $(".form-step:nth-child(2) p.instructions").html(html);
        $('.twinkle_group_name_header')
            .click(function (e) {
                e.preventDefault();
                var el = $("table.stats thead th").filter(function(){
                    return $(this).text() == 'Group Name';
                });
                setTimeout(function(){twinkle_element($(el).find('div'))}, 400);
            });

        $('.show_proceed_instructions')            
            .click(function (e) {
                e.preventDefault();
                $('.instrNavBtns').css({'display':'block'});
                $(".proceed").show('slow');
                setTimeout("twinkle($('.proceed'))", 400);
            });

        $('.mark_checkboxes')
            .click(function (e) {
                e.preventDefault();
                var el = $('table.stats input[name=\'RadioButtonColHeader\']');
                setTimeout(function(){twinkle_element(el)}, 400);

            });

        $('.twinkle_sort')
            .click(function (e) {
                e.preventDefault();
                var el = $('.DataTables_sort_icon:visible');
                setTimeout(function(){twinkle_element(el)}, 400);
            });

        $('.highlighted_area')
            .click(function (e) {
                e.preventDefault();
            })
            .mouseover(function (e) {
                //e.preventDefault();
                $('.stats tr.group_0').addClass('group_highlight')
            })
            .mouseout(function (e) {
                e.preventDefault();
                $('.stats tr.group_0').removeClass('group_highlight')
            });

        $('.twinkle_Next step')
            .click(function (e) {
                e.preventDefault();
                var el = $('.form-submit');
                setTimeout(function(){twinkle_element(el)}, 400);
            })
        $('.twinkle_checked_radio')
            .click(function (e) {
                e.preventDefault();
                var el = $("table.stats input[name='RadioButtonColHeader']:checked");
                setTimeout(function(){twinkle_element(el)}, 400);
            });


        $(".form-step:nth-child(2) p.instructions li").hide()
        $(".form-step:nth-child(2) p.instructions li:first").show()

        buildPhenoDataUI(data);
        $('#myFrame').show('slow');
        $(".form-step:first p.about").html('InSilico is loaded.');                        

    } else {
        $(".form-step:nth-child(2) p.about").html(" Failed extracting pheno (meta) data.");
        $(".form-step:nth-child(2) p.instructions").html("Please try again or select a different dataset.");
    }
}


function fnGetSelected(oTableLocal, classesToMatch) {
    var aReturn = [];
    var aTrs = oTableLocal.fnGetNodes();

    for (var i = 0; i < aTrs.length; i++) {
        var match = false;
        for (var j = 0; j < classesToMatch.length; j++) {
            if ($(aTrs[i]).hasClass(classesToMatch[j])) {
                match = true;
            }
            else{
               match = false;   
               break;
            }
        }
        if(match) {
            aReturn.push(aTrs[i]);
        }
    }
    return aReturn;
}

function get_col_index(col_name){
    return $("table.stats thead th").filter(function(){
            return $(this).text() == col_name;
        }).index();
}

function buildPhenoDataUI(data) {

    //******* following is a list of local function fefinitions

    function fnFormatDetails ( oTable, nTr ) {
            /*  to activate when aData is defined
            var aData = oTable.fnGetData( nTr );
            var sOut = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
            sOut += '<tr><td>This group contains samples:</td><td>'+aData[3]+'</td></tr>';
            sOut += '</table>';
            */
            var sOut = '<table cellpadding="" cellspacing="0" border="0" style="padding-left:0px;">';
            sOut+= $('.dataTables_scrollBody .stats.dataTable').find('thead').html();
            var classes = new Array();
            group_id = getGroupID(nTr);
            classes.push(group_id);
            classes.push('collapsed');
            var rows = fnGetSelected(oTable, classes)
            for (var i = 0; i < rows.length; i++) {
                sOut += '<tr>';
                $(rows[i]).find('img').hide()
                sOut += rows[i].innerHTML;
                sOut += '</tr>';
            }
            sOut += '</table>';
            return sOut;
        }


    var bindShowDetailsHandler = function () {
        $('table.stats tbody td img').on('click', function () {
            var nTr = $(this).parents('tr')[0];
            if ( oTable.fnIsOpen(nTr) ) {
                /* This row is already open - close it */
                this.src = "/widget/lib/client/js/DataTables/examples/examples_support/details_open.png";
                oTable.fnClose( nTr );
            } else {
                /* Open this row */
                this.src = "/widget/lib/client/js/DataTables/examples/examples_support/details_close.png";
                oTable.fnOpen( nTr, fnFormatDetails(oTable, nTr), 'details' );
            }
        });
    }


    var getGroupID = function (tr) { //
        var my_class='';
        if( $(tr)[0].className != '' ){
        //if( $(tr).attr('class').length >0 ){
            var classes = $(tr).attr('class').split(/\s+/);
            var pattern = /^group_/;            
            for (var i = 0; i < classes.length; i++) {
                var className = classes[i];
                if (className.match(pattern)) {
                    //console.log(className);
                    my_class = className;
                    break;
                }
            }
        }else{
        }
        return my_class;        
    }

    var getUserChoiceOfColumn = function (html) {
        //console.log('select the column containing the time info.');
        $('<div> </div>')
            .attr('id',"selectGrouppingCriteriaDialog")
            .attr('title',"Select the criteria for groupping of samples")
            .html(html).appendTo('#phenoData');

        $( "#selectGrouppingCriteriaDialog" ).dialog({
            autoOpen: false,
            width: "auto",
            height: "auto",
            modal: true,
            open: function( event, ui ) {
                $( "#radioBtnHolder" ).buttonset();
            },
            buttons: {
                Proceed: function() {
                       $(this).dialog('close');                }
            },
            beforeClose: function( event, ui ) {
                    if ($("#radioBtnHolder input[name=same]:checked").length == 0) {
                        alert('Please select the criteria for groupping of samples');
                        return false;
                    }else{
                         return true;
                   }                
            },
            close: function (ev, ui) {
                        var id = $("#radioBtnHolder input[name=same]:checked").attr("id");
                        var colName = $('label[for='+id+']').text();
                        var $match = $("table.stats thead th").filter(function(){
                            return $(this).text() == colName;
                        });

                        $( "#selectGrouppingCriteriaDialog" ).remove();

                        $match.find("input[name='RadioButtonColHeader']").prop("checked", true);
                        var colName = $match.text();
                        updateGroupNames();
                        createDataTable(colName);   
                        collapseGroups();

                        //createGroups() ;                              
                    }
        });

        $( "#selectGrouppingCriteriaDialog" ).dialog('open');

    }

    /*var removeGroup = function (tr) { //
        var my_class = getGroupID(tr);*/
    var removeGroup = function (my_class) { //
        //var my_class = getGroupID(tr);

        $('.'+ my_class).find('td:nth('+get_col_index("Group Name")+')').html("TBD");
        $('.'+ my_class).find('.rowCheckbox').prop('checked',false);
        $('.'+ my_class)
            .addClass('disabled')
            .off('click')
            .on('click', function (event) {
                /*
                $("table.stats thead th").find("input[name='RadioButtonColHeader']:checked")                    
                .trigger("click")
                .prop("checked", true);
                */
            })
            .off('mouseover mouseout')
            .removeClass(my_class);
    }

    var onGrouppedRowMouseOver = function () { //bind mouse over the selected rows
        var tr = $(this).closest('tr');
        var my_class = getGroupID(tr);
        if(my_class != ''){
            $("." + my_class).addClass('group_highlight');//add highligh to all trs in the group
        }
/*
        if (1) {
            tr
            .off('click')
        }
        */
    }
/*
    var onGrouppedRowMouseOver = function () { //bind mouse over the selected rows
        var tr = $(this).closest('tr');
        $("." + tr.attr("class")).addClass('group_highlight');
        if ($(".btnUngroup", ".stats").length == 0) {
            tr.append('<button class="btnUngroup">Ungroup</button>')
            $('.btnUngroup').css({
                position: 'absolute',
                top: tr.position().top,
                left: tr.position().left
            }).on('click', function (event) {
                event.stopPropagation();
                var l = fnGetSelected(oTable, 'group_highlight');
                $(l).each(function () {
                    $(this).find('td:nth('+get_col_index("Group Name")+')').html("TBD");
                });
                $(l).removeClass('group_highlight').css('color', 'black').on('click').off('mouseover mouseout')

                var tr = $(this).closest('tr');
                var classes = tr.attr('class').split(/\s+/);
                var pattern = /^group_/;
                for (var i = 0; i < classes.length; i++) {
                    var className = classes[i];

                    if (className.match(pattern)) {
                        $(l).removeClass(className);
                    }
                }

                $(this).off('click').remove();
            });
        }
    }
*/
    var onGrouppedRowMouseOout = function () {
        var classes = [];
        classes.push('group_highlight')
        var l = fnGetSelected(oTable, classes);
        $(l).removeClass('group_highlight');
        // uncomment when switch to work with btnUngroup $(".btnUngroup", this).off('click').remove(); 
    }

    var updateGroupNames = function () { // for each row
        $("table.stats tbody tr").each(function () {
            var that = this;
            var string = '';
            $("table.stats input[name='RadioButtonColHeader']:checked").each(function () {
                var col_index = $(this).closest('th').prevAll().length;
                var td = $(that).find('td:nth-child(' + (col_index + 1) + ')');
                string += ($(td).text() + '_');
            });
            string = string.substring(0, string.length - 1);   //remove extra _
            string = string.replace(/ /g, '');    // strip whitespaces
            string = string.replace(/-/g, '_');    // strip hifens
            string = string.replace(/(\r\n|\n|\r)/gm, ""); // remove endline
            //console.log(string);
            var group_name_index = get_col_index("Group Name");
            $(that).find('td:nth('+group_name_index+')').html((string) ? (string) : "TBD");
            //$(that).find('td:nth('+group_name_index+')').html((string) ? ('T_' + string) : "TBD");
        });
    };

    var transposeTable = function ($table) {
        var t = $table.find('tbody').eq(0);
        var r = t.find('tr');
        var cols= r.length;
        var rows= r.eq(0).find('td').length;
        var cell, next, tem, i = 0;
        var tb= $('<tbody></tbody>');

        while(i<rows){
            cell= 0;
            tem= $('<tr></tr>');
            while(cell<cols){
                next= r.eq(cell++).find('td').eq(0);
                tem.append(next);
            }
            tb.append(tem);
            ++i;
        }
//        $('#thetable').append(tb);
//        $('#thetable').show();
        return tb;
    };

    var detectDataType = function (elem) {
        var type = '';
        $(elem).find('td').each(function(index,el){
            if(type=='natural'){
                return type;
            }
            var val = $(el).text();
            //console.log(index,el);
            if(/[a-z]/i.test(val)) {            
                type = (type=='numeric') ? 'natural' : 'string';
                //return type;
            }
            if(/[0-9]/.test(val)) {            
                type = (type=='string') ? 'natural' : 'numeric';
                //return type;
            }
/*
            if($.isNumeric(val)){
                type = 'numeric';
                //return type;
            }
            */
        });
        type = (type=='') ? 'string' : type;
        return type;
    }

    var defineSortTypes = function ($table) {
        var obj = {};
        $transposedTbody = transposeTable($table.clone());
        $transposedTbody.find('tr').each(function(index,elem){
            //console.log(index,elem);
            obj[index]=detectDataType(elem);            
        });
        //console.log($.toJSON(obj));
        return obj;
    };


    var createDataTable = function (colName) {

        $.fn.dataTableExt.oApi.fnAddTr = function ( oSettings, nTr, bRedraw ) {
            if ( typeof bRedraw == 'undefined' )
            {
                bRedraw = true;
            }

            var nTds = nTr.getElementsByTagName('td');
            if ( nTds.length != oSettings.aoColumns.length )
            {
                alert( 'Warning: not adding new TR - columns and TD elements must match' );
                return;
            }

            var aData = [];
            for ( var i=0 ; i<nTds.length ; i++ )
            {
                aData.push( nTds[i].innerHTML );
            }

            /* Add the data and then replace DataTable's generated TR with ours */
            var iIndex = this.oApi._fnAddData( oSettings, aData );
            oSettings.aoData[ iIndex ].nTr = nTr;

            oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
            this.oApi._fnBuildSearchArray( oSettings, 1 );

            if ( bRedraw )
            {
                this.oApi._fnReDraw( oSettings );
            }
        }


        var sortTypes = defineSortTypes($('.stats'));
        /*
        jQuery.fn.dataTableExt.aTypes.push(
            function ( sData ) {
                //return null;
                return 'mixedType';                
            }
        );
*/
        jQuery.fn.dataTableExt.oSort['alphanumeric-asc']  = function(a,b) {
          var re = new RegExp("^([a-zA-Z]*)(.*)");
          var x = re.exec(a);
          var y = re.exec(b);
         
          // you might want to force the first portion to lowercase
          // for case insensitive matching
          // x[1] = x[1].toLowerCase();
          // y[1] = y[1].toLowerCase();
         
          if (x[1] > y[1]) return 1;
          if (x[1] < y[1]) return -1;
         
          // if you want to force the 2nd part to only be numeric:
          x[2] = parseInt(x[2]);
          y[2] = parseInt(y[2]);
         
          return ((x[2] < y[2]) ? -1 : ((x[2] > y[2]) ?  1 : 0));
        };
          
        jQuery.fn.dataTableExt.oSort['alphanumeric-desc'] = function(a,b) {
          var re = new RegExp("^([a-zA-Z]*)(.*)");
          var x = re.exec(a);
          var y = re.exec(b);
         
          // you might want to force the first portion to lowercase
          // for case insensitive matching
          // x[1] = x[1].toLowerCase();
          // y[1] = y[1].toLowerCase();
         
          if (x[1] > y[1]) return -1;
          if (x[1] < y[1]) return 1;
         
          // if you want to force the 2nd part to only be numeric:
          x[2] = parseInt(x[2]);
          y[2] = parseInt(y[2]);
         
           return ((x[2] < y[2]) ?  1 : ((x[2] > y[2]) ? -1 : 0));
        };

        function naturalSort (a, b) {
            var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
                sre = /(^[ ]*|[ ]*$)/g,
                dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
                hre = /^0x[0-9a-f]+$/i,
                ore = /^0/,
                // convert all to strings and trim()
                x = a.toString().replace(sre, '') || '',
                y = b.toString().replace(sre, '') || '',
                // chunk/tokenize
                xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
                yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
                // numeric, hex or date detection
                xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
                yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null;
            // first try and sort Hex codes or Dates
            if (yD)
                if ( xD < yD ) return -1;
                else if ( xD > yD )  return 1;
            // natural sorting through split numeric strings and default strings
            for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
                // find floats not starting with '0', string or 0 if not defined (Clint Priest)
                var oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
                var oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
                // handle numeric vs string comparison - number < string - (Kyle Adams)
                if (isNaN(oFxNcL) !== isNaN(oFyNcL)) return (isNaN(oFxNcL)) ? 1 : -1;
                // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
                else if (typeof oFxNcL !== typeof oFyNcL) {
                    oFxNcL += '';
                    oFyNcL += '';
                }
                if (oFxNcL < oFyNcL) return -1;
                if (oFxNcL > oFyNcL) return 1;
            }
            return 0;
        }

       
        jQuery.extend( jQuery.fn.dataTableExt.oSort, {
            "natural-asc": function ( a, b ) {
                return naturalSort(a,b);
            },
         
            "natural-desc": function ( a, b ) {
                return naturalSort(a,b) * -1;
            }
        } );

        var arr = [];
        for (var i in sortTypes) {
            arr.push({
              "sType": sortTypes[i],
              "aTargets": [parseInt(i)]
          });
        };
        





        /*
        var obj = {
            aTargets: [0],    // Column number which needs to be modified
            fnRender: function (o, v) {   // o, v contains the object and value for the column
                return '<input type="checkbox" class="rowCheckbox" name="rawCheckbox" />';
            },
            sClass: 'tableCell'    // Optional - class to be applied to this table cell
        };
        arr.push(obj);
        */


        /*
        var obj = { "bVisible": false, "aTargets": [2] };
        arr.push(obj);
        */


        var obj = { "bSortable": false, "aTargets": [0,1,2] };
        arr.push(obj);


        /* Formating function for row details */

        if($('body').data('oTable') != undefined){
            $.removeData( $('body')[0], "oTable" ); 
        }

        oTable = $('.stats').dataTable({
            //"bRetrieve":true,
            "bPaginate": false,
            "aoColumnDefs": arr,            

            /*
            aoColumnDefs  : [
            {
                aTargets: [0],    // Column number which needs to be modified
                fnRender: function (o, v) {   // o, v contains the object and value for the column
                    return '<input type="checkbox" id="someCheckbox" name="someCheckbox" />';
                },
                sClass: 'tableCell'    // Optional - class to be applied to this table cell
            }],
            */
            /* 
            "aoColumnDefs": [
            //{ "sWidth": "100px", "aTargets": [ 1 ] },
            {
                "sType": "numeric", "aTargets": ["_all"]
            }
            ],
            */
            
            /*
            "aoColumnDefs": [{
                "sType": "numeric",
                "aTargets": [index]
            }],
            */

            /* check out "sRowSelect": "multi" */

            
            //"sDom": 'C<"clear">lfrtp',
            /*
            "oColVis": {
                //"aiExclude": [ get_col_index("Group Name"), get_col_index("ID"), get_col_index("row.names") ],
                //"aiExclude": [ get_col_index("row.names") ],
                "buttonText": "Filter columns",
                "bRestore": true,
                "sAlign": "left"
            },
            */

            "bFilter": false,
            "bInfo": false,
            //"sScrollX": "100%",
            "sScrollY": "300px",
            /*"bScrollCollapse": true,*/
            "bSort": true,
            "bJQueryUI": true,
            "aaSorting": [[ get_col_index(colName), "asc" ]],
            "bAutoWidth": true,
            "fnRowCallback": function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                //$(nRow).removeClass('odd');
                //$(nRow).removeClass('even');
            },

            "fnCreatedRow": function( nRow, aData, iDataIndex ) {
                 
                 // need to find the group ID which is stored as the "+"" img element class
                var getGroupIDofNewRow = function (tr) { //
                    var my_class='';
                    var imgEl = $(tr).find('img');
                    if( imgEl.length > 0 ){
                        imgEl = imgEl[0];
                        if( imgEl.className != '' ){
                        //if( $(tr).attr('class').length >0 ){
                            var classes = imgEl.className.split(/\s+/);
                            var pattern = /^group_/;            
                            for (var i = 0; i < classes.length; i++) {
                                var className = classes[i];
                                if (className.match(pattern)) {
                                    //console.log(className);
                                    my_class = className;
                                    break;
                                }
                            }
                        }
                    }
                    return my_class;        
                }

                
                 var group_id = getGroupIDofNewRow(nRow);

                if (group_id  != '' )   {
                    $(nRow).find('img').removeClass(group_id);
                    $(nRow).addClass(group_id);
                    $(nRow).addClass('aggregated');
                }
                else{

                }
            },

            "fnDrawCallback": function () {
                //console.log("redrawn");


                if($('body').data('oTable') == undefined){
                    return;
                }
                oTable = $('body').data('oTable');
                $(oTable.fnGetNodes()).removeClass('controlGrp')
                var classes = [];
                classes.push('aggregated');
                var rows = fnGetSelected(oTable, classes)
                $(rows[0]).addClass('controlGrp');                

                /*
                $('tr.controlGrp:last td').each(function(){
                    el = $('<span></span>')
                    .attr('class','cntrMark')
                    .width($(this).outerWidth( true ) );
                    
                    $(this).append(el);
                });
                */



                /*
                $('tr.controlGrp:last td')
                    .css({'border-bottom':'1px solid'})
                $('tr.controlGrp:first td')
                    .css({'border-top':'1px solid'})
                */


                //$(this).find('tbody th:last-child').editable(function (value, settings) {
                    //     console.log(this);
                    //console.log(value);
                    //console.log(settings);
                    //return (value);
                //});
            },
            
            "fnInitComplete": function(oSettings, json) {
                /*
                $("button.ColVis_Button").click(function () {
                    $('div.ColVis_collection input[name="RadioButtonColHeader"]').remove();
                });
                */
                
                //collapseroups();
                //createGroups();
                //bindContextMenu();
            }
        })
        //.rowReordering();
        //.makeEditable();
        ;      
        //new FixedHeader( oTable );

        var $match = $("table.stats thead th").filter(function(){
            return $(this).text() == colName;
        });
        $match.find("input[name='RadioButtonColHeader']").prop("checked", true);

        $('table.stats thead input').each (function(){
            $(this).appendTo( ($(this).parent()).parent())
        })

        if(bindPdataTableBtnClicks(oTable)){
            triggerNextStepDisplay(); // everything is fine so can display table to user
            $('body').data('oTable',oTable)
             //collapseGroups();
             //bindShowDetailsHandler();

        }
    };


    $.fn.dataTableExt.oApi.fnFlattenGroups = function ( oSettings )     {
        oTable = $('body').data('oTable');
        $(oTable.fnGetNodes()).find('img.collapsed').show();               
        $(oTable.fnGetNodes()).removeClass('collapsed');
        $match = $(oTable.fnGetNodes()).filter(function () {
            return $(this).attr('class').match(/aggregated/i);
        });
        $match.each( function () {
            var row = $(this).get(0);
            oTable.fnDeleteRow(row);
        } );
    }


    var flattenGroups = function () {
        oTable = $('body').data('oTable');
        $(oTable.fnGetNodes()).find('img.collapsed').show();               
        $(oTable.fnGetNodes()).removeClass('collapsed');
        $match = $(oTable.fnGetNodes()).filter(function () {
            return $(this).attr('class').match(/aggregated/i);
        });
        $match.each( function () {
            var row = $(this).get(0);
            oTable.fnDeleteRow(row);
        } );

    }


    $.fn.dataTableExt.oApi.fnCollapseGroups = function ( oSettings )   {

        var groups = $('.stats').data('groups');
        for (var label in groups) {
            var className = groups[label];
            var tr = $('.' + className + ':first');
            var mergedTR = tr.clone();
            $('.dataTables_scrollHead .stats.dataTable thead th').each(function(){
                var col_name = $(this).text();
                var col_index = get_col_index(col_name);
                var rownamesTD = mergedTR.find('td:nth('+col_index+')');
                var names = []; 
                $('.' + className).each( function () {
                    var name = $(this).find('td:nth('+col_index+')').text();
                    names.push(name);
                } );
                namesU = arrayUnique(names);
                names_html='';
                names_html += "<ul'>";
                //names_html += "<ul class='hidden'>";
                for(i=0;i<namesU.length;i++){
                    names_html += "<il>";
                    names_html += names[i];
                    names_html += "</il>";
                }
                names_html += "</ul>";
                $(rownamesTD).html(names_html);
                if(namesU.length==1){
                    $(rownamesTD).text(namesU[0]);
                }else{
                    $(rownamesTD).text('multiple[+]');
                }
                if(col_name=='+') {
                    var img = $('<img>')
                    .attr('src',"/widget/lib/client/js/DataTables/examples/examples_support/details_open.png")
                    .attr('class',className);
                    $(rownamesTD).html(img)
                }                
            });
            $('.' + className).addClass('collapsed');
            $(mergedTR).addClass('aggregated');
            //mergedTR "<tr><td>1</td><td>2</td><td>3</td><td>5</td><td>5</td><td>6</td></tr>";
            var tr_node = $(mergedTR)[0];
            //console.log('mergedTR', tr_node);
            
            //oTable.fnAddTr(tr_node);
            
            //oTable.row.add($(mergedTR)[0]);
           

            var nTds = tr_node.getElementsByTagName('td');
            //console.log('nTds.length:', nTds.length);

            /*
            if ( nTds.length != oTable.oSettings.aoColumns.length )   {
                alert( 'Warning: not adding new TR - columns and TD elements must match' );
                return;
            }
            */

            var aData = [];
            for ( var i=0 ; i<nTds.length ; i++ )  {
                aData.push( nTds[i].innerHTML );
            }

            oTable = $('body').data('oTable');
            oTable.fnAddData(aData);

        }
    }


    var collapseGroups = function () {
        createGroups();

        oTable = $('body').data('oTable')
        oTable.fnCollapseGroups();

        bindShowDetailsHandler();
    }   


    var bindContextMenu = function () {
        $('table.stats tbody').contextMenu({
            selector: 'tr', 
            trigger: 'right',
            /*trigger: 'hover',
            delay: 500,
            autoHide: true,
*/
            
            callback: function(key, options) {
                //var m = "clicked: " + key;
                //window.console && console.log(m) || alert(m); 
            },
            
            items: {
                //"edit": {name: "Edit", icon: "edit"},
                //"cut": {name: "Cut", icon: "cut"},
                //"copy": {name: "Copy", icon: "copy"},
                //"paste": {name: "Paste", icon: "paste"},
                "include_group": {
                    name: "Include this group (soon)", 
                    icon: "include_group", 
                    disabled: true,
                    // superseeds "global" callback
                    callback: function(key, options) {
                        //removeGroup(this);
                    }
                },
                "delete": {
                    name: "Exclude this group from analysis", 
                    icon: "delete", 
                    // superseeds "global" callback
                    callback: function(key, options) {
                        removeGroup(this);
                        //var m = "edit was clicked";
                        //window.console && console.log(m) || alert(m); 
                        //console.log(this);
                    }
                },
                "edit": {
                    name: "Include all groups into analysis", 
                    icon: "refresh", 
                    // superseeds "global" callback
                    callback: function(key, options) {
                        updateGroupNames();
                        createGroups();
                        //var m = "edit was clicked";
                        //window.console && console.log(m) || alert(m); 
                        //console.log(this);
                    }
                },               
                "sep1": "---------",
                "quit": {name: "Cancel", icon: "quit"}
            }
        });

    };

    var createGroups = function () {
        //console.log(colName) ;
        $('#dynamicStyle').text('');

        var groups = {};
        $('.stats').data('group_id', 0);
        $('.stats').data('groups', groups);

        var col_index =  $("table.stats thead th").filter(function(){
            return $(this).text() == "Group Name";
        }).index();
        //console.log(col_index) ;

        $("table.stats tbody tr").each(function () {
            //var that = this;            
            var td = $(this).find('td:nth-child(' + (col_index + 1) + ')');
            var string = $(td).text();
            var label = string.replace(/(\r\n|\n|\r)/gm, "");

            if(label != 'TBD'){
                $(this).removeClass('disabled')
            }
            //console.log('label:',label) ;
            //console.log(this) ;
            if (!groups[label]) {
                var group_id = $('.stats').data('group_id');
                var className = 'group' + '_' + group_id;
                $('.stats').data('group_id', group_id + 1);
                $(this).addClass(className);
                groups[label] = className;

                /*
                //add class style
                $('#dynamicStyle').text($('#dynamicStyle').text() + "."+className+"{color:"+obtainGroupColor()+"; }");                
                */

            } else {
                var className = groups[label];
                $(this).addClass(className)
            }
            $(this).find('.rowCheckbox').prop('checked',true);
        });

        for (var label in groups) {
            var className = groups[label];
            $('.' + className)
            .mouseover(onGrouppedRowMouseOver)
            .mouseout(onGrouppedRowMouseOout) ;

            //.css('color', obtainGroupColor());
            //.each(updateGroupName);
        }
        /*
        if($('.stats').hasClass('dataTable')) {
            //table already exists
        }else{
            //createDataTable(col_index,colName);   
            //bindContextMenu();
        }
        */
    };

    var triggerNextStepDisplay = function () {
        $('.form-submit').trigger('click');
    };

    var setColorsForGroups = function () {
        $('.stats').data('rgb', {
            'r': 200,
            'g': 200,
            'b': 200
        });
    };

    var get_random_color = function () {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    };

    var componentToHex = function (c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    var rgbToHex = function (r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    var obtainGroupColor = function () {

        return get_random_color();
    }


    var form_changed = function (html) {
        $('#sliderForm').data('form_changed', true);
        $("#rhino-item2-bullet").removeClass("step-error");
        
        $("#rhino-item1-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/dataset.gif'); //.removeClass("step-success")
        $("#rhino-item2-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/research-results.png'); //$("#rhino-item1-bullet").removeClass("step-success");
    };

    var findSortDir = function (col_index, curSortingArr) {
        for (var i = 0; i < curSortingArr.length; i++) {
            var arr = curSortingArr[i];
            if(arr[0] === col_index)
                return i;
        }        
    }

    var headerCheckBoxHandler = function(e){
            e.stopPropagation();
            if($(this).prop('checked')){ //column was added so applying additional column sort
                var curSortingArr = oTable.dataTable().fnSettings().aaSorting;
                var col_name = $(this).parent('th').text();
                var col_index = get_col_index(col_name);
                var addSortArr=[col_index,"asc"];
                curSortingArr.push(addSortArr);
                oTable.fnSort( curSortingArr );                
            } // true
            else{ //column was removed so removing column sort from $this column
                var curSortingArr = oTable.dataTable().fnSettings().aaSorting;
                var col_name = $(this).parent('th').text();
                var col_index = get_col_index(col_name);
                var sortDir = findSortDir(col_index, curSortingArr);
                curSortingArr.splice(sortDir,1);
                oTable.fnSort( curSortingArr );                
            }
            
            /*remove existing groups */
            oTable.fnFlattenGroups();
            //flattenGroups();
            /*
            $("table.stats tbody tr")
            .each(function() {
                removeGroup(this);
            });
            */      
            var groups = $('.stats').data('groups');
            for (var label in groups) {
                removeGroup(groups[label]);
            }

            updateGroupNames();
            if ($('table.stats input[name="RadioButtonColHeader"]:checked').length != 0) {                
                collapseGroups() ;                              //
            }               

            /*
            $("table.stats tbody tr").each(function () {
            });   */

            
            //$(oTable.fnGetNodes()).each(updateGroupName);
            form_changed();
    };

    var addHeaderClickHandler = function(oTable){
        var statusOK = true;
        $('input[name="RadioButtonColHeader"]').on('click', { param: oTable }, headerCheckBoxHandler);

        $(".stats > thead").click(function() {
            form_changed();
        });

        $('#sliderForm').data('form_changed', true);

        return statusOK;
    }

    var addRowClickHandler = function(oTable){
        var statusOK = true;
        $(oTable.fnGetNodes()).on('click', function (e) {
            if ($("table.stats input[name='RadioButtonColHeader']:checked").length == 0) {
                alert("Please first mark checkboxes (at least one) to define columns corresponding to the experimental conditions for your dataset of interest");
                return false;
            }
/*
            if ($(this).attr('class').match(/group_/)) {
                return false; //dont allow click if grouped
            }
            */
                        //return false;
                        //updateGroupNames();
                        //$(l).each(updateGroupName);
        });

                return statusOK;
    };

    var bindPdataTableBtnClicks = function (oTable) {
        if(addHeaderClickHandler(oTable) && addRowClickHandler(oTable)){
            return true;
        }        
        else{
            return false;
        }
    };

var buildSelectColumnUI = function (html) {
        //console.log($(html))
        //var myhtml = $.parseHTML( html );
        //console.log(myhtml);
        var columns = $(html).find("thead tr th");
        //console.log(columns);
        var div = $('<div class="selectGrouppingCriteriaDialogContent"></div>');
        div.append(' \
            <div class="expinfo"> \
                <span><u>Study:</u></span> \
                <span class="studyTitle"> ' + $('#expinfo span.studyTitle').html() + '</span> \
                <p>Please select one of the following criteria for groupping of samples</p> \
            </div> \
            ');

        var divHolder = $('<div id="radioBtnHolder"></div>').appendTo(div);
        $(columns).each(function(i, ui) {            
        //    console.log($(ui).text())
            $match= $(ui).find("input[name='RadioButtonColHeader']")
            if ($match.length == 1) {
                var name = $(ui).text();
                //console.log(name);
                $('<input/>', {
                    type : 'radio',
                    id: 'myRadio'+i,
                    name: 'same'
                  //  text: name
                }).appendTo(divHolder);
                $('<label/>', {
                    'for' : 'myRadio'+i,
                    text: name
                }).appendTo(divHolder);
            
            }
        });

        getUserChoiceOfColumn(div);
    };/******* end of local function definitions for buildPhenoDataUI  */


    $('#phenoData .tableHolder').append(data.html); //add pData table to html

    setColorsForGroups();

    var index; //column to hold the criteria for groupping of samples
    var $match = $('.stats thead th').filter(function () {
        return $(this).text().match(/^.*time|hours?|sample_name|phase|stage/i);
        //return $(this).text().match(/^.*time|hours?|sample_name|age|phase|stage/i);
    });

    if ($match.length == 1) { // only one column nmae matched, so select and group on it
        $match.find("input[name='RadioButtonColHeader']").prop("checked", true);
        var colName = $match.text();
        updateGroupNames();
        createDataTable(colName);   
        collapseGroups();
         

        //createGroups() ;                              

    } else {
        buildSelectColumnUI(data.html);    
    }

}// end of 


function createBioM_UI() {
    createTabs();
    makeRetrieveTab_BioM();
}


function makeAccordion() {
    $('a.confirm').click(function (e) {
        e.preventDefault();
        if (1) {
            var div = $(this).closest('.ui-accordion-content');
            var table = div.find('table');
            var tr = $("tr:contains('Experiment ID')", table);
            var val = $("td:nth-child(2)", tr).text();
            $('body').data('expID', val);
            $("#submitTo").append(new Option(val, val));

            var $loading = $('<img src=' + $('body').data('baseURL') + 'widget/imgs/loading.gif alt="loading">');
            $('#exp_list').html($loading.clone());
            var f_path = $(this).attr('href');
            var f_name = $(this).text();
            $('#exp_list').append("<div>Preparing " + f_name + "</div>");
            var token = $('body').data('token');
            var jsonp_url = $('body').data('jspURL') + "prepareDownload.jsp?callback=?";
            $.getJSON(jsonp_url, {
                token: token,
                file_name: f_name,
                file_path: f_path
            }, function (data) {
                if (data.status == 'ok') {
                    $('#dm-widget-container').dialog('option', 'modal', false);
                    $('#exp_list').html("<p>Instructions for continuing data transfer:</p><ol><li>The green box with the URL of the data file indicates it was succesfully prepared for use.</li><li>Proceed with the usual workflow on the web page.</li>");
                    var marker = $('<span class="tmp_insert_marker"/>').insertBefore('.inputFileTarget');
                    $('.inputFileTarget').detach().attr('type', 'text').insertAfter(marker);
                    marker.remove();

                    $('.inputFileTarget').val(data.fileURL).css('background-color', '#99FF33').removeClass('inputFileTarget').show().focus();
                }
            });
        }
    });
    $('a.previewResFile').click(function (e) {
        e.preventDefault();
        var a = $(this);
        var msgBox = $('<span></span>');
        msgBox.insertAfter(a);
        a.addClass('hidden');
        msgBox.addClass('messagebox').text('Generating preview....').fadeIn(1000);
        var f_path = $(this).attr('href');
        var f_name = $(this).text();
        var token = $('body').data('token');
        var jsonp_url = $('body').data('jspURL') + "prepareDownload.jsp?callback=?";
        $.getJSON(jsonp_url, {
            token: token,
            file_name: f_name,
            file_path: f_path
        }, function (data) {
            if (data.status == 'ok') //if correct login detail
            {
                msgBox.fadeTo(900, 0.1, function () //start fading the messagebox
                {
                    //add message and change the class of the box and start fading
                    $(this).html(data.msg).addClass('messageboxok').fadeTo(1200, 1, function () //start fading the messagebox
                    {
                        //add message and change the class of the box and start fading
                        $(this).fadeTo(900, 0, function () //start fading the messagebox
                        {
                            //add message and change the class of the box and start fading
                            a.attr('href', data.fileURL).removeClass('previewResFile').unbind('click').show();
                            $(this).remove();
                        });
                    });
                });
            } else {
                msgBox.fadeTo(200, 0.1, function () //start fading the messagebox
                {
                    //add message and change the class of the box and start fading
                    $(this).html(data.msg).addClass('messageboxerror').fadeTo(900, 1, function () //start fading the messagebox
                    {
                        //add message and change the class of the box and start fading
                        $(this).fadeTo(900, 0);
                    });
                });
            }
        });
    });
    $("#accordion").accordion('destroy').accordion({
        close: function (event, ui) {
            $('.ui-dialog').empty().remove();
            $('#dm-widget-container').remove();
            //console.log('dialog close triggered');
        },
        active: false,
        collapsible: true
    });

    $("#accordion").bind("dialogclose", function (event, ui) {
        $('.ui-dialog').empty().remove();
        $('#dm-widget-container').remove();
        //console.log('dialog close triggered');
    });
}


function processResults(data) {
    if (data.status == 'ok') {
        var html = '';
        $.each(data.results, function (i, val) {
            var ajax_url = $('body').data('widget_conf').conf.server_scripts + "runXSLT.php";

            $.post(ajax_url, {
                "xml": val
            }, function (data) {
                if (data != null) {
                    html += data.xsltResult;
                    $('#accordion').html(html);
                    makeAccordion();
                }
            }, "json");
        });
        $('#exp_list').html('<div id="resultStats">Search results (' + data.results.length + '):</div>');
        $('#exp_list').append('<div id="accordion">');
    } else {
        $('#exp_list').html('<p class="search_msg">' + data.msg + '<p>');
    }
}

function twinkle_element(el) {  
    twinkle(el);
}

function LoadTablescrollScripts() {
    $LAB.script($('body').data('baseURL') + 'lib/client/js/jquery-tbodyscroll/jquery.tbodyscroll.js')
        .wait(function () {
            $('table').tbodyScroll({
                tbody_height: '200px',
            });
        });
}

/*
function LoadTablescrollScripts() {
    var link = $("<link>");
    link.attr({
        type: 'text/css',
        rel: 'stylesheet',
        href: $('body').data('baseURL') + 'lib/client/js/jquery.tableScroll/jquery.tablescroll.css'
    });
    $("head").append(link);

    $LAB.script($('body').data('baseURL') + 'lib/client/js/jquery.tableScroll/jquery.tablescroll.js')

        .wait(function () {
        $('.stats').tableScroll({
            height: 150
        });
    });
}

*/
function twinkle(selector) {
    var options = {
        "effect": "drop",
        "effectOptions": {
            "color": "rgba(0,0,255,0.5)",
            "radius": 50
        }
    };
    $(selector).twinkle(options);
}


/*
function loadlightbox() {
    var link = $("<link>");
    link.attr({
        type: 'text/css',
        rel: 'stylesheet',
        //href: 'http://slapp04.mssm.edu/widget/lib/client/js/rhinoslider/css/rhinoslider-1.05.css'
        href: $('body').data('baseURL') + 'lib/client/js/jquery-lightbox/css/jquery.lightbox-0.5.css'
    });
    $("head").append(link);

    $LAB.script($('body').data('baseURL') + "lib/client/js/jquery-lightbox/js/jquery.lightbox-0.5.js");
}
*/

function loadlightbox2() {
    var link = $("<link>");
    link.attr({
        type: 'text/css',
        rel: 'stylesheet',
        //href: 'http://slapp04.mssm.edu/widget/lib/client/js/rhinoslider/css/rhinoslider-1.05.css'
        href: $('body').data('baseURL') + 'lib/client/js/lightbox/css/lightbox.css'
    });
    $("head").append(link);

    $LAB.script($('body').data('baseURL') + "lib/client/js/lightbox/js/lightbox.js");
}

function load_tooltipster() {
    var link = $("<link>");
    link.attr({
        type: 'text/css',
        rel: 'stylesheet',
        href: $('body').data('baseURL') + 'lib/client/js/tooltipster/css/tooltipster.css'
    });
    $("head").append(link);

    $LAB.script($('body').data('baseURL') + "lib/client/js/tooltipster/js/jquery.tooltipster.min.js")
    .wait(function () {
        $('.tooltip').tooltipster();               
    });

}

/*
function loadjqzoom() {
    var link = $("<link>");
    link.attr({
        type: 'text/css',
        rel: 'stylesheet',
        //href: 'http://slapp04.mssm.edu/widget/lib/client/js/rhinoslider/css/rhinoslider-1.05.css'
        href: 'lib/client/js/jqzoom/css/jquery.jqzoom.css'
    });
    $("head").append(link);

    $LAB.script($('body').data('baseURL') + "lib/client/js/jqzoom/js/jquery.jqzoom-core.js");
}
*/

function set_dataType() {
    var selectedVal = "";
    var selected = $("#dataTypeWraper input[type='radio']:checked");
    if (selected.length > 0) {
        selectedVal = selected.val();
    }else{
        alert('data type has not been set')
    }

    $('body').data('data_type', selectedVal);//true

    var selectedID = selected.attr('id')
    var dataType = $("label[for="+selectedID+"]").text()
    var value = $("#widget_title").text(); // value = 9.61 use $("#text").text() if you are not on select box...
    value = value.replace("High-throughput", dataType); // value = 9:61
    // can then use it as
    $("#widget_title").text(value);
}


function LoadRhinosliderScripts() {

/*
    var link = $("<link>");
    link.attr({
        type: 'text/css',
        rel: 'stylesheet',
        href: $('body').data('baseURL') + 'lib/client/css/rhinosliderAU.css'
    });
    $("head").append(link);

    */

    //loadjqzoom();
    load_tooltipster();
    loadlightbox2();

    $LAB.script($('body').data('baseURL') + "lib/client/js/jquery.twinkle-0.4.min.js");
    $LAB.script($('body').data('baseURL') + "lib/client/js/rhinoslider/js/easing.js");
    $LAB.script($('body').data('baseURL') + "lib/client/js/rhinoslider/js/mousewheel.js");
    //$LAB.script("http://slapp04.mssm.edu/widget/lib/client/js/rhinoslider/js/rhinoslider-1.05.js")
    $LAB.script($('body').data('baseURL') + "lib/client/js/rhinoslider/js/rhinoslider-1.05.js")
        .wait(function () {

        $('#slider').rhinoslider({
            controlsPlayPause: false,
            showControls: 'always',
            showBullets: 'always',
            controlsMousewheel: false,
            prevText: 'Previous step',
            nextText: 'Next step',
            slidePrevDirection: 'toRight',
            slideNextDirection: 'toLeft'
        });


        $(".rhino-prev").hide();
        $('.rhino-next').after('<a class="form-submit" href="javascript:void(0);" >Next step</a>');
        $(".rhino-next").hide();

        $(".proceed")
        .button({
            icons: {
                //primary: "ui-icon-carat-1-e",
                secondary: "ui-icon-carat-1-e"
            }
        })
        .click(function (e) {
            e.preventDefault();
            var $visible = $(".form-step:nth-child(2) p.instructions li:visible");
            var index = $visible.index();
            switch (index) {
            case 0:
                $("button.back").show('slow');
                break;
            case 1:
                break;
            case 2:                
                oTable = $('body').data('oTable');
                oTable.rowReordering(); //enable when column reorder is fixed
                break;
            case 3:
                break;
            }
/*
            var $visible = $(".form-step:nth-child(2) p.instructions li:visible");
            if (index === 0) {
                $("button.back").show('slow');
            }
*/
            var $next = $visible.next();
            if ($next.length > 0) {
                $visible.hide('slow');
                $next.show('slow');
            }

            var $last = $(".form-step:nth-child(2) p.instructions li:last");
            if ($next.index() === $last.index()) {
                $(this).hide('slow');
                //$('.form-submit').show('slow');
            }

        })
        .hide();

        $(".back").button({
            icons: {
                primary: "ui-icon-carat-1-w"
                //,secondary: "ui-icon-carat-1-w"
            }
        })
        .click(function (e) {
            e.preventDefault();
            var $visible = $(".form-step:nth-child(2) p.instructions li:visible");
            var index = $visible.index();
            switch (index) {
            case 0:
                break;
            case 1:
                $("button.back").hide('slow');
                break;
            case 2:
                break;
            case 3:
            // need to find out how to re activate sort
                break;
            }

            var $last = $(".form-step:nth-child(2) p.instructions li:last");
            if ($visible.index() === $last.index()) {
                $("button.proceed").show('slow');
            }

            var $prev = $visible.prev();
            if ($prev.length > 0) {
                $visible.hide('slow');
                $prev.show('slow');
            } else {
                $(this).hide('slow');
            }
        })
        .hide();


        $('.instrNavBtns').buttonset();

        //                var info = ["1. Search insilicoDB for data", "2. Define dataset","3. Refine dataset","4. Review and submit"];
        //                var images = ["TwittInSilico_normal.png","dataset.gif", "refine.png","research-results.png"];
        var info = ["Step 1. Load gene expression data", "Step 2. Define dataset", "Step 3. Review and submit"];
        var images = ["TwittInSilico_normal.png", "dataset.gif", "research-results.png"];
        $('.rhino-bullet').each(function (index) {
            $(this).html('<p style="margin: 0pt; font-size: 13px; font-weight: bold;"><img src=" ' + $('body').data('baseURL') + 'lib/client/imgs/' + images[index] + '"><p class="bullet-desc">' + info[index] + '</p></p></a>');
        });


        $('.form-submit').click(function () {

            $('.form-error').html("");

            var current_tab = $('#slider').find('.rhino-active').attr("id");

            switch (current_tab) {
            case 'rhino-item0':
                step1_validation();
                break;
            case 'rhino-item1':
                step2_validation();
                break;
            case 'rhino-item2':
                step3_validation();
                break;
            }
        });

        var step1_validation = function () {

            var err = 0;

            if (0) {
                err++;
            }
            if (err == 0) {
                $(".rhino-active-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/ltgreen_50px_checkbox.png');
                $("#rhino-item1-bullet").removeClass("step-error");
                $(".rhino-next").show();
                $('.form-submit').hide();
                $('.rhino-next').trigger('click');
                //$('.form-submit').hide(); //for dev needs
                //setTimeout("twinkle($('.proceed'))", 20000);
                //$('.form-submit').trigger('click');
            } else {
                $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
            }
        };


        var check_step2 = function () {
            if ($("table.stats input[name='RadioButtonColHeader']:checked").length == 0) {
                   alert("Please first mark checkboxes (at least one) to define columns corresponding to the experimental conditions for your dataset of interest");
                    return false;
            }
            
            function allValsEqual(array) {
                var first = array[0];
                return array.every(function(element) {
                    return element === first;
                });
            }

            var data = [];
            $('#stats tbody tr').each(function () {
                var val = $(this).find('td:nth('+get_col_index("Group Name")+')').text();
                data.push(val);
            });

            if (allValsEqual(data)) {
                   alert("Your selection contain only one group of samples. For DE analysis at least two groups are needed.");
                    return false;
            }

            return true;
        };

        var step2_validation = function () {
            var no_err = check_step2();

            if (no_err) {
                $(".rhino-active-bullet").removeClass("step-error");
                $(".rhino-active-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/ltgreen_50px_checkbox.png');
                //                 $(".rhino-active-bullet").removeClass("step-error").addClass("step-success");
                //$(".rhino-next").show();
                
                $('.rhino-next').trigger('click');
                if ($('#sliderForm').data('form_changed') === true) {
                    var selectedVal = $('body').data('data_type');
                    if(selectedVal=='rnaseq'){
                        submit_pData_cuffDif();                    
                    }else{
                        submit_pData();                    
                    }
                    $('.form-submit').hide();
                }else{
                    if( $('#dm-widget-container').data('widgetFinishedSuccesfully') ){
                        $('.form-submit').hide();                    }
                    else{
                    }

                }
            } else {
                $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
            }

        };
/*
        var sortTable = function (t_id){
            var tbl = document.getElementById(t_id).tBodies[0];
            var store = [];
            for(var i=0, len=tbl.rows.length; i<len; i++){
                var row = tbl.rows[i];
                var sortnr = parseFloat(row.cells[0].textContent || row.cells[0].innerText);
                if(!isNaN(sortnr)) store.push([sortnr, row]);
            }
            store.sort(function(x,y){
                return x[0] - y[0];
            });
            for(var i=0, len=store.length; i<len; i++){
                tbl.appendChild(store[i][1]);
            }
            store = null;
            //return tbl;
        }
*/
        var submit_pData_cuffDif = function () {

            //$(oTable).find('td:first-child').hide();
            $(".form-step:nth-child(3) p.about").html("Data subset is valid! Storing settings.");
            $(".form-step:nth-child(3) p.instructions").html("Please wait...");

            var $loading = $('<img class=centeredSpin src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
            $('#barplotImage').html($loading.clone());

            $("#heatmapImage").html('');
            $('#heatmap').css('border','none');
            $('.generateHeatmapBtn ').hide();

            var ajax_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.server_scripts + 'table2CSV_cuffDif.php';
            
            oTable = $('body').data('oTable');
            oTable.fnFlattenGroups();
            var t_tmp = $('.dataTables_scrollBody .stats').clone();
            t_tmp.find('thead').html($('.dataTables_scrollHead thead').html());
            oTable.fnCollapseGroups();

            //t_tmp.find('td:first-child').remove();//remove id
            //t_tmp.find('th:first-child').remove();

            /*
            moveColumn = function (table, from, to) {
                var rows = $('tr', table);
                var cols;
                rows.each(function() {
                    cols = $(this).children('th, td');
                    cols.eq(from).detach().insertAfter(cols.eq(to));
                });
            }            
            var tbl = $('.stats');
            moveColumn(t_tmp, 1, 5);
            */


            var csv_text = t_tmp.table2CSV({                
                separator: '\t',
                delivery: 'value'
            });

            var arg = {
                "csv_text": csv_text,
                'folder': $('#dm-widget-container').data('data').folder,
                'file': $('#dm-widget-container').data('data').file
            };
            $.post(ajax_url, {
                "arg": arg
            }, on_submit_pData_cuffDif, "json");
        };


        var submit_pData = function () {

            //$(oTable).find('td:first-child').hide();
            $(".form-step:nth-child(3) p.about").html("Data subset is valid! Storing settings.");
            $(".form-step:nth-child(3) p.instructions").html("Please wait...");

            var $loading = $('<img class=centeredSpin src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
            $('#barplotImage').html($loading.clone());

            $("#heatmapImage").html('');
            $('#heatmap').css('border','none');
            $('.generateHeatmapBtn ').hide();

            var ajax_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.server_scripts + 'table2CSV.php';
            
            oTable = $('body').data('oTable');
            oTable.fnFlattenGroups();
            var t_tmp = $('.dataTables_scrollBody .stats').clone();
            t_tmp.find('thead').html($('.dataTables_scrollHead thead').html());
            oTable.fnCollapseGroups();

            //t_tmp.find('td:first-child').remove();//remove id
            //t_tmp.find('th:first-child').remove();

            /*
            moveColumn = function (table, from, to) {
                var rows = $('tr', table);
                var cols;
                rows.each(function() {
                    cols = $(this).children('th, td');
                    cols.eq(from).detach().insertAfter(cols.eq(to));
                });
            }            
            var tbl = $('.stats');
            moveColumn(t_tmp, 1, 5);
            */


            var csv_text = t_tmp.table2CSV({                
                separator: '\t',
                delivery: 'value'
            });

            var arg = {
                "csv_text": csv_text,
                'folder': $('#dm-widget-container').data('data').folder,
                'file': $('#dm-widget-container').data('data').file
            };
            $.post(ajax_url, {
                "arg": arg
            }, on_submit_pData, "json");
        };

        var on_submit_pData_cuffDif = function (data) {
            //console.log('on_submit_pData')
            //console.log(data)
            if (data.status === 'ok') { //
                $(".form-step:nth-child(3) p.about").html("<p>Your new meta data was stored successfully. Generating list of Differentially Expressed (DE) genes...</p>");
                $(".form-step:nth-child(3) p.instructions").html("Please wait...");

                var dataFileInfo = $('body').data('dataFileInfo');
                var args = {
                    dataFileInfo: dataFileInfo,
                    params: {
                        tol: parseFloat($('#tol').val()),
                        FDR: parseFloat($('#FDR').val())
                    }
                }
                var argsString = $.toJSON(args);
                var jsonp_url = $('body').data('baseURL') + 
                    $('body').data('widget_conf').conf.server_scripts + 'get_diff_cuffDif.php';
                $.getJSON(jsonp_url, {
                    'jsonString': argsString
                }, on_get_diff_cuffDif);
            } else {
                $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
                $(".form-step:nth-child(3) p.about").html("Data subset is not valid!");
                $(".form-step:nth-child(3) p.instructions").html("Try to create a different data subset.");
                $('#barplotImageImage').html('');
            }
        };


        var on_submit_pData = function (data) {
            //console.log('on_submit_pData')
            //console.log(data)
            if (data.status === 'ok') { //
                $(".form-step:nth-child(3) p.about").html("<p>Your new meta data was stored successfully. Generating list of Differentially Expressed (DE) genes...</p>");
                $(".form-step:nth-child(3) p.instructions").html("Please wait...");

                var dataFileInfo = $('body').data('dataFileInfo');
                var args = {
                    dataFileInfo: dataFileInfo,
                    params: {
                        tol: parseFloat($('#tol').val()),
                        FDR: parseFloat($('#FDR').val())
                    }
                }
                var argsString = $.toJSON(args);
                var jsonp_url = $('body').data('baseURL') + 
                    $('body').data('widget_conf').conf.server_scripts + 'get_diff.php';
                $.getJSON(jsonp_url, {
                    'jsonString': argsString
                }, on_get_diff);
            } else {
                $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
                $(".form-step:nth-child(3) p.about").html("Data subset is not valid!");
                $(".form-step:nth-child(3) p.instructions").html("Try to create a different data subset.");
                $('#barplotImageImage').html('');
            }
        };


        var on_get_diff_cuffDif = function (data) {
            //console.log('on_get_diff');
            //console.log(data);
            if (data.ret.output.status === 'success') {

                $('#sliderForm').data('form_changed', false); //to prevent submit when no changes were made

                var src = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.geneData.barplot;
                var img = '<img class="infoPlot" src=' + src + ' alt="barplotImage"/>';
                var plot = $('<a href="' + src + '">' + img + '</a>');
                $("#barplotImage").html(plot);
                $('#barplotImage a').attr('rel', "lightbox");

                var generateStep2Info = function (data) {
                    $(".form-step:nth-child(3) p.about").html("Differentially Expressed (DE) gene statistics was generated and can be <a class='DEGstat ui-helper-hidden' href=''>downloaded</a>");
                    $(".form-step:nth-child(3) p.instructions").html("Review the barplot and press the submit button if the DE gene statistics fits your expectations. To adjust the DE gene statistics you can <a href='#' class='densityPlotLink'>change the background cuttof</a> or select a different data subset in step 2.");
                    $(".densityPlotLink")
                        //.button()
                        .css({'color':'blue'})
                        .click(function (e) {
                            e.preventDefault();
                            $('#infoplots').hide('slow');
                            $('#density_item').show('slow');
                            $(".form-step:nth-child(3) p.about").html("Gene expression density plot was generated.");
                            $(".form-step:nth-child(3) p.instructions").html("Move the slider over the gene expression density function to define background cutoff. Then 'Apply cutoff'.");
                            $('.form-submit').hide('slow');
                            $(".rhino-prev").hide();
                        });
                    $("a.DEGstat")
                        .button({ icons: { primary: "ui-icon-arrowthick-1-s", secondary: "ui-icon-arrowthick-1-s" } })

                    $('.form-submit').show('slow');
                };
                generateStep2Info();

                var href = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.geneData.DEGzip;
                $('a.DEGstat').attr('href',href).removeClass('ui-helper-hidden')

                
                $('#heatmap').css('border','3px dashed #D3D3D3');
                $(".generateHeatmapBtn").button({
                    icons: {
                        primary: "ui-icon-play",
                        secondary: "ui-icon-image"
                    }
                })
                    .unbind('click')
                    .click(function (e) {
                       e.preventDefault();
                       generateHeatmap();
                       $(this).hide('slow');
                    })
                    .show();

                //$('.form-submit').hide();

                //setTimeout("$('.generateHeatmapBtn').trigger('click')", 1000);

                $('#heatmap').removeClass('hidden')
                $('.generateHeatmapBtn').css({
                    position: 'absolute',
                    left: ($('#heatmap').width() - $('.generateHeatmapBtn').outerWidth()) / 2,
                    top: ($('#heatmap').height() - $('.generateHeatmapBtn').outerHeight()) / 2
                });


                var generateHeatmap = function () {

                    var $loading = $('<img class="spinner" src='+$('body').data('baseURL') + 'lib/client/imgs/spinner.gif alt="loading">');
                    $('#heatmapImage').html($loading.clone());

                    $('.spinner').css({
                        position: 'absolute',
                        left: ($('#heatmap').width() - $loading.outerWidth()) / 2,
                        top: ($('#heatmap').height() - $loading.outerHeight()) / 2
                    });


                    var dataFileInfo = $('body').data('dataFileInfo');
                    var args = dataFileInfo;
                    var argsString = $.toJSON(args);
                    var jsonp_url = $('body').data('baseURL') + 
                        $('body').data('widget_conf').conf.server_scripts + 'generateHeatmap_cuffDif.php?callback=?';
                    $.getJSON(jsonp_url, {
                        'jsonString': argsString
                    }, on_generateHeatmap);
                };

                var on_generateHeatmap = function (data) {
                    //console.log('on_make_tidalInput')
                    //console.log(data)
                    if (data.ret.output.status === 'success') {

                        //generateStep2Info();

                        var src = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.heatmapImage;
                        var img = '<img class="infoPlot" src=' + src + ' alt="heatmapImage"/>';
                        //var big_img = '<img src=' + src + ' alt="heatmapImageBig"/>' ;                       
                        var plot = $('<a href="' + src + '">' + img + '</a>');
                        //$('#barplot').css({'margin-left':'-300px'});
                        $("#heatmap").css({
                            border: 'none'
                        });
                        $("#heatmapImage").html(plot).css({});
                        //$('#heatmapImage a').lightBox({fixedNavigation:true});
                        $('#heatmapImage a').attr('rel', "lightbox");
                    } else {
                        $('#heatmapImage').html('error generating heatmap');
                    }
                };



                $(".updateDensNavBtn").button({
                    icons: {
                        primary: "ui-icon-carat-1-e",
                        secondary: "ui-icon-carat-1-e"
                    }
                })
                var on_updateDensNavBtnClicked = function (e) {
                    e.preventDefault();
                    $('button.backDensNavBtn').trigger('click');
                    $('.form-submit').hide();
                    $("#tolSlider").unbind("slide").bind("slide", function (event, ui) {
                        $("#tol").val(ui.value);
                    });
                    $("#FDESlider").unbind("slide").bind("slide", function (event, ui) {
                        $("#FDR").val(ui.value);
                    });

                    $(this).unbind('click');

                    var selectedVal = $('body').data('data_type');
                    if(selectedVal=='rnaseq'){
                        submit_pData_cuffDif();                    
                    }else{
                        submit_pData();                    
                    }

                    
                    $('button.updateDensNavBtn').hide('slow');
                    //$('.form-submit').show('slow');
                    $(".generateHeatmapBtn").show();
                    $(".generateHeatmapBtn").hide().button('destroy');

                };
                /*
                if (!button.isBound('click', on_updateDensNavBtnClicked)) {
                    button.click(on_updateDensNavBtnClicked);
                }
                */

                $(".updateDensNavBtn").unbind('click') //remove handler
                .bind('click', on_updateDensNavBtnClicked); //add handler


                $(".backDensNavBtn").button({
                    icons: {
                        primary: "ui-icon-carat-1-w",
                        secondary: "ui-icon-carat-1-w"
                    }
                })
                    .click(function (e) {
                    e.preventDefault();
                    $('#infoplots').show('slow');
                    $('#density_item').hide('slow');
                    $(".rhino-prev").show();
                    generateStep2Info();
                });
                $("#tolSlider, #FDRSlider").bind("slide", function (event, ui) {
                    $('button.updateDensNavBtn').show();
                    
                });


            } else {
                $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
                //$(".form-step:nth-child(3) p.about").html(data.ret.output.message);                
                $(".form-step:nth-child(3) p.about").html('No DE genes were found');
                $(".form-step:nth-child(3) p.instructions").html("Try to create a different data subset.");
                $('#barplotImage').html('');
            }

        };



        var on_get_diff = function (data) {
            //console.log('on_get_diff');
            //console.log(data);
            if (data.ret.output.status === 'success') {

                $('#sliderForm').data('form_changed', false); //to prevent submit when no changes were made

                var src = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.geneData.barplot;
                var img = '<img class="infoPlot" src=' + src + ' alt="barplotImage"/>';
                var plot = $('<a href="' + src + '">' + img + '</a>');
                $("#barplotImage").html(plot);
                $('#barplotImage a').attr('rel', "lightbox");

                var generateStep2Info = function (data) {
                    $(".form-step:nth-child(3) p.about").html("Differentially Expressed (DE) gene statistics was generated and can be <a class='DEGstat ui-helper-hidden' href=''>downloaded</a>");
                    $(".form-step:nth-child(3) p.instructions").html("Review the barplot and press the submit button if the DE gene statistics fits your expectations. To adjust the DE gene statistics you can <a href='#' class='densityPlotLink'>change the background cuttof</a> or select a different data subset in step 2.");
                    $(".densityPlotLink")
                        //.button()
                        .css({'color':'blue'})
                        .click(function (e) {
                            e.preventDefault();
                            $('#infoplots').hide('slow');
                            $('#density_item').show('slow');
                            $(".form-step:nth-child(3) p.about").html("Gene expression density plot was generated.");
                            $(".form-step:nth-child(3) p.instructions").html("Move the slider over the gene expression density function to define background cutoff. Then 'Apply cutoff'.");
                            $('.form-submit').hide('slow');
                            $(".rhino-prev").hide();
                        });
                    $("a.DEGstat")
                        .button({ icons: { primary: "ui-icon-arrowthick-1-s", secondary: "ui-icon-arrowthick-1-s" } })

                    $('.form-submit').show('slow');
                };
                generateStep2Info();

                var href = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.geneData.DEGzip;
                $('a.DEGstat').attr('href',href).removeClass('ui-helper-hidden')

                
                $('#heatmap').css('border','3px dashed #D3D3D3');
                $(".generateHeatmapBtn").button({
                    icons: {
                        primary: "ui-icon-play",
                        secondary: "ui-icon-image"
                    }
                })
                    .unbind('click')
                    .click(function (e) {
                       e.preventDefault();
                       generateHeatmap();
                       $(this).hide('slow');
                    })
                    .show();

                //$('.form-submit').hide();

                //setTimeout("$('.generateHeatmapBtn').trigger('click')", 1000);

                $('#heatmap').removeClass('hidden')
                $('.generateHeatmapBtn').css({
                    position: 'absolute',
                    left: ($('#heatmap').width() - $('.generateHeatmapBtn').outerWidth()) / 2,
                    top: ($('#heatmap').height() - $('.generateHeatmapBtn').outerHeight()) / 2
                });


                var generateHeatmap = function () {

                    var $loading = $('<img class="spinner" src='+$('body').data('baseURL') + 'lib/client/imgs/spinner.gif alt="loading">');
                    $('#heatmapImage').html($loading.clone());

                    $('.spinner').css({
                        position: 'absolute',
                        left: ($('#heatmap').width() - $loading.outerWidth()) / 2,
                        top: ($('#heatmap').height() - $loading.outerHeight()) / 2
                    });


                    var dataFileInfo = $('body').data('dataFileInfo');
                    var args = dataFileInfo;
                    var argsString = $.toJSON(args);
                    var jsonp_url = $('body').data('baseURL') + 
                        $('body').data('widget_conf').conf.server_scripts + 'generateHeatmap.php?callback=?';
                    $.getJSON(jsonp_url, {'jsonString': argsString}, on_generateHeatmap);
                };

                var on_generateHeatmap = function (data) {
                    //console.log('on_make_tidalInput')
                    //console.log(data)
                    if (data.ret.output.status === 'success') {

                        //generateStep2Info();

                        var src = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.heatmapImage;
                        var img = '<img class="infoPlot" src=' + src + ' alt="heatmapImage"/>';
                        //var big_img = '<img src=' + src + ' alt="heatmapImageBig"/>' ;                       
                        var plot = $('<a href="' + src + '">' + img + '</a>');
                        //$('#barplot').css({'margin-left':'-300px'});
                        $("#heatmap").css({
                            border: 'none'
                        });
                        $("#heatmapImage").html(plot).css({});
                        //$('#heatmapImage a').lightBox({fixedNavigation:true});
                        $('#heatmapImage a').attr('rel', "lightbox");
                    } else {
                        $('#heatmapImage').html('error generating heatmap');
                    }
                };



                $(".updateDensNavBtn").button({
                    icons: {
                        primary: "ui-icon-carat-1-e",
                        secondary: "ui-icon-carat-1-e"
                    }
                })
                var on_updateDensNavBtnClicked = function (e) {
                    e.preventDefault();
                    $('button.backDensNavBtn').trigger('click');
                    $('.form-submit').hide();
                    $("#tolSlider").unbind("slide").bind("slide", function (event, ui) {
                        $("#tol").val(ui.value);
                    });
                    $("#FDESlider").unbind("slide").bind("slide", function (event, ui) {
                        $("#FDR").val(ui.value);
                    });

                    $(this).unbind('click');

                    var selectedVal = $('body').data('data_type');
                    if(selectedVal=='rnaseq'){
                        submit_pData_cuffDif();                    
                    }else{
                        submit_pData();                    
                    }

                    
                    $('button.updateDensNavBtn').hide('slow');
                    //$('.form-submit').show('slow');
                    $(".generateHeatmapBtn").show();
                    $(".generateHeatmapBtn").hide().button('destroy');

                };
                /*
                if (!button.isBound('click', on_updateDensNavBtnClicked)) {
                    button.click(on_updateDensNavBtnClicked);
                }
                */

                $(".updateDensNavBtn").unbind('click') //remove handler
                .bind('click', on_updateDensNavBtnClicked); //add handler


                $(".backDensNavBtn").button({
                    icons: {
                        primary: "ui-icon-carat-1-w",
                        secondary: "ui-icon-carat-1-w"
                    }
                })
                    .click(function (e) {
                    e.preventDefault();
                    $('#infoplots').show('slow');
                    $('#density_item').hide('slow');
                    $(".rhino-prev").show();
                    generateStep2Info();
                });
                $("#tolSlider, #FDRSlider").bind("slide", function (event, ui) {
                    $('button.updateDensNavBtn').show();
                    
                });


            } else {
                $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
                //$(".form-step:nth-child(3) p.about").html(data.ret.output.message);                
                $(".form-step:nth-child(3) p.about").html('No DE genes were found');
                $(".form-step:nth-child(3) p.instructions").html("Try to create a different data subset.");
                $('#barplotImage').html('');
            }

        };

        var step3_validation = function () {
            var err = 0;

            if (err == 0) {
                $(".rhino-active-bullet img").attr('src', $('body').data('baseURL') + 'lib/client/imgs/ltgreen_50px_checkbox.png');
                //                 $(".rhino-active-bullet").removeClass("step-error").addClass("step-success");
                //$(".rhino-next").show();
                $('.form-submit').hide();
                $('.rhino-prev').hide();
                //                    $('.rhino-next').trigger('click');
                make_tidalInput();
            } else {
                $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
            }
        };

        var make_tidalInput = function () {
            $(".form-step:nth-child(3) p.about").html("Generating Tidal input.");
            $(".form-step:nth-child(3) p.instructions").html("Please wait... It can take a few seconds.");

            var $loading = $('<img class=centeredSpin src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
            $('#barplotImage').html($loading.clone());
            $("#heatmapImage").html('');
            $('#heatmap').css('border','none');
            $('.generateHeatmapBtn ').hide();

            var dataFileInfo = $('body').data('dataFileInfo');
            var args = dataFileInfo;
            args.taxon = $('body').data('taxon').specie;
            var argsString = $.toJSON(args);
            var jsonp_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.server_scripts + 'make_tidalInput.php?callback=?';
            $.getJSON(jsonp_url, {'jsonString': argsString}, on_make_tidalInput);
        };

        var on_make_tidalInput = function (data) {
            //console.log('on_make_tidalInput')
            //console.log(data)
            $('.form-submit').hide('slow');

            $('html, body').animate({
                scrollTop: $("#slider").offset().top
            }, 2000);

            $('.rhino-prev').show();
            $("#barplotImage").html('');

            if (data.ret.output.status === 'success') {                

                /******** update widget ************/
                $(".form-step:nth-child(3) p.about").html("<p>Tidal input was generated successfully.</p> <span id='tidalIputStatusImgHolder'> </span>");
                $(".form-step:nth-child(3) p.instructions").html('You can now <a onclick="$(\'#dm-widget-container\').dialog(\'close\');" href="#" class="close_widget">close</a> the widget.');
                $(".close_widget").button({ icons: { primary: "", secondary: "ui-icon-circle-close" } })

                //var $checkImg = $('<img class="" src=' + $('body').data('baseURL') + 'lib/client/imgs/checkmark.gif">');
                //$('#tidalIputStatusImgHolder').html($checkImg.clone());
                $checkImg = $('<img class=centeredSpin src=' + $('body').data('baseURL') + 'lib/client/imgs/checkmark.png alt="loading">');
                $('#barplotImage').html($checkImg.clone());


                /*------------------------------------------------------*/

                
                /******** update webtool form  ************/
                var fileURL = $('body').data('dataFileInfo').outDir_url + '/' + data.ret.output.tidalInputFile;
                var marker = $('<span class="tmp_insert_marker"/>').insertBefore('#foreground');
                $('#foreground').detach().attr('type', 'text').insertAfter(marker).val(fileURL).css('background-color', '#99FF33').show().prop('disabled', false).focus();
                marker.remove();
                /*------------------------------------------------------*/
                $('#dm-widget-container').data('widgetFinishedSuccesfully', true)

            } else { // failed
                if (data.ret.output.message === "taxon is not set") {  // failed due to taxon problem
                    if($('body').data('taxon').type == "user"){ //user already tried to set the taxon
                        $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
                        $(".form-step:nth-child(3) p.about").html("Note, TiDAL input was not generated as the taxonomy info didn't match the data.");
                        $(".form-step:nth-child(3) p.instructions").html("Try to create a different data subset.");
                        $('#dm-widget-container').data('widgetFinishedSuccesfully',false)
                    }else{//let user choos the taxon
                        if($('body').data('debug_mode')){ console.log("Couldn't detect taxon"); }
                        getUserChoiceOfTaxon();
                    }
                }else{
                    $(".rhino-active-bullet").removeClass("step-success").addClass("step-error");
                    $(".form-step:nth-child(3) p.about").html("Note, TiDAL input could not not be generated from this dataset!");
                    $(".form-step:nth-child(3) p.instructions").html("Try to create a different data subset.");
                    $('#dm-widget-container').data('widgetFinishedSuccesfully',false)
                }   
            }
        };
        
        var getUserChoiceOfTaxon = function () {
        console.log('display UI for get user of taxon');
            var jsonp_url = $('body').data('baseURL') + 
                $('body').data('widget_conf').conf.views + 
                    "/selectTaxonDialogMK.php?callback=?";
        $.getJSON(jsonp_url, function (data) {
            $('#infoplots').append(data.html);

            $( "#taxonChoiceDialog-container" ).dialog({
                autoOpen: false,
                width: "auto",
                height: "auto",
                modal: false,
                open: function( event, ui ) {
                    $( "#radioBtnHolder" ).buttonset();
                },
                buttons: {
                    Proceed: function() {
                           $(this).dialog('close');                }
                },
                beforeClose: function( event, ui ) {
                        if ($("#radioBtnHolder input[name=taxon]:checked").length == 0) {
                            alert('Please select the criteria for groupping of samples');
                            return false;
                        }else{
                           return true;
                       }                
                },
                close: function (ev, ui) {
                            var id = $("#radioBtnHolder input[name=same]:checked").attr("id");
                            var taxon= {
                                specie : $('label[for='+id+']').text(),
                                type : "user"
                            }                            
                            $('body').data('taxon', taxon);

                            $( "#taxonChoiceDialog-container" ).remove();
                            make_tidalInput();
                        }
            });
            $("#taxonChoiceDialog-container").dialog('open');
        });
    };//end of getUserChoiceOfTaxon

    }); //end of script loading wait

    $('.form-submit').hide();


} //end of LoadRhinosliderScripts


function filterMappingFiles() { // hide all non matching taxon 
    var taxon = $('body').data('taxon');
    $("#tfbs option").addClass('hidden');
    var el = $("#tfbs option").filter(function(){
        return $(this).val().match(taxon);
    });
    el.removeClass('hidden');
    
    //select a new option
    $match = taxon + '.+2kb.+conserved';
    $("#tfbs option").filter(function(){
        return $(this).val().match($match);
    }).prop('selected', true);
    
}


function displayUserFormMsg() {
    var $msg = $('<span/>')
        .attr('id',"successMsg")
        .css( "display", "none" );
    if( $('#dm-widget-container').data('widgetFinishedSuccesfully') ){
        $msg
            .html("<p>The green box with the URL of the data file indicates it was succesfully prepared for use.</p><p> Proceed with the usual workflow on the web page.</p>")
            .addClass('messageboxok')
        }
    else{
        $msg
            .html("<p>Data import didn't finish succesfully. Relaunch the widget and try again.</p>")
            .addClass('messageboxerror')
    }
    $msg.insertAfter('.dmlink').fadeIn(3000, function () { //start fading the messagebox
        setTimeout(function() {
            $('#successMsg').fadeOut(6000).remove();
        }, 2000);                  
    });
}

function processBioModelSearchResults(data) {
    console.log(data);
    if (data.ret.status === 'ok') {
        var table = CreateTableView(data.ret.results);
        $('#exp_list').html('<div id="resultStats">Search results (' + Object.keys(data.ret.results).length + '):</div>');
        $('#exp_list').append(table);
        //        $('#accordion').html(table);        
        $('#exp_list tbody').find("tr").css("cursor", "pointer").bind("click", function () {
            var $tr = $(this);
            var msgBox = $('<span></span>');
            //            var cell = $("<td/>").appendTo(tr);
            //            msgBox.appendTo(cell);
            msgBox.insertAfter($tr);

            //            tr.addClass('hidden');
            msgBox.addClass('messagebox').text('retrieving SBML....').fadeIn(1000);
            var biomodelID = $tr.closest('tr').attr('id'); // table row ID 
            var dataDir = $('body').data('dataDir');

            var jsonp_url = $('body').data('widget_conf').conf.server_scripts + "searchBiomodels.php?callback=?";

            var args = {
                "dataDir": dataDir,
                "type": "getModelSBMLById",
                "term": biomodelID
            }
            var argsString = $.toJSON(args);

            $.getJSON(jsonp_url, {            
                "args": argsString
            }, function (data) {
                console.log(data);
                if (1) //if correct login detail
                {
                    msgBox.fadeTo(900, 0.1, function () //start fading the messagebox
                    {
                        //add message and change the class of the box and start fading
                        $(this).html(data.msg).addClass('messageboxok').fadeTo(1200, 1, function () //start fading the messagebox
                        {
                            //add message and change the class of the box and start fading
                            $(this).fadeTo(900, 0, function () //start fading the messagebox
                            {
                                //add message and change the class of the box and start fading
                                var link = $('<a>');
                                link.attr({
                                    'href': $('body').data('dataFileInfo').outDir_url + '/' + data.ret.fileName,
                                    'target': 'blank'
                                }).text('download SBML');
                                ////                                var a = $('<a>').attr('href',data.fileURL).attr('text','link').
                                $tr.unbind('click');
                                //$(this).remove();
                                $tr.find('td:first').html(link).css('background', '#C9FFCA');
                            });
                        });

                    });

                } else {
                    msgBox.fadeTo(200, 0.1, function () //start fading the messagebox
                    {
                        //add message and change the class of the box and start fading
                        $(this).html(data.msg).addClass('messageboxerror').fadeTo(900, 1, function () //start fading the messagebox
                        {
                            //add message and change the class of the box and start fading
                            $(this).fadeTo(900, 0);
                        });
                    });
                }
            });

        });

        LoadTablescrollScripts();
        //
        /*
        var options = {
            formatOutput: true
        };
        var xml = $.json2xml(data, options);
        console.log(xml);        
        $('#exp_list').html('<p class="search_msg">' + xml + '<p>');
*/


        //        $('#exp_list').append('<div id="accordion">');
    } else {
        $('#exp_list').html('<p class="search_msg">' + data.ret.msg + '<p>');
    }
}

function CreateTableView(objArray, theme, enableHeader) {
    // set optional theme parameter
    if (theme === undefined) {
        theme = 'mediumTable'; //default theme
    }

    if (enableHeader === undefined) {
        enableHeader = true; //default enable headers
    }

    // If the returned data is an object do nothing, else try to parse
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;

    var str = '<table class="' + theme + '">';

    // table head
    if (enableHeader) {
        str += '<thead><tr>';
            str += '<th scope="col">' + "Models matching your keyword" + '</th>';
        str += '</tr></thead>';
    }

    // table body
    str += '<tbody>';
    var index = 0;
    for (var m_id in objArray) {
        str += (index % 2 == 0) ? '<tr id='+m_id+' class="alt">' : '<tr id='+m_id+'>';
        str += '<td>' + objArray[m_id] + '</td>';
        str += '</tr>';
        index++;
    }
    str += '</tbody>'
    str += '</table>';
    return str;
}

function createTabs(source) {
    var dyna_tabs = {

        tabs: null,

        init: function (id) {
            var tabs = $('<div id="' + id + '"></div>');
            $('.dm_main_link_container').html(tabs);

            var list = $('<ul></ul').append('<li><a href="#"></a></li>');
            tabs.append(list);

            tabs.tabs();

            // remove the dummy tab
            tabs.tabs('remove', 0);
            tabs.hide();

            this.tabs = tabs;
        },

        add: function (tab_id, tab_name, tab_content) {
            if (this.tabs != null) {
                if (this.tabs.css('display') == 'none') {
                    this.tabs.show();
                }
                var data = $('<div id="' + tab_id + '"></div>').append(tab_content);
                this.tabs.append(data).tabs('add', '#' + tab_id, tab_name);
                this.tabs.tabs('select', '#' + tab_id);
            } else {
                alert('Tabs not initialized!');
            }
        }

    };

    dyna_tabs.init('mytabs');

    dyna_tabs.add('retreiveTab', 'Retreive Data', 'Retreive Data Tab');

    dyna_tabs.add('submitTab', 'Submit Data', 'Submit Data Tab');

    s = ' <div id="help" class=""> <p>Help items are coming soon</p></div>';
    dyna_tabs.add('helpTab', 'Help', s);

    $('#mytabs').tabs("select", 0);

    if (source === 'primeDB') {
        $('submit_demo').removeClass('hidden');
    }

}

function loadExperimentTypes(data) {
    /*    var argsString = $.toJSON(data);
    console.log(data);            
    console.log(argsString);
 */
    var callback = $.proxy(createExpTypeSelectBox, this, data);
    var ajax_url = $('body').data('widget_conf').conf.server_scripts + "loadDict.php?callback=?";
    $.getJSON(ajax_url, {
        //            tool_title: $(document).attr('title')
    }, callback);
}

function makeRetrieveTab() {
    var p = $('<p>').append('<input placeholder="search by keyword" id="search">').append('<button id="search_btn">Go</button>').append("<span> or/and </span>").append('<span id="exp_type">').append('<span id="selDates">');
    $('#retreiveTab').html(p);
    var exp_list = $('<div id="exp_list">');
    $('#retreiveTab').append(exp_list);
    var token = $('body').data('token');
    var jsonp_url = $('body').data('widget_conf').conf.server_scripts + "loadExperimentTypes.jsp?callback=?";
    $.getJSON(jsonp_url, {
        token: token
    }, loadExperimentTypes);

    $("#search_btn").bind('click', function () {
        var $loading = $('<img src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
        $('#exp_list').html($loading.clone());

        var jsonp_url = $('body').data('jspURL') + "experimentSearch.jsp?callback=?";
        $.getJSON(jsonp_url, {
            token: token,
            "exp_type": $("#select_exp_type option:selected").text(),
            "search_string": $('#search').val()
        }, processResults);
    })
    $("#retreiveTab").bind('keypress', function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            //            e.preventDefault();
            $("#search_btn").blur().focus().click();
        }
    });
    $('#selDates').html('<span>From: <input type="text" id="dateFrom" class="datepicker"></span><span>To: <input type="text" id="dateTo" class="datepicker"></span>');
    $(".datepicker").datepicker({
        showOn: "button",
        buttonImage: $('body').data('baseURL') + "lib/client/imgs/calendar.gif",
        buttonImageOnly: true
    });

}

function makeRetrieveTab_BioM() {
    var p = $('<p>').append('<input placeholder="search by keyword" id="search">').append('<button id="search_btn">Go</button>')
    $('#retreiveTab').html(p);
    var exp_list = $('<div id="exp_list">');
    $('#retreiveTab').append(exp_list);

    $("#search_btn").bind('click', function () {
        var $loading = $('<img src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
        $('#exp_list').html($loading.clone());

        var jsonp_url = $('body').data('widget_conf').conf.server_scripts + "searchBiomodels.php?callback=?";

        var args = {
            "type": "getModelsIdByName",
            "term": $('#search').val()
        }
        var argsString = $.toJSON(args);

        $.getJSON(jsonp_url, {            
            "args": argsString
        }, processBioModelSearchResults);
    })
    $("#retreiveTab").bind('keypress', function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            //            e.preventDefault();
            $("#search_btn").blur().focus().click();
        }
    });
    $('#selDates').html('<span>From: <input type="text" id="dateFrom" class="datepicker"></span><span>To: <input type="text" id="dateTo" class="datepicker"></span>');
    $(".datepicker").datepicker({
        showOn: "button",
        buttonImage: $('body').data('baseURL') + "lib/client/imgs/calendar.gif",
        buttonImageOnly: true
    });

}

function include(arr, obj) {
    return (arr.indexOf(obj) != -1);
}

function createExpTypeSelectBox(data, curData) {
    var argsString = $.toJSON(curData);
    //console.log(curData);    
    //console.log(argsString);
    var argsString = $.toJSON(data);
    //console.log(data);    
    //console.log(argsString);
    var s = $('<select/>').attr('id', 'select_exp_type');

    var tool_title = $(document).attr('title');
    var dictExpTypes = new Array;
    var matchedDictExpTypes = {};

    $.each(curData, function (key, value) {
        if (key === tool_title) {
            dictExpTypes.push(value);
        }
    });

    if (dictExpTypes.length < 1) { //tool title was not matched
        matchedDictExpTypes = data;
        $('<option />', {
            value: "Show All",
            text: "Show All"
        }).appendTo(s);
    } else {
        $.each(dictExpTypes, function (index, val) {
            $.each(data, function (key, value) {
                if (value === val) {
                    matchedDictExpTypes.value = value;
                }
            });
        });
    }

    $.each(matchedDictExpTypes, function (key, val) {
        $('<option />', {
            value: key,
            text: val
        }).appendTo(s);
    });
    $('#exp_type').html('<span>Browse by experiment type: </span>').append(s);
    $('#select_exp_type').change(function () {
        var $loading = $('<img src=' + $('body').data('baseURL') + 'lib/client/imgs/loading.gif alt="loading">');
        $('#exp_list').html($loading.clone());
        var jsonp_url = $('body').data('jspURL') + "experimentSearch.jsp?callback=?";
        var token = $('body').data('token');
        $.getJSON(jsonp_url, {
            token: token,
            "exp_type": $("#select_exp_type option:selected").text(),
            "search_string": $('#search').val()
        }, processResults);
    });
}

function initFileUpload() {
    $('#Remove_selected_files').live('click', function () {
        $('#fileupload p').remove('');
        $('#submitTab').data('files', {
            filenames: []
        });
    })

    $('#submitTab').data('files', {
        filenames: []
    });

    $('#fileupload').fileupload({
        dataType: 'json',
        url: $('body').data('widget_conf').conf.server_scripts + 'fileUpload/example/upload.php',
        done: function (e, data) {
            $.each(data.result, function (index, file) {
                $('<p/>').text(file.name).appendTo('.fileupload-content');
            });
        },
        always: function (e, data) {

            $.each(data.result, function (index, file) {
                $('#submitTab').data('files').filenames.push(file.name);
            });
        },
        start: function (e) {
            $('#Remove_selected_files').show('slow');
        }
    });

    var link = $("<link>");
    link.attr({
        type: 'text/css',
        rel: 'stylesheet',
        href: $('body').data('baseURL') + 'lib/client/js/fileUpload/jquery.fileupload-ui.css'
    });
    $("head").append(link);

}

function LoadSubmitScripts() {
    $LAB.script($('body').data('baseURL') + "lib/client/js/fileUpload/jquery.iframe-transport.js")
    //    .script("//ajax.aspnetcdn.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js")
    .script($('body').data('baseURL') + "lib/client/js/fileUpload/jquery.fileupload.js").wait(function () {
        initFileUpload();
    })

        .script($('body').data('baseURL') + "lib/client/js/jquery.json-2.3.min.js")
    //    .script($('body').data('baseURL') + "lib/client/fileUpload/example/application.js").wait()


    $LAB.script($('body').data('baseURL') + "lib/client/js/jquery.elastic.source.js").wait(function () {
        $('#notes textarea').elastic();
    })
} //

function makeSubmitTab() {

    //    $('#submitTab').html('<input id="fileupload" type="file" name="files[]" multiple>');
    var jsonp_url = $('body').data('widget_conf').conf.views + 
        "lib/client/fileUpload/fileUploadHTML.php?callback=?";
    $.getJSON(jsonp_url, function (data) {
        $('#submitTab').html(data.html);

        $('#btnGet').click(function () {
            onButtonClick();
        });


        /*
        $( "#droppable" ).droppable({
            drop: function( event, ui ) {
                $( this )
                //                .addClass( "ui-state-highlight" )
                .find( "p" )
                .html( "Dropped!" )
            //                .append($(ui.helper).clone());                
            }
        });
     */

        LoadSubmitScripts();

    });

    LoadSubmitScripts();


}


function bindConturLogin() {
    $("#contur_submit").on('click', function (e) {
        e.preventDefault();
        //remove all the class add the messagebox classes and start fading
        $("#msgbox").removeClass().addClass('messagebox').text('Validating...').fadeIn(1000);
        //check the username exists or not from ajax
        var jsonp_url = $('body').data('widget_conf').conf.server_scripts + "conturLogin.php?callback=?";
        var hash = CryptoJS.MD5($('#password').val());
        hash = hash.toString();
        $.getJSON(jsonp_url, {
            user_name: $('#username').val(),
            password: hash,
            rand: Math.random()
        }, function (data) {
            console.log(data);        
            if (data.status == 'yes') {//if correct login detail             
                $('body').data('token', data.token)
                $("#msgbox").fadeTo(200, 0.1, function () {//start fading the messagebox
                    //add message and change the class of the box and start fading
                    $(this).html('Logging in.....').addClass('messageboxok').fadeTo(900, 1, function () {
                        createTabs('primeDB');
                        makeRetrieveTab();
                        makeSubmitTab();

                        //                            $('#submitTab').width( $('#retreiveTab').width() );  // just so tabs looks equal width                              
                        //                            $('#helpTab').width( $('#retreiveTab').width() );  // just so tabs looks equal width                                                          
                    });
                });
            } else {
                $("#msgbox").fadeTo(200, 0.1, function () //start fading the messagebox
                {
                    //add message and change the class of the box and start fading
                    $(this).html('Incorrect login details...').addClass('messageboxerror').fadeTo(900, 1);
                });
            }
        
        });
        return false; //not to post the form physically    
    });
}


function onButtonClick() {
    $("#submitMsgbox").removeClass().addClass('messagebox').text('Preparing to submit....').fadeIn(1000);
    //    console.log("Record submitted");
    var args = {
        //        "progName":"flowPeaks"
    };

    if (!(typeof ($('body').data('expID')) === 'undefined')) {
        var toolName = $('body').data('toolName');
        args.tool = toolName;
    }

    var expID = $("#submitTo option:selected").val();
    args.expID = expID;
    if (!(typeof ($('body').data('expID')) === 'undefined')) {
        var relExps = new Array($('body').data('expID'));
        args.relatedExpts = relExps;
    }
    args.notes = $("#notes  textarea").val();

    if (typeof ($("#submitTab").data("files")) === 'undefined') {
        if (confirm('There are no files attached! Submit anyway?')) {
            args.files = [];
        } else {
            return false;
        }
    } else {
        args.files = $('#submitTab').data('files').filenames;
    }
    args.dirName = $('body').data('baseURL') + 'lib/client/fileUpload/example/files';
    var token = $('body').data('token');
    args.token = token;

    var argsString = $.toJSON(args);
    //console.log(args);
    //console.log(argsString);
    var jsonp_url = $('body').data('jspURL') + "requestUpload.jsp?callback=?";
    $.getJSON(jsonp_url, {
        args: argsString
    }, function (data) {
        //console.log(data);
        //console.log($.toJSON(data));
        if (data.status == 'ok') //if correct login detail
        {
            $("#submitMsgbox").fadeTo(900, 0.1, function () //start fading the messagebox
            {
                //add message and change the class of the box and start fading
                $(this).html('submitted successfully').addClass('messageboxok').fadeTo(1100, 1, function () //start fading the messagebox
                {
                    //add message and change the class of the box and start fading
                    $(this).fadeTo(900, 0);
                });
            });
        } else {
            $("#submitMsgbox").fadeTo(200, 0.1, function () //start fading the messagebox
            {
                //add message and change the class of the box and start fading
                $(this).html(data.msg).addClass('messageboxerror').fadeTo(900, 1, function () //start fading the messagebox
                {
                    //add message and change the class of the box and start fading
                    $(this).fadeTo(900, 0);
                });
            });
        }
    });


}


/* $('li.item-a').closest('input')
  .css('background-color', 'red');*/
/*
$('li', 'form').first().append('<a id="dmlink">Or load from PRiME DB</a>');

$('#dmlink').click(function(){
console.log('clicked');
$('#dmlink').siblings('input[type=file]').css('background-color', 'red');});

*/


var arrayUnique = function(a) {
    return a.reduce(function(p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    }, []);
};

