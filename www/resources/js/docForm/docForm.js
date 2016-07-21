Ext.define('DocForm',{
	docFormDebug:function(msg){
		//console.log('docFormId '+this.docFormId+', '+this.getItemId()+': '+msg);
	},
	docFormInitilizeToolbar:function(toolbarConfig){

		if(!toolbarConfig.hasOwnProperty('id')){
			return;
		}

		var toolbar = this.queryById(toolbarConfig.id);

		var btnFunctions = {
			'newFn':this.docFormNew, //Move into new state
			'addFn':Ext.emptyFn, //Call add function
			'saveFn':Ext.emptyFn,
			'cancelFn':this.docFormCancel,
			'deleteFn':Ext.emptyFn
		};

		var fnNames = Object.keys(btnFunctions);
		for(var i in fnNames){
			if(toolbarConfig.hasOwnProperty(fnNames[i])){
				btnFunctions[fnNames[i]] = this[toolbarConfig[fnNames[i]]];
			}
		}

		this.docFormBtns.newBtn = Ext.create({
			xtype: 'button',
			//itemId: 'newBtn',
			icon: '/inc/img/silk_icons/add.png',
			text: 'New',
			listeners: {
				click: btnFunctions.newFn,
				scope:this
			}
		});

		this.docFormBtns.saveBtn = Ext.create({
			xtype: 'button',
			//itemId: 'saveBtn',
			icon: '/inc/img/silk_icons/disk.png',
			text: 'Save',
			listeners: {
				click: function(){
					if(this.docFormCurrentState == 'edit'){
						btnFunctions.saveFn.call(this);
					}

					if(this.docFormCurrentState == 'new'){
						btnFunctions.addFn.call(this);
					}
				},
				scope:this
			}
		});

		this.docFormBtns.cancelBtn = Ext.create({
			xtype: 'button',
			//itemId: 'cancelBtn',
			icon: '/inc/img/silk_icons/cross.png',
			text: 'Cancel',
			listeners: {
				click: btnFunctions.cancelFn,
				scope:this
			}
		});

		this.docFormBtns.deleteBtn = Ext.create({
			xtype: 'button',
			//itemId: 'deleteBtn',
			icon: '/inc/img/silk_icons/delete.png',
			text: 'Delete',
			listeners: {
				click: function(){
					Ext.Msg.show({
						title:'Delete?',
						message: 'Are you sure you want to delete?',
						buttons: Ext.Msg.YESNO,
						icon: Ext.Msg.WARNING,
						fn: function(btn) {
							if (btn === 'yes') {
								btnFunctions.deleteFn.call(this);
							}
						},
						scope:this
					});
				},
				scope:this
			}
		});

		this.docFormBtns.statusLabel = Ext.create({
			xtype: 'tbtext',
			cls: 'docFormStatusLabel',
			html: '[Status]',
			//itemId: 'docFormStatus',
			width: 100
		});

		this.docFormBtns.containerStructure = Ext.create({
			xtype: 'container',
			defaults: {
				layout: 'fit',
				width: 80,
				margin: '0 8 0 8'
			},
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [
				{
					xtype: 'container',
					items: [
						this.docFormBtns.newBtn,
						this.docFormBtns.saveBtn
					]
				},
				{
					xtype: 'container',
					items: this.docFormBtns.cancelBtn
				}
			]
		});

		if(btnFunctions.deleteFn != Ext.emptyFn){
			this.docFormBtns.containerStructure.add(
				{
					xtype: 'container',
					items: this.docFormBtns.deleteBtn
				}
			);
		}

		if(!toolbarConfig.hideAllBtns){
			toolbar.insert(0,this.docFormBtns.containerStructure);
		}
		toolbar.add([{xtype: 'tbfill'},this.docFormBtns.statusLabel]);
	},
	docFormConfirmContinue:function(confirmFunction){
		this.docFormDebug('docFormConfirmContinue');

		var localScope = this;
		setTimeout(function(){
			var unsavedPrompt = Ext.Msg.show({
				title:'Warning!',
				message: 'You have unsaved changes<br /></br>You will LOSE these if you continue.',
				buttons: Ext.Msg.YESNO,
				buttonText:{
					yes:'Continue',
					no:'Cancel'
				},
				icon: Ext.Msg.WARNING,
				fn: function(btn) {
					if (btn === 'yes') {
						confirmFunction.call(this);
					}
				},
				scope:localScope
			});

			//Set the "cancel" button to be focued, to prevent accidental continues.
			unsavedPrompt.defaultButton = 2;
			unsavedPrompt.focus();
		},1);

	},
	docFormUnsavedChangesConfirmContinue:function(confirmFunction){
		this.docFormDebug('docFormUnsavedChangesConfirmContinue');

		if(!this.docFormHasChangesAnywhere() ){
			confirmFunction.call(this);
			return;
		}

		this.docFormConfirmContinue(confirmFunction);
	},
	docFormLoadFormData:function(params){
		//Used for viewing a document
		this.docFormSetState('loadingForm');
		if(!params){
			params = {};
		}
		if(!params.hasOwnProperty('data')){
			params.data = {};
		}
		if(!params.hasOwnProperty('comboData')){
			params.comboData = {};
		}

		this.docFormSetValues(params.data, params.comboData );
		this.docFormSetState('view');
	},
	docFormGetCurrentDocument:function(){
		return this.docFormCurrentDocument;
	},
	//Used to add a new entry (Perhaps with some starting data)
	docFormNew:function(params){
		this.docFormUnsavedChangesConfirmContinue(function(){
			this.docFormNewConfirmed(params);
		});
	},
	docFormNewConfirmed:function(params){
		this.docFormReset();
		this.docFormSetState('loadingForm');
		if(!params){
			params = {};
		}

		if(!params.data){
			params.data = {};
		}
		this.docFormSetValues(params.data, this.docFormComboData);

		this.docFormSetState('new');
		if(params.hasOwnProperty('disableFields')){
			for(var i=0,il=params.disableFields.length;i<il;i++){
				var field =  this.queryById(params.disableFields[i]);
				field.setReadOnly(true);
				field.addCls('docFormReadOnly');
			}
		}
	},
	docFormSearch:function(){
		var searchValues = {};
		this.docFormEachField(function(field){
			if(field.hasOwnProperty('docFormSearchable')){
				searchValues[field.getName()] = field.getSubmitValue();
			}
		});
		this.fireEvent('docformsearch',searchValues);
	},
	docFormSetSearchableFields:function(fieldIds){
		for(var i in fieldIds){
			if(this.docFormFields.hasOwnProperty(fieldIds[i])){
				this.docFormFields[fieldIds[i]].docFormSearchable = true;
			}
		}
	},
	docFormSetFieldsMaxLength:function(fields){
		for(var id in fields){
			if(this.docFormFields.hasOwnProperty(id)){
				this.docFormFields[id].inputEl.dom.maxLength = fields[id];
			}
		}
	},
	docFormHighlightChangedField:function(field){
		if(this.docFormCheckFieldChanged(field) ){
			field.addCls('docFormChanged');
		}else{
			field.removeCls('docFormChanged');
		}
	},
	docFormChange:function(target){
		if(this.docFormId != target.docFormId){
			return;
		}
		//if(!this.hasOwnProperty('docFormRawData') || !this.docFormRawData.hasOwnProperty(target.name)){
		//	return;
		//}

		if(this.docFormCurrentState === 'new'){
			this.docFormHighlightChangedField(target);
		}

		if(this.docFormCurrentState !== 'view' && this.docFormCurrentState !== 'edit') {
			return;
		}
		//var originalValue = this.docFormRawData[target.name];


		this.docFormHighlightChangedField(target);
		if(this.docFormCheckFieldChanged(target) ) {
			this.docFormSetState('edit');
			return; //no need to check if the form is clean, we clearly aren't.
		}
		var formHasChanges = this.docFormCheckAllFieldsForChanges();
		if(formHasChanges){
			this.docFormSetState('edit');
		}else{
			this.docFormSetState('view');
		}
	},
	docFormCheckFieldChanged:function(field){
		originalValue = this.docFormNullsToBlanks(field.originalValue)+'';
		var checkValue = this.docFormNullsToBlanks(field.getValue())+'';

		return (originalValue !== checkValue);
	},
	docFormCheckAllFieldsForChanges:function(){
		var formHasChanges = false;
		this.docFormEachField(function(field){
			if(this.docFormCheckFieldChanged( field)){
				formHasChanges = true;
				return;
			}
		});
		return formHasChanges;
	},
	docFormHasChangesAnywhere:function(){
		this.docFormDebug('docFormHasChangesAnywhere');
		//checks immediate fields and all sub children

		var hasChangesAnywhere = false;

		this.docFormEachField(function(field){
			if(this.docFormCheckFieldChanged( field)){
				hasChangesAnywhere = true;
				return;
			}
		});

		var docFormSubLen = this.docFormSubs.length;

		while(docFormSubLen--){

			var subDirty = this.docFormSubs[docFormSubLen].docFormCheckAllFieldsForChanges();
			if(subDirty){
				this.docFormDebug('dirty child');
				this.docFormSubs[docFormSubLen].docFormDebug('im dirty');
			}
			hasChangesAnywhere = hasChangesAnywhere || subDirty;
		}

		return hasChangesAnywhere;
	},
	docFormNullsToBlanks:function(value){
		if(value === null){
			return '';
		}
		return value;
	},
	docFormResetFieldsToLoadedData:function(){
		this.docFormSetValues(this.docFormCurrentDocument, this.docFormComboData );
	},
	docFormSetValues:function(values, comboData){
		this.docFormReset();

		this.docFormCurrentDocument = values;
		this.docFormComboData = comboData;

		this.docFormEachField(function(field){
			if(field.getXType() === 'combobox' && comboData && comboData.hasOwnProperty(field.name) ){
				field.getStore().loadData(comboData[field.name]);
			}
		});

		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			if(values.hasOwnProperty(itemId)){
				field.setValue(values[itemId]);
				field.resetOriginalValue();
			}
		});
	},
	docFormFieldRemoveReadOnly:function(field){
		field.setReadOnly(false);
		field.removeCls('docFormReadOnly');
	},
	docFormSetStateIfNoChanges:function(state){
		this.docFormUnsavedChangesConfirmContinue(function(){
	        this.docFormSetState(state);
		});
	},
	docFormSetState:function(newState){
		if(!this.docFormInitComplete){
			this.docFormDebug('docFormSetState docFormInitComplete = false!');
			return;
		}
		this.docFormDebug('docFormSetState = '+newState);

		if(this.docFormCurrentState == newState){
			//We are already in that state!
			return;
		}

		if(!this.docFormCurrentState){
			//if no current state, make it null; (First state, basically)
			this.docFormCurrentState = null;
		}
		this.docFormPreviousState = this.docFormCurrentState;
		this.docFormCurrentState = newState;

		this.docFormHideIfExists(this.docFormBtns.newBtn);
		this.docFormHideIfExists(this.docFormBtns.saveBtn);
		this.docFormHideIfExists(this.docFormBtns.deleteBtn);
		this.docFormHideIfExists(this.docFormBtns.cancelBtn);

		switch(this.docFormCurrentState){
			case 'empty':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,' ');
				this.docFormShowIfExists(this.docFormBtns.newBtn);
				this.docFormEmptyFields();
				this.docFormEachField(function(field){
					field.resetOriginalValue();
					field.addCls('docFormReadOnly');
					field.removeCls('docFormSearchable');
					field.removeCls('docFormChanged');
					field.setReadOnly(true);
				});
				break;
			case 'readOnly':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'<img src="/inc/img/silk_icons/lock.png" /> Read Only');
				this.docFormEachField(function(field){
					field.removeCls('docFormReadOnly');
					field.removeCls('docFormSearchable');
					field.removeCls('docFormChanged');
					field.setReadOnly(true);
				});
				break;
			case 'loadingForm':
				//An extra state so we can ignore all the change events while we're changing the entire form;
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Loading...');
				break;
			case 'view':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Viewing');
				this.docFormShowIfExists(this.docFormBtns.newBtn);
				this.docFormShowIfExists(this.docFormBtns.deleteBtn);
				this.docFormEachField(function(field){
					field.removeCls('docFormReadOnly');
					field.removeCls('docFormSearchable');
					field.removeCls('docFormChanged');
					field.setReadOnly(false);
				});
				break;
			case 'edit':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Editing');
				this.docFormShowIfExists(this.docFormBtns.saveBtn);
				this.docFormShowIfExists(this.docFormBtns.cancelBtn);
				this.docFormShowIfExists(this.docFormBtns.deleteBtn);
				this.docFormEachField(function(field){
					if(field.hasOwnProperty('docFormFocus') && field.docFormFocus){
						field.focus();
					}
					field.removeCls('docFormReadOnly');
					field.removeCls('docFormSearchable');
					field.setReadOnly(false);
				});
				break;
			case 'new':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'New Entry');
				this.docFormShowIfExists(this.docFormBtns.saveBtn);
				this.docFormShowIfExists(this.docFormBtns.cancelBtn);
				this.docFormEachField(function(field){
					field.removeCls('docFormReadOnly');
					field.removeCls('docFormSearchable');
					field.removeCls('docFormChanged');
					field.setReadOnly(false);
				});
				break;
			case 'search':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Search Mode');
				this.docFormEachField(function(field){
					field.removeCls('docFormReadOnly');
					field.removeCls('docFormChanged');
					field.setValue('');
					if(field.hasOwnProperty('docFormSearchFocus') && field.docFormSearchFocus){
						field.focus();
					}
					if(field.hasOwnProperty('docFormSearchable')){
						field.addCls('docFormSearchable');
						field.setReadOnly(false);
					}else{
						field.removeCls('docFormSearchable');
						field.setReadOnly(true);
					}
				});
				break;
		}

		//Fire state changed event, sending old and new state;
		this.fireEvent('docformstatechanged',this.docFormPreviousState,this.docFormCurrentState);
	},
	docFormHideIfExists:function(item){
		if(item !== null){
			item.hide();
		}
	},
	docFormShowIfExists:function(item){
		if(item !== null){
			item.show();
		}
	},
	docFormSetHtmlIfExists:function(item,value){
		if(item !== null){
			item.setHtml(value);
		}
	},
	docFormCancel:function(){

		switch(this.docFormCurrentState){
			case 'edit':
				this.docFormResetFieldsToLoadedData();
				this.docFormSetState('view');
				break;
			case 'new':
				this.docFormSetState('empty');
				break;
		}
	},
	docFormReset:function(){
		this.docFormDebug('docFormReset');

		this.docFormSetState('empty');

		if(this.docFormSubs){
			var docFormSubLen = this.docFormSubs.length;
			while(docFormSubLen--){
				this.docFormSubs[docFormSubLen].docFormDebug('SUB docFormReset');
				this.docFormSubs[docFormSubLen].docFormReset();
			}
		}
	},
	docFormEmptyFields:function(){
		this.docFormDebug('docFormEmptyFields');
		this.docFormCurrentDocument = {};

		this.docFormEachField(function(field){
			field.setValue('');
			field.removeCls('docFormChanged');
		});
	},
	docFormEachField:function(loopFn){
		for(var fieldName in this.docFormFields){
			var field = this.docFormFields[fieldName];
			//Skip all checkbox groups!
			if(field.getXType() == 'checkboxgroup'){
				continue;
			}
			loopFn.call(this,field);
		}
	},
	docFormInit:function(params){
		this.docFormId = Ext.id();
		this.docFormDebug("docFormInit");
		//this.getForm().trackResetOnLoad = true; //Auto-cleans fields when loaded with setValues()
		this.docFormFields = {};
		var doubleFields = [];
		this.docFormSupportedXTypes = ["textfield","textarea","combobox","combo","checkbox","displayfield","numberfield","datefield"];

		this.docFormSubsChangesConfirmed = false;
		this.docFormSubs = [];
		var children = this.docFormGetChildren(this);

		//for(var i in children){
		//	console.log(children[i].getItemId());
		//}
		//console.log("-----");

		this.on({
			change: this.docFormChange,
    		scope: this
		});

		this.docFormBtns = {
			'newBtn': this.queryById('newBtn'),
			'saveBtn': this.queryById('saveBtn'),
			'deleteBtn': this.queryById('deleteBtn'),
			'cancelBtn': this.queryById('cancelBtn'),
			'searchBtn': this.queryById('searchBtn')
		};

		if(params && params.hasOwnProperty('docFormToolbar')){
			this.docFormInitilizeToolbar(params.docFormToolbar);
		}

		for(var fieldNo in children){
			var field = children[fieldNo];

			var xType = field.getXType();
			var itemId = field.getItemId();

			field.name = itemId;
			field.enableKeyEvents = true;
			field.enableBubble(['change']);
			field.docFormId = this.docFormId;

			if(this.docFormFields.hasOwnProperty(itemId) ){
				doubleFields.push(itemId);
			}
			this.docFormFields[itemId] = field;
		}

		var doubleFieldString = "";
		for(var i=0;i<doubleFields.length;i++){
			doubleFieldString += doubleFields[i]+"\n";
		}
		if(doubleFieldString.length>0){
			console.error("Douplicate Fields Detected: \n"+doubleFieldString);
		}

		this.docFormInitComplete = true;
		this.docFormSetState('empty');
	},
	docFormGetChildren:function(parent){
		var results = [];
		parent.items.each(function(child){
			var xType = child.getXType();
			var itemId = child.getItemId();
			console.log(itemId+" - "+xType);
			if(this.docFormSupportedXTypes.indexOf(xType) != -1){
				results.push(child);
			}

			//Look for children (if it isn't a doc form!)
			if(child.docFormGetChildren){ //It's a doc form!
				this.docFormSubs.push(child);
				child.docFormParent = this;
				return true;
			}
			if(child.hasOwnProperty("items") && child.items.length !== 0){
				var childrenChildren = this.docFormGetChildren(child);
				if(childrenChildren.length > 0){
					for(var i=0; i<childrenChildren.length; i++){
						results.push(childrenChildren[i]);
					}
				}
			}
		},this);
		return results;
	},
	docFormWindowBeforeClose:function(docFormWindow){
		//Stop the window close event for now.
		//The unsaved changes function will close the window.

		if(docFormWindow.docFormSafeToClose === true){
			//close the window!

			//reset safe to close value
			docFormWindow.docFormSafeToClose = false;
			return true;
		}

		if(docFormWindow.docForm.docFormHasChangesAnywhere() ){
			//confirm before changing because changes found

			docFormWindow.docForm.docFormConfirmContinue(function(){
				docFormWindow.docFormSafeToClose = true;
				docFormWindow.close();
				docFormWindow.docForm.docFormReset();
			});
			return false;
		}else{
			//close the window!

			//reset safe to close value
			docFormWindow.docFormSafeToClose = false;
			return true;
		}
	}
});