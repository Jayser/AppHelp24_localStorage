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
		help.isLocalStorageAvailable = function() {
			var test = 'AppHelp24';
			try {
				localStorage.setItem(test, test);
				localStorage.removeItem(test);
				return true;
			} catch(e) {
				return false;
			}
		};

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
		help.getCollection = function(locStorage) {
			
			var keys = _.keys(locStorage),
				filterKeys = _.filter(keys,function(data) {
					return /^help24_/.test(data);
				}),
				models = _.map(filterKeys,function(data) {
					return JSON.parse(locStorage.getItem(data));
				});

			return {
				models: models,
				keys  : filterKeys
			};
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

		// CLEAR TEXTAREA
		help.clearArea = function() {
			_.delay(function() {
				selectors.$textarea.val('')
				selectors.$chCount.html("Осталось символов: <span>255</span>");
			}, 1);
		};


		/* * * * * * * * * * * * * END HELPERS * * * * * * * * * * * * */


		// CHECK IS LOCAL STORAGE AVAILABLE
		if (help.isLocalStorageAvailable()){

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

					// CHARACTER LIMIT
					var ln    = selectors.$textarea.val().length,
						count = 255 - (+ln);

					selectors.$chCount.html("Осталось символов: <span>"+count+"</span>");

					if (count <= 0 && e.which !== 0){
						selectors.$textarea.val(selectors.$textarea.val().substring(0, ln - 1));
					}

					// Add Messages
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
			selectors.$chCount 	   = $('#chCount');
			selectors.$dialogСlear = $('#help24-dialog-clear');

			// MODEL MESSAGES 
			App.Models.Msg = Backbone.Model.extend({
				defaults:{
					'avatar':'img/avatar.gif'
				},
				validate:function (attrs){
					if (attrs.msg.length >= 256){
						console.log( attrs.msg.length );
						alert('Максимально допустимое количество символов 255!!!');
					} else if(attrs.msg === ''){
						help.clearArea(); // CLEAR TEXTAREA
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
						if( opt ) help.clearArea();
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

			new App.Views.addMsg({collection:(help.getCollection(localStorage)).models });

			help.localStorageListener = function() {
				var domKey = [];
				
				// GET MESSAGES FROM DOM
				_.each($('.help24-message'), function(key) {
					domKey.push($(key).attr('id'))
				});				

				// DIFFERANCE BETWEEN LOCAL STORAGE & DOM
				var difference = $.grep(help.getCollection(localStorage).keys,function(x) {return $.inArray(x, domKey) < 0});


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