/*
 * File: app/view/JakeCI.js
 *
 * This file was generated by Sencha Architect
 * http://www.sencha.com/products/architect/
 *
 * This file requires use of the Ext JS 6.2.x Classic library, under independent license.
 * License of Sencha Architect does not include license for Ext JS 6.2.x Classic. For more
 * details see http://www.sencha.com/license or contact license@sencha.com.
 *
 * This file will be auto-generated each and everytime you save your project.
 *
 * Do NOT hand edit this file.
 */

Ext.define('JakeCI.view.JakeCI', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.jakeci',

	requires: [
		'JakeCI.view.JakeCIViewModel',
		'JakeCI.view.JobGrid',
		'JakeCI.view.JobForm',
		'JakeCI.view.JobHistory',
		'JakeCI.view.BuildQueue',
		'Ext.grid.Panel',
		'Ext.form.Panel'
	],

	viewModel: {
		type: 'jakeci'
	},
	title: '',
	defaultListenerScope: true,

	layout: {
		type: 'vbox',
		align: 'stretch'
	},
	items: [
		{
			xtype: 'container',
			flex: 1,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'jobgrid',
					flex: 1,
					listeners: {
						viewsettings: 'onJobGridViewsettings',
						addnewjob: 'onJobGridAddnewjob'
					}
				},
				{
					xtype: 'jobform',
					disabled: false,
					flex: 1,
					listeners: {
						showcredwindow: 'onJobPanelShowcredwindow'
					}
				},
				{
					xtype: 'jobhistory',
					disabled: false,
					flex: 1
				}
			]
		},
		{
			xtype: 'buildqueue',
			liveDrag: false,
			animCollapse: 0.5,
			collapsible: true,
			simpleDrag: true
		}
	],
	listeners: {
		afterrender: 'onViewportRender'
	},

	onJobGridViewsettings: function(gridpanel) {
		this.showSettingsWindow();
	},

	onJobGridAddnewjob: function(gridpanel) {
		this.newJob();
	},

	onJobPanelShowcredwindow: function(form) {
		this.viewCreds();
	},

	onViewportRender: function(component, eOpts) {
		this.queryById('jobGrid').getAllJobs();


		var sThis = this;
		this.resetIdleTimer();
		this.updateJobQueue();
		setInterval(function(){
		    if(!sThis.idle){
		        //sThis.updateJobQueue();
		    }
		},5000);
	},

	showCredWindow: function(firstFunction) {
		if(!firstFunction){
			firstFunction = function(){};
		}

		if(!this.credWindow){
		    var form = Ext.create('widget.credseditor',{
		        listeners:{
		            scope:this,
		        }
		    });

		    this.credWindow = Ext.create('Ext.window.Window', {
		        resizable: true,
		        layout: 'fit',
		        closeAction: 'hide',
		        title: 'Saved Credentials',
		        liveDrag:true,
		        items: form,
				listeners:{
					beforeclose: form.docFormWindowBeforeClose
				}
		    });
		    this.credWindow.docForm = form;
		}
		this.credWindow.show();
		this.credWindow.focus();
		firstFunction(this.credWindow.docForm);
	},

	showSettingsWindow: function() {
		if(!this.settingsWindow){
		    var panel = Ext.create('widget.settings',{
		        listeners:{
		            scope:this,
		            showcredwindow:this.viewCreds
		        }
		    });


		    this.settingsWindow = Ext.create('Ext.window.Window', {
		        resizable: true,
		        layout: 'fit',
		        closeAction: 'hide',
		        title: 'Settings',
		        liveDrag:true,
		        items: panel
		    });
		    this.settingsWindow.settingsPanel = panel;
		}
		this.settingsWindow.show();
	},

	resetIdleTimer: function() {
		var sThis = this;
		this.idle = false;
		clearTimeout(this.idleTimeout);
		this.idleTimeout = setTimeout(function(){
		    sThis.idle = true;
		},30000); //If you don't do anything for 30 seconds, stop updating the screen.
	},

	updateJobQueue: function() {
		AERP.Ajax.request({
		    url:'/Job/getJobQueue',
		    success:function(reply){
		        this.lookupViewModel().getStore('QueueStore').loadData(reply.data);
		    },
		    scope:this
		})
	},

	newJob: function() {
		var jobPanel = this.queryById('jobPanel');

		jobPanel.enable();
		jobPanel.docFormSetState('new');
	},

	viewCreds: function() {
		this.showCredWindow(function(form){
			form.docFormSetState('empty');
		});
	}

});