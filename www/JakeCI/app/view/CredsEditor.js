/*
 * File: app/view/CredsEditor.js
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

Ext.define('JakeCI.view.CredsEditor', {
	extend: 'Ext.form.Panel',
	alias: 'widget.credseditor',

	mixins: [
		DocForm
	],
	requires: [
		'JakeCI.view.CredsEditorViewModel',
		'Ext.toolbar.Toolbar',
		'Ext.grid.Panel',
		'Ext.grid.column.Column',
		'Ext.view.Table',
		'Ext.form.field.Text'
	],

	viewModel: {
		type: 'credseditor'
	},
	height: 384,
	width: 551,
	title: '',
	defaultListenerScope: true,

	layout: {
		type: 'hbox',
		align: 'stretch'
	},
	dockedItems: [
		{
			xtype: 'toolbar',
			flex: 1,
			dock: 'top',
			itemId: 'credToolbar'
		}
	],
	items: [
		{
			xtype: 'gridpanel',
			flex: 1,
			itemId: 'credGrid',
			title: '',
			bind: {
				store: '{CredStore}'
			},
			columns: [
				{
					xtype: 'gridcolumn',
					width: 164,
					dataIndex: 'name',
					text: 'Name'
				}
			],
			listeners: {
				rowdblclick: 'onCredGridRowDblClick'
			}
		},
		{
			xtype: 'container',
			frame: false,
			padding: 10,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'textfield',
					itemId: 'name',
					fieldLabel: 'Name'
				},
				{
					xtype: 'textfield',
					itemId: 'username',
					fieldLabel: 'Username'
				},
				{
					xtype: 'textfield',
					itemId: 'password',
					fieldLabel: 'Password'
				}
			]
		}
	],
	listeners: {
		afterrender: 'onFormAfterRender'
	},

	onCredGridRowDblClick: function(tableview, record, tr, rowIndex, e, eOpts) {
		this.loadCred(record.get('name'));
	},

	onFormAfterRender: function(component, eOpts) {
		console.log('docFormInit');

		this.docFormInit({
			toolbarId:'credToolbar',
			addFn:'addCred',
			saveFn:'editCred',
			deleteFn:'deleteCred'
		});

		AERP.Ajax.request({
			url:'/Creds/getCredEditorInitData',
			success:function(reply){
				this.lookupViewModel().getStore('CredStore').setData(reply.data);

				this.fireEvent('docforminitcomplete',this);
			},
			scope:this
		});

	},

	addCred: function() {
		this.mask('Adding...');
		AERP.Ajax.request({
		    url:'/Creds/addCred',
		    params:this.getValues(),
		    success:function(reply){
		        this.unmask();
		        this.loadCred(reply.newCredName);
		        this.reloadGrid();
		    },
		    failure:function(){
		        this.unmask();
		    },
		    scope:this
		});
	},

	reloadGrid: function() {
		AERP.Ajax.request({
		    url:'/Creds/getCredEditorInitData',
		    params:this.getValues(),
		    success:function(reply){
		        this.lookupViewModel().getStore('CredStore').setData(reply.data);
		    },
		    scope:this
		});
	},

	loadCred: function(name) {
		AERP.Ajax.request({
		    url:'/Creds/getCred',
		    params:{name:name},
		    success:function(reply){
		        this.docFormLoadFormData(reply);
		    },
		    scope:this
		});
	},

	editCred: function() {
		this.mask('Saving...');
		AERP.Ajax.request({
		    url:'/Creds/updateCred',
		    params:this.getValues(),
		    success:function(reply){
		        this.unmask();
		        this.loadCred(reply.updatedCredName);
		        this.reloadGrid();
		    },
		    failure:function(){
		        this.unmask();
		    },
		    scope:this
		});
	}

});