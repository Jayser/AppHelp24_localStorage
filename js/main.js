// PATTERN MODULE
;(function(){

	"use strict";

	window.AppHelp24 = function() {

		var App   = {
			Models:      {},
			Views:       {},
			Collections: {},
			Helpers:     {}
		},
		help 	  = App.Helpers,
		selectors = {
			$wrap 	  : $('#wrap'),
			$tempRoot : $('#help24-template-root'),
			$tempMsg  : $('#help24-template-message')
		};

		// ISLOCALSTORAGE
		help.isLocalStorageAvailable = (function() {
			try {
				localStorage.setItem('.', '.');
				localStorage.removeItem('.');
				return true;
			} catch(e) {
				return false;
			}
		}());

		/* 
		 * GET CURRENT DATE
		 * f@ format 'dmy'
		 * s@ divider '/'
		 * new Date().currentDate('dmy','/')
		 */
		if(!Date.prototype.currentDate){
			Date.prototype.currentDate = function(f,s){
				var s = s || '',
					d = ((this.getDate() < 10)?"0":"") + this.getDate(),
					m = (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1),
					y = this.getFullYear(),
					date = f.replace('d',d+s).replace('m',m+s).replace('y',y+s);

				return (s !== '' ? date.substring(0,date.length-1) : date);
			};
		}

		/* 
		 * GET CURRENT TIME
		 * f@ format 'hmsM'
		 * s@ divider '/'
		 * new Date().currentTime('hmsM',':')
		 */
		if(!Date.prototype.currentTime){
			Date.prototype.currentTime = function(f,s){
				var sep  = s || '',
					h    = ((this.getHours() < 10)?"0":"") + this.getHours(),
					m    = ((this.getMinutes() < 10)?"0":"") + this.getMinutes(),
					s    = ((this.getSeconds() < 10) ? "0":"") + this.getSeconds(),
					M    = this.getMilliseconds(),
					time = f.replace('h',h+sep).replace('m',m+sep).replace('s',s+sep).replace('M',M+sep);

				return (sep !== '' ? time.substring(0,time.length-1) : time);
			};
		}

		// TRIM SPACES
		if(!String.prototype.trim){
			String.prototype.trim = function() {
				return this.replace(/^\s+|\s+$/gm,'');
			};
		}

		// REPLACE HTML SYMBOLS
		if(!String.prototype.htmlentities){
			String.prototype.htmlentities = function() {
				return this.replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
			};
		}

		// GET MESSAGES FROM LOCAL STORAGE
		help.getCollection = function(ls) {
			var collection = _.keys(ls).filter(function(data) {
				return /^help24_/.test(data);
			}).map(function(data) {
				return JSON.parse(ls.getItem(data));
			});
			return collection;
		};

		// REPLACE SMILE
		help.compileSmile = function(str) {
			var smilies = str.match(/\(\:[a-z]+\:\)/g);
			if(smilies !== null){
				for(var i = 0, ln = smilies.length; i < ln; i++){
					var replaceData = $('[data-smile-code="'+smilies[i]+'"]').clone().attr('data-smile-code','').prop('outerHTML'),
						str 		= str.replace(smilies[i], replaceData );
				}
			}
			return str;
		};

		// DINAMIC HEIGHT
		help.dinamicHeight = function() {
			var height = selectors.$root.height() - selectors.$header.height() - selectors.$footer.height();
			selectors.$content.height(height);
		};

		// SET SCROLL
		help.setScroll = function(el) {
			help.dinamicHeight();
			el.scrollTop(el[0].scrollHeight);
		};

		// USER IDENTIFICATION
		help.userView = function(model) {
			if(model.userName === help.userName){
				model.userName = "<span class='text-blood'>Вы</span>";
			} else {
				model.userName = "<span class='text-light_blue'>"+model.userName+"</span>";
			}
		};


		/* * * * * * * * * * * * * END HELPERS * * * * * * * * * * * * */


		// CHECK IS LOCAL STORAGE AVAILABLE
		if (help.isLocalStorageAvailable){

			// SET USER NAME
			help.userName = (function() {
				do{
					var val = prompt('Как вас зовут?');
				} while(val === null || !(/[A-Za-zА-Яа-я\_]/g.test(val)));

				return val.toLowerCase();
			}());

			// INIT help24
			App.Views.Init = Backbone.View.extend({
				tagName: 'section',
				id: 'help24',
				tempRoot: _.template(selectors.$tempRoot.html()), // MAIN HTML FROM TEMPLATE
				events: {
					'click #help24-submit'      : 'addMsg',
					'click [data-smile-code]'   : 'addSmile',
					'keydown #help24-textarea'  : 'addMsg',
					'click #help24-dialog-clear': 'clearMsg'
				},
				addSmile:function(e) {
					var $msg = selectors.$textarea;
					$msg.val($msg.val() + $(e.target).attr('data-smile-code'));
				},
				clearMsg:function() {
					if(confirm('Вы уверены,что хотите удалить всю историю?')){
						selectors.$content.removeAttr('style').empty();
						localStorage.clear();
						help.dinamicHeight();
					}
				},
				addMsg:function(e) {
					if(e.ctrlKey && e.keyCode === 13 || $(e.target).attr('id') === 'help24-submit'){

						var msgText = help.compileSmile(selectors.$textarea.val().trim().htmlentities()),
							сTime = new Date().currentTime('hmsM'),
							сDate = new Date().currentDate('dmy');

						(new App.Models.Msg).set({
							keyMsg: 'help24'+'_'+сDate+'_'+сTime,
							userName: help.userName,
							timePost: new Date().currentTime('hm',':'),
							msg: msgText
						}, {validate:true});

					}
				},
				initialize:function() {
					this.render();
				},
				render:function() {
					selectors.$wrap.append(this.$el.append(this.tempRoot(this.model)));
				}
			});

			new App.Views.Init({model: {title: 'Помощь онлайн!'}});

			// ADD NEW SELECTORS AFTER APPEND help24
			selectors.$root 	   = $('#help24');
			selectors.$header 	   = $('.help24-header');
			selectors.$content 	   = $('.help24-content');
			selectors.$footer 	   = $('.help24-footer');
			selectors.$textarea    = $('#help24-textarea');
			selectors.$submit 	   = $('#help24-submit');
			selectors.$dialogСlear = $('#help24-dialog-clear');

			// MODEL MESSAGES 
			App.Models.Msg = Backbone.Model.extend({
				defaults:{
					'avatar':'img/avatar.gif'
				},
				validate:function (attrs){
					if (attrs.msg === ''){
						_.delay(function() {selectors.$textarea.val('')}, 1);
						return alert('Необходимо вести текст сообщения!');
					} else {
						new App.Views.addMsg({model: attrs, clearMsg:true});
					}
				}
			});

			// GENERATED MESSAGE FROM TEMPLATE
			help.tempMsg = _.template( selectors.$tempMsg.html() );

			// GET * MESSAGE
			App.Views.addMsg = Backbone.View.extend({
				el:'.help24-content',
				initialize:function(opt) {
					this.render(opt.clearMsg);
				},
				render:function(opt) {

					// GET & ADD & APPEND MESSAGE
					if (this.model) {

						// ADD TO LOCAL STORAGE
						localStorage.setItem(this.model.keyMsg, JSON.stringify(this.model));

						// GET USER
						help.userView(this.model);
						
						// APPEND TO DOM;
						this.$el.append(help.tempMsg(this.model));

						// CLEAR TEXTAREA
						if( opt ) _.delay(function() {selectors.$textarea.val('')}, 1);
					};

					// GET & APPEND MESSAGES FROM LOCAL STORAGE
					if(this.collection){
						_.each(this.collection,function(msg) {

							// GET USER
							help.userView(msg);

							// APPEND TO DOM;
							this.$el.append(help.tempMsg(msg));

						},this);
					}

					// RESIZE & SET SCROLL TO BOTTOM
					help.setScroll(this.$el);

				}
			});

			new App.Views.addMsg({collection:help.getCollection(localStorage)});

			help.localStorageListener = function() {
				var domKey = [],localStorageKey = [];
				
				// GET MESSAGES FROM DOM
				_.each($('.help24-message'), function(key) {
					domKey.push($(key).attr('id'))
				});

				// GET MESSAGES FROM LOCAL STORAGE
				_.each(help.getCollection(localStorage),function(key) {
					localStorageKey.push(key.keyMsg)
				});

				// DIFFERANCE BETWEEN LOCAL STORAGE & DOM
				var difference = $.grep((help.getCollection()).keys,function(x) {return $.inArray(x, domKey) < 0});

				if(difference.length !== 0) {
					_.each(difference,function(msg) {
						new App.Views.addMsg({ model: JSON.parse(localStorage.getItem(msg)), clearMsg:false });
					});
				}
			};

			// LISTENER LOCAL STORAGE
			(function() { setInterval(function() {
				help.localStorageListener() }, 5000);
			}());

			// RESIZE
			$(window).on('resize',function() {help.setScroll(selectors.$content)});

		} else {
			alert('Ваш браузер не поддерживает local storage!!!');
		}
	};
}());

// INIT
AppHelp24();