document.addEventListener('deviceready', init, false);

var ws;
var current = null;
var closed = false;

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
    closed = false;
    
    $.ajax({url:"https://www.reddit.com/live/"+lid+"/about.json", success: function(j){
        $("#infobox").removeClass("panel-primary panel-success panel-danger").addClass("panel-warning")
        $("#status").text("Connecting")
        $("#viewers").text(j.data.viewer_count);
        
        if(j.data.websocket_url == null){
            $("#infobox").removeClass("panel-primary panel-warning panel-success").addClass("panel-danger")
            $("#status").text("Thread Completed")
            return;   
        }
        
        var url = chars_decode(j.data.websocket_url)
        
        console.log("ATTEMPTING TO CONNECT: " + url)
        ws = new WebSocket(url)
        ws.onmessage = function(e){
            wsUpdate(e);   
        };
        ws.onclose = function(){
            console.log("CLOSED")
            if(!closed){
                connectToWS(lid); 
                
            }
        }
        
        ws.onopen = function(){
            console.log("WS OPEN!!!");
            $("#infobox").removeClass("panel-primary panel-warning panel-danger").addClass("panel-success")
            $("#status").text("Connected")
        }
        
        
    }})
}

var test;

function wsUpdate(event){
    console.log("GOT EVENT")
    console.log(event.data);
    var e = JSON.parse(event.data)
    
    
    //{"type": "embeds_ready", "payload": {"media_embeds": [{"url": "https://twitter.com/UpkeRP/status/670705578910593024", "width": 485, "height": null}], "liveupdate_id": "LiveUpdate_d8cfbb60-965e-11e5-b371-0e44750760a5"}}
    
    
    if(e.type == "update"){
        renderUpdate(e.payload, true)
        
        var i = randint(1,10000) //ToDo: Put on element so that it can be highlighted 
        
        notif = {
            id: i,
            title: "Live Thread Update",
            text: e.payload.data.body,
            led: "FF0000"
        }
        
        cordova.plugins.notification.local.schedule(notif);
        
        
    } else if (e.type == "delete"){
        var t = e.payload.replace("LiveUpdate_", "")
        console.log("#up-"+t)
        $("#up-"+t).fadeOut();
    } else if (e.type == "strike"){
        var t = e.payload.replace("LiveUpdate_", "")
        console.log("#up-"+t)
        $("#up-"+t).addClass("strike");
    }
}

function renderUpdate(j, live){
    
    var s_ins = ""
    if(j.data.stricken){
      s_ins = "strike" 
    }
    
    var ele = $('<li class="list-group-item '+s_ins+'" id="up-'+j.data.id+'"><div class="embed_hold"></div></li>');
    console.log("j " + JSON.stringify(j));
    var body = chars_decode(j.data.body_html);
    console.log("BODY "+body);
    $(ele).prepend(body);
    
    /*if(j.data.embeds.length != 0){
        for(var i = 0; i < j.data.embeds.length; i++){
              $(".embed_hold",ele).append("<iframe class='embed' width='100%' src='"+j.data.embeds[i].url+"' />")  
            
        }
    }*/
    
    //ToDo: format time    
    var d = new Date(j.data.created_utc * 1000)
    console.log(d);
    var ago = jQuery.timeago(d);
    
    $(ele).append("<i class='authtime'>/u/"+j.data.author+" <abbr class='timeago' title='"+d+"'>"+ago+"</abbr></i>")
    
    $("a", ele).click(function(e){
        e.preventDefault()
        ref = cordova.InAppBrowser.open($(this).attr("href"), '_blank', 'location=yes'); 
    });
    
    if(live){
        $("#updates").prepend(ele);
    } else {
        $("#updates").append(ele);
    }
    
    
}

function populateThread(lid){
    $.ajax({url:"https://api.reddit.com/live/"+lid+"?limit=40", success: function(data){
        var j = data.data.children;
        for(var i = 0; i < j.length; i++){
            renderUpdate(j[i], false)   
        }
            
    }})   
}


function openThread(lid){
    if(current != null){
        closeThread()
    }
    
    setTimeout(function(){
        console.log("TIME")
        
        current = lid
        closed = false;
        $("#sel option[value=null]").html("CLOSE THREAD")

        populateThread(lid);
        connectToWS(lid);
        
    }, 100);
    
    
}

function closeThread(){
    console.log("MANUAL CLOSE")
    
    $("#sel option[value=null]").html("SELECT")
    closed = true;
    $("#updates").html("");
    $("#infobox").removeClass("panel-primary panel-warning panel-success").addClass("panel-danger")
    $("#status").text("Closed")
    //ws.close();
    ws = null;
    
    return
}

function init(){
    console.log("DEVICE READY");
    getThreads();
    
}

$("#infobox").click(function(){
    $("#infobox .panel-body").slideToggle();  
})

$('#sel').on('change', function() {
    var lid = $(this).val();
    
    if(lid == "null"){
        closeThread();  
    } else if (lid == "custom"){ 
        var inp = prompt("Input thread URL or ID")
        if(inp.indexOf("reddit.com/live/") != -1){
            console.log("URL");
            var lid = inp.substring(inp.indexOf("reddit.com/live/") + "reddit.com/live/".length)
            if(lid.indexOf("/") != -1){
                lid = lid.substring(0, lid.indexOf("/") )
            }
            
        
        } else { 
            console.log("ID")   
            
        }
        
        $.ajax({url:"https://reddit.com/live/"+lid+"/about.json", complete:function(e){
            if(e.status != 404){
                openThread(lid);
            } else {
                alert("Thread not found!")   
            }
            
        }})
        
    } else {
        //var lid = "w0399h7wkc7l"; //TODO: REMOVE
        openThread(lid);
    }
    
    
});