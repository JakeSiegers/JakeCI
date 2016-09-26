/*
 * File: app/view/JobHistory.js
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

Ext.define('JakeCI.view.JobHistory', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.jobhistory',

	requires: [
		'JakeCI.view.JobHistoryViewModel',
		'Ext.grid.Panel',
		'Ext.toolbar.Paging',
		'Ext.grid.column.Date',
		'Ext.view.Table',
		'Ext.selection.RowModel',
		'Ext.form.Panel',
		'Ext.form.field.TextArea'
	],

	viewModel: {
		type: 'jobhistory'
	},
	height: 614,
	width: 953,
	title: 'Build History',
	defaultListenerScope: true,

	layout: {
		type: 'vbox',
		align: 'stretch'
	},
	items: [
		{
			xtype: 'gridpanel',
			flex: 1,
			border: false,
			disabled: true,
			itemId: 'historyGrid',
			title: '',
			bind: {
				store: '{HistoryStore}'
			},
			dockedItems: [
				{
					xtype: 'pagingtoolbar',
					dock: 'top',
					width: 360,
					displayInfo: true,
					bind: {
						store: '{HistoryStore}'
					}
				}
			],
			columns: [
				{
					xtype: 'gridcolumn',
					renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
						if(value === true){
							return '<i class="fa fa-thumbs-up" aria-hidden="true" style="color:green;"></i>';
						}
						return '<i class="fa fa-thumbs-down" aria-hidden="true" style="color:red;"></i>';
					},
					width: 30,
					dataIndex: 'passed',
					menuDisabled: true,
					text: ''
				},
				{
					xtype: 'gridcolumn',
					width: 67,
					dataIndex: 'buildNumber',
					text: 'Build #'
				},
				{
					xtype: 'datecolumn',
					width: 170,
					dataIndex: 'started',
					text: 'Started',
					format: 'M j, Y, g:i a'
				},
				{
					xtype: 'datecolumn',
					width: 170,
					dataIndex: 'finished',
					text: 'Finished',
					format: 'M j, Y, g:i a'
				}
			],
			selModel: {
				selType: 'rowmodel',
				listeners: {
					select: 'onRowModelSelect'
				}
			}
		},
		{
			xtype: 'form',
			flex: 1,
			border: false,
			disabled: true,
			height: 1122,
			width: 819,
			layout: 'fit',
			bodyPadding: 10,
			title: 'Build #',
			items: [
				{
					xtype: 'textareafield',
					itemId: 'logTextArea',
					fieldLabel: '',
					readOnly: true
				}
			]
		}
	],

	onRowModelSelect: function(rowmodel, record, index, eOpts) {

		this.queryById('logTextArea').setValue(record.get('log'));
	},

	getHistory: function(job) {
		var historyStore = this.lookupViewModel().getStore('HistoryStore');
		var historyGrid = this.queryById('historyGrid');
		historyStore.getProxy().setExtraParams({
		    job:job
		});
		historyStore.load({callback:function(records,operation,success){
			historyGrid.enable();
		}});
	}

});