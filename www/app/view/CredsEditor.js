/*
 * File: app/view/CredsEditor.js
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

Ext.define('JakeCI.view.CredsEditor', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.credseditor',

    requires: [
        'JakeCI.view.CredsEditorViewModel',
        'Ext.grid.column.Column',
        'Ext.form.field.Text',
        'Ext.view.Table',
        'Ext.toolbar.Toolbar',
        'Ext.button.Button',
        'Ext.toolbar.Spacer',
        'Ext.grid.plugin.RowEditing'
    ],

    viewModel: {
        type: 'credseditor'
    },
    height: 329,
    width: 657,
    title: '',
    defaultListenerScope: true,

    bind: {
        store: '{CredStore}'
    },
    columns: [
        {
            xtype: 'gridcolumn',
            width: 160,
            dataIndex: 'cred',
            text: 'Cred Name',
            editor: {
                xtype: 'textfield'
            }
        },
        {
            xtype: 'gridcolumn',
            width: 183,
            dataIndex: 'username',
            text: 'Username',
            editor: {
                xtype: 'textfield'
            }
        },
        {
            xtype: 'gridcolumn',
            renderer: function(value, metaData, record, rowIndex, colIndex, store, view) {
                return Array(value.length+1).join("*");
            },
            dataIndex: 'password',
            width: 212,
            text: 'Password',
            editor: {
                xtype: 'textfield'
            }
        }
    ],
    viewConfig: {
        width: 590
    },
    dockedItems: [
        {
            xtype: 'toolbar',
            dock: 'top',
            items: [
                {
                    xtype: 'button',
                    text: 'Add New',
                    listeners: {
                        click: 'onButtonClick'
                    }
                },
                {
                    xtype: 'tbspacer',
                    flex: 1
                },
                {
                    xtype: 'button',
                    text: 'Delete Selected',
                    listeners: {
                        click: 'onButtonClick1'
                    }
                }
            ]
        }
    ],
    plugins: [
        {
            ptype: 'rowediting',
            pluginId: 'credRowEditing',
            autoCancel: false,
            listeners: {
                canceledit: 'onRowEditingCanceledit',
                beforeedit: 'onRowEditingBeforeEdit',
                edit: 'onRowEditingEdit'
            }
        }
    ],
    listeners: {
        render: 'onGridpanelRender'
    },

    onButtonClick: function(button, e, eOpts) {
        if(this.getPlugin('credRowEditing').editing){
            return false;
        }
        this.lookupViewModel().getStore('CredStore').insert(0,{credName:'',userame:'',password:''});
        this.getPlugin('credRowEditing').startEdit(0);
        this.currentState = 'new';
    },

    onButtonClick1: function(button, e, eOpts) {
        console.log('Program Delete Cred');
    },

    onRowEditingCanceledit: function(editor, context, eOpts) {
        var record = context.record;
        var rowIdx = context.rowIdx;

        if(this.currentState === "new"){
            this.lookupViewModel().getStore('CredStore').removeAt(rowIdx);
        }
    },

    onRowEditingBeforeEdit: function(editor, context, eOpts) {
        //Don't try and edit anything else if we're already editing something!
        if(this.getPlugin('credRowEditing').editing){
            return false;
        }
        this.currentState = 'edit';
    },

    onRowEditingEdit: function(editor, context, eOpts) {
        if(this.currentState == 'new'){
            console.log(context);
            if(context.newValues == context.originalValues){
                return;
            }
            this.addCred(context.newValues);
        }else{
            this.editCred();
        }
    },

    onGridpanelRender: function(component, eOpts) {
        this.loadCreds();
    },

    addCred: function(data) {
        this.mask('Adding...');
        AERP.Ajax.request({
            url:'AddCred',
            params:data,
            success:function(reply){
                this.unmask();
                this.getStore().commitChanges();
            },
            failure:function(){
                this.unmask();
                this.getPlugin('credRowEditing').startEdit(0);
                this.currentState = 'new';
            },
            scope:this
        });
    },

    editCred: function() {

    },

    loadCreds: function() {
        AERP.Ajax.request({
            url:'GetAllCreds',
            success:function(reply){
                this.lookupViewModel().getStore('CredStore').setData(reply.data);
            },
            failure:function(){

            },
            scope:this
        });
    }

});