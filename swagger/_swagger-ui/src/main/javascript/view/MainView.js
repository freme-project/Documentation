'use strict';

SwaggerUi.Views.MainView = Backbone.View.extend({
  events: {
    'click .toggleGeneralInformation'  : 'toggleDescription'
  },

  apisSorter : {
    alpha   : function(a,b){ return a.name.localeCompare(b.name); }
  },
  operationsSorters : {
    alpha   : function(a,b){ return a.path.localeCompare(b.path); },
    method  : function(a,b){ return a.method.localeCompare(b.method); }
  },
  initialize: function(opts){
    var sorterOption, sorterFn, key, value;
    opts = opts || {};

    this.router = opts.router;

    opts.swaggerOptions.whitelist = opts.swaggerOptions.whitelist || {};

    // Sort APIs
    if (opts.swaggerOptions.apisSorter) {
      sorterOption = opts.swaggerOptions.apisSorter;
      if (_.isFunction(sorterOption)) {
        sorterFn = sorterOption;
      } else {
        sorterFn = this.apisSorter[sorterOption];
      }
      if (_.isFunction(sorterFn)) {
        this.model.apisArray.sort(sorterFn);
      }
    }
    // Sort operations of each API
    if (opts.swaggerOptions.operationsSorter) {
      sorterOption = opts.swaggerOptions.operationsSorter;
      if (_.isFunction(sorterOption)) {
        sorterFn = sorterOption;
      } else {
        sorterFn = this.operationsSorters[sorterOption];
      }
      if (_.isFunction(sorterFn)) {
        for (key in this.model.apisArray) {
          this.model.apisArray[key].operationsArray.sort(sorterFn);
        }
      }
    }

    // set up the UI for input
    this.model.auths = [];

    for (key in this.model.securityDefinitions) {
      value = this.model.securityDefinitions[key];

      this.model.auths.push({
        name: key,
        type: value.type,
        value: value
      });
    }

    if ('validatorUrl' in opts.swaggerOptions) {
      // Validator URL specified explicitly
      this.model.validatorUrl = opts.swaggerOptions.validatorUrl;
    } else if (this.model.url.indexOf('localhost') > 0 || this.model.url.indexOf('127.0.0.1') > 0) {
      // Localhost override
      this.model.validatorUrl = null;
    } else {
      // Default validator
      if(window.location.protocol === 'https:') {
        this.model.validatorUrl = 'https://online.swagger.io/validator';
      }
      else {
        this.model.validatorUrl = 'http://online.swagger.io/validator';
      }
    }

    // JSonEditor requires type='object' to be present on defined types, we add it if it's missing
    // is there any valid case were it should not be added ?
    var def;
    for(def in this.model.definitions){
      if (!this.model.definitions[def].type){
        this.model.definitions[def].type = 'object';
      }
    }

  },

  render: function () {
    if (this.model.securityDefinitions) {
      for (var name in this.model.securityDefinitions) {
        var auth = this.model.securityDefinitions[name];
        var button;

        if (auth.type === 'apiKey' && $('#apikey_button').length === 0) {
          button = new SwaggerUi.Views.ApiKeyButton({model: auth, router:  this.router}).render().el;
          $('.auth_main_container').append(button);
        }

        if (auth.type === 'basicAuth' && $('#basic_auth_button').length === 0) {
          button = new SwaggerUi.Views.BasicAuthButton({model: auth, router: this.router}).render().el;
          $('.auth_main_container').append(button);
        }
      }
    }

    $(this.el).html(Handlebars.templates.main(this.model));
    this.info = this.$('.info')[0];

    if (this.info) {
      this.info.addEventListener('click', this.onLinkClick, true);
    }

    this.model.securityDefinitions = this.model.securityDefinitions || {};

    // add model resources to unused tags (as resources)
    var prospectiveResources = this.model.swaggerObject.tags.filter(hasntTheseNames, this.model.apisArray).concat(this.model.apisArray);
    var resources = {};
    var counter = 0;
    // Render each (not empty) resource
    for (var i = 0; i < prospectiveResources.length; i++) {
      var resource = prospectiveResources[i];
      var id = resource.name;
      while (typeof resources[id] !== 'undefined') {
        id = id + '_' + counter;
        counter += 1;
      }
      resource.id = id;
      resources[id] = resource;
      this.addResource(resource, this.model.auths);
    }

    $('.propWrap').hover(function onHover(){
      $('.optionsWrapper', $(this)).show();
    }, function offhover(){
      $('.optionsWrapper', $(this)).hide();
    });
    return this;
  },

  addResource: function(resource, auths){
    // Render a resource and add it to resources li
    resource.id = resource.id.replace(/\s/g, '_');

    // Make all definitions available at the root of the resource so that they can
    // be loaded by the JSonEditor
    resource.definitions = this.model.definitions;

    var resourceView = new SwaggerUi.Views.ResourceView({
      model: resource,
      router: this.router,
      tagName: 'li',
      id: 'resource_' + resource.id,
      className: 'resource',
      auths: auths,
      swaggerOptions: this.options.swaggerOptions
    });

    // add resource only, if whitelisting is not used or the list of endpoints is not empty
    var rendered = resourceView.render();
    var len = 0;
    if(rendered.model.operationsArray){
      len = rendered.model.operationsArray.filter(function(value) { return value !== undefined; }).length;
    }
    if(!this.options.swaggerOptions.whitelist.paths || len > 0) {
      $('#resources', this.el).append(rendered.el);
    }
  },

  clear: function(){
    $(this.el).html('');
  },

  onLinkClick: function (e) {
    var el = e.target;

    if (el.tagName === 'A' && el.href && !el.target) {
      e.preventDefault();
      window.open(el.href, '_blank');
    }
  },

  toggleDescription: function() {
    var ele = document.getElementById('toggle_content');
    var text = document.getElementById('toggle_header');
    if(ele.style.display === 'block') {
      ele.style.display = 'none';
      text.innerHTML = 'show';
      //text.slideDown();
      //ele.removeClass('active');
    }
    else {
      ele.style.display = 'block';
      text.innerHTML = 'hide';
      //text.slideUp();
      //ele.addClass('active');
    }
  }
});

function hasntTheseNames(o){
  for (var i = 0; i < this.length; i++) {
    if(this[i].name === o.name){
      return false;
    }
  }
  return true;
}