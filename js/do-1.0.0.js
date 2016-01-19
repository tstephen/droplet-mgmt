var EASING_DURATION = 500;
fadeOutMessages = true;
var newLineRegEx = /\n/g;

var ractive = new Ractive({
  el: 'container',
  lazy: true,
  template: '#template',
  data: {
    doKey: undefined,
    droplets: [],
    title: 'Droplet Management',
    username: localStorage['username'],
    formatDate: function(timeString) {
      if (timeString==undefined) return 'n/a';
      return new Date(timeString).toLocaleDateString(navigator.languages);
    },
    hash: function(email) {
      if (email == undefined) return '';
      //console.log('hash '+email+' = '+ractive.hash(email));
      return '<img class="img-rounded" src="http://www.gravatar.com/avatar/'+ractive.hash(email)+'?s=36"/>'
    },
    matchFilter: function(obj) {
      var filter = ractive.get('filter');
      if (filter==undefined) {
        return true;
      } else {
        try {
          if (filter.operator=='in') {
            var values = filter.value.toLowerCase().split(',');
            return values.indexOf(obj[filter.field].toLowerCase())!=-1;
          } else if (filter.operator=='!in') {
            var values = filter.value.toLowerCase().split(',');
            return values.indexOf(obj[filter.field].toLowerCase())==-1;
          } else {
            if (filter.operator==undefined) filter.operator='==';
            return eval("'"+filter.value.toLowerCase()+"'"+filter.operator+"'"+obj[filter.field].toLowerCase()+"'");
          }
        } catch (e) {
          console.debug('Exception during filter, probably means record does not have a value for the filtered field');
          return true;
        }
      }
    },
    matchSearch: function(obj) {
      var searchTerm = ractive.get('searchTerm');
      //console.info('matchSearch: '+searchTerm);
      if (searchTerm==undefined || searchTerm.length==0) {
        return true;
      } else {
        return (obj.firstName.toLowerCase().indexOf(searchTerm.toLowerCase()))>=0
          || (obj.lastName.toLowerCase().indexOf(searchTerm.toLowerCase()))>=0
          || (obj.email.toLowerCase().indexOf(searchTerm.toLowerCase()))>=0
          || (obj.accountName.toLowerCase().indexOf(searchTerm.toLowerCase()))>=0;
      }
    },
    searchMatched:0,
    stdPartials: [
      { "name": "profileArea", "url": "/partials/profile-area.html"},
      { "name": "titleArea", "url": "/partials/title-area.html"},
      { "name": "dropletListSect", "url": "/partials/droplet-list-sect.html"}
    ],
  },
  ajaxSetup: function() {
    console.log('ajaxSetup: '+this);
    $.ajaxSetup({
      error: this.handleError
    });
  },
  fetch: function () {
    console.info('fetch...');
    ractive.set('saveObserver', false);
    if (ractive.get('doKey')==undefined || ractive.get('doKey')=='') return;
    ractive.showMessage('Loading...');
    $.ajax({
      dataType: "json",
      url: 'https://api.digitalocean.com/v2/droplets',
      crossDomain: true,
      beforeSend : function(xhr) {
        xhr.setRequestHeader("Authorization", "Bearer "+ractive.get('doKey'));
      },
      success: function( data ) {
        ractive.merge('droplets', data.droplets);
        $.each(ractive.get('droplets'), function(i,d) {
          d.active = (d.status=='active');
        });
        ractive.set('searchMatched',$('#dropletsTable tbody tr:visible').length);
        ractive.showMessage('Successfully updated droplet status');
      },
      error: ractive.handleError
    });
  },
  handleError: function(jqXHR, textStatus, errorThrown) {
    switch (jqXHR.status) {
    case 400:
      var msg = jqXHR.responseJSON == null ? textStatus+': '+errorThrown : errorThrown+': '+jqXHR.responseJSON.message;
      ractive.showError(msg);
      break;
    case 401:
    case 403:
    case 405: /* Could also be a bug but in production we'll assume a timeout */
      ractive.showError("Session expired, please login again");
      window.location.href='/login';
      break;
    case 404:
      var path ='';
      if (jqXHR.responseJSON != undefined) {
        path = " '"+jqXHR.responseJSON.path+"'";
      }
      var msg = "That's odd, we can't find the page"+path+". Please let us know about this message";
      console.error('msg:'+msg);
      ractive.showError(msg);
      break;
    default:
      var msg = "Bother! Something has gone wrong (code "+jqXHR.status+"): "+textStatus+':'+errorThrown;
      console.error('msg:'+msg);
      $( "#ajax-loader" ).hide();
      ractive.showError(msg);
    }
  },
  getServer: function() {
    return ractive.get('server')==undefined ? '' : ractive.get('server');
  },
  hash: function(email) {
    if (email==undefined) return email;
    return hex_md5(email.trim().toLowerCase());
  },
  hasRole: function(role) {
    var ractive = this;
    if (this && this.get('profile')) {
      var hasRole = ractive.get('profile').groups.filter(function(g) {return g.id==role})
      return hasRole!=undefined && hasRole.length>0;
    }
    return false;
  },
  hideMessage: function() {
    $('#messages').hide();
  },
  loadStandardPartials: function(stdPartials) {
    console.info('loadStandardPartials');
    $.each(stdPartials, function(i,d) {
      console.log('loading...: '+d.name)
      $.get(d.url, function(response){
        console.log('... loaded: '+d.name)
        //console.log('response: '+response)
        if (ractive != undefined) {
          try {
            ractive.resetPartial(d.name,response);
          } catch (e) {
            console.warn('Unable to reset partial '+d.name+': '+e);
          }
        }
      });
    });
  },
  logout: function() {
    console.info('logout');
    localStorage.removeItem('doKey');
    ractive.set('doKey',undefined);
    ractive.set('searchMatched',0);
    ractive.get('droplets').splice(0,ractive.get('droplets').length);
    ractive.showMessage('Your Digital Ocean key has now been forgotten');
  },
  oninit: function() {
    console.log('oninit');
    this.set('doKey',localStorage['doKey']),
    this.ajaxSetup();
    this.loadStandardPartials(this.get('stdPartials'));
  },
  showError: function(msg) {
    this.showMessage(msg, 'bg-danger text-danger');
  },
  showFormError: function(formId, msg) {
    this.showError(msg);
    var selector = formId==undefined || formId=='' ? ':invalid' : '#'+formId+' :invalid';
    $(selector).addClass('field-error');
    $(selector)[0].focus();
  },
  showMessage: function(msg, additionalClass) {
    console.log('showMessage: '+msg);
    if (additionalClass == undefined) additionalClass = 'bg-info text-info';
    if (msg === undefined) msg = 'Working...';
    $('#messages').empty().append(msg).removeClass().addClass(additionalClass).show();
//    document.getElementById('messages').scrollIntoView();
    if (fadeOutMessages && additionalClass!='bg-danger text-danger') setTimeout(function() {
      $('#messages').fadeOut();
    }, EASING_DURATION*10);
    else $('#messages').append('<span class="text-danger pull-right glyphicon glyphicon-remove" onclick="ractive.hideMessage()"></span>');
  },
  shutdown: function(obj) {
    console.info('shutdown');
    $.ajax({
      type: 'POST',
      dataType: "json",
      url: 'https://api.digitalocean.com/v2/droplets/'+obj.id+'/actions',
      crossDomain: true,
      data: {"type":"shutdown"},
      beforeSend : function(xhr) {
        xhr.setRequestHeader("Authorization", "Bearer "+ractive.get('doKey'));
      },
      success: function( data ) {
        console.debug('success: '+JSON.stringify(data));
        ractive.showMessage('Shutdown request initiated, status is: '+data.action.status);
      },
      error: ractive.handleError
    });
  },
  snapshot: function(obj) {
    console.info('snapshot');
    $.ajax({
      type: 'POST',
      dataType: "json",
      url: 'https://api.digitalocean.com/v2/droplets/'+obj.id+'/actions',
      crossDomain: true,
      data: {"type":"snapshot","name":obj.name+"-"+new Date().toISOString()},
      beforeSend : function(xhr) {
        xhr.setRequestHeader("Authorization", "Bearer "+ractive.get('doKey'));
      },
      success: function( data ) {
        console.debug('success: '+JSON.stringify(data));
        ractive.showMessage('Snapshot request initiated, status is: '+data.action.status);
      },
      error: ractive.handleError
    });
  },
  start: function(obj) {
    console.info('start');
    $.ajax({
      type: 'POST',
      dataType: "json",
      url: 'https://api.digitalocean.com/v2/droplets/'+obj.id+'/actions',
      crossDomain: true,
      data: {"type":"power_on"},
      beforeSend : function(xhr) {
        xhr.setRequestHeader("Authorization", "Bearer "+ractive.get('doKey'));
      },
      success: function( data ) {
        console.debug('success: '+JSON.stringify(data));
        ractive.showMessage('Start request initiated, status is: '+data.action.status);
      },
      error: ractive.handleError
    });
  }
});

ractive.observe( 'doKey', function ( newValue, oldValue, keypath ) {
  console.info('doKey');
  if (oldValue!=undefined && newValue!=undefined && newValue != '') {
    localStorage['doKey'] = newValue;
    ractive.showMessage('Saved your digital ocean key');
    ractive.fetch();
  }
});

$(document).ready(function() {
  console.info('ready');
  ractive.fetch();
})
