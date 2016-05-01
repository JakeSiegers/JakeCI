/*
 * File: app/view/Settings.js
 *
 * This file was generated by Sencha Architect
 * http://www.sencha.com/products/architect/
 *
 * This file requires use of the Ext JS 5.1.x library, under independent license.
 * License of Sencha Architect does not include license for Ext JS 5.1.x. For more
 * details see http://www.sencha.com/license or contact license@sencha.com.
 *
 * This file will be auto-generated each and everytime you save your project.
 *
 * Do NOT hand edit this file.
 */

Ext.define('Senkins.view.Settings', {
    extend: 'Ext.form.Panel',
    alias: 'widget.settings',

    requires: [
        'Senkins.view.SettingsViewModel',
        'Ext.toolbar.Toolbar',
        'Ext.button.Button',
        'Ext.form.field.Text'
    ],

    viewModel: {
        type: 'settings'
    },
    height: 244,
    itemId: 'settingsPanel',
    width: 348,
    bodyPadding: 10,
    title: 'Settings',

    dockedItems: [
        {
            xtype: 'toolbar',
            dock: 'top',
            items: [
                {
                    xtype: 'button',
                    text: '<i class="fa fa-floppy-o"></i> Save'
                }
            ]
        }
    ],
    items: [
        {
            xtype: 'textfield',
            anchor: '100%',
            fieldLabel: 'Default Email'
        }
    ]

});