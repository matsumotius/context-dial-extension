var onYouTubePlayerAPIReady = function(){ console.log('ready'); };
$(function(){
  var cdx = {};
      cdx.port = chrome.extension.connect();
      cdx.context = { scroll : 0, link : 0, sound : 0, time : 0, video : 0 };
      cdx.types = ['change', 'enter'];
      cdx.is_video = false;
  /**
   * message
   */
  cdx.sync = function(){ cdx.port.postMessage({ type : 'sync', context : cdx.context }); };
  cdx.join = function(){ cdx.port.postMessage({ type : 'join', url : location.href   }); };
  cdx.join();
  cdx.port.onMessage.addListener(function(data, port){
    if(data.type in cdx.mapping) cdx.mapping[data.type](data);
    cdx.sync();
  });
  cdx.mapping = {
    change : function(data){
      if(data.key in cdx.context) cdx.context[data.key] = data.value;
      cdx.page.change[data.key](data.value);
    },
    enter : function(data){
      cdx.page.enter[data.key](data.value);
    }
  };
  /**
   * content
   */
  cdx.page = {
    link_css : {
      'background-color' : 'yellow' 
    },
    current : { scroll : 0, link : null },
    change : {
      scroll : function(value){
	$('body').scrollTop(value * 20);
      },
      link : function(value){
        var css = {};
        var current = cdx.page.current.link;
        var links = $('a');
	var link  = links[value % links.length];
        for(var key in cdx.page.link_css){
          if(current) $(current.target).css(key, current.css[key]);
          css[key] = $(link).css(key);
	  $(link).css(key, cdx.page.link_css[key]);
        }
        cdx.page.current.link = { target : link, css : css };
        var offset = $(link).offset();
        var window_height = $(window).height();
        var scroll_top    = $('body').scrollTop();
        if(offset.top - 100 <= scroll_top ||
           offset.top + 100 >= scroll_top + window_height){
          var scroll_value = Math.max(0, offset.top - window_height/2);
          $('body').scrollTop(scroll_value);
          cdx.page.current.scroll = scroll_value;
          cdx.context.scroll = scroll_value;
        }
      }
    },
    enter : {
      root : function(){
        var link = cdx.page.current.link;
        if(null == link) return;
        location.href = $(link.target).attr('href');
      }
    }
  };
});
