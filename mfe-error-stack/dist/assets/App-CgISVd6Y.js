import { r as importShared } from "./_virtual___federation_fn_import-DYD12ulU.js";
import { D as useDefaultProps, E as createSvgIcon, F as createTheme, I as createTypography, L as DefaultPropsProvider, Q as useEnhancedEffect, R as RtlProvider, at as styleFunctionSx, c as Box, ct as ThemeContext$1, dt as axios, ft as require_jsx_runtime, it as useTheme$1, k as globalCss, lt as identifier_default, q as useId, rt as GlobalStyles$1, st as GlobalStyles$2 } from "./severity-IagH6rzy.js";
import { n as Tabs, r as Tab, t as ErrorDetailPage } from "./ErrorDetailPage-C2Rq1PSQ.js";
import { t as ErrorOverviewPage } from "./ErrorOverviewPage-C4nszi8s.js";
import { t as ErrorGroupsPage } from "./ErrorGroupsPage-D4UMB8Zq.js";
// ../node_modules/redux/dist/redux.mjs
function formatProdErrorMessage$1(code) {
	return `Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or use the non-minified dev environment for full errors. `;
}
var symbol_observable_default = /* @__PURE__ */ (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
var randomString = () => Math.random().toString(36).substring(7).split("").join(".");
var actionTypes_default = {
	INIT: `@@redux/INIT${/* @__PURE__ */ randomString()}`,
	REPLACE: `@@redux/REPLACE${/* @__PURE__ */ randomString()}`,
	PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
};
function isPlainObject$1(obj) {
	if (typeof obj !== "object" || obj === null) return false;
	let proto = obj;
	while (Object.getPrototypeOf(proto) !== null) proto = Object.getPrototypeOf(proto);
	return Object.getPrototypeOf(obj) === proto || Object.getPrototypeOf(obj) === null;
}
function createStore(reducer, preloadedState, enhancer) {
	if (typeof reducer !== "function") throw new Error(formatProdErrorMessage$1(2));
	if (typeof preloadedState === "function" && typeof enhancer === "function" || typeof enhancer === "function" && typeof arguments[3] === "function") throw new Error(formatProdErrorMessage$1(0));
	if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
		enhancer = preloadedState;
		preloadedState = void 0;
	}
	if (typeof enhancer !== "undefined") {
		if (typeof enhancer !== "function") throw new Error(formatProdErrorMessage$1(1));
		return enhancer(createStore)(reducer, preloadedState);
	}
	let currentReducer = reducer;
	let currentState = preloadedState;
	let currentListeners = /* @__PURE__ */ new Map();
	let nextListeners = currentListeners;
	let listenerIdCounter = 0;
	let isDispatching = false;
	function ensureCanMutateNextListeners() {
		if (nextListeners === currentListeners) {
			nextListeners = /* @__PURE__ */ new Map();
			currentListeners.forEach((listener, key) => {
				nextListeners.set(key, listener);
			});
		}
	}
	function getState() {
		if (isDispatching) throw new Error(formatProdErrorMessage$1(3));
		return currentState;
	}
	function subscribe(listener) {
		if (typeof listener !== "function") throw new Error(formatProdErrorMessage$1(4));
		if (isDispatching) throw new Error(formatProdErrorMessage$1(5));
		let isSubscribed = true;
		ensureCanMutateNextListeners();
		const listenerId = listenerIdCounter++;
		nextListeners.set(listenerId, listener);
		return function unsubscribe() {
			if (!isSubscribed) return;
			if (isDispatching) throw new Error(formatProdErrorMessage$1(6));
			isSubscribed = false;
			ensureCanMutateNextListeners();
			nextListeners.delete(listenerId);
			currentListeners = null;
		};
	}
	function dispatch(action) {
		if (!isPlainObject$1(action)) throw new Error(formatProdErrorMessage$1(7));
		if (typeof action.type === "undefined") throw new Error(formatProdErrorMessage$1(8));
		if (typeof action.type !== "string") throw new Error(formatProdErrorMessage$1(17));
		if (isDispatching) throw new Error(formatProdErrorMessage$1(9));
		try {
			isDispatching = true;
			currentState = currentReducer(currentState, action);
		} finally {
			isDispatching = false;
		}
		(currentListeners = nextListeners).forEach((listener) => {
			listener();
		});
		return action;
	}
	function replaceReducer(nextReducer) {
		if (typeof nextReducer !== "function") throw new Error(formatProdErrorMessage$1(10));
		currentReducer = nextReducer;
		dispatch({ type: actionTypes_default.REPLACE });
	}
	function observable() {
		const outerSubscribe = subscribe;
		return {
			/**
			* The minimal observable subscription method.
			* @param observer Any object that can be used as an observer.
			* The observer object should have a `next` method.
			* @returns An object with an `unsubscribe` method that can
			* be used to unsubscribe the observable from the store, and prevent further
			* emission of values from the observable.
			*/
			subscribe(observer) {
				if (typeof observer !== "object" || observer === null) throw new Error(formatProdErrorMessage$1(11));
				function observeState() {
					const observerAsObserver = observer;
					if (observerAsObserver.next) observerAsObserver.next(getState());
				}
				observeState();
				return { unsubscribe: outerSubscribe(observeState) };
			},
			[symbol_observable_default]() {
				return this;
			}
		};
	}
	dispatch({ type: actionTypes_default.INIT });
	return {
		dispatch,
		subscribe,
		getState,
		replaceReducer,
		[symbol_observable_default]: observable
	};
}
function assertReducerShape(reducers) {
	Object.keys(reducers).forEach((key) => {
		const reducer = reducers[key];
		if (typeof reducer(void 0, { type: actionTypes_default.INIT }) === "undefined") throw new Error(formatProdErrorMessage$1(12));
		if (typeof reducer(void 0, { type: actionTypes_default.PROBE_UNKNOWN_ACTION() }) === "undefined") throw new Error(formatProdErrorMessage$1(13));
	});
}
function combineReducers(reducers) {
	const reducerKeys = Object.keys(reducers);
	const finalReducers = {};
	for (let i = 0; i < reducerKeys.length; i++) {
		const key = reducerKeys[i];
		if (typeof reducers[key] === "function") finalReducers[key] = reducers[key];
	}
	const finalReducerKeys = Object.keys(finalReducers);
	let shapeAssertionError;
	try {
		assertReducerShape(finalReducers);
	} catch (e) {
		shapeAssertionError = e;
	}
	return function combination(state = {}, action) {
		if (shapeAssertionError) throw shapeAssertionError;
		let hasChanged = false;
		const nextState = {};
		for (let i = 0; i < finalReducerKeys.length; i++) {
			const key = finalReducerKeys[i];
			const reducer = finalReducers[key];
			const previousStateForKey = state[key];
			const nextStateForKey = reducer(previousStateForKey, action);
			if (typeof nextStateForKey === "undefined") {
				action && action.type;
				throw new Error(formatProdErrorMessage$1(14));
			}
			nextState[key] = nextStateForKey;
			hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
		}
		hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
		return hasChanged ? nextState : state;
	};
}
function compose(...funcs) {
	if (funcs.length === 0) return (arg) => arg;
	if (funcs.length === 1) return funcs[0];
	return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
function applyMiddleware(...middlewares) {
	return (createStore2) => (reducer, preloadedState) => {
		const store = createStore2(reducer, preloadedState);
		let dispatch = () => {
			throw new Error(formatProdErrorMessage$1(15));
		};
		const middlewareAPI = {
			getState: store.getState,
			dispatch: (action, ...args) => dispatch(action, ...args)
		};
		dispatch = compose(...middlewares.map((middleware) => middleware(middlewareAPI)))(store.dispatch);
		return {
			...store,
			dispatch
		};
	};
}
function isAction(action) {
	return isPlainObject$1(action) && "type" in action && typeof action.type === "string";
}
// ../node_modules/immer/dist/immer.mjs
var NOTHING = Symbol.for("immer-nothing");
var DRAFTABLE = Symbol.for("immer-draftable");
var DRAFT_STATE = Symbol.for("immer-state");
function die(error, ...args) {
	throw new Error(`[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`);
}
var O = Object;
var getPrototypeOf = O.getPrototypeOf;
var CONSTRUCTOR = "constructor";
var PROTOTYPE = "prototype";
var CONFIGURABLE = "configurable";
var ENUMERABLE = "enumerable";
var WRITABLE = "writable";
var VALUE = "value";
var isDraft = (value) => !!value && !!value[DRAFT_STATE];
function isDraftable(value) {
	if (!value) return false;
	return isPlainObject(value) || isArray(value) || !!value[DRAFTABLE] || !!value[CONSTRUCTOR]?.[DRAFTABLE] || isMap(value) || isSet(value);
}
var objectCtorString = O[PROTOTYPE][CONSTRUCTOR].toString();
var cachedCtorStrings = /* @__PURE__ */ new WeakMap();
function isPlainObject(value) {
	if (!value || !isObjectish(value)) return false;
	const proto = getPrototypeOf(value);
	if (proto === null || proto === O[PROTOTYPE]) return true;
	const Ctor = O.hasOwnProperty.call(proto, CONSTRUCTOR) && proto[CONSTRUCTOR];
	if (Ctor === Object) return true;
	if (!isFunction(Ctor)) return false;
	let ctorString = cachedCtorStrings.get(Ctor);
	if (ctorString === void 0) {
		ctorString = Function.toString.call(Ctor);
		cachedCtorStrings.set(Ctor, ctorString);
	}
	return ctorString === objectCtorString;
}
function each(obj, iter, strict = true) {
	if (getArchtype(obj) === 0) (strict ? Reflect.ownKeys(obj) : O.keys(obj)).forEach((key) => {
		iter(key, obj[key], obj);
	});
	else obj.forEach((entry, index) => iter(index, entry, obj));
}
function getArchtype(thing) {
	const state = thing[DRAFT_STATE];
	return state ? state.type_ : isArray(thing) ? 1 : isMap(thing) ? 2 : isSet(thing) ? 3 : 0;
}
var has = (thing, prop, type = getArchtype(thing)) => type === 2 ? thing.has(prop) : O[PROTOTYPE].hasOwnProperty.call(thing, prop);
var get = (thing, prop, type = getArchtype(thing)) => type === 2 ? thing.get(prop) : thing[prop];
var set = (thing, propOrOldValue, value, type = getArchtype(thing)) => {
	if (type === 2) thing.set(propOrOldValue, value);
	else if (type === 3) thing.add(value);
	else thing[propOrOldValue] = value;
};
function is(x, y) {
	if (x === y) return x !== 0 || 1 / x === 1 / y;
	else return x !== x && y !== y;
}
var isArray = Array.isArray;
var isMap = (target) => target instanceof Map;
var isSet = (target) => target instanceof Set;
var isObjectish = (target) => typeof target === "object";
var isFunction = (target) => typeof target === "function";
var isBoolean$1 = (target) => typeof target === "boolean";
function isArrayIndex(value) {
	const n = +value;
	return Number.isInteger(n) && String(n) === value;
}
var latest = (state) => state.copy_ || state.base_;
var getFinalValue = (state) => state.modified_ ? state.copy_ : state.base_;
function shallowCopy(base, strict) {
	if (isMap(base)) return new Map(base);
	if (isSet(base)) return new Set(base);
	if (isArray(base)) return Array[PROTOTYPE].slice.call(base);
	const isPlain = isPlainObject(base);
	if (strict === true || strict === "class_only" && !isPlain) {
		const descriptors = O.getOwnPropertyDescriptors(base);
		delete descriptors[DRAFT_STATE];
		let keys = Reflect.ownKeys(descriptors);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const desc = descriptors[key];
			if (desc[WRITABLE] === false) {
				desc[WRITABLE] = true;
				desc[CONFIGURABLE] = true;
			}
			if (desc.get || desc.set) descriptors[key] = {
				[CONFIGURABLE]: true,
				[WRITABLE]: true,
				[ENUMERABLE]: desc[ENUMERABLE],
				[VALUE]: base[key]
			};
		}
		return O.create(getPrototypeOf(base), descriptors);
	} else {
		const proto = getPrototypeOf(base);
		if (proto !== null && isPlain) return { ...base };
		const obj = O.create(proto);
		return O.assign(obj, base);
	}
}
function freeze(obj, deep = false) {
	if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj)) return obj;
	if (getArchtype(obj) > 1) O.defineProperties(obj, {
		set: dontMutateMethodOverride,
		add: dontMutateMethodOverride,
		clear: dontMutateMethodOverride,
		delete: dontMutateMethodOverride
	});
	O.freeze(obj);
	if (deep) each(obj, (_key, value) => {
		freeze(value, true);
	}, false);
	return obj;
}
function dontMutateFrozenCollections() {
	die(2);
}
var dontMutateMethodOverride = { [VALUE]: dontMutateFrozenCollections };
function isFrozen(obj) {
	if (obj === null || !isObjectish(obj)) return true;
	return O.isFrozen(obj);
}
var PluginMapSet = "MapSet";
var PluginPatches = "Patches";
var PluginArrayMethods = "ArrayMethods";
var plugins = {};
function getPlugin(pluginKey) {
	const plugin = plugins[pluginKey];
	if (!plugin) die(0, pluginKey);
	return plugin;
}
var isPluginLoaded = (pluginKey) => !!plugins[pluginKey];
var currentScope;
var getCurrentScope = () => currentScope;
var createScope = (parent_, immer_) => ({
	drafts_: [],
	parent_,
	immer_,
	canAutoFreeze_: true,
	unfinalizedDrafts_: 0,
	handledSet_: /* @__PURE__ */ new Set(),
	processedForPatches_: /* @__PURE__ */ new Set(),
	mapSetPlugin_: isPluginLoaded(PluginMapSet) ? getPlugin(PluginMapSet) : void 0,
	arrayMethodsPlugin_: isPluginLoaded(PluginArrayMethods) ? getPlugin(PluginArrayMethods) : void 0
});
function usePatchesInScope(scope, patchListener) {
	if (patchListener) {
		scope.patchPlugin_ = getPlugin(PluginPatches);
		scope.patches_ = [];
		scope.inversePatches_ = [];
		scope.patchListener_ = patchListener;
	}
}
function revokeScope(scope) {
	leaveScope(scope);
	scope.drafts_.forEach(revokeDraft);
	scope.drafts_ = null;
}
function leaveScope(scope) {
	if (scope === currentScope) currentScope = scope.parent_;
}
var enterScope = (immer2) => currentScope = createScope(currentScope, immer2);
function revokeDraft(draft) {
	const state = draft[DRAFT_STATE];
	if (state.type_ === 0 || state.type_ === 1) state.revoke_();
	else state.revoked_ = true;
}
function processResult(result, scope) {
	scope.unfinalizedDrafts_ = scope.drafts_.length;
	const baseDraft = scope.drafts_[0];
	if (result !== void 0 && result !== baseDraft) {
		if (baseDraft[DRAFT_STATE].modified_) {
			revokeScope(scope);
			die(4);
		}
		if (isDraftable(result)) result = finalize(scope, result);
		const { patchPlugin_ } = scope;
		if (patchPlugin_) patchPlugin_.generateReplacementPatches_(baseDraft[DRAFT_STATE].base_, result, scope);
	} else result = finalize(scope, baseDraft);
	maybeFreeze(scope, result, true);
	revokeScope(scope);
	if (scope.patches_) scope.patchListener_(scope.patches_, scope.inversePatches_);
	return result !== NOTHING ? result : void 0;
}
function finalize(rootScope, value) {
	if (isFrozen(value)) return value;
	const state = value[DRAFT_STATE];
	if (!state) return handleValue(value, rootScope.handledSet_, rootScope);
	if (!isSameScope(state, rootScope)) return value;
	if (!state.modified_) return state.base_;
	if (!state.finalized_) {
		const { callbacks_ } = state;
		if (callbacks_) while (callbacks_.length > 0) callbacks_.pop()(rootScope);
		generatePatchesAndFinalize(state, rootScope);
	}
	return state.copy_;
}
function maybeFreeze(scope, value, deep = false) {
	if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) freeze(value, deep);
}
function markStateFinalized(state) {
	state.finalized_ = true;
	state.scope_.unfinalizedDrafts_--;
}
var isSameScope = (state, rootScope) => state.scope_ === rootScope;
var EMPTY_LOCATIONS_RESULT = [];
function updateDraftInParent(parent, draftValue, finalizedValue, originalKey) {
	const parentCopy = latest(parent);
	const parentType = parent.type_;
	if (originalKey !== void 0) {
		if (get(parentCopy, originalKey, parentType) === draftValue) {
			set(parentCopy, originalKey, finalizedValue, parentType);
			return;
		}
	}
	if (!parent.draftLocations_) {
		const draftLocations = parent.draftLocations_ = /* @__PURE__ */ new Map();
		each(parentCopy, (key, value) => {
			if (isDraft(value)) {
				const keys = draftLocations.get(value) || [];
				keys.push(key);
				draftLocations.set(value, keys);
			}
		});
	}
	const locations = parent.draftLocations_.get(draftValue) ?? EMPTY_LOCATIONS_RESULT;
	for (const location of locations) set(parentCopy, location, finalizedValue, parentType);
}
function registerChildFinalizationCallback(parent, child, key) {
	parent.callbacks_.push(function childCleanup(rootScope) {
		const state = child;
		if (!state || !isSameScope(state, rootScope)) return;
		rootScope.mapSetPlugin_?.fixSetContents(state);
		const finalizedValue = getFinalValue(state);
		updateDraftInParent(parent, state.draft_ ?? state, finalizedValue, key);
		generatePatchesAndFinalize(state, rootScope);
	});
}
function generatePatchesAndFinalize(state, rootScope) {
	if (state.modified_ && !state.finalized_ && (state.type_ === 3 || state.type_ === 1 && state.allIndicesReassigned_ || (state.assigned_?.size ?? 0) > 0)) {
		const { patchPlugin_ } = rootScope;
		if (patchPlugin_) {
			const basePath = patchPlugin_.getPath(state);
			if (basePath) patchPlugin_.generatePatches_(state, basePath, rootScope);
		}
		markStateFinalized(state);
	}
}
function handleCrossReference(target, key, value) {
	const { scope_ } = target;
	if (isDraft(value)) {
		const state = value[DRAFT_STATE];
		if (isSameScope(state, scope_)) state.callbacks_.push(function crossReferenceCleanup() {
			prepareCopy(target);
			updateDraftInParent(target, value, getFinalValue(state), key);
		});
	} else if (isDraftable(value)) target.callbacks_.push(function nestedDraftCleanup() {
		const targetCopy = latest(target);
		if (target.type_ === 3) {
			if (targetCopy.has(value)) handleValue(value, scope_.handledSet_, scope_);
		} else if (get(targetCopy, key, target.type_) === value) {
			if (scope_.drafts_.length > 1 && (target.assigned_.get(key) ?? false) === true && target.copy_) handleValue(get(target.copy_, key, target.type_), scope_.handledSet_, scope_);
		}
	});
}
function handleValue(target, handledSet, rootScope) {
	if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) return target;
	if (isDraft(target) || handledSet.has(target) || !isDraftable(target) || isFrozen(target)) return target;
	handledSet.add(target);
	each(target, (key, value) => {
		if (isDraft(value)) {
			const state = value[DRAFT_STATE];
			if (isSameScope(state, rootScope)) {
				set(target, key, getFinalValue(state), target.type_);
				markStateFinalized(state);
			}
		} else if (isDraftable(value)) handleValue(value, handledSet, rootScope);
	});
	return target;
}
function createProxyProxy(base, parent) {
	const baseIsArray = isArray(base);
	const state = {
		type_: baseIsArray ? 1 : 0,
		scope_: parent ? parent.scope_ : getCurrentScope(),
		modified_: false,
		finalized_: false,
		assigned_: void 0,
		parent_: parent,
		base_: base,
		draft_: null,
		copy_: null,
		revoke_: null,
		isManual_: false,
		callbacks_: void 0
	};
	let target = state;
	let traps = objectTraps;
	if (baseIsArray) {
		target = [state];
		traps = arrayTraps;
	}
	const { revoke, proxy } = Proxy.revocable(target, traps);
	state.draft_ = proxy;
	state.revoke_ = revoke;
	return [proxy, state];
}
var objectTraps = {
	get(state, prop) {
		if (prop === DRAFT_STATE) return state;
		let arrayPlugin = state.scope_.arrayMethodsPlugin_;
		const isArrayWithStringProp = state.type_ === 1 && typeof prop === "string";
		if (isArrayWithStringProp) {
			if (arrayPlugin?.isArrayOperationMethod(prop)) return arrayPlugin.createMethodInterceptor(state, prop);
		}
		const source = latest(state);
		if (!has(source, prop, state.type_)) return readPropFromProto(state, source, prop);
		const value = source[prop];
		if (state.finalized_ || !isDraftable(value)) return value;
		if (isArrayWithStringProp && state.operationMethod && arrayPlugin?.isMutatingArrayMethod(state.operationMethod) && isArrayIndex(prop)) return value;
		if (value === peek(state.base_, prop)) {
			prepareCopy(state);
			const childKey = state.type_ === 1 ? +prop : prop;
			const childDraft = createProxy(state.scope_, value, state, childKey);
			return state.copy_[childKey] = childDraft;
		}
		return value;
	},
	has(state, prop) {
		return prop in latest(state);
	},
	ownKeys(state) {
		return Reflect.ownKeys(latest(state));
	},
	set(state, prop, value) {
		const desc = getDescriptorFromProto(latest(state), prop);
		if (desc?.set) {
			desc.set.call(state.draft_, value);
			return true;
		}
		if (!state.modified_) {
			const current2 = peek(latest(state), prop);
			const currentState = current2?.[DRAFT_STATE];
			if (currentState && currentState.base_ === value) {
				state.copy_[prop] = value;
				state.assigned_.set(prop, false);
				return true;
			}
			if (is(value, current2) && (value !== void 0 || has(state.base_, prop, state.type_))) return true;
			prepareCopy(state);
			markChanged(state);
		}
		if (state.copy_[prop] === value && (value !== void 0 || prop in state.copy_) || Number.isNaN(value) && Number.isNaN(state.copy_[prop])) return true;
		state.copy_[prop] = value;
		state.assigned_.set(prop, true);
		handleCrossReference(state, prop, value);
		return true;
	},
	deleteProperty(state, prop) {
		prepareCopy(state);
		if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
			state.assigned_.set(prop, false);
			markChanged(state);
		} else state.assigned_.delete(prop);
		if (state.copy_) delete state.copy_[prop];
		return true;
	},
	getOwnPropertyDescriptor(state, prop) {
		const owner = latest(state);
		const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
		if (!desc) return desc;
		return {
			[WRITABLE]: true,
			[CONFIGURABLE]: state.type_ !== 1 || prop !== "length",
			[ENUMERABLE]: desc[ENUMERABLE],
			[VALUE]: owner[prop]
		};
	},
	defineProperty() {
		die(11);
	},
	getPrototypeOf(state) {
		return getPrototypeOf(state.base_);
	},
	setPrototypeOf() {
		die(12);
	}
};
var arrayTraps = {};
for (let key in objectTraps) {
	let fn = objectTraps[key];
	arrayTraps[key] = function() {
		const args = arguments;
		args[0] = args[0][0];
		return fn.apply(this, args);
	};
}
arrayTraps.deleteProperty = function(state, prop) {
	return arrayTraps.set.call(this, state, prop, void 0);
};
arrayTraps.set = function(state, prop, value) {
	return objectTraps.set.call(this, state[0], prop, value, state[0]);
};
function peek(draft, prop) {
	const state = draft[DRAFT_STATE];
	return (state ? latest(state) : draft)[prop];
}
function readPropFromProto(state, source, prop) {
	const desc = getDescriptorFromProto(source, prop);
	return desc ? VALUE in desc ? desc[VALUE] : desc.get?.call(state.draft_) : void 0;
}
function getDescriptorFromProto(source, prop) {
	if (!(prop in source)) return void 0;
	let proto = getPrototypeOf(source);
	while (proto) {
		const desc = Object.getOwnPropertyDescriptor(proto, prop);
		if (desc) return desc;
		proto = getPrototypeOf(proto);
	}
}
function markChanged(state) {
	if (!state.modified_) {
		state.modified_ = true;
		if (state.parent_) markChanged(state.parent_);
	}
}
function prepareCopy(state) {
	if (!state.copy_) {
		state.assigned_ = /* @__PURE__ */ new Map();
		state.copy_ = shallowCopy(state.base_, state.scope_.immer_.useStrictShallowCopy_);
	}
}
var Immer2 = class {
	constructor(config) {
		this.autoFreeze_ = true;
		this.useStrictShallowCopy_ = false;
		this.useStrictIteration_ = false;
		/**
		* The `produce` function takes a value and a "recipe function" (whose
		* return value often depends on the base state). The recipe function is
		* free to mutate its first argument however it wants. All mutations are
		* only ever applied to a __copy__ of the base state.
		*
		* Pass only a function to create a "curried producer" which relieves you
		* from passing the recipe function every time.
		*
		* Only plain objects and arrays are made mutable. All other objects are
		* considered uncopyable.
		*
		* Note: This function is __bound__ to its `Immer` instance.
		*
		* @param {any} base - the initial state
		* @param {Function} recipe - function that receives a proxy of the base state as first argument and which can be freely modified
		* @param {Function} patchListener - optional function that will be called with all the patches produced here
		* @returns {any} a new state, or the initial state if nothing was modified
		*/
		this.produce = (base, recipe, patchListener) => {
			if (isFunction(base) && !isFunction(recipe)) {
				const defaultBase = recipe;
				recipe = base;
				const self = this;
				return function curriedProduce(base2 = defaultBase, ...args) {
					return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
				};
			}
			if (!isFunction(recipe)) die(6);
			if (patchListener !== void 0 && !isFunction(patchListener)) die(7);
			let result;
			if (isDraftable(base)) {
				const scope = enterScope(this);
				const proxy = createProxy(scope, base, void 0);
				let hasError = true;
				try {
					result = recipe(proxy);
					hasError = false;
				} finally {
					if (hasError) revokeScope(scope);
					else leaveScope(scope);
				}
				usePatchesInScope(scope, patchListener);
				return processResult(result, scope);
			} else if (!base || !isObjectish(base)) {
				result = recipe(base);
				if (result === void 0) result = base;
				if (result === NOTHING) result = void 0;
				if (this.autoFreeze_) freeze(result, true);
				if (patchListener) {
					const p = [];
					const ip = [];
					getPlugin(PluginPatches).generateReplacementPatches_(base, result, {
						patches_: p,
						inversePatches_: ip
					});
					patchListener(p, ip);
				}
				return result;
			} else die(1, base);
		};
		this.produceWithPatches = (base, recipe) => {
			if (isFunction(base)) return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
			let patches, inversePatches;
			return [
				this.produce(base, recipe, (p, ip) => {
					patches = p;
					inversePatches = ip;
				}),
				patches,
				inversePatches
			];
		};
		if (isBoolean$1(config?.autoFreeze)) this.setAutoFreeze(config.autoFreeze);
		if (isBoolean$1(config?.useStrictShallowCopy)) this.setUseStrictShallowCopy(config.useStrictShallowCopy);
		if (isBoolean$1(config?.useStrictIteration)) this.setUseStrictIteration(config.useStrictIteration);
	}
	createDraft(base) {
		if (!isDraftable(base)) die(8);
		if (isDraft(base)) base = current(base);
		const scope = enterScope(this);
		const proxy = createProxy(scope, base, void 0);
		proxy[DRAFT_STATE].isManual_ = true;
		leaveScope(scope);
		return proxy;
	}
	finishDraft(draft, patchListener) {
		const state = draft && draft[DRAFT_STATE];
		if (!state || !state.isManual_) die(9);
		const { scope_: scope } = state;
		usePatchesInScope(scope, patchListener);
		return processResult(void 0, scope);
	}
	/**
	* Pass true to automatically freeze all copies created by Immer.
	*
	* By default, auto-freezing is enabled.
	*/
	setAutoFreeze(value) {
		this.autoFreeze_ = value;
	}
	/**
	* Pass true to enable strict shallow copy.
	*
	* By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
	*/
	setUseStrictShallowCopy(value) {
		this.useStrictShallowCopy_ = value;
	}
	/**
	* Pass false to use faster iteration that skips non-enumerable properties
	* but still handles symbols for compatibility.
	*
	* By default, strict iteration is enabled (includes all own properties).
	*/
	setUseStrictIteration(value) {
		this.useStrictIteration_ = value;
	}
	shouldUseStrictIteration() {
		return this.useStrictIteration_;
	}
	applyPatches(base, patches) {
		let i;
		for (i = patches.length - 1; i >= 0; i--) {
			const patch = patches[i];
			if (patch.path.length === 0 && patch.op === "replace") {
				base = patch.value;
				break;
			}
		}
		if (i > -1) patches = patches.slice(i + 1);
		const applyPatchesImpl = getPlugin(PluginPatches).applyPatches_;
		if (isDraft(base)) return applyPatchesImpl(base, patches);
		return this.produce(base, (draft) => applyPatchesImpl(draft, patches));
	}
};
function createProxy(rootScope, value, parent, key) {
	const [draft, state] = isMap(value) ? getPlugin(PluginMapSet).proxyMap_(value, parent) : isSet(value) ? getPlugin(PluginMapSet).proxySet_(value, parent) : createProxyProxy(value, parent);
	(parent?.scope_ ?? getCurrentScope()).drafts_.push(draft);
	state.callbacks_ = parent?.callbacks_ ?? [];
	state.key_ = key;
	if (parent && key !== void 0) registerChildFinalizationCallback(parent, state, key);
	else state.callbacks_.push(function rootDraftCleanup(rootScope2) {
		rootScope2.mapSetPlugin_?.fixSetContents(state);
		const { patchPlugin_ } = rootScope2;
		if (state.modified_ && patchPlugin_) patchPlugin_.generatePatches_(state, [], rootScope2);
	});
	return draft;
}
function current(value) {
	if (!isDraft(value)) die(10, value);
	return currentImpl(value);
}
function currentImpl(value) {
	if (!isDraftable(value) || isFrozen(value)) return value;
	const state = value[DRAFT_STATE];
	let copy;
	let strict = true;
	if (state) {
		if (!state.modified_) return state.base_;
		state.finalized_ = true;
		copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
		strict = state.scope_.immer_.shouldUseStrictIteration();
	} else copy = shallowCopy(value, true);
	each(copy, (key, childValue) => {
		set(copy, key, currentImpl(childValue));
	}, strict);
	if (state) state.finalized_ = false;
	return copy;
}
var produce = new Immer2().produce;
// ../node_modules/redux-thunk/dist/redux-thunk.mjs
function createThunkMiddleware(extraArgument) {
	const middleware = ({ dispatch, getState }) => (next) => (action) => {
		if (typeof action === "function") return action(dispatch, getState, extraArgument);
		return next(action);
	};
	return middleware;
}
var thunk = createThunkMiddleware();
var withExtraArgument = createThunkMiddleware;
// ../node_modules/@reduxjs/toolkit/dist/redux-toolkit.modern.mjs
var composeWithDevTools = typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : function() {
	if (arguments.length === 0) return void 0;
	if (typeof arguments[0] === "object") return compose;
	return compose.apply(null, arguments);
};
typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__;
function createAction(type, prepareAction) {
	function actionCreator(...args) {
		if (prepareAction) {
			let prepared = prepareAction(...args);
			if (!prepared) throw new Error(formatProdErrorMessage(0));
			return {
				type,
				payload: prepared.payload,
				..."meta" in prepared && { meta: prepared.meta },
				..."error" in prepared && { error: prepared.error }
			};
		}
		return {
			type,
			payload: args[0]
		};
	}
	actionCreator.toString = () => `${type}`;
	actionCreator.type = type;
	actionCreator.match = (action) => isAction(action) && action.type === type;
	return actionCreator;
}
var Tuple = class _Tuple extends Array {
	constructor(...items) {
		super(...items);
		Object.setPrototypeOf(this, _Tuple.prototype);
	}
	static get [Symbol.species]() {
		return _Tuple;
	}
	concat(...arr) {
		return super.concat.apply(this, arr);
	}
	prepend(...arr) {
		if (arr.length === 1 && Array.isArray(arr[0])) return new _Tuple(...arr[0].concat(this));
		return new _Tuple(...arr.concat(this));
	}
};
function freezeDraftable(val) {
	return isDraftable(val) ? produce(val, () => {}) : val;
}
function getOrInsertComputed(map, key, compute) {
	if (map.has(key)) return map.get(key);
	return map.set(key, compute(key)).get(key);
}
function isBoolean(x) {
	return typeof x === "boolean";
}
var buildGetDefaultMiddleware = () => function getDefaultMiddleware(options) {
	const { thunk: thunk$1 = true, immutableCheck = true, serializableCheck = true, actionCreatorCheck = true } = options ?? {};
	let middlewareArray = new Tuple();
	if (thunk$1) {
		if (isBoolean(thunk$1)) middlewareArray.push(thunk);
		else middlewareArray.push(withExtraArgument(thunk$1.extraArgument));
	}
	return middlewareArray;
};
var SHOULD_AUTOBATCH = "RTK_autoBatch";
var createQueueWithTimer = (timeout) => {
	return (notify) => {
		setTimeout(notify, timeout);
	};
};
var createRafWithFallbackTimer = (raf, timeout) => {
	return (notify) => {
		let called = false;
		const callback = () => {
			if (called) return;
			called = true;
			cancelAnimationFrame(rafId);
			clearTimeout(timerId);
			notify();
		};
		const rafId = raf(callback);
		const timerId = setTimeout(callback, timeout);
	};
};
var autoBatchEnhancer = (options = { type: "raf" }) => (next) => (...args) => {
	const store = next(...args);
	let notifying = true;
	let shouldNotifyAtEndOfTick = false;
	let notificationQueued = false;
	const listeners = /* @__PURE__ */ new Set();
	const queueCallback = options.type === "tick" ? queueMicrotask : options.type === "raf" ? typeof window !== "undefined" && window.requestAnimationFrame ? createRafWithFallbackTimer(window.requestAnimationFrame, 100) : createQueueWithTimer(10) : options.type === "callback" ? options.queueNotification : createQueueWithTimer(options.timeout);
	const notifyListeners = () => {
		notificationQueued = false;
		if (shouldNotifyAtEndOfTick) {
			shouldNotifyAtEndOfTick = false;
			listeners.forEach((l) => l());
		}
	};
	return Object.assign({}, store, {
		subscribe(listener2) {
			const wrappedListener = () => notifying && listener2();
			const unsubscribe = store.subscribe(wrappedListener);
			listeners.add(listener2);
			return () => {
				unsubscribe();
				listeners.delete(listener2);
			};
		},
		dispatch(action) {
			try {
				notifying = !action?.meta?.[SHOULD_AUTOBATCH];
				shouldNotifyAtEndOfTick = !notifying;
				if (shouldNotifyAtEndOfTick) {
					if (!notificationQueued) {
						notificationQueued = true;
						queueCallback(notifyListeners);
					}
				}
				return store.dispatch(action);
			} finally {
				notifying = true;
			}
		}
	});
};
var buildGetDefaultEnhancers = (middlewareEnhancer) => function getDefaultEnhancers(options) {
	const { autoBatch = true } = options ?? {};
	let enhancerArray = new Tuple(middlewareEnhancer);
	if (autoBatch) enhancerArray.push(autoBatchEnhancer(typeof autoBatch === "object" ? autoBatch : void 0));
	return enhancerArray;
};
function configureStore(options) {
	const getDefaultMiddleware = buildGetDefaultMiddleware();
	const { reducer = void 0, middleware, devTools = true, duplicateMiddlewareCheck = true, preloadedState = void 0, enhancers = void 0 } = options || {};
	let rootReducer;
	if (typeof reducer === "function") rootReducer = reducer;
	else if (isPlainObject$1(reducer)) rootReducer = combineReducers(reducer);
	else throw new Error(formatProdErrorMessage(1));
	let finalMiddleware;
	if (typeof middleware === "function") finalMiddleware = middleware(getDefaultMiddleware);
	else finalMiddleware = getDefaultMiddleware();
	let finalCompose = compose;
	if (devTools) finalCompose = composeWithDevTools({
		trace: false,
		...typeof devTools === "object" && devTools
	});
	const getDefaultEnhancers = buildGetDefaultEnhancers(applyMiddleware(...finalMiddleware));
	let storeEnhancers = typeof enhancers === "function" ? enhancers(getDefaultEnhancers) : getDefaultEnhancers();
	const composedEnhancer = finalCompose(...storeEnhancers);
	return createStore(rootReducer, preloadedState, composedEnhancer);
}
function executeReducerBuilderCallback(builderCallback) {
	const actionsMap = {};
	const actionMatchers = [];
	let defaultCaseReducer;
	const builder = {
		addCase(typeOrActionCreator, reducer) {
			const type = typeof typeOrActionCreator === "string" ? typeOrActionCreator : typeOrActionCreator.type;
			if (!type) throw new Error(formatProdErrorMessage(28));
			if (type in actionsMap) throw new Error(formatProdErrorMessage(29));
			actionsMap[type] = reducer;
			return builder;
		},
		addAsyncThunk(asyncThunk, reducers) {
			if (reducers.pending) actionsMap[asyncThunk.pending.type] = reducers.pending;
			if (reducers.rejected) actionsMap[asyncThunk.rejected.type] = reducers.rejected;
			if (reducers.fulfilled) actionsMap[asyncThunk.fulfilled.type] = reducers.fulfilled;
			if (reducers.settled) actionMatchers.push({
				matcher: asyncThunk.settled,
				reducer: reducers.settled
			});
			return builder;
		},
		addMatcher(matcher, reducer) {
			actionMatchers.push({
				matcher,
				reducer
			});
			return builder;
		},
		addDefaultCase(reducer) {
			defaultCaseReducer = reducer;
			return builder;
		}
	};
	builderCallback(builder);
	return [
		actionsMap,
		actionMatchers,
		defaultCaseReducer
	];
}
function isStateFunction(x) {
	return typeof x === "function";
}
function createReducer(initialState, mapOrBuilderCallback) {
	let [actionsMap, finalActionMatchers, finalDefaultCaseReducer] = executeReducerBuilderCallback(mapOrBuilderCallback);
	let getInitialState;
	if (isStateFunction(initialState)) getInitialState = () => freezeDraftable(initialState());
	else {
		const frozenInitialState = freezeDraftable(initialState);
		getInitialState = () => frozenInitialState;
	}
	function reducer(state = getInitialState(), action) {
		let caseReducers = [actionsMap[action.type], ...finalActionMatchers.filter(({ matcher }) => matcher(action)).map(({ reducer: reducer2 }) => reducer2)];
		if (caseReducers.filter((cr) => !!cr).length === 0) caseReducers = [finalDefaultCaseReducer];
		return caseReducers.reduce((previousState, caseReducer) => {
			if (caseReducer) {
				if (isDraft(previousState)) {
					const result = caseReducer(previousState, action);
					if (result === void 0) return previousState;
					return result;
				} else if (!isDraftable(previousState)) {
					const result = caseReducer(previousState, action);
					if (result === void 0) {
						if (previousState === null) return previousState;
						throw Error("A case reducer on a non-draftable value must not return undefined");
					}
					return result;
				} else return produce(previousState, (draft) => {
					return caseReducer(draft, action);
				});
			}
			return previousState;
		}, state);
	}
	reducer.getInitialState = getInitialState;
	return reducer;
}
var asyncThunkSymbol = /* @__PURE__ */ Symbol.for("rtk-slice-createasyncthunk");
function getType(slice, actionKey) {
	return `${slice}/${actionKey}`;
}
function buildCreateSlice({ creators } = {}) {
	const cAT = creators?.asyncThunk?.[asyncThunkSymbol];
	return function createSlice2(options) {
		const { name, reducerPath = name } = options;
		if (!name) throw new Error(formatProdErrorMessage(11));
		const reducers = (typeof options.reducers === "function" ? options.reducers(buildReducerCreators()) : options.reducers) || {};
		const reducerNames = Object.keys(reducers);
		const context = {
			sliceCaseReducersByName: {},
			sliceCaseReducersByType: {},
			actionCreators: {},
			sliceMatchers: []
		};
		const contextMethods = {
			addCase(typeOrActionCreator, reducer2) {
				const type = typeof typeOrActionCreator === "string" ? typeOrActionCreator : typeOrActionCreator.type;
				if (!type) throw new Error(formatProdErrorMessage(12));
				if (type in context.sliceCaseReducersByType) throw new Error(formatProdErrorMessage(13));
				context.sliceCaseReducersByType[type] = reducer2;
				return contextMethods;
			},
			addMatcher(matcher, reducer2) {
				context.sliceMatchers.push({
					matcher,
					reducer: reducer2
				});
				return contextMethods;
			},
			exposeAction(name2, actionCreator) {
				context.actionCreators[name2] = actionCreator;
				return contextMethods;
			},
			exposeCaseReducer(name2, reducer2) {
				context.sliceCaseReducersByName[name2] = reducer2;
				return contextMethods;
			}
		};
		reducerNames.forEach((reducerName) => {
			const reducerDefinition = reducers[reducerName];
			const reducerDetails = {
				reducerName,
				type: getType(name, reducerName),
				createNotation: typeof options.reducers === "function"
			};
			if (isAsyncThunkSliceReducerDefinition(reducerDefinition)) handleThunkCaseReducerDefinition(reducerDetails, reducerDefinition, contextMethods, cAT);
			else handleNormalReducerDefinition(reducerDetails, reducerDefinition, contextMethods);
		});
		function buildReducer() {
			const [extraReducers = {}, actionMatchers = [], defaultCaseReducer = void 0] = typeof options.extraReducers === "function" ? executeReducerBuilderCallback(options.extraReducers) : [options.extraReducers];
			const finalCaseReducers = {
				...extraReducers,
				...context.sliceCaseReducersByType
			};
			return createReducer(options.initialState, (builder) => {
				for (let key in finalCaseReducers) builder.addCase(key, finalCaseReducers[key]);
				for (let sM of context.sliceMatchers) builder.addMatcher(sM.matcher, sM.reducer);
				for (let m of actionMatchers) builder.addMatcher(m.matcher, m.reducer);
				if (defaultCaseReducer) builder.addDefaultCase(defaultCaseReducer);
			});
		}
		const selectSelf = (state) => state;
		const injectedSelectorCache = /* @__PURE__ */ new Map();
		const injectedStateCache = /* @__PURE__ */ new WeakMap();
		let _reducer;
		function reducer(state, action) {
			if (!_reducer) _reducer = buildReducer();
			return _reducer(state, action);
		}
		function getInitialState() {
			if (!_reducer) _reducer = buildReducer();
			return _reducer.getInitialState();
		}
		function makeSelectorProps(reducerPath2, injected = false) {
			function selectSlice(state) {
				let sliceState = state[reducerPath2];
				if (typeof sliceState === "undefined") {
					if (injected) sliceState = getOrInsertComputed(injectedStateCache, selectSlice, getInitialState);
				}
				return sliceState;
			}
			function getSelectors(selectState = selectSelf) {
				return getOrInsertComputed(getOrInsertComputed(injectedSelectorCache, injected, () => /* @__PURE__ */ new WeakMap()), selectState, () => {
					const map = {};
					for (const [name2, selector] of Object.entries(options.selectors ?? {})) map[name2] = wrapSelector(selector, selectState, () => getOrInsertComputed(injectedStateCache, selectState, getInitialState), injected);
					return map;
				});
			}
			return {
				reducerPath: reducerPath2,
				getSelectors,
				get selectors() {
					return getSelectors(selectSlice);
				},
				selectSlice
			};
		}
		const slice = {
			name,
			reducer,
			actions: context.actionCreators,
			caseReducers: context.sliceCaseReducersByName,
			getInitialState,
			...makeSelectorProps(reducerPath),
			injectInto(injectable, { reducerPath: pathOpt, ...config } = {}) {
				const newReducerPath = pathOpt ?? reducerPath;
				injectable.inject({
					reducerPath: newReducerPath,
					reducer
				}, config);
				return {
					...slice,
					...makeSelectorProps(newReducerPath, true)
				};
			}
		};
		return slice;
	};
}
function wrapSelector(selector, selectState, getInitialState, injected) {
	function wrapper(rootState, ...args) {
		let sliceState = selectState(rootState);
		if (typeof sliceState === "undefined") {
			if (injected) sliceState = getInitialState();
		}
		return selector(sliceState, ...args);
	}
	wrapper.unwrapped = selector;
	return wrapper;
}
var createSlice = /* @__PURE__ */ buildCreateSlice();
function buildReducerCreators() {
	function asyncThunk(payloadCreator, config) {
		return {
			_reducerDefinitionType: "asyncThunk",
			payloadCreator,
			...config
		};
	}
	asyncThunk.withTypes = () => asyncThunk;
	return {
		reducer(caseReducer) {
			return Object.assign({ [caseReducer.name](...args) {
				return caseReducer(...args);
			} }[caseReducer.name], { _reducerDefinitionType: "reducer" });
		},
		preparedReducer(prepare, reducer) {
			return {
				_reducerDefinitionType: "reducerWithPrepare",
				prepare,
				reducer
			};
		},
		asyncThunk
	};
}
function handleNormalReducerDefinition({ type, reducerName, createNotation }, maybeReducerWithPrepare, context) {
	let caseReducer;
	let prepareCallback;
	if ("reducer" in maybeReducerWithPrepare) {
		if (createNotation && !isCaseReducerWithPrepareDefinition(maybeReducerWithPrepare)) throw new Error(formatProdErrorMessage(17));
		caseReducer = maybeReducerWithPrepare.reducer;
		prepareCallback = maybeReducerWithPrepare.prepare;
	} else caseReducer = maybeReducerWithPrepare;
	context.addCase(type, caseReducer).exposeCaseReducer(reducerName, caseReducer).exposeAction(reducerName, prepareCallback ? createAction(type, prepareCallback) : createAction(type));
}
function isAsyncThunkSliceReducerDefinition(reducerDefinition) {
	return reducerDefinition._reducerDefinitionType === "asyncThunk";
}
function isCaseReducerWithPrepareDefinition(reducerDefinition) {
	return reducerDefinition._reducerDefinitionType === "reducerWithPrepare";
}
function handleThunkCaseReducerDefinition({ type, reducerName }, reducerDefinition, context, cAT) {
	if (!cAT) throw new Error(formatProdErrorMessage(18));
	const { payloadCreator, fulfilled, pending, rejected, settled, options } = reducerDefinition;
	const thunk = cAT(type, payloadCreator, options);
	context.exposeAction(reducerName, thunk);
	if (fulfilled) context.addCase(thunk.fulfilled, fulfilled);
	if (pending) context.addCase(thunk.pending, pending);
	if (rejected) context.addCase(thunk.rejected, rejected);
	if (settled) context.addMatcher(thunk.settled, settled);
	context.exposeCaseReducer(reducerName, {
		fulfilled: fulfilled || noop$2,
		pending: pending || noop$2,
		rejected: rejected || noop$2,
		settled: settled || noop$2
	});
}
function noop$2() {}
var listener = "listener";
var completed = "completed";
var cancelled = "cancelled";
`${cancelled}`;
`${completed}`;
`${listener}${cancelled}`;
`${listener}${completed}`;
var { assign } = Object;
var alm = "listenerMiddleware";
var addListener = /* @__PURE__ */ assign(/* @__PURE__ */ createAction(`${alm}/add`), { withTypes: () => addListener });
`${alm}`;
var removeListener = /* @__PURE__ */ assign(/* @__PURE__ */ createAction(`${alm}/remove`), { withTypes: () => removeListener });
function formatProdErrorMessage(code) {
	return `Minified Redux Toolkit error #${code}; visit https://redux-toolkit.js.org/Errors?code=${code} for the full message or use the non-minified dev environment for full errors. `;
}
// ../node_modules/jwt-decode/build/esm/index.js
var InvalidTokenError = class extends Error {};
InvalidTokenError.prototype.name = "InvalidTokenError";
function b64DecodeUnicode(str) {
	return decodeURIComponent(atob(str).replace(/(.)/g, (m, p) => {
		let code = p.charCodeAt(0).toString(16).toUpperCase();
		if (code.length < 2) code = "0" + code;
		return "%" + code;
	}));
}
function base64UrlDecode(str) {
	let output = str.replace(/-/g, "+").replace(/_/g, "/");
	switch (output.length % 4) {
		case 0: break;
		case 2:
			output += "==";
			break;
		case 3:
			output += "=";
			break;
		default: throw new Error("base64 string is not of the correct length");
	}
	try {
		return b64DecodeUnicode(output);
	} catch (err) {
		return atob(output);
	}
}
function jwtDecode(token, options) {
	if (typeof token !== "string") throw new InvalidTokenError("Invalid token specified: must be a string");
	options || (options = {});
	const pos = options.header === true ? 0 : 1;
	const part = token.split(".")[pos];
	if (typeof part !== "string") throw new InvalidTokenError(`Invalid token specified: missing part #${pos + 1}`);
	let decoded;
	try {
		decoded = base64UrlDecode(part);
	} catch (e) {
		throw new InvalidTokenError(`Invalid token specified: invalid base64 for part #${pos + 1} (${e.message})`);
	}
	try {
		return JSON.parse(decoded);
	} catch (e) {
		throw new InvalidTokenError(`Invalid token specified: invalid json for part #${pos + 1} (${e.message})`);
	}
}
// ../shared-library/src/store/authSlice.ts
var getInitialAuth = () => {
	try {
		if (typeof window === "undefined" || !window.localStorage) return {
			token: null,
			user: null,
			isAuthenticated: false
		};
		const token = localStorage.getItem("jwt_token");
		if (!token) return {
			token: null,
			user: null,
			isAuthenticated: false
		};
		const decoded = jwtDecode(token);
		if (decoded.exp && decoded.exp * 1e3 < Date.now() + 5e3) {
			localStorage.removeItem("jwt_token");
			return {
				token: null,
				user: null,
				isAuthenticated: false
			};
		}
		return {
			token,
			user: decoded,
			isAuthenticated: true
		};
	} catch (err) {
		console.warn("Error reading or decoding auth token from storage:", err);
		try {
			localStorage.removeItem("jwt_token");
		} catch {}
		return {
			token: null,
			user: null,
			isAuthenticated: false
		};
	}
};
var authSlice = createSlice({
	name: "auth",
	initialState: getInitialAuth(),
	reducers: {
		loginSuccess: (state, action) => {
			try {
				const decoded = jwtDecode(action.payload);
				state.token = action.payload;
				state.user = decoded;
				state.isAuthenticated = true;
				if (typeof window !== "undefined" && window.localStorage) localStorage.setItem("jwt_token", action.payload);
			} catch (err) {
				console.error("Failed to decode JWT token:", err);
			}
		},
		logout: (state) => {
			state.token = null;
			state.user = null;
			state.isAuthenticated = false;
			try {
				if (typeof window !== "undefined" && window.localStorage) localStorage.removeItem("jwt_token");
			} catch {}
		}
	}
});
var { loginSuccess, logout } = authSlice.actions;
var authSlice_default = authSlice.reducer;
// ../shared-library/src/store/cartSlice.ts
var cartSlice = createSlice({
	name: "cart",
	initialState: {
		items: [],
		totalQuantity: 0,
		totalAmount: 0
	},
	reducers: {
		addToCart(state, action) {
			const newItem = action.payload;
			const existingItem = state.items.find((item) => item.productId === newItem.productId);
			state.totalQuantity++;
			state.totalAmount += newItem.price;
			if (!existingItem) state.items.push({
				productId: newItem.productId,
				name: newItem.name,
				price: newItem.price,
				quantity: 1
			});
			else existingItem.quantity++;
		},
		removeFromCart(state, action) {
			const id = action.payload;
			const existingItem = state.items.find((item) => item.productId === id);
			if (existingItem) {
				state.totalQuantity--;
				state.totalAmount -= existingItem.price;
				if (existingItem.quantity === 1) state.items = state.items.filter((item) => item.productId !== id);
				else existingItem.quantity--;
			}
		},
		clearCart(state) {
			state.items = [];
			state.totalQuantity = 0;
			state.totalAmount = 0;
		},
		updateQuantity(state, action) {
			const { productId, quantity } = action.payload;
			const existingItem = state.items.find((item) => item.productId === productId);
			if (existingItem) {
				if (quantity <= 0) {
					state.totalQuantity -= existingItem.quantity;
					state.totalAmount -= existingItem.price * existingItem.quantity;
					state.items = state.items.filter((item) => item.productId !== productId);
				} else {
					const diff = quantity - existingItem.quantity;
					existingItem.quantity = quantity;
					state.totalQuantity += diff;
					state.totalAmount += existingItem.price * diff;
				}
			}
		}
	}
});
var { addToCart, removeFromCart, clearCart, updateQuantity } = cartSlice.actions;
var cartSlice_default = cartSlice.reducer;
configureStore({ reducer: {
	auth: authSlice_default,
	cart: cartSlice_default
} });
// ../shared-library/src/components/RoleGuard.tsx
var import_jsx_runtime = require_jsx_runtime();
await importShared("react");
// ../shared-library/src/components/ProtectedRoute.tsx
await importShared("react");
var { Navigate, useLocation } = await importShared("react-router-dom");
// ../shared-library/src/components/ErrorBoundary.tsx
var { Component } = await importShared("react");
// ../shared-library/src/auth/applicationSession.ts
var ApplicationSignInError = class extends Error {
	constructor(message, status) {
		super(message);
		this.name = "ApplicationSignInError";
		this.status = status;
	}
};
var STORAGE_PREFIX = "ucp.session.";
var DEFAULT_ERRORS = {
	400: "Enter your client workspace, email and password.",
	401: "The email or password is incorrect.",
	403: "Your account does not have access to this application for that client."
};
function sessionStorageKey(applicationCode) {
	return STORAGE_PREFIX + applicationCode;
}
/** Decodes a JWT payload without verifying it. Returns null for malformed tokens. */
function decodeTokenClaims(token) {
	const parts = token.split(".");
	if (parts.length !== 3) return null;
	try {
		const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
		const json = decodeURIComponent(Array.from(atob(padded), (char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
		const claims = JSON.parse(json);
		return claims && typeof claims === "object" ? claims : null;
	} catch {
		return null;
	}
}
/**
* True when the token claims this application and tenant and has not expired.
* A token without an `exp` claim is treated as invalid.
*/
function isUsableApplicationToken(token, applicationCode, tenantId, nowMs = Date.now()) {
	const claims = decodeTokenClaims(token);
	if (!claims) return false;
	if (claims.application_code !== applicationCode || claims.tenant_id !== tenantId) return false;
	return typeof claims.exp === "number" && claims.exp * 1e3 > nowMs;
}
/** Signs in to one application for one client workspace. Throws ApplicationSignInError on failure. */
async function signInToApplication(request, fetchImpl = fetch, apiBaseUrl = "") {
	let response;
	try {
		response = await fetchImpl(`${apiBaseUrl}/api/users/login/application`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: request.email.trim(),
				password: request.password,
				applicationCode: request.applicationCode,
				tenantSlug: request.tenantSlug.trim().toLowerCase()
			})
		});
	} catch {
		throw new ApplicationSignInError("The sign-in service could not be reached. Try again shortly.", 0);
	}
	const body = await response.json().catch(() => null);
	if (!response.ok) {
		const serverMessage = body && typeof body.error === "string" ? body.error : null;
		throw new ApplicationSignInError(DEFAULT_ERRORS[response.status] ?? serverMessage ?? "Sign in failed. Please try again.", response.status);
	}
	const session = toSession(body, request.applicationCode);
	if (!session || !isUsableApplicationToken(session.token, request.applicationCode, session.tenantId)) throw new ApplicationSignInError("The sign-in response was not valid for this application.", response.status);
	return session;
}
function storeApplicationSession(session, storage) {
	storage.setItem(sessionStorageKey(session.applicationCode), JSON.stringify(session));
}
/** Returns the stored session for this application, clearing it if it is malformed, foreign or expired. */
function readApplicationSession(applicationCode, storage, nowMs = Date.now()) {
	const key = sessionStorageKey(applicationCode);
	let session = null;
	try {
		const raw = storage.getItem(key);
		session = raw ? toSession(JSON.parse(raw), applicationCode) : null;
	} catch {
		session = null;
	}
	if (session && isUsableApplicationToken(session.token, applicationCode, session.tenantId, nowMs)) return session;
	storage.removeItem(key);
	return null;
}
function clearApplicationSession(applicationCode, storage) {
	storage.removeItem(sessionStorageKey(applicationCode));
}
/** True when the token is an unexpired platform token (no tenant or application scope). */
function isUsablePlatformToken(token, nowMs = Date.now()) {
	const claims = decodeTokenClaims(token);
	if (!claims || claims.tenant_id !== void 0 || claims.application_code !== void 0) return false;
	return typeof claims.exp === "number" && claims.exp * 1e3 > nowMs;
}
/** Parses a session payload, accepting it only when it is for the expected application. */
function toSession(value, expectedCode) {
	if (!value || typeof value !== "object") return null;
	const v = value;
	if (typeof v.token !== "string" || v.applicationCode !== expectedCode || typeof v.tenantId !== "string") return null;
	return {
		token: v.token,
		applicationCode: expectedCode,
		tenantId: v.tenantId,
		tenantSlug: typeof v.tenantSlug === "string" ? v.tenantSlug : "",
		tenantName: typeof v.tenantName === "string" ? v.tenantName : "",
		role: typeof v.role === "string" ? v.role : ""
	};
}
function isKnownApplicationCode(value) {
	return typeof value === "string" && /^[A-Z][A-Z0-9_]{1,47}$/.test(value);
}
/** The workspaces that grant this application, for the one-click sign-in list. */
function workspacesFor(applications, applicationCode) {
	if (!applications) return [];
	return applications.workspaces.filter((workspace) => workspace.applications.some((application) => application.applicationCode === applicationCode));
}
/** Parses /api/users/me/workspaces, dropping anything malformed or naming an unknown application. */
function parseMyApplications(body) {
	const raw = body ?? {};
	return {
		platform: Array.isArray(raw.platform) ? raw.platform.flatMap((entry) => {
			const item = entry;
			return isKnownApplicationCode(item.applicationCode) && typeof item.displayName === "string" ? [{
				applicationCode: item.applicationCode,
				displayName: item.displayName
			}] : [];
		}) : [],
		workspaces: Array.isArray(raw.workspaces) ? raw.workspaces.flatMap((entry) => {
			const item = entry;
			if (typeof item.tenantId !== "string" || typeof item.slug !== "string" || typeof item.name !== "string") return [];
			const applications = Array.isArray(item.applications) ? item.applications.flatMap((app) => {
				const a = app;
				return isKnownApplicationCode(a.applicationCode) && typeof a.displayName === "string" && typeof a.role === "string" ? [{
					applicationCode: a.applicationCode,
					displayName: a.displayName,
					role: a.role
				}] : [];
			}) : [];
			return [{
				tenantId: item.tenantId,
				slug: item.slug,
				name: item.name,
				applications
			}];
		}) : []
	};
}
async function fetchMyApplications(platformToken, fetchImpl = fetch, apiBaseUrl = "") {
	const response = await fetchImpl(`${apiBaseUrl}/api/users/me/workspaces`, { headers: { Authorization: `Bearer ${platformToken}` } });
	if (!response.ok) throw new ApplicationSignInError("Your workspaces could not be loaded.", response.status);
	return parseMyApplications(await response.json().catch(() => null));
}
/** Opens a client application with the current account sign-in; no password is sent again. */
async function exchangeForApplication(request, platformToken, fetchImpl = fetch, apiBaseUrl = "") {
	let response;
	try {
		response = await fetchImpl(`${apiBaseUrl}/api/users/login/application/exchange`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${platformToken}`
			},
			body: JSON.stringify({
				applicationCode: request.applicationCode,
				tenantSlug: request.tenantSlug
			})
		});
	} catch {
		throw new ApplicationSignInError("The sign-in service could not be reached. Try again shortly.", 0);
	}
	const body = await response.json().catch(() => null);
	if (!response.ok) throw new ApplicationSignInError({
		401: "Your sign-in has ended. Sign in again.",
		403: "Your account does not have access to this application for that client.",
		429: "Too many sign-in attempts. Wait a minute and try again."
	}[response.status] ?? "Sign in failed. Please try again.", response.status);
	const session = body && typeof body.token === "string" && typeof body.tenantId === "string" ? {
		token: body.token,
		applicationCode: request.applicationCode,
		tenantId: body.tenantId,
		tenantSlug: typeof body.tenantSlug === "string" ? body.tenantSlug : request.tenantSlug,
		tenantName: typeof body.tenantName === "string" ? body.tenantName : "",
		role: typeof body.role === "string" ? body.role : ""
	} : null;
	if (!session || !isUsableApplicationToken(session.token, request.applicationCode, session.tenantId)) throw new ApplicationSignInError("The sign-in response was not valid for this application.", response.status);
	return session;
}
// ../shared-library/src/auth/requestRoutes.ts
var RULES = [
	{
		pattern: /^\/api\/products\/admin\/analytics(\/|$)/,
		application: null
	},
	{
		pattern: /^\/api\/products\/admin(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/orders\/admin(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/stock\/admin(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/crm(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/errors\/admin(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/loyalty\/admin(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/loyalty\/\d+\/(bonus|earn)$/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/procurement\/ucp(\/|$)/,
		application: "INVENTORY"
	},
	{
		pattern: /^\/api\/procurement(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	},
	{
		pattern: /^\/api\/inventory(\/|$)/,
		application: "INVENTORY"
	},
	{
		pattern: /^\/api\/accounting\/admin(\/|$)/,
		application: "ACCOUNTING"
	},
	{
		pattern: /^\/api\/admin\/qa(\/|$)/,
		application: "QUALITY_CENTER"
	},
	{
		pattern: /^\/api\/delivery(\/|$)/,
		application: "DELIVERY_OPS"
	},
	{
		pattern: /^\/api\/tenant(\/|$)/,
		application: "ECOMMERCE_ADMIN"
	}
];
/** The path part of a request URL (absolute or relative, with or without a query string). */
function requestPath(url) {
	let path = url.trim();
	const scheme = path.indexOf("://");
	if (scheme >= 0) {
		const slash = path.indexOf("/", scheme + 3);
		path = slash >= 0 ? path.slice(slash) : "/";
	}
	path = path.split(/[?#]/)[0];
	if (!path.startsWith("/")) path = "/" + path;
	return path.replace(/\/{2,}/g, "/");
}
/** The application whose token a request needs, or undefined when the platform token applies. */
function applicationForRequest(url) {
	const path = requestPath(url);
	for (const rule of RULES) if (rule.pattern.test(path)) return rule.application ?? void 0;
}
/**
* Picks the token: the application session's token for tenant-scoped admin APIs (null without a session, so the
* request fails closed), otherwise the platform login token.
*/
function pickToken(url, sessionToken, local) {
	const application = applicationForRequest(url);
	if (application) return sessionToken(application) ?? null;
	return local?.getItem("jwt_token") || local?.getItem("token") || null;
}
// ../shared-library/src/auth/requestAuth.ts
function requestToken(url, session = globalThis.sessionStorage, local = globalThis.localStorage) {
	return pickToken(url, (application) => readApplicationSession(application, session)?.token, local);
}
// ../shared-library/src/components/ApplicationGate.tsx
var { useEffect, useState: useState$1 } = await importShared("react");
/** The account sign-in kept by the shell (localStorage 'jwt_token'), when it is a live platform token. */
function accountToken() {
	try {
		const token = localStorage.getItem("jwt_token");
		return token && isUsablePlatformToken(token) ? token : null;
	} catch {
		return null;
	}
}
/**
* Shows its children only with a valid session for this application (a tenant-scoped token). A signed-in person picks
* one of their workspaces that grants the application and opens it without typing a password again (token exchange);
* otherwise they enter the client workspace and credentials. The session lives in sessionStorage, so every screen of
* the same application shares it until the browser session ends or they switch workspace.
*/
function ApplicationGate({ applicationCode, applicationName, children }) {
	const [session, setSession] = useState$1(() => readApplicationSession(applicationCode, sessionStorage));
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationSignIn, {
		applicationCode,
		applicationName,
		onAuthenticated: (next) => {
			storeApplicationSession(next, sessionStorage);
			setSession(next);
		}
	});
	const signOut = () => {
		clearApplicationSession(applicationCode, sessionStorage);
		setSession(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		style: styles$1.bar,
		"data-testid": "application-session-bar",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			style: styles$1.muted,
			children: [
				applicationName,
				" · ",
				session.tenantName || session.tenantSlug,
				" · ",
				session.role
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: signOut,
			style: styles$1.linkButton,
			children: "Switch workspace"
		})]
	}), children] });
}
function ApplicationSignIn({ applicationCode, applicationName, onAuthenticated }) {
	const [tenantSlug, setTenantSlug] = useState$1("");
	const [email, setEmail] = useState$1("");
	const [password, setPassword] = useState$1("");
	const [error, setError] = useState$1("");
	const [submitting, setSubmitting] = useState$1(false);
	const [workspaces, setWorkspaces] = useState$1(null);
	const [showForm, setShowForm] = useState$1(false);
	const token = accountToken();
	useEffect(() => {
		if (!token) {
			setWorkspaces([]);
			return;
		}
		let active = true;
		fetchMyApplications(token).then((mine) => {
			if (active) setWorkspaces(workspacesFor(mine, applicationCode));
		}).catch(() => {
			if (active) setWorkspaces([]);
		});
		return () => {
			active = false;
		};
	}, [token, applicationCode]);
	const run = async (attempt) => {
		setError("");
		setSubmitting(true);
		try {
			onAuthenticated(await attempt());
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Sign in failed. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};
	const signIn = (event) => {
		event.preventDefault();
		run(() => signInToApplication({
			applicationCode,
			tenantSlug,
			email,
			password
		}));
	};
	const quickList = token && workspaces && workspaces.length > 0 && !showForm;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: styles$1.page,
		children: quickList ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: styles$1.card,
			"aria-label": `Choose a workspace for ${applicationName}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					style: styles$1.title,
					children: ["Open ", applicationName]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: styles$1.muted,
					children: "Choose the client workspace to work in. You stay signed in with your account."
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "alert",
					style: styles$1.error,
					children: error
				}),
				workspaces.map((workspace) => {
					const role = workspace.applications.find((app) => app.applicationCode === applicationCode)?.role;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: submitting,
						style: styles$1.workspace,
						onClick: () => void run(() => exchangeForApplication({
							applicationCode,
							tenantSlug: workspace.slug
						}, token)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: workspace.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							style: styles$1.muted,
							children: [workspace.slug, role ? ` · ${role}` : ""]
						})]
					}, workspace.tenantId);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setShowForm(true),
					style: styles$1.linkButton,
					children: "Use a different account"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: signIn,
			style: styles$1.card,
			"aria-label": `Sign in to ${applicationName}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					style: styles$1.title,
					children: ["Sign in to ", applicationName]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: styles$1.muted,
					children: token && workspaces && workspaces.length === 0 ? "Your account has no workspace with this application. Sign in with an account that has access, or ask your client owner." : "Use your client workspace and account. Access is checked for this application."
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "alert",
					style: styles$1.error,
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					style: styles$1.label,
					children: ["Client workspace", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						style: styles$1.input,
						value: tenantSlug,
						onChange: (e) => setTenantSlug(e.target.value),
						placeholder: "legacy",
						autoComplete: "organization",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					style: styles$1.label,
					children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						style: styles$1.input,
						value: email,
						onChange: (e) => setEmail(e.target.value),
						autoComplete: "username",
						type: "email",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					style: styles$1.label,
					children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						style: styles$1.input,
						value: password,
						onChange: (e) => setPassword(e.target.value),
						autoComplete: "current-password",
						type: "password",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: submitting,
					style: styles$1.primary,
					children: submitting ? "Signing in…" : `Continue to ${applicationName}`
				}),
				token && workspaces && workspaces.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setShowForm(false),
					style: styles$1.linkButton,
					children: "Back to my workspaces"
				})
			]
		})
	});
}
var styles$1 = {
	page: {
		minHeight: "60vh",
		display: "grid",
		placeItems: "center",
		padding: "32px 16px"
	},
	card: {
		width: "min(100%, 440px)",
		display: "grid",
		gap: 14,
		padding: 28,
		borderRadius: 16,
		border: "1px solid rgba(127,127,127,.25)",
		background: "var(--ucp-surface, inherit)",
		color: "inherit",
		fontFamily: "inherit"
	},
	title: {
		margin: 0,
		fontSize: 22,
		fontWeight: 800
	},
	muted: {
		margin: 0,
		opacity: .75,
		fontSize: 14
	},
	label: {
		display: "grid",
		gap: 6,
		fontSize: 13,
		fontWeight: 600
	},
	input: {
		padding: "10px 12px",
		borderRadius: 8,
		border: "1px solid rgba(127,127,127,.4)",
		font: "inherit",
		fontWeight: 400
	},
	primary: {
		minHeight: 46,
		borderRadius: 8,
		border: 0,
		background: "#4F46E5",
		color: "#fff",
		fontWeight: 800,
		font: "inherit",
		cursor: "pointer"
	},
	workspace: {
		display: "grid",
		gap: 2,
		textAlign: "left",
		padding: "12px 14px",
		borderRadius: 10,
		cursor: "pointer",
		border: "1px solid rgba(127,127,127,.35)",
		background: "transparent",
		color: "inherit",
		font: "inherit"
	},
	error: {
		padding: "10px 12px",
		borderRadius: 8,
		background: "rgba(220,38,38,.12)",
		color: "#B91C1C",
		fontSize: 14
	},
	bar: {
		display: "flex",
		justifyContent: "flex-end",
		alignItems: "center",
		gap: 12,
		padding: "6px 16px",
		borderBottom: "1px solid rgba(127,127,127,.2)",
		fontSize: 13
	},
	linkButton: {
		background: "none",
		border: 0,
		color: "#4F46E5",
		cursor: "pointer",
		font: "inherit",
		fontWeight: 600,
		justifySelf: "start"
	}
};
// ../node_modules/@mui/private-theming/useTheme/ThemeContext.js
var ThemeContext = /*#__PURE__*/ (await importShared("react")).createContext(null);
// ../node_modules/@mui/private-theming/useTheme/useTheme.js
var React$6 = await importShared("react");
function useTheme() {
	return React$6.useContext(ThemeContext);
}
var nested_default = typeof Symbol === "function" && Symbol.for ? Symbol.for("mui.nested") : "__THEME_NESTED__";
// ../node_modules/@mui/private-theming/ThemeProvider/ThemeProvider.js
var React$5 = await importShared("react");
function mergeOuterLocalTheme(outerTheme, localTheme) {
	if (typeof localTheme === "function") return localTheme(outerTheme);
	return {
		...outerTheme,
		...localTheme
	};
}
/**
* This component takes a `theme` prop.
* It makes the `theme` available down the React tree thanks to React context.
* This component should preferably be used at **the root of your component tree**.
*/
function ThemeProvider$2(props) {
	const { children, theme: localTheme } = props;
	const outerTheme = useTheme();
	const theme = React$5.useMemo(() => {
		const output = outerTheme === null ? { ...localTheme } : mergeOuterLocalTheme(outerTheme, localTheme);
		if (output != null) output[nested_default] = outerTheme !== null;
		return output;
	}, [localTheme, outerTheme]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ThemeContext.Provider, {
		value: theme,
		children
	});
}
// ../node_modules/@mui/system/esm/ThemeProvider/useLayerOrder.js
/**
* This hook returns a `GlobalStyles` component that sets the CSS layer order (for server-side rendering).
* Then on client-side, it injects the CSS layer order into the document head to ensure that the layer order is always present first before other Emotion styles.
*/
await importShared("react");
function useLayerOrder(theme) {
	const upperTheme = useTheme$1();
	const id = useId() || "";
	const { modularCssLayers } = theme;
	let layerOrder = "mui.global, mui.components, mui.theme, mui.custom, mui.sx";
	if (!modularCssLayers || upperTheme !== null) layerOrder = "";
	else if (typeof modularCssLayers === "string") layerOrder = modularCssLayers.replace(/mui(?!\.)/g, layerOrder);
	else layerOrder = `@layer ${layerOrder};`;
	useEnhancedEffect(() => {
		const head = document.querySelector("head");
		if (!head) return;
		const firstChild = head.firstChild;
		if (layerOrder) {
			if (firstChild && firstChild.hasAttribute?.("data-mui-layer-order") && firstChild.getAttribute("data-mui-layer-order") === id) return;
			const styleElement = document.createElement("style");
			styleElement.setAttribute("data-mui-layer-order", id);
			styleElement.textContent = layerOrder;
			head.prepend(styleElement);
		} else head.querySelector(`style[data-mui-layer-order="${id}"]`)?.remove();
	}, [layerOrder, id]);
	if (!layerOrder) return null;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(GlobalStyles$1, { styles: layerOrder });
}
// ../node_modules/@mui/system/esm/ThemeProvider/ThemeProvider.js
var React$4 = await importShared("react");
var EMPTY_THEME = {};
function useThemeScoping(themeId, upperTheme, localTheme, isPrivate = false) {
	return React$4.useMemo(() => {
		const resolvedTheme = themeId ? upperTheme[themeId] || upperTheme : upperTheme;
		if (typeof localTheme === "function") {
			const mergedTheme = localTheme(resolvedTheme);
			const result = themeId ? {
				...upperTheme,
				[themeId]: mergedTheme
			} : mergedTheme;
			if (isPrivate) return () => result;
			return result;
		}
		return themeId ? {
			...upperTheme,
			[themeId]: localTheme
		} : {
			...upperTheme,
			...localTheme
		};
	}, [
		themeId,
		upperTheme,
		localTheme,
		isPrivate
	]);
}
/**
* This component makes the `theme` available down the React tree.
* It should preferably be used at **the root of your component tree**.
*
* <ThemeProvider theme={theme}> // existing use case
* <ThemeProvider theme={{ id: theme }}> // theme scoping
*/
function ThemeProvider$1(props) {
	const { children, theme: localTheme, themeId } = props;
	const upperTheme = useTheme$1(EMPTY_THEME);
	const upperPrivateTheme = useTheme() || EMPTY_THEME;
	const engineTheme = useThemeScoping(themeId, upperTheme, localTheme);
	const privateTheme = useThemeScoping(themeId, upperPrivateTheme, localTheme, true);
	const rtlValue = (themeId ? engineTheme[themeId] : engineTheme).direction === "rtl";
	const layerOrder = useLayerOrder(engineTheme);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ThemeProvider$2, {
		theme: privateTheme,
		children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ThemeContext$1.Provider, {
			value: engineTheme,
			children: /*#__PURE__*/ (0, import_jsx_runtime.jsx)(RtlProvider, {
				value: rtlValue,
				children: /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(DefaultPropsProvider, {
					value: themeId ? engineTheme[themeId].components : engineTheme.components,
					children: [layerOrder, children]
				})
			})
		})
	});
}
// ../node_modules/@mui/system/esm/InitColorSchemeScript/InitColorSchemeScript.js
await importShared("react");
var DEFAULT_MODE_STORAGE_KEY = "mode";
var DEFAULT_COLOR_SCHEME_STORAGE_KEY = "color-scheme";
var DEFAULT_ATTRIBUTE = "data-color-scheme";
function InitColorSchemeScript(options) {
	const { defaultMode = "system", defaultLightColorScheme = "light", defaultDarkColorScheme = "dark", modeStorageKey = DEFAULT_MODE_STORAGE_KEY, colorSchemeStorageKey = DEFAULT_COLOR_SCHEME_STORAGE_KEY, attribute: initialAttribute = DEFAULT_ATTRIBUTE, colorSchemeNode = "document.documentElement", nonce } = options || {};
	let setter = "";
	let attribute = initialAttribute;
	if (initialAttribute === "class") attribute = ".%s";
	if (initialAttribute === "data") attribute = "[data-%s]";
	if (attribute.startsWith(".")) {
		const selector = attribute.substring(1);
		setter += `${colorSchemeNode}.classList.remove('${selector}'.replace('%s', light), '${selector}'.replace('%s', dark));
      ${colorSchemeNode}.classList.add('${selector}'.replace('%s', colorScheme));`;
	}
	const matches = attribute.match(/\[([^\]]+)\]/);
	if (matches) {
		const [attr, value] = matches[1].split("=");
		if (!value) setter += `${colorSchemeNode}.removeAttribute('${attr}'.replace('%s', light));
      ${colorSchemeNode}.removeAttribute('${attr}'.replace('%s', dark));`;
		setter += `
      ${colorSchemeNode}.setAttribute('${attr}'.replace('%s', colorScheme), ${value ? `${value}.replace('%s', colorScheme)` : "\"\""});`;
	} else setter += `${colorSchemeNode}.setAttribute('${attribute}', colorScheme);`;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("script", {
		suppressHydrationWarning: true,
		nonce: typeof window === "undefined" ? nonce : "",
		dangerouslySetInnerHTML: { __html: `(function() {
try {
  let colorScheme = '';
  const mode = localStorage.getItem('${modeStorageKey}') || '${defaultMode}';
  const dark = localStorage.getItem('${colorSchemeStorageKey}-dark') || '${defaultDarkColorScheme}';
  const light = localStorage.getItem('${colorSchemeStorageKey}-light') || '${defaultLightColorScheme}';
  if (mode === 'system') {
    // handle system mode
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (mql.matches) {
      colorScheme = dark
    } else {
      colorScheme = light
    }
  }
  if (mode === 'light') {
    colorScheme = light;
  }
  if (mode === 'dark') {
    colorScheme = dark;
  }
  if (colorScheme) {
    ${setter}
  }
} catch(e){}})();` }
	}, "mui-color-scheme-init");
}
// ../node_modules/@mui/system/esm/cssVars/localStorageManager.js
function noop$1() {}
var localStorageManager = ({ key, storageWindow }) => {
	if (!storageWindow && typeof window !== "undefined") storageWindow = window;
	return {
		get(defaultValue) {
			if (typeof window === "undefined") return;
			if (!storageWindow) return defaultValue;
			let value;
			try {
				value = storageWindow.localStorage.getItem(key);
			} catch {}
			return value || defaultValue;
		},
		set: (value) => {
			if (storageWindow) try {
				storageWindow.localStorage.setItem(key, value);
			} catch {}
		},
		subscribe: (handler) => {
			if (!storageWindow) return noop$1;
			const listener = (event) => {
				const value = event.newValue;
				if (event.key === key) handler(value);
			};
			storageWindow.addEventListener("storage", listener);
			return () => {
				storageWindow.removeEventListener("storage", listener);
			};
		}
	};
};
// ../node_modules/@mui/system/esm/cssVars/useCurrentColorScheme.js
var React$3 = await importShared("react");
function noop() {}
function getSystemMode(mode) {
	if (typeof window !== "undefined" && typeof window.matchMedia === "function" && mode === "system") {
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
		return "light";
	}
}
function processState(state, callback) {
	if (state.mode === "light" || state.mode === "system" && state.systemMode === "light") return callback("light");
	if (state.mode === "dark" || state.mode === "system" && state.systemMode === "dark") return callback("dark");
}
function getColorScheme(state) {
	return processState(state, (mode) => {
		if (mode === "light") return state.lightColorScheme;
		if (mode === "dark") return state.darkColorScheme;
	});
}
function useCurrentColorScheme(options) {
	const { defaultMode = "light", defaultLightColorScheme, defaultDarkColorScheme, supportedColorSchemes = [], modeStorageKey = DEFAULT_MODE_STORAGE_KEY, colorSchemeStorageKey = DEFAULT_COLOR_SCHEME_STORAGE_KEY, storageWindow = typeof window === "undefined" ? void 0 : window, storageManager = localStorageManager, noSsr = false } = options;
	const joinedColorSchemes = supportedColorSchemes.join(",");
	const isMultiSchemes = supportedColorSchemes.length > 1;
	const modeStorage = React$3.useMemo(() => storageManager?.({
		key: modeStorageKey,
		storageWindow
	}), [
		storageManager,
		modeStorageKey,
		storageWindow
	]);
	const lightStorage = React$3.useMemo(() => storageManager?.({
		key: `${colorSchemeStorageKey}-light`,
		storageWindow
	}), [
		storageManager,
		colorSchemeStorageKey,
		storageWindow
	]);
	const darkStorage = React$3.useMemo(() => storageManager?.({
		key: `${colorSchemeStorageKey}-dark`,
		storageWindow
	}), [
		storageManager,
		colorSchemeStorageKey,
		storageWindow
	]);
	const [state, setState] = React$3.useState(() => {
		const initialMode = modeStorage?.get(defaultMode) || defaultMode;
		const lightColorScheme = lightStorage?.get(defaultLightColorScheme) || defaultLightColorScheme;
		const darkColorScheme = darkStorage?.get(defaultDarkColorScheme) || defaultDarkColorScheme;
		return {
			mode: initialMode,
			systemMode: getSystemMode(initialMode),
			lightColorScheme,
			darkColorScheme
		};
	});
	const [isClient, setIsClient] = React$3.useState(noSsr || !isMultiSchemes);
	React$3.useEffect(() => {
		setIsClient(true);
	}, []);
	const colorScheme = getColorScheme(state);
	const setMode = React$3.useCallback((mode) => {
		setState((currentState) => {
			if (mode === currentState.mode) return currentState;
			const newMode = mode ?? defaultMode;
			modeStorage?.set(newMode);
			return {
				...currentState,
				mode: newMode,
				systemMode: getSystemMode(newMode)
			};
		});
	}, [modeStorage, defaultMode]);
	const setColorScheme = React$3.useCallback((value) => {
		if (!value) setState((currentState) => {
			lightStorage?.set(defaultLightColorScheme);
			darkStorage?.set(defaultDarkColorScheme);
			return {
				...currentState,
				lightColorScheme: defaultLightColorScheme,
				darkColorScheme: defaultDarkColorScheme
			};
		});
		else if (typeof value === "string") {
			if (value && !joinedColorSchemes.includes(value)) console.error(`\`${value}\` does not exist in \`theme.colorSchemes\`.`);
			else setState((currentState) => {
				const newState = { ...currentState };
				processState(currentState, (mode) => {
					if (mode === "light") {
						lightStorage?.set(value);
						newState.lightColorScheme = value;
					}
					if (mode === "dark") {
						darkStorage?.set(value);
						newState.darkColorScheme = value;
					}
				});
				return newState;
			});
		} else setState((currentState) => {
			const newState = { ...currentState };
			const newLightColorScheme = value.light === null ? defaultLightColorScheme : value.light;
			const newDarkColorScheme = value.dark === null ? defaultDarkColorScheme : value.dark;
			if (newLightColorScheme) {
				if (!joinedColorSchemes.includes(newLightColorScheme)) console.error(`\`${newLightColorScheme}\` does not exist in \`theme.colorSchemes\`.`);
				else {
					newState.lightColorScheme = newLightColorScheme;
					lightStorage?.set(newLightColorScheme);
				}
			}
			if (newDarkColorScheme) {
				if (!joinedColorSchemes.includes(newDarkColorScheme)) console.error(`\`${newDarkColorScheme}\` does not exist in \`theme.colorSchemes\`.`);
				else {
					newState.darkColorScheme = newDarkColorScheme;
					darkStorage?.set(newDarkColorScheme);
				}
			}
			return newState;
		});
	}, [
		joinedColorSchemes,
		lightStorage,
		darkStorage,
		defaultLightColorScheme,
		defaultDarkColorScheme
	]);
	const handleMediaQuery = React$3.useCallback((event) => {
		if (state.mode === "system") setState((currentState) => {
			const systemMode = event?.matches ? "dark" : "light";
			if (currentState.systemMode === systemMode) return currentState;
			return {
				...currentState,
				systemMode
			};
		});
	}, [state.mode]);
	const mediaListener = React$3.useRef(handleMediaQuery);
	mediaListener.current = handleMediaQuery;
	React$3.useEffect(() => {
		if (typeof window.matchMedia !== "function" || !isMultiSchemes) return;
		const handler = (...args) => mediaListener.current(...args);
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		media.addListener(handler);
		handler(media);
		return () => {
			media.removeListener(handler);
		};
	}, [isMultiSchemes]);
	React$3.useEffect(() => {
		if (isMultiSchemes) {
			const unsubscribeMode = modeStorage?.subscribe((value) => {
				if (!value || [
					"light",
					"dark",
					"system"
				].includes(value)) setMode(value || defaultMode);
			}) || noop;
			const unsubscribeLight = lightStorage?.subscribe((value) => {
				if (!value || joinedColorSchemes.match(value)) setColorScheme({ light: value });
			}) || noop;
			const unsubscribeDark = darkStorage?.subscribe((value) => {
				if (!value || joinedColorSchemes.match(value)) setColorScheme({ dark: value });
			}) || noop;
			return () => {
				unsubscribeMode();
				unsubscribeLight();
				unsubscribeDark();
			};
		}
	}, [
		setColorScheme,
		setMode,
		joinedColorSchemes,
		defaultMode,
		storageWindow,
		isMultiSchemes,
		modeStorage,
		lightStorage,
		darkStorage
	]);
	return {
		...state,
		mode: isClient ? state.mode : void 0,
		systemMode: isClient ? state.systemMode : void 0,
		colorScheme: isClient ? colorScheme : void 0,
		setMode,
		setColorScheme
	};
}
// ../node_modules/@mui/system/esm/cssVars/createCssVarsProvider.js
var React$2 = await importShared("react");
var DISABLE_CSS_TRANSITION = "*{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}";
function createCssVarsProvider(options) {
	const { themeId, theme: defaultTheme = {}, modeStorageKey: defaultModeStorageKey = DEFAULT_MODE_STORAGE_KEY, colorSchemeStorageKey: defaultColorSchemeStorageKey = DEFAULT_COLOR_SCHEME_STORAGE_KEY, disableTransitionOnChange: designSystemTransitionOnChange = false, defaultColorScheme, resolveTheme } = options;
	const defaultContext = {
		allColorSchemes: [],
		colorScheme: void 0,
		darkColorScheme: void 0,
		lightColorScheme: void 0,
		mode: void 0,
		setColorScheme: () => {},
		setMode: () => {},
		systemMode: void 0
	};
	const ColorSchemeContext = /*#__PURE__*/ React$2.createContext(void 0);
	const useColorScheme = () => React$2.useContext(ColorSchemeContext) || defaultContext;
	const defaultColorSchemes = {};
	const defaultComponents = {};
	function CssVarsProvider(props) {
		const { children, theme: themeProp, modeStorageKey = defaultModeStorageKey, colorSchemeStorageKey = defaultColorSchemeStorageKey, disableTransitionOnChange = designSystemTransitionOnChange, storageManager, storageWindow = typeof window === "undefined" ? void 0 : window, documentNode = typeof document === "undefined" ? void 0 : document, colorSchemeNode = typeof document === "undefined" ? void 0 : document.documentElement, disableNestedContext = false, disableStyleSheetGeneration = false, defaultMode: initialMode = "system", noSsr } = props;
		const hasMounted = React$2.useRef(false);
		const upperTheme = useTheme();
		const ctx = React$2.useContext(ColorSchemeContext);
		const nested = !!ctx && !disableNestedContext;
		const initialTheme = React$2.useMemo(() => {
			if (themeProp) return themeProp;
			return typeof defaultTheme === "function" ? defaultTheme() : defaultTheme;
		}, [themeProp]);
		const scopedTheme = initialTheme[themeId];
		const restThemeProp = scopedTheme || initialTheme;
		const { colorSchemes = defaultColorSchemes, components = defaultComponents, cssVarPrefix } = restThemeProp;
		const joinedColorSchemes = Object.keys(colorSchemes).filter((k) => !!colorSchemes[k]).join(",");
		const allColorSchemes = React$2.useMemo(() => joinedColorSchemes.split(","), [joinedColorSchemes]);
		const defaultLightColorScheme = typeof defaultColorScheme === "string" ? defaultColorScheme : defaultColorScheme.light;
		const defaultDarkColorScheme = typeof defaultColorScheme === "string" ? defaultColorScheme : defaultColorScheme.dark;
		const { mode: stateMode, setMode, systemMode, lightColorScheme, darkColorScheme, colorScheme: stateColorScheme, setColorScheme } = useCurrentColorScheme({
			supportedColorSchemes: allColorSchemes,
			defaultLightColorScheme,
			defaultDarkColorScheme,
			modeStorageKey,
			colorSchemeStorageKey,
			defaultMode: colorSchemes[defaultLightColorScheme] && colorSchemes[defaultDarkColorScheme] ? initialMode : colorSchemes[restThemeProp.defaultColorScheme]?.palette?.mode || restThemeProp.palette?.mode,
			storageManager,
			storageWindow,
			noSsr
		});
		let mode = stateMode;
		let colorScheme = stateColorScheme;
		if (nested) {
			mode = ctx.mode;
			colorScheme = ctx.colorScheme;
		}
		const memoTheme = React$2.useMemo(() => {
			const calculatedColorScheme = colorScheme || restThemeProp.defaultColorScheme;
			const themeVars = restThemeProp.generateThemeVars?.() || restThemeProp.vars;
			const theme = {
				...restThemeProp,
				components,
				colorSchemes,
				cssVarPrefix,
				vars: themeVars
			};
			if (typeof theme.generateSpacing === "function") theme.spacing = theme.generateSpacing();
			if (calculatedColorScheme) {
				const scheme = colorSchemes[calculatedColorScheme];
				if (scheme && typeof scheme === "object") Object.keys(scheme).forEach((schemeKey) => {
					if (scheme[schemeKey] && typeof scheme[schemeKey] === "object") theme[schemeKey] = {
						...theme[schemeKey],
						...scheme[schemeKey]
					};
					else theme[schemeKey] = scheme[schemeKey];
				});
			}
			return resolveTheme ? resolveTheme(theme) : theme;
		}, [
			restThemeProp,
			colorScheme,
			components,
			colorSchemes,
			cssVarPrefix
		]);
		const colorSchemeSelector = restThemeProp.colorSchemeSelector;
		useEnhancedEffect(() => {
			if (colorScheme && colorSchemeNode && colorSchemeSelector && colorSchemeSelector !== "media") {
				const selector = colorSchemeSelector;
				let rule = colorSchemeSelector;
				if (selector === "class") rule = `.%s`;
				if (selector === "data") rule = `[data-%s]`;
				if (selector?.startsWith("data-") && !selector.includes("%s")) rule = `[${selector}="%s"]`;
				if (rule.startsWith(".")) {
					colorSchemeNode.classList.remove(...allColorSchemes.map((scheme) => rule.substring(1).replace("%s", scheme)));
					colorSchemeNode.classList.add(rule.substring(1).replace("%s", colorScheme));
				} else {
					const matches = rule.replace("%s", colorScheme).match(/\[([^\]]+)\]/);
					if (matches) {
						const [attr, value] = matches[1].split("=");
						if (!value) allColorSchemes.forEach((scheme) => {
							colorSchemeNode.removeAttribute(attr.replace(colorScheme, scheme));
						});
						colorSchemeNode.setAttribute(attr, value ? value.replace(/"|'/g, "") : "");
					} else colorSchemeNode.setAttribute(rule, colorScheme);
				}
			}
		}, [
			colorScheme,
			colorSchemeSelector,
			colorSchemeNode,
			allColorSchemes
		]);
		React$2.useEffect(() => {
			let timer;
			if (disableTransitionOnChange && hasMounted.current && documentNode) {
				const css = documentNode.createElement("style");
				css.appendChild(documentNode.createTextNode(DISABLE_CSS_TRANSITION));
				documentNode.head.appendChild(css);
				(() => window.getComputedStyle(documentNode.body))();
				timer = setTimeout(() => {
					documentNode.head.removeChild(css);
				}, 1);
			}
			return () => {
				clearTimeout(timer);
			};
		}, [
			colorScheme,
			disableTransitionOnChange,
			documentNode
		]);
		React$2.useEffect(() => {
			hasMounted.current = true;
			return () => {
				hasMounted.current = false;
			};
		}, []);
		const contextValue = React$2.useMemo(() => ({
			allColorSchemes,
			colorScheme,
			darkColorScheme,
			lightColorScheme,
			mode,
			setColorScheme,
			setMode,
			systemMode
		}), [
			allColorSchemes,
			colorScheme,
			darkColorScheme,
			lightColorScheme,
			mode,
			setColorScheme,
			setMode,
			systemMode,
			memoTheme.colorSchemeSelector
		]);
		let shouldGenerateStyleSheet = true;
		if (disableStyleSheetGeneration || restThemeProp.cssVariables === false || nested && upperTheme?.cssVarPrefix === cssVarPrefix) shouldGenerateStyleSheet = false;
		const element = /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(React$2.Fragment, { children: [/*#__PURE__*/ (0, import_jsx_runtime.jsx)(ThemeProvider$1, {
			themeId: scopedTheme ? themeId : void 0,
			theme: memoTheme,
			children
		}), shouldGenerateStyleSheet && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(GlobalStyles$2, { styles: memoTheme.generateStyleSheets?.() || [] })] });
		if (nested) return element;
		return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ColorSchemeContext.Provider, {
			value: contextValue,
			children: element
		});
	}
	const defaultLightColorScheme = typeof defaultColorScheme === "string" ? defaultColorScheme : defaultColorScheme.light;
	const defaultDarkColorScheme = typeof defaultColorScheme === "string" ? defaultColorScheme : defaultColorScheme.dark;
	const getInitColorSchemeScript = (params) => InitColorSchemeScript({
		colorSchemeStorageKey: defaultColorSchemeStorageKey,
		defaultLightColorScheme,
		defaultDarkColorScheme,
		modeStorageKey: defaultModeStorageKey,
		...params
	});
	return {
		CssVarsProvider,
		useColorScheme,
		getInitColorSchemeScript
	};
}
// ../node_modules/@mui/material/styles/ThemeProviderNoVars.js
await importShared("react");
function ThemeProviderNoVars({ theme: themeInput, ...props }) {
	const scopedTheme = "$$material" in themeInput ? themeInput[identifier_default] : void 0;
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ThemeProvider$1, {
		...props,
		themeId: scopedTheme ? identifier_default : void 0,
		theme: scopedTheme || themeInput
	});
}
// ../node_modules/@mui/material/InitColorSchemeScript/InitColorSchemeScript.js
await importShared("react");
var defaultConfig = {
	attribute: "data-mui-color-scheme",
	colorSchemeStorageKey: "mui-color-scheme",
	defaultLightColorScheme: "light",
	defaultDarkColorScheme: "dark",
	modeStorageKey: "mui-mode"
};
// ../node_modules/@mui/material/styles/ThemeProviderWithVars.js
await importShared("react");
var { CssVarsProvider: InternalCssVarsProvider, useColorScheme, getInitColorSchemeScript: deprecatedGetInitColorSchemeScript } = createCssVarsProvider({
	themeId: identifier_default,
	theme: () => createTheme({ cssVariables: true }),
	colorSchemeStorageKey: defaultConfig.colorSchemeStorageKey,
	modeStorageKey: defaultConfig.modeStorageKey,
	defaultColorScheme: {
		light: defaultConfig.defaultLightColorScheme,
		dark: defaultConfig.defaultDarkColorScheme
	},
	resolveTheme: (theme) => {
		const newTheme = {
			...theme,
			typography: createTypography(theme.palette, theme.typography)
		};
		newTheme.unstable_sx = function sx(props) {
			return styleFunctionSx({
				sx: props,
				theme: this
			});
		};
		return newTheme;
	}
});
/**
* TODO: remove this export in v7
* @deprecated
* The `CssVarsProvider` component has been deprecated and ported into `ThemeProvider`.
*
* You should use `ThemeProvider` and `createTheme()` instead:
*
* ```diff
* - import { CssVarsProvider, extendTheme } from '@mui/material/styles';
* + import { ThemeProvider, createTheme } from '@mui/material/styles';
*
* - const theme = extendTheme();
* + const theme = createTheme({
* +   cssVariables: true,
* +   colorSchemes: { light: true, dark: true },
* + });
*
* - <CssVarsProvider theme={theme}>
* + <ThemeProvider theme={theme}>
* ```
*
* To see the full documentation, check out https://mui.com/material-ui/customization/css-theme-variables/usage/.
*/
var CssVarsProvider = InternalCssVarsProvider;
// ../node_modules/@mui/material/styles/ThemeProvider.js
var React$1 = await importShared("react");
function ThemeProvider({ theme, ...props }) {
	const noVarsTheme = React$1.useMemo(() => {
		if (typeof theme === "function") return theme;
		const muiTheme = "$$material" in theme ? theme[identifier_default] : theme;
		if (!("colorSchemes" in muiTheme)) {
			if (!("vars" in muiTheme)) return {
				...theme,
				vars: null
			};
			return theme;
		}
		return null;
	}, [theme]);
	if (noVarsTheme) return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(ThemeProviderNoVars, {
		theme: noVarsTheme,
		...props
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CssVarsProvider, {
		theme,
		...props
	});
}
// ../node_modules/@mui/material/CssBaseline/CssBaseline.js
var React = await importShared("react");
var isDynamicSupport = typeof globalCss({}) === "function";
var html = (theme, enableColorScheme) => ({
	WebkitFontSmoothing: "antialiased",
	MozOsxFontSmoothing: "grayscale",
	boxSizing: "border-box",
	WebkitTextSizeAdjust: "100%",
	...enableColorScheme && !theme.vars && { colorScheme: theme.palette.mode }
});
var body = (theme) => ({
	color: (theme.vars || theme).palette.text.primary,
	...theme.typography.body1,
	backgroundColor: (theme.vars || theme).palette.background.default,
	"@media print": { backgroundColor: (theme.vars || theme).palette.common.white }
});
var styles = (theme, enableColorScheme = false) => {
	const colorSchemeStyles = {};
	if (enableColorScheme && theme.colorSchemes && typeof theme.getColorSchemeSelector === "function") Object.entries(theme.colorSchemes).forEach(([key, scheme]) => {
		const selector = theme.getColorSchemeSelector(key);
		if (selector.startsWith("@")) colorSchemeStyles[selector] = { ":root": { colorScheme: scheme.palette?.mode } };
		else colorSchemeStyles[selector.replace(/\s*&/, "")] = { colorScheme: scheme.palette?.mode };
	});
	let defaultStyles = {
		html: html(theme, enableColorScheme),
		"*, *::before, *::after": { boxSizing: "inherit" },
		"strong, b": { fontWeight: theme.typography.fontWeightBold },
		body: {
			margin: 0,
			...body(theme),
			"&::backdrop": { backgroundColor: (theme.vars || theme).palette.background.default }
		},
		...colorSchemeStyles
	};
	const themeOverrides = theme.components?.MuiCssBaseline?.styleOverrides;
	if (themeOverrides) defaultStyles = [defaultStyles, themeOverrides];
	return defaultStyles;
};
var SELECTOR = "mui-ecs";
var staticStyles = (theme) => {
	const result = styles(theme, false);
	const baseStyles = Array.isArray(result) ? result[0] : result;
	if (!theme.vars && baseStyles) baseStyles.html[`:root:has(${SELECTOR})`] = { colorScheme: theme.palette.mode };
	if (theme.colorSchemes) Object.entries(theme.colorSchemes).forEach(([key, scheme]) => {
		const selector = theme.getColorSchemeSelector(key);
		if (selector.startsWith("@")) baseStyles[selector] = { [`:root:not(:has(.${SELECTOR}))`]: { colorScheme: scheme.palette?.mode } };
		else baseStyles[selector.replace(/\s*&/, "")] = { [`&:not(:has(.${SELECTOR}))`]: { colorScheme: scheme.palette?.mode } };
	});
	return result;
};
var GlobalStyles = globalCss(isDynamicSupport ? ({ theme, enableColorScheme }) => styles(theme, enableColorScheme) : ({ theme }) => staticStyles(theme));
/**
* Kickstart an elegant, consistent, and simple baseline to build upon.
*/
function CssBaseline(inProps) {
	const { children, enableColorScheme = false } = useDefaultProps({
		props: inProps,
		name: "MuiCssBaseline"
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(React.Fragment, { children: [
		isDynamicSupport && /*#__PURE__*/ (0, import_jsx_runtime.jsx)(GlobalStyles, { enableColorScheme }),
		!isDynamicSupport && !enableColorScheme && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("span", {
			className: SELECTOR,
			style: { display: "none" }
		}),
		children
	] });
}
// ../node_modules/@mui/icons-material/esm/DashboardRounded.js
var DashboardRounded_default = createSvgIcon(/*#__PURE__*/ (0, import_jsx_runtime.jsx)("path", { d: "M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1m0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1m10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1M13 4v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1" }), "DashboardRounded");
// ../node_modules/@mui/icons-material/esm/ViewListRounded.js
var ViewListRounded_default = createSvgIcon(/*#__PURE__*/ (0, import_jsx_runtime.jsx)("path", { d: "M4 14h2c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1m0 5h2c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1M4 9h2c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1m5 5h11c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1m0 5h11c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1M8 6v2c0 .55.45 1 1 1h11c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1" }), "ViewListRounded");
// src/App.tsx
var { useState } = await importShared("react");
axios.interceptors.request.use((config) => {
	if (typeof window !== "undefined") {
		const token = requestToken((config.baseURL || "") + (config.url || ""));
		if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
		const userStr = localStorage.getItem("user");
		if (userStr) try {
			const u = JSON.parse(userStr);
			if (u.role && !config.headers["X-User-Role"]) config.headers["X-User-Role"] = u.role;
			if (u.id && !config.headers["X-User-Id"]) config.headers["X-User-Id"] = String(u.id);
		} catch (e) {}
	}
	return config;
});
var darkTheme = createTheme({
	palette: {
		mode: "dark",
		primary: { main: "#4F46E5" },
		background: {
			default: "#0B0F19",
			paper: "#111827"
		},
		text: {
			primary: "#F8FAFC",
			secondary: "#94A3B8"
		}
	},
	typography: { fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif" }
});
function AppContent() {
	const [activeTab, setActiveTab] = useState("overview");
	const [selectedFingerprint, setSelectedFingerprint] = useState(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ThemeProvider, {
		theme: darkTheme,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CssBaseline, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Box, {
			sx: {
				bgcolor: "#0B0F19",
				minHeight: "100vh",
				py: 3
			},
			children: selectedFingerprint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorDetailPage, {
				fingerprint: selectedFingerprint,
				onBack: () => setSelectedFingerprint(null)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Box, {
				sx: {
					maxWidth: 1400,
					mx: "auto",
					px: 3
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Box, {
						sx: {
							borderBottom: "1px solid #1F2937",
							mb: 3
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
							value: activeTab,
							onChange: (_, val) => setActiveTab(val),
							sx: {
								"& .MuiTab-root": {
									color: "#94A3B8",
									fontWeight: 700,
									textTransform: "none",
									fontSize: "0.95rem"
								},
								"& .Mui-selected": { color: "#818CF8" },
								"& .MuiTabs-indicator": {
									bgcolor: "#4F46E5",
									height: 3
								}
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardRounded_default, {}),
								iconPosition: "start",
								label: "Executive Overview",
								value: "overview"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tab, {
								icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewListRounded_default, {}),
								iconPosition: "start",
								label: "Error Groups & Triage",
								value: "groups"
							})]
						})
					}),
					activeTab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorOverviewPage, { onSelectGroup: (fp) => setSelectedFingerprint(fp) }),
					activeTab === "groups" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorGroupsPage, { onSelectGroup: (fp) => setSelectedFingerprint(fp) })
				]
			})
		})]
	});
}
function App() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationGate, {
		applicationCode: "ECOMMERCE_ADMIN",
		applicationName: "E-commerce Admin",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppContent, {})
	});
}
export { App as t };
