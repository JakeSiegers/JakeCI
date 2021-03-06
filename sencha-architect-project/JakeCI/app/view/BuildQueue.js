/*
 * File: app/view/BuildQueue.js
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

Ext.define('JakeCI.view.BuildQueue', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.buildqueue',

	requires: [
		'JakeCI.view.BuildQueueViewModel',
		'Ext.ProgressBar'
	],

	viewModel: {
		type: 'buildqueue'
	},
	height: 94,
	width: 400,
	title: 'Build Queue',
	defaultListenerScope: true,

	items: [
		{
			xtype: 'progressbar',
			itemId: 'progress',
			value: 0.4
		}
	],
	listeners: {
		afterrender: 'onPanelAfterRender'
	},

	onPanelAfterRender: function(component, eOpts) {
		var p = this.queryById('progress');
		setInterval(function(){
			var v = Math.random();
			var t = Math.floor(v*100)+1+'%';
			p.updateProgress(v,t,true);
		},1000);
	}

});