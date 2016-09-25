/*
 * File: app/view/JobForm.js
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

Ext.define('JakeCI.view.JobForm', {
	extend: 'Ext.form.Panel',
	alias: 'widget.jobform',

	mixins: [
		'DocForm'
	],
	requires: [
		'JakeCI.view.JobFormViewModel',
		'Ext.toolbar.Toolbar',
		'Ext.form.FieldSet',
		'Ext.form.field.TextArea',
		'Ext.form.field.ComboBox',
		'Ext.button.Button'
	],

	viewModel: {
		type: 'jobform'
	},
	itemId: 'jobPanel',
	width: 629,
	bodyPadding: 10,
	title: 'Job Details',
	trackResetOnLoad: true,
	defaultListenerScope: true,

	dockedItems: [
		{
			xtype: 'toolbar',
			dock: 'top',
			itemId: 'jobFormToolbar'
		}
	],
	items: [
		{
			xtype: 'fieldset',
			title: 'Description',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'textfield',
					itemId: 'name',
					fieldLabel: 'Name',
					labelAlign: 'right'
				},
				{
					xtype: 'textareafield',
					itemId: 'description',
					fieldLabel: 'Description',
					labelAlign: 'right'
				}
			]
		},
		{
			xtype: 'fieldset',
			title: 'Source Control',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'combobox',
					flex: 1,
					itemId: 'repoType',
					maxWidth: 200,
					fieldLabel: 'Repo Type',
					labelAlign: 'right',
					editable: false,
					displayField: 'repoType',
					forceSelection: true,
					queryMode: 'local',
					valueField: 'repoValue',
					bind: {
						store: '{RepoTypeStore}'
					}
				},
				{
					xtype: 'textfield',
					flex: 1,
					itemId: 'repoUrl',
					fieldLabel: 'Repo Url',
					labelAlign: 'right'
				},
				{
					xtype: 'container',
					flex: 1,
					margin: '0 0 5 0',
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [
						{
							xtype: 'combobox',
							flex: 1,
							itemId: 'repoCredentials',
							fieldLabel: 'Credentials',
							labelAlign: 'right',
							editable: false,
							displayField: 'cred',
							forceSelection: true,
							queryMode: 'local',
							valueField: 'cred',
							bind: {
								store: '{CredStore}'
							}
						},
						{
							xtype: 'button',
							margin: '0 0 0 5',
							text: 'Edit Creds',
							listeners: {
								click: 'onButtonClick'
							}
						}
					]
				}
			]
		},
		{
			xtype: 'fieldset',
			title: 'Actions',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'textareafield',
					itemId: 'exec',
					fieldLabel: 'Exec',
					labelAlign: 'right'
				}
			]
		},
		{
			xtype: 'fieldset',
			title: 'Cron',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'textfield',
					itemId: 'cron',
					fieldLabel: 'Cron Schedule',
					labelAlign: 'right'
				}
			]
		},
		{
			xtype: 'fieldset',
			title: 'Email',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'textfield',
					itemId: 'email',
					fieldLabel: 'Email',
					labelAlign: 'right'
				}
			]
		}
	],
	listeners: {
		afterrender: 'onJobPanelAfterRender'
	},

	onButtonClick: function(button, e, eOpts) {
		this.fireEvent('showcredwindow');
	},

	onJobPanelAfterRender: function(component, eOpts) {
		//this.loadCreds();

		this.docFormInit({
		    docFormToolbar:{
		        id:'jobFormToolbar',
		        addFn:'addNewJob',
		        saveFn:'saveJob'
		    }
		});

		AERP.Ajax.request({
		    url:'/Creds/getAllCreds',
		    success:function(reply){
		        this.lookupViewModel().getStore('CredStore').setData(reply.data);

		        this.fireEvent('docforminitcomplete',this);
		    },
		    scope:this
		});

	},

	loadJob: function(jobName) {
		this.mask('Loading Job...');
		AERP.Ajax.request({
		    url:'/Job/getJob',
		    params:{jobName:jobName},
		    success:function(reply){
		        this.unmask();
		        this.docFormLoadFormData(reply);
		        this.currentJob = reply.data.name;
		    },
		    failure:function(){
		        this.unmask();
		    },
		    scope:this
		});
	},

	addNewJob: function() {
		this.mask("Adding New Job...");

		AERP.Ajax.request({
		    url:'/Job/newJob',
		    params:this.getValues(false,false,true,true), //[asString], [dirtyOnly], [includeEmptyText], [useDataValues]
		    success:function(reply){
		        this.unmask();
		        this.loadJob(reply.data.jobName);
		        this.fireEvent('addjob');
		    },
		    failure:function(){
		        this.unmask();
		    },
		    scope:this
		});
	},

	saveJob: function() {
		this.mask('Saving...');
		AERP.Ajax.request({
		    url:'/Job/saveJob',
		    params:{
		        jobName:this.currentJob,
		        jobData:Ext.encode(this.getValues(false,false,true,true)) //[asString], [dirtyOnly], [includeEmptyText], [useDataValues
		    },
		    success:function(reply){
		        this.unmask();
		        this.docFormLoadFormData(reply);
		        this.currentJob = reply.data.name;
		        this.fireEvent('savejob');
		    },
		    failure:function(){
		        this.unmask();
		    },
		    scope:this
		});
	},

	runLoadedJob: function() {
		this.mask('Starting Job...');
		AERP.Ajax.request({
		    url:'/Job/runJob',
		    params:{
		        jobName:this.currentJob,
		    },
		    success:function(reply){
		        this.unmask();
		    },
		    failure:function(){
		        this.unmask();
		    },
		    scope:this
		});
	}

});