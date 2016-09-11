Ext.define('ContextManager',{
	prepare:function(userConfig){

		/*
			Adds right-click event to grid
			adds buttons to toolbar
			what the buttons actually do are passed in via menu items array

			Example:
				new ContextManager().prepare({
				    menuItems:menuItems,
				    grid:this.queryById('currentJobClockOnGrid'),
				    toolbar:this.queryById('currentJobClockOnToolbar'),
				    callbackHandler:this.menuItemClicked,
				    scope:this
				});
		 */
		this.config = userConfig;

		this.menu = Ext.create({
			xtype:'menu',
			items:this.config.menuItems,
			listeners:{
				click:function(menu,item,e,eOps){
					this.config.callbackHandler.call(this.config.scope,item.action,menu.recordData);
				},
				scope:this
			}
		});

		this.config.grid.addListener('rowcontextmenu',function(tableview,record,tr,rowIndex,e,eOpts){
			this.menu.recordData = record.getData();
			this.menu.showAt(e.getXY());
			e.stopEvent();
		},this);

		var toolbarItems = [];

		for(var i in this.config.menuItems){
			var menuItem = this.config.menuItems[i];
			var button = Ext.create({
				xtype:'button',
				icon: menuItem.icon,
				text: menuItem.text,
				action: menuItem.action,
				listeners:{
					click:this.toolbarButtonClickHandler,
					scope:this
				}
			});
			toolbarItems.push(button);
		}

		var toolbarContainer = Ext.create({
			xtype: 'container',
			defaults: {
				'margin':'0 0 0 8'
			},
			items:toolbarItems
		});

		this.config.toolbar.add(toolbarContainer);
	},
	toolbarButtonClickHandler:function(button,e,eOps){
		var selection = this.config.grid.getSelection();
		if(selection.length == 1){
			this.menu.recordData = selection[0].getData();
			this.config.callbackHandler.call(this.config.scope,button.action,this.menu.recordData);
		}
	}
});