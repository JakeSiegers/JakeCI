Ext.define('DocForm',{
	docFormDebug:function(msg){
		if(this.docFormDebugMode){
			console.log('docFormId '+this.docFormId+', '+this.getItemId()+': '+msg);
		}
	},
	docFormInitilizeToolbar:function(config){

		if(!config.hasOwnProperty('toolbarId')){
			return;
		}

		var toolbar = this.queryById(config.toolbarId);
		toolbar.setHeight(26);

		this.btnFunctions = {
			'newFn':this.docFormNew, //Move into new state
			'addFn':Ext.emptyFn, //Call add function
			'saveFn':Ext.emptyFn,
			'cancelFn':this.docFormCancel,
			'deleteFn':Ext.emptyFn,
			'searchFn':Ext.emptyFn,
			'browseFn':Ext.emptyFn,
		};

		var fnNames = Object.keys(this.btnFunctions);
		for(var i in fnNames){
			if(config.hasOwnProperty(fnNames[i])){
				this.btnFunctions[fnNames[i]] = this[config[fnNames[i]]];
			}
		}

		this.docFormBtns.newBtn = Ext.create({
			xtype: 'button',
			glyph:'f067',
			text: 'New',
			listeners: {
				click: this.btnFunctions.newFn,
				scope:this
			}
		});

		this.docFormBtns.saveBtn = Ext.create({
			xtype: 'button',
			glyph:'f0c7',
			text: 'Save',
			listeners: {
				click: function(){
					if(this.docFormCurrentState == 'edit'){
						this.btnFunctions.saveFn.call(this);
					}

					if(this.docFormCurrentState == 'new'){
						this.btnFunctions.addFn.call(this);
					}
				},
				scope:this
			}
		});

		this.docFormBtns.cancelBtn = Ext.create({
			xtype: 'button',
			glyph:'f05e',
			text: 'Cancel',
			listeners: {
				click: this.btnFunctions.cancelFn,
				scope:this
			}
		});

		this.docFormBtns.deleteBtn = Ext.create({
			xtype: 'button',
			glyph:'f1f8',
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
								this.btnFunctions.deleteFn.call(this);
							}
						},
						scope:this
					});
				},
				scope:this
			}
		});

		this.docFormBtns.searchBtn = Ext.create({
			xtype: 'button',
			glyph:'f002',
			text: 'Search',
			listeners: {
				click: function(){
					if(this.btnFunctions.searchFn === Ext.emptyFn){
						return true;
					}
					if(this.docFormCurrentState == 'search'){
						this.docFormPerformSearch();
					}else{
						this.docFormSetStateIfNoChanges('search');
					}
				},
				scope:this
			}
		});

		this.docFormBtns.browseBtn = Ext.create({
			xtype: 'button',
			glyph:'f03a',
			text: 'Browse',
			listeners: {
				click: this.btnFunctions.browseFn,
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
			}
		});

		var newSaveArray = [];
		var hideNewBtn = config.hideNewButton || false;

		if(!hideNewBtn && (this.btnFunctions.newFn != this.docFormNew || this.btnFunctions.addFn != Ext.emptyFn)){
			newSaveArray.push(this.docFormBtns.newBtn);
		}

		if(this.btnFunctions.saveFn != Ext.emptyFn || this.btnFunctions.addFn != Ext.emptyFn){
			newSaveArray.push(this.docFormBtns.saveBtn);
		}

		if(newSaveArray.length > 0){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: newSaveArray
			});
		}

		if(this.btnFunctions.searchFn != Ext.emptyFn){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: this.docFormBtns.searchBtn
			});
		}

		if(this.btnFunctions.browseFn != Ext.emptyFn){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: this.docFormBtns.browseBtn
			});
		}

		//Always add the cancel button
		this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: this.docFormBtns.cancelBtn
		});

		if(this.btnFunctions.deleteFn != Ext.emptyFn){
			this.docFormBtns.containerStructure.add({
				xtype: 'container',
				items: this.docFormBtns.deleteBtn
			});
		}

		toolbar.insert(0,this.docFormBtns.containerStructure);
		toolbar.add([{xtype: 'tbfill'},this.docFormBtns.statusLabel]);
	},
	docFormGetAllFieldValues:function(){
		var allFormData = {};
		this.docFormEachField(function(field){
			//console.log(field.getItemId());
			//console.log(field.getSubmitValue());
			allFormData[field.getItemId()] = field.getSubmitValue();
		});
		return allFormData;
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
	docFormPerformSearch:function(){
		var searchValues = {},
			value;
		this.docFormEachField(function(field){
			if(field.docFormSearchable){
				value = field.getSubmitValue();
				if(value !== "" ){
					searchValues[field.getName()] = value;
				}
			}
		});
		this.btnFunctions.searchFn.call(this,searchValues);
	},
	docFormSetSearchableFields:function(fieldIds){
		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			field.docFormSearchable = (fieldIds.indexOf(itemId) != -1);
		});
	},
	docFormSetFieldsMaxLength:function(fields){
		for(var id in fields){
			if(this.docFormFields.hasOwnProperty(id) ){
				//type ahead combos get weird, don't set max len for combos
				if(this.docFormFields[id].getXType() == 'combo' || this.docFormFields[id].getXType() == 'combobox'){
					continue;
				}
				this.docFormFields[id].maxLength = fields[id];
				this.docFormFields[id].enforceMaxLength = true;
				if(this.docFormFields[id].inputEl){
					this.docFormFields[id].inputEl.dom.maxLength = fields[id];
				}
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
		var originalValue = this.docFormNullsToBlanks(field.originalValue)+'';
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
		this.docFormHideIfExists(this.docFormBtns.searchBtn);
		this.docFormHideIfExists(this.docFormBtns.browseBtn);

		switch(this.docFormCurrentState){
			case 'empty':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,' ');
				this.docFormShowIfExists(this.docFormBtns.newBtn);
				this.docFormShowIfExists(this.docFormBtns.searchBtn);
				this.docFormEmptyFields();
				this.docFormEachField(function(field){
					field.addCls('docFormReadOnly');
					field.removeCls(['docFormSearchable','docFormChanged']);
					field.setReadOnly(true);
				});
				break;
			case 'readOnly':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'<img src="/inc/img/silk_icons/lock.png" /> Read Only');
				this.docFormShowIfExists(this.docFormBtns.searchBtn);
				this.docFormShowIfExists(this.docFormBtns.browseBtn);
				this.docFormEachField(function(field){
					field.removeCls(['docFormReadOnly','docFormSearchable','docFormChanged']);
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
					field.removeCls(['docFormReadOnly','docFormSearchable','docFormChanged']);
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
					field.removeCls(['docFormReadOnly','docFormSearchable']);
					field.setReadOnly(false);
				});
				break;
			case 'new':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'New Entry');
				this.docFormShowIfExists(this.docFormBtns.saveBtn);
				this.docFormShowIfExists(this.docFormBtns.cancelBtn);
				this.docFormEachField(function(field){
					field.removeCls(['docFormReadOnly','docFormSearchable','docFormChanged']);
					field.setReadOnly(false);
				});
				break;
			case 'search':
				this.docFormSetHtmlIfExists(this.docFormBtns.statusLabel,'Search Mode');
				this.docFormShowIfExists(this.docFormBtns.searchBtn);
				this.docFormShowIfExists(this.docFormBtns.browseBtn);
				this.docFormShowIfExists(this.docFormBtns.cancelBtn);
				this.docFormEmptyFields();
				this.docFormEachField(function(field){
					field.removeCls(['docFormReadOnly','docFormChanged']);
					if(field.docFormSearchFocus){
						field.focus();
					}
					if(field.docFormSearchable){
						field.addCls('docFormSearchable');
						field.setReadOnly(false);
					}else{
						field.removeCls('docFormSearchable');
						field.addCls('docFormReadOnly');
						field.setReadOnly(true);
					}
				});
				break;
		}

		//Fire state changed event, sending old and new state;
		this.fireEvent('docformstatechanged',this.docFormPreviousState,this.docFormCurrentState);
	},
	docFormHideIfExists:function(item){
		if(item){
			item.hide();
		}
	},
	docFormShowIfExists:function(item){
		if(item){
			item.show();
		}
	},
	docFormSetHtmlIfExists:function(item,value){
		if(item){
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
			case 'search':
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
			field.resetOriginalValue();
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
	docFormsetKeyEvents:function(){
		this.docFormDebug("docFormsetKeyEvents");

		var map = new Ext.util.KeyMap({
			target: this.el,
			binding:[
				{
					key: "s",
					ctrl:true,
					fn: function(key,event){
						event.stopEvent();
						switch(this.docFormCurrentState){
							case 'search':
								this.docFormBtns.searchBtn.fireEvent('click');
								break;
							case 'edit':
							case 'new':
								this.docFormBtns.saveBtn.fireEvent('click');
								break;
						}
					},
					scope: this
				},
				{
					key: "f",
					ctrl:true,
					fn: function(key,event){
						event.stopEvent();
						this.docFormBtns.searchBtn.fireEvent('click');
					},
					scope: this
				},
				{
					key: "z",
					ctrl:true,
					fn: function(key,event){
						event.stopEvent();
						this.docFormBtns.cancelBtn.fireEvent('click');
					},
					scope: this
				}
			]
		});
	},
	docFormInitKeyEvents:function(){
		this.docFormDebug("docFormInitKeyEvents");
		if(this.rendered){
			this.docFormsetKeyEvents();
		}else{
			this.on('render',this.docFormsetKeyEvents,this);
		}
	},
	docFormSetFieldTypes:function(fieldTypes){
		this.docFormDebug("docFormSetFieldTypes");
		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			if(fieldTypes.hasOwnProperty(itemId)){
				switch(fieldTypes[itemId]){
					case 'number':
						if(field.rendered){
							console.error('Error on "'+itemId+'" field: maskRe does not work after the field is rendered - set fieldTypes BEFORE you render this field.');
						}
						field.maskRe = /[0-9]/;
						break;
				}
			}
		});
	},
	docFormSetPickerWidths:function(pickerWidths){
		this.docFormDebug("docFormSetPickerWidths");
		this.docFormEachField(function(field){
			var itemId = field.getItemId();
			if(pickerWidths.hasOwnProperty(itemId)){
				if(field.rendered){
					field.getPicker().setWidth(pickerWidths[itemId]);
				}else{
					field.on('render',function(combo){
						combo.getPicker().setWidth(pickerWidths[itemId]);
					});
				}
			}
		});
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
		/*
		if(this.rendered){
			this.el.addClass('docform');
		}else{
			this.cls = 'docform';
		}
		*/
		this.on({
			change: this.docFormChange,
    		scope: this
		});

		this.docFormBtns = {};
		this.docFormInitilizeToolbar(params);

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

		if(params.hasOwnProperty('fieldLengths')){
			this.docFormSetFieldsMaxLength(params.fieldLengths);
		}

		if(params.hasOwnProperty('searchableFields')){
			this.docFormSetSearchableFields(params.searchableFields);
		}

		if(params.hasOwnProperty('fieldTypes')){
			this.docFormSetFieldTypes(params.fieldTypes);
		}

		if(params.hasOwnProperty('pickerWidths')){
			this.docFormSetPickerWidths(params.pickerWidths);
		}

		if(params.hasOwnProperty('debug')){
			this.docFormDebugMode = params.debug;
		}

		var doubleFieldString = "";
		for(var i=0;i<doubleFields.length;i++){
			doubleFieldString += doubleFields[i]+"\n";
		}
		if(doubleFieldString.length>0){
			console.error("Douplicate Fields Detected: \n"+doubleFieldString);
		}

		this.docFormInitKeyEvents();

		this.docFormInitComplete = true;
		this.docFormSetState('empty');
	},
	docFormGetChildren:function(parent){
		var results = [];
		parent.items.each(function(child){
			var xType = child.getXType();
			var itemId = child.getItemId();
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