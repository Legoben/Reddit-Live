document.addEventListener('deviceready', init, false);

var ws;
var current = null;

function chars_decode(string, quote_style) {
  //       discuss at: http://phpjs.org/functions/htmlspecialchars_decode/

  var optTemp = 0,
    i = 0,
    noquotes = false;
  if (typeof quote_style === 'undefined') {
    quote_style = 2;
  }
  string = string.toString()
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  var OPTS = {
    'ENT_NOQUOTES': 0,
    'ENT_HTML_QUOTE_SINGLE': 1,
    'ENT_HTML_QUOTE_DOUBLE': 2,
    'ENT_COMPAT': 2,
    'ENT_QUOTES': 3,
    'ENT_IGNORE': 4
  };
  if (quote_style === 0) {
    noquotes = true;
  }
  if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
    quote_style = [].concat(quote_style);
    for (i = 0; i < quote_style.length; i++) {
      // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
      if (OPTS[quote_style[i]] === 0) {
        noquotes = true;
      } else if (OPTS[quote_style[i]]) {
        optTemp = optTemp | OPTS[quote_style[i]];
      }
    }
    quote_style = optTemp;
  }
  if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
    string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
    // string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
  }
  if (!noquotes) {
    string = string.replace(/&quot;/g, '"');
  }
  // Put this in last place to avoid escape being double-decoded
  string = string.replace(/&amp;/g, '&');

  return string;
}

function getThreads(){
    $.ajax({url:"https://www.reddit.com/r/live/.json", success: function(data){
        var j = data.data.children;
        for(var i = 0; i < j.length; i++){
            if (j[i].data.secure_media == null || j[i].data.secure_media.type != "liveupdate"){
                continue;
            }
            
            var lid = j[i].data.secure_media.event_id;
            var title = j[i].data.title;
            
            console.log("LIVE THREAD" + lid + title);
            $("#sel").append("<option value='"+lid+"'>"+title+"</option>")
            
        }
        
        $("#sel option[value=null]").html("SELECT")
    }})
}

function connectToWS(lid){
    $.ajax({url:"https://www.reddit.com/live/"+lid+"/about.json", success: function(j){
        ws = new WebSocket(j.data.websocket_url)
        ws.onmessage = wsUpdate;
        ws.onclose = function(){
            console.log("CLOSED")
            connectToWS(lid);   
        }
        
    }})
}

function wsUpdate(event){
    console.log("GOT EVENT")
    console.log(event.data);
}

function renderUpdate(j){
    var ele = $('<li class="list-group-item" id="up-'+j.data.id+'"></li>');
    console.log("j " + JSON.stringify(j));
    var body = chars_decode(j.data.body_html);
    console.log("BODY "+body);
    $(ele).prepend(body);
    
    if(j.data.embeds.length != 0){
        for(var i = 0; i < j.data.embeds.length; i++){
            
          $(ele).append("<iframe class='embed' width='100%' src='"+j.data.embeds[i].url+"' />")  
            
        }
    }
    
    //ToDo: format time
    $(ele).append("<i class='authtime'>/u/"+j.data.author+" at "+j.data.created+"</i>")
    
    $("#updates").append(ele);
}

function openThread(lid){
    if(current !=  null){
        closeThread()
    }
    
    $.ajax({url:"https://api.reddit.com/live/"+lid+"?limit=40", success: function(data){
        var j = data.data.children;
        for(var i = 0; i < j.length; i++){
            renderUpdate(j[i])   
        }
            
    }})
    
    connectToWS(lid);
       
}

function closeThread(){
       
}

function init(){
    console.log("DEVICE READY");
    getThreads();
    
}

$('#sel').on('change', function() {
    var lid = $(this).val();
    
    var lid = "vzpz90hf0c0c"; //TODO: REMOVE
    
    openThread(lid);
});