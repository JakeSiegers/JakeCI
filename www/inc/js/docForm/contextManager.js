Ext.define('ContextManager',{
	prepare:function(userConfig){

		/*
			Adds right-click event to grid
			adds buttons to toolbar
			what the buttons actually do are passed in via menu items array

			Example (Required Params):
				new ContextManager().prepare({
				    menuItems:menuItems,
				    grid:this.queryById('currentJobClockOnGrid'),
				    toolbar:this.queryById('currentJobClockOnToolbar'),
				    callbackHandler:this.menuItemClicked,
				    scope:this
				});

			Optional Params:
				onSelectionChange
				noDoubleClick
		 */
		this.config = userConfig;

		this.menu = Ext.create({
			xtype:'menu',
			items:this.config.menuItems,
			listeners:{
				click:this.menuClickHandler,
				scope:this
			}
		});

		this.toolbarContainer =  Ext.create({
			xtype: 'container',
			defaults: {
				'margin':'0 0 0 8'
			},
			items:this.generateToolbarButtons(this.config.menuItems)
		});

		this.config.toolbar.setHeight(26);
		this.config.toolbar.insert(0,this.toolbarContainer);

		this.config.grid.addListener('selectionchange',function(model,selected,eOpts){
			if(this.config.hasOwnProperty('onSelectionChange')){
				var data = this.config.onSelectionChange.call(this.config.scope,selected);
				this.menu.removeAll();
				this.menu.add(data.menuItems);
				this.toolbarContainer.removeAll();
				this.toolbarContainer.add(this.generateToolbarButtons(data.menuItems));
				this.menu.recordData = data.recordData;
				if(data.disabled){
					this.toolbarContainer.items.each(function(item){
						item.disable();
					});
				}else{
					this.toolbarContainer.items.each(function(item){
						item.enable();
					});
				}
			}else{
				if(selected.length == 1){
					this.menu.recordData = selected[0].getData();
					this.toolbarContainer.items.each(function(item){
						item.enable();
					});
				}else{
					this.toolbarContainer.items.each(function(item){
						item.disable();
					});
				}
			}
		},this);

		if(!(this.config.hasOwnProperty('noDoubleClick') || this.config.noDoubleClick === true)){
			this.config.grid.addListener('rowdblclick',function(tableview, record, tr, rowIndex, e, eOpts){
				this.config.callbackHandler.call(this.config.scope,this.menu.items.first().action,this.menu.recordData);
			},this);
		}

		this.config.grid.addListener('rowcontextmenu',function(tableview, record, tr, rowIndex, e, eOpts){
			this.menu.showAt(e.getXY());
			e.stopEvent();
		},this);


	},
	generateToolbarButtons:function(items){
		var toolbarItems = [];
		for(var i=0;i<items.length;i++){
			var menuItem = items[i];
			var button = Ext.create({
				xtype:'button',
				icon: menuItem.icon,
				text: menuItem.text,
				action: menuItem.action,
				disabled:true,
				listeners:{
					click:this.toolbarButtonClickHandler,
					scope:this
				}
			});
			toolbarItems.push(button);
		}

		return toolbarItems;
	},
	menuClickHandler:function(menu,item,e,eOps){
		this.config.callbackHandler.call(this.config.scope,item.action,menu.recordData);
	},
	toolbarButtonClickHandler:function(button,e,eOps){
		this.config.callbackHandler.call(this.config.scope,button.action,this.menu.recordData);
	}
});