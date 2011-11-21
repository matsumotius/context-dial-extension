$(function(){
  var cdx = {};
      cdx.tabs = {};
      cdx.user = 'masuilab';
      cdx.host = 'http://myatsumoto.com:3000/';
      cdx.url_exp = new RegExp('^http:\/\/myatsumoto.com\:3000\/[_a-zA-Z0-9&=\?-]+\/display');
      cdx.current = { id : -1 };
      cdx.current.reload = function(){
        chrome.tabs.getSelected(null, function(_tab){ cdx.current.id = _tab.id; });
      };
      cdx.context = { link : 0, scroll : 0, sound : 0, time : 0, video : 0 };
      cdx.is_video = false;
  chrome.self.onConnect.addListener(function(port, name){
    port.onMessage.addListener(function(data, req){
      cdx.mapping[data.type](port, name, data, req);
    });
  });
  cdx.mapping = {
    sync : function(port, name, data, req){
      cdx.context = data.context;
    },
    join : function(port, name, data, req){
      chrome.tabs.getAllInWindow(null, function(tabs){
        $.each(tabs, function(index, _tab){
          if(_tab.selected){
            cdx.current.id = _tab.id;
            var type = _tab.url.match(cdx.url_exp) ? 'video' : 'extension';
            cdx.replace(type);
          }
          if(_tab.url != data.url) return;
          if(_tab.id in cdx.tabs && cdx.tabs[_tab.id].has_port) return;
          cdx.tabs[_tab.id] = { url : data.url, port : req, has_port : true };
        });
      });
    }
  };
  cdx.post = function(message){
    if(cdx.current.id < 0 || false == cdx.current.id in cdx.tabs) return;
    var current = cdx.tabs[cdx.current.id];
    current.port.postMessage(message);
  };
  cdx.replace = function(context){
    if(cdx.is_video == (context == 'video')) return;
    cdx.is_video = cdx.is_video ? false : true;
    socket.emit('replace', { to : 'controller', key : 'context', value : context });
  };
  /**
   * tab event handler
   */
  chrome.tabs.onCreated.addListener(function(tab){
    if(tab.selected){
      var type = tab.url.match(cdx.url_exp) ? 'video' : 'extension';
      cdx.replace(type);
    } 
    cdx.tabs[tab.id] = { url : tab.url, has_port : false };
    cdx.current.reload();
  });
  chrome.tabs.onSelectionChanged.addListener(function(tab_id){
    cdx.current.id = tab_id;
    chrome.tabs.get(tab_id, function(tab){
      var type = tab.url.match(cdx.url_exp) ? 'video' : 'extension';
      cdx.replace(type);
    });
  });
  chrome.tabs.onUpdated.addListener(function(tab_id, info, tab){
    if(info.status == 'complete') return;
    if(tab.selected){
      var type = tab.url.match(cdx.url_exp) ? 'video' : 'extension';
      cdx.replace(type);
    } 
    cdx.tabs[tab.id] = { url : tab.url, has_port : false };
    cdx.current.reload();
  });
  chrome.tabs.onRemoved.addListener(function(tab_id){
    if(tab_id in cdx.tabs) delete cdx.tabs[tab_id];
    cdx.current.reload();
  });
  /**
   * socket
   */
  var socket = io.connect(cdx.host);
  socket.emit('join', { type : 'extension', id : cdx.user });
  socket.on('join', function(message){
    chrome.tabs.getSelected(null, function(tab){
      var type = tab.url.match(cdx.url_exp) ? 'video' : 'extension';
      cdx.replace(type);
    });
  });
  socket.on('change', function(message){
    if(cdx.is_video) return;
    cdx.post({ type : 'change', key : message.key, value : message.value });
  });
  socket.on('enter', function(message){
    if(cdx.is_video) return;
    cdx.post({ type : 'enter',  key : message.key, value : message.value });
  });
});

