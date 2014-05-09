/*
 * jQuery File Upload Plugin JS Example 5.0.2
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://creativecommons.org/licenses/MIT/
 */

/*jslint nomen: true */
/*global $ */
function start(e) {            
    $('#submitTab').data('files', {
        filenames: []
    } );
    
     
//console.log('Uploads started');        
    
}

function drop(e, data) {            
    $('.fileupload-content p')
    .text("Ok, you've got some files. Now you can upload them using the 'Start' button or the 'Start upload' button if you've got many files.")
    .css('color','red');    
        
}

function change(e, data) {            
    $('.fileupload-content p').text("Ok, you've got some files. Now you can upload them using the 'Start' button or the 'Start upload' button if you've got many files.");    
        
}

function always(e, data) {            
    
    //    console.log(data.result[0].name);
    /*
    var tr = $("tr:contains("+data.result[0].name+")"); 
    var textArea = $('<textarea style="padding-left:20px" placeholder="Enter description for uploaded file"/>'); 
    tr.append(textArea);
  */


    $.each(data.result, function (index, file) {
        var tr = $("tr:contains("+data.result[0].name+")");                
        tr.prependTo(tr);
        /*
        var t = $('#notes').val()
        $('#notes').val(t+file.name+"\n")
*/
        //       $('#submitTab').data('files', {filenames: ['test','test']} );
        $('#submitTab').data('files').filenames.push(file.name);

    });

}

$(function () {
    'use strict';

    $('#btnGet').click(function() {
        onButtonClick();
    });

    // Initialize the jQuery File Upload widget:
    $('#fileupload').fileupload({
        dropZone : $('.fileupload-content')
        });

    // Load existing files:
    $.getJSON($('#fileupload form').prop('action'), function (files) {
        var fu = $('#fileupload').data('fileupload');
        fu._adjustMaxNumberOfFiles(-files.length);
        fu._renderDownload(files)
        .appendTo($('#fileupload .files'))
        .fadeIn(function () {
            // Fix for IE7 and lower:
            $(this).show();
        });
    });

    // Open download dialogs via iframes,
    // to prevent aborting current uploads:
    $('#fileupload .files a:not([target^=_blank])').live('click', function (e) {
        e.preventDefault();
        $('<iframe style="display:none;"></iframe>')
        .prop('src', this.href)
        .appendTo('body');
    });
    $('#fileupload')
    .bind('fileuploaddone', always)
    .bind('fileuploadstart', start)    
    .bind('fileuploaddrop', drop)        
//    .bind('fileuploadchange', change)            
    
});


/*
$( "img" ).resizable().droppable({
    drop: function( event, ui ) {
        $( this )
//                .addClass( "ui-state-highlight" )
        .find( "p" )
        .html( "Dropped!" )
//                .append($(ui.helper).clone());                
    }
}).css('border','red solid');
*/
