window.jms.client = function (buildNumber, document, undef) {

	var cfg,
		isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]', // (dull)
		head = document.getElementsByTagName('head')[0],
	//If BASE tag is in play, using appendChild is a problem for IE6.
	//When that browser dies, this can be removed. Details in this jQuery bug:
	//http://dev.jquery.com/ticket/2709
		baseElement = document.getElementsByTagName('base')[0],
		readyRegExp = /^(complete|loaded)$/,
		loaderObj,
		loadedList = [],
		callBackOrder = 0,
		orderedLoaders = {},
		lastLoaded = 1,
		contextList = {};

	if (baseElement) {
		head = baseElement.parentNode;
	}

	if (typeof window.jms != 'undefined') {
		cfg = window.jms;
	}

	if (!cfg.baseURL) {
	}

	if (!cfg.useFIF) {
		cfg.useFIF = false;
	}

	window.jms = function (module, actionArgs, action, actionContext) {

		var requestedModules = actionArgs[1],
			context,
			reqmodlen = requestedModules.length,
			modulesToLoad = [],
			loadingAlready;

		if (requestedModules.join(',').indexOf('.js') > -1) {
			throw new Error(requestedModules.join(',')  + " possibly refers to a file, not a module, aborting");
			return;
		}

		callBackOrder += 1;
		context = newLoader(callBackOrder, actionArgs, action, actionContext);

		orderedLoaders['load_'+callBackOrder] = (function (context) {
			return function executor() {

				if (lastLoaded == context.callBackIndex) {
					lastLoaded++;

					window['jmscb_' + context.callBackIndex]();
					context.passContext();


					if (orderedLoaders['load_' + (context.callBackIndex + 1)]) {
						orderedLoaders['load_' + (context.callBackIndex + 1)]();
					}

					//( orderedLoaders['load_' + (context.callBackIndex + 1)] || function() {} )();

					window['jmscb_' + context.callBackIndex] = undefined;
					orderedLoaders['load_' + context.callBackIndex] = undefined;

				}


			}

		}(context));

		console.group('jms');
		console.log(arguments)
		console.log('  requested modules: ', requestedModules.join(',') )
		console.log('  loaded list: ', loadedList )

		console.groupEnd();


		// adott csomagot mar toltjuk epp
		// ha le van toltve, el se jutunk idaig ugye (almond megfogja elottunk)

		for (var m = 0 ; m < reqmodlen ; m++) {
			if (!inArray(requestedModules[m], loadedList)) {
				modulesToLoad.push(requestedModules[m]);
			}
		}


		//loadingAlready = inArray(requestedModules.join(','), loadedList);
		/*
		 if (loadingAlready) {
		 console.log('  already loading, adding to previous context...')
		 // itt vhogy a mar toltodo csomag context-jehez kene csapni
		 // a mostani callbacket
		 contextList[module].append(actionArgs, action, actionContext);
		 return;
		 }
		 */

		var url = [
			cfg.baseURL,
			'js/',
			buildNumber + '/',
			'+',
			modulesToLoad.join(','),
			(loadedList.length) ? '-'+loadedList.join(',') : '',
			'.js',
			params()
		].join('');

		// they have been loaded together
		//loadedList.push(requestedModules.join(','));
		// they have been loaded separately
		for (var m = 0; m < requestedModules.length ; m++ ) {
			loadedList.push(requestedModules[m]);
		}

		contextList[requestedModules.join(',')] = context;

		// store data for possible lookup
		// make the load
		console.log(url, '  loading...');


		(cfg.useFIF ? loadFIF : load).call(this, context, module, url)
	}

	for (var i in cfg.pre) {
		require.apply(window, cfg.pre[i]);
	}
	cfg.pre = [];


	function params () {
		var params = [];

		if (cfg.locale) {
			params.push('locale=' + cfg.locale);
		}
		if (cfg.debug) {
			params.push('debug=1');
		}
		if (cfg.useFIF) {
			params.push('fif=1');
		}

		params.push('cb=jmscb_' + callBackOrder);

		ret = params.length > 0 ? '?' + params.join('&') : '';

		return ret;
	}

	function load (context, moduleName, url) {
		var node = document.createElement('script');
		node.type = 'text/javascript';
		node.charset = 'utf-8';
		node.async = true;
		node.setAttribute('data-requiremodule', moduleName);

		if (node.attachEvent &&
			!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
			!isOpera) {

			node.attachEvent('onreadystatechange', context.onScriptLoad);

			//It would be great to add an error handler here to catch
			//404s in IE9+. However, onreadystatechange will fire before
			//the error handler, so that does not help. If addEvenListener
			//is used, then IE will fire error before load, but we cannot
			//use that pathway given the connect.microsoft.com issue
			//mentioned above about not doing the 'script execute,
			//then fire the script load event listener before execute
			//next script' that other browsers do.
			//Best hope: IE10 fixes the issues,
			//and then destroys all installs of IE 6-9.
			//node.attachEvent('onerror', context.onScriptError);
		} else {
			node.addEventListener('load', context.onScriptLoad, false);
			node.addEventListener('error', context.onScriptError, false);
		}

		context.packFileUrl = node.src = url;

		//For some cache cases in IE 6-8, the script executes before the end
		//of the appendChild execution, so to tie an anonymous define
		//call to the module name (which is stored on the node), hold on
		//to a reference to this node, but clear after the DOM insertion.

		//currentlyAddingScript = node;

		if (baseElement) {
			head.insertBefore(node, baseElement);
		} else {
			head.appendChild(node);
		}
		//currentlyAddingScript = null;

		return node;
	}



	/*
	 // // // // // // // // //

	 This will be injected in an iframe onload as text (toString),
	 here is just easier to maintain.

	 Do not use globals from this scope!
	 */
	function fif_injector (url, moduleName, callbackId) {
		var isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]', // (dull)
			node = document.createElement('script');
		node.type = 'text/javascript';
		node.charset = 'utf-8';
		node.async = true;
		node.setAttribute('data-requiremodule', moduleName);

		if (node.attachEvent &&
			!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
			!isOpera) {

			node.attachEvent('onreadystatechange', window.parent[callbackId]);
		} else {
			node.addEventListener('load', window.parent[callbackId], false);
			node.addEventListener('error', window.parent[callbackId], false);
		}
		node.src = url;
		document.getElementsByTagName('body')[0].appendChild(node);
	}
	/*
	 You've been warned

	 // // // // // // // // //
	 */



	function loadFIF (context, moduleName, url) {


		var callbackId = "jms" + (+new Date());

		window[callbackId] = function (e) {
			switch(e.type) {
				case "load":
				case "readystatechange":
					context.onScriptLoad(e);
					break;
				case "error":
					context.onScriptError(e);
			}


			window[callbackId] = null;
		}

		var iframe = document.createElement('iframe'),
			where, doc;

		(iframe.frameElement || iframe).style.cssText = "width: 0; height: 0; border: 0";
		iframe.src = "javascript:false";

		where = document.getElementsByTagName('script')[0];
		where.parentNode.insertBefore(iframe, where);

		doc = iframe.contentWindow.document;
		doc.open().write('<body onload="('+ fif_injector.toString() +'(\''+url+'\',\''+moduleName+'\',\''+callbackId+'\'));"></body>');
		doc.close();

		context.packFileUrl = url;
	}

	function inArray(find, inArr) {
		var ret = false;
		if (!Array.prototype.indexOf) {
			ret = inArr.indexOf(find) > -1;
		} else {
			var s = inArr.length;
			while (s--) {
				if (find == inArr[s]) {
					ret = true;
				}
			}
		}
		return ret;
	}

	function each(ary, func) {
		if (ary) {
			var i;
			for (i = 0; i < ary.length; i += 1) {
				if (ary[i] && func(ary[i], i, ary)) {
					break;
				}
			}
		}
	}

	function newLoader (callBackOrder, actionArgs, action, actionContext) {

		var loader;




		return (loader = {
			callBackIndex: callBackOrder,
			packFileUrl: '',
			onCompleteActionArguments: [actionArgs],
			onCompleteAction: [action],
			onCompleteActionContext: [actionContext],

			/**
			 * add another dependency handler for this context
			 *
			 * @param actionArgs
			 * @param action
			 * @param actionContext
			 */
			append: function (actionArgs, action, actionContext) {
				loader.onCompleteActionArguments.push(actionArgs);
				loader.onCompleteAction.push(action);
				loader.onCompleteActionContext.push(actionContext);
			},

			onScriptLoad: function (evt) {
				//Using currentTarget instead of target for Firefox 2.0's sake. Not
				//all old browsers will be supported, but this one was easy enough
				//to support and still makes sense.
				if (evt.type === 'load' ||
					(readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
					//Reset interactive script so a script node is not held onto for
					//to long.
					//interactiveScript = null;

					//Pull out the name of the module and the context.
					var data = loader.getScriptData(evt);
					loader.completeLoad(data.id);
				}
			},

			onScriptError: function (evt) {
				var data = loader.getScriptData(evt);
				throw ('jms.js - Script error', evt, [data.id]);
			},

			getScriptData: function (evt) {
				//Using currentTarget instead of target for Firefox 2.0's sake. Not
				//all old browsers will be supported, but this one was easy enough
				//to support and still makes sense.
				var node = evt.currentTarget || evt.srcElement;

				//Remove the listeners once here.
				loader.removeListener(node, loader.onScriptLoad, 'load', 'onreadystatechange');
				loader.removeListener(node, loader.onScriptError, 'error');

				return {
					node: node,
					id: node && node.getAttribute('data-requiremodule')
				};
			},

			removeListener: function (node, func, name, ieName) {
				//Favor detachEvent because of IE9
				//issue, see attachEvent/addEventListener comment elsewhere
				//in this file.
				if (node.detachEvent && !isOpera) {
					//Probably IE. If not it will throw an error, which will be
					//useful to know.
					if (ieName) {
						node.detachEvent(ieName, func);
					}
				} else {
					node.removeEventListener(name, func, false);
				}
			},

			completeLoad: function () {
				console.log('jms completeLoad', loader.callBackIndex)
				orderedLoaders['load_'+loader.callBackIndex]();
			},

			passContext: function () {
				var l = loader.onCompleteAction.length,
					action, context, args;

				for(var i = 0; i < l; i++) {
					action = loader.onCompleteAction[i];
					context = loader.onCompleteActionContext[i];
					args = loader.onCompleteActionArguments[i];
					action.apply(context, args);
				}

				contextList[loader.packFileUrl] = null;
			}
		});
	}

};

(function (document){
	var xhr;
	if (window.ActiveXObject)
	{
		try {
			xhr = new ActiveXObject("Microsoft.XMLHTTP");
		} catch(e) {
			alert(e.message);
			xhr = null;
		}
	} else {
		xhr = new XMLHttpRequest();
	}
	var url = jms.baseURL + 'current';
	xhr.onreadystatechange = function (e) {
		var request = e.target;
		if (request.readyState === 4) {
			jms.client(request.getResponseHeader('jms-buildnumber'), document);
		}
	};
	xhr.ontimeout = function () {};
	xhr.onerror = function () {};
	xhr.open('OPTIONS', url , true);
	xhr.send();
}(document));