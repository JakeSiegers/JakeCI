/*
 * File: app/view/JobGrid.js
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

Ext.define('JakeCI.view.JobGrid', {
	extend: 'Ext.grid.Panel',
	alias: 'widget.jobgrid',

	requires: [
		'JakeCI.view.JobGridViewModel',
		'Ext.grid.column.Column',
		'Ext.view.Table',
		'Ext.toolbar.Toolbar',
		'Ext.button.Button',
		'Ext.form.field.Text'
	],

	viewModel: {
		type: 'jobgrid'
	},
	height: 214,
	itemId: 'jobGrid',
	width: 400,
	title: 'Jake CI',
	defaultListenerScope: true,

	bind: {
		store: '{JobStore}'
	},
	columns: [
		{
			xtype: 'gridcolumn',
			renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
				switch(value){
					case null:
					return '<i class="fa fa-minus" aria-hidden="true" style="color:gray;"></i>';
					case true:
					return '<i class="fa fa-thumbs-up" aria-hidden="true" style="color:green;"></i>';
					case false:
					return '<i class="fa fa-thumbs-down" aria-hidden="true" style="color:red;"></i>';

				}
			},
			width: 40,
			sortable: false,
			dataIndex: 'buildPassing',
			menuDisabled: true,
			text: ''
		},
		{
			xtype: 'gridcolumn',
			width: 193,
			dataIndex: 'name',
			text: 'Job Name'
		},
		{
			xtype: 'gridcolumn',
			renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
				if(value === null){
					return '[Never Run]';
				}
				return Ext.util.Format.number(value/1000.0,'0.###')+" sec";
			},
			width: 249,
			dataIndex: 'lastBuildLength',
			text: 'Last Build Time'
		}
	],
	listeners: {
		rowdblclick: 'onJobGridRowDblClick'
	},
	dockedItems: [
		{
			xtype: 'toolbar',
			dock: 'top',
			items: [
				{
					xtype: 'button',
					glyph: 'f067',
					text: 'Add New Job',
					listeners: {
						click: 'onButtonClick1'
					}
				},
				{
					xtype: 'textfield',
					flex: 1,
					fieldLabel: '',
					emptyText: 'Search'
				},
				{
					xtype: 'button',
					glyph: 'f1de',
					text: 'Jake CI Settings',
					listeners: {
						click: 'onButtonClick3'
					}
				}
			]
		}
	],

	onJobGridRowDblClick: function(tableview, record, tr, rowIndex, e, eOpts) {
		this.fireEvent('viewjob',record.get('name'));
	},

	onButtonClick1: function(button, e, eOpts) {
		this.fireEvent('addnewjob');
	},

	onButtonClick3: function(button, e, eOpts) {
		this.fireEvent('viewsettings');
	},

	getAllJobs: function() {
		this.mask("Loading Jobs...");

		AERP.Ajax.request({
		    url:'/Job/getAllJobs',
		    success:function(result){
		        this.unmask();
		        this.lookupViewModel().getStore('JobStore').loadData(result.data);
		    },
		    failure:function(){
		        this.unmask();
		    },
		    scope:this
		});
	}

});