import { r as importShared } from "../_virtual___federation_fn_import-93ZKRMKF.js";
import { t as require_jsx_runtime } from "../jsx-runtime-C4CQOM_b.js";
import { t as axios } from "../axios-CBjUy1wA.js";
// ../shared-library/src/services/AuthService.ts
var AuthService = {
	login: async (email, password) => {
		const response = await fetch("/api/users/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email,
				password
			})
		});
		if (!response.ok) {
			let errMsg = "Login failed";
			try {
				const errorData = await response.json();
				errMsg = errorData.error || errorData.message || errMsg;
			} catch {
				errMsg = `Login failed (${response.status} ${response.statusText})`;
			}
			throw new Error(errMsg);
		}
		return (await response.json()).token;
	},
	register: async (email, name, password) => {
		const response = await fetch("/api/users/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email,
				name,
				password
			})
		});
		if (!response.ok) {
			let errMsg = "Registration failed";
			try {
				const errorData = await response.json();
				errMsg = errorData.error || errorData.message || errMsg;
			} catch {
				errMsg = `Registration failed (${response.status} ${response.statusText})`;
			}
			throw new Error(errMsg);
		}
		return (await response.json()).token;
	}
};
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
		fulfilled: fulfilled || noop,
		pending: pending || noop,
		rejected: rejected || noop,
		settled: settled || noop
	});
}
function noop() {}
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
// ../shared-library/src/store/index.ts
var store = configureStore({ reducer: {
	auth: authSlice_default,
	cart: cartSlice_default
} });
// ../shared-library/src/components/RoleGuard.tsx
var import_jsx_runtime = require_jsx_runtime();
await importShared("react");
var { useSelector: useSelector$1 } = await importShared("react-redux");
var RoleGuard = ({ allowedRoles, children, fallback = null }) => {
	const user = useSelector$1((state) => state.auth.user);
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fallback });
	if (allowedRoles.includes(user.role) || user.role === "ADMIN" || user.role === "SUPER_ADMIN") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fallback });
};
// ../shared-library/src/auth/routeAccess.ts
var ANY_SIGNED_IN = "*";
/**
* allowedRoles may contain ANY_SIGNED_IN for screens about the user's own account (profile, cart, orders): every
* signed-in person may open them whatever their platform role, since services only return the caller's own records.
*/
function routeAllowed(user, allowedRoles, requiredPermission) {
	if (user.role === "SUPER_ADMIN") return true;
	if (allowedRoles.includes("*") && !requiredPermission) return true;
	const permissions = user.permissions || [];
	if (requiredPermission) {
		const granted = permissions.includes("*") || permissions.includes(requiredPermission);
		const legacyRoleAllowed = !user.permissions && (allowedRoles.includes(user.role) || user.role === "ADMIN");
		return granted || legacyRoleAllowed;
	}
	return allowedRoles.includes(user.role) || user.role === "ADMIN";
}
// ../shared-library/src/components/ProtectedRoute.tsx
await importShared("react");
var { Navigate, useLocation } = await importShared("react-router-dom");
var { useSelector } = await importShared("react-redux");
var ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
	const { isAuthenticated, user } = useSelector((state) => state.auth);
	const location = useLocation();
	if (!isAuthenticated || !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/login",
		state: { from: location },
		replace: true
	});
	if (!routeAllowed(user, allowedRoles, requiredPermission)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/unauthorized",
		replace: true
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
};
// ../shared-library/src/services/ErrorReporter.ts
var breadcrumbRingBuffer = [];
var MAX_BREADCRUMBS = 25;
function addBreadcrumb(category, message, data) {
	try {
		const item = {
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			category,
			message,
			data
		};
		breadcrumbRingBuffer.push(item);
		if (breadcrumbRingBuffer.length > MAX_BREADCRUMBS) breadcrumbRingBuffer.shift();
	} catch {}
}
function getBrowserInfo() {
	if (typeof window === "undefined") return {
		browser: "Node/SSR",
		os: "Server"
	};
	const ua = navigator.userAgent;
	let browser = "Unknown Browser";
	if (ua.includes("Edg/")) browser = "Microsoft Edge";
	else if (ua.includes("Chrome/")) browser = "Google Chrome";
	else if (ua.includes("Safari/")) browser = "Apple Safari";
	else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
	let os = "Unknown OS";
	if (ua.includes("Win")) os = "Windows";
	else if (ua.includes("Mac")) os = "macOS";
	else if (ua.includes("Linux")) os = "Linux";
	else if (ua.includes("Android")) os = "Android";
	else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
	return {
		browser,
		os
	};
}
async function reportClientError(report) {
	try {
		const apiBase = "";
		const { browser, os } = getBrowserInfo();
		const currentRoute = typeof window !== "undefined" ? window.location.pathname : void 0;
		let userId;
		let userRole;
		if (typeof window !== "undefined") try {
			const u = JSON.parse(localStorage.getItem("user") || "{}");
			if (u.id) userId = u.id;
			if (u.role) userRole = u.role;
		} catch {}
		const payload = {
			serviceName: report.serviceName || "shell-app",
			environment: report.environment || "production",
			version: report.version || "2.0.0",
			releaseTag: report.releaseTag || "production-v2.0.0",
			errorType: report.errorType || "ClientError",
			message: report.message || "Unknown error occurred",
			stackTrace: report.stackTrace,
			requestMethod: report.requestMethod,
			requestUri: report.requestUri,
			responseStatus: report.responseStatus,
			traceId: report.traceId,
			userId: report.userId ?? userId,
			userRole: report.userRole ?? userRole,
			browser: report.browser || browser,
			os: report.os || os,
			frontendRoute: report.frontendRoute || currentRoute,
			severity: report.severity || "ERROR",
			metadata: report.metadata,
			breadcrumbs: [...breadcrumbRingBuffer]
		};
		axios.post(`${apiBase}/api/errors/ingest`, payload).catch(() => {});
	} catch {}
}
var handlersInitialized = false;
function initGlobalErrorHandlers(serviceName = "shell-app") {
	if (typeof window === "undefined" || handlersInitialized) return;
	handlersInitialized = true;
	window.addEventListener("error", (event) => {
		try {
			addBreadcrumb("window.error", event.message);
			reportClientError({
				serviceName,
				errorType: event.error?.name || "UncaughtError",
				message: event.message || String(event.error),
				stackTrace: event.error?.stack,
				severity: "CRITICAL"
			});
		} catch {}
	});
	window.addEventListener("unhandledrejection", (event) => {
		try {
			const reason = event.reason;
			const message = reason?.message || String(reason);
			addBreadcrumb("promise.rejection", message);
			reportClientError({
				serviceName,
				errorType: reason?.name || "UnhandledPromiseRejection",
				message,
				stackTrace: reason?.stack,
				severity: "ERROR"
			});
		} catch {}
	});
}
// ../shared-library/src/components/ErrorBoundary.tsx
var { Component } = await importShared("react");
var ErrorBoundary = class extends Component {
	constructor(props) {
		super(props);
		this.handleRetry = () => {
			this.setState({
				hasError: false,
				error: null
			});
		};
		this.state = {
			hasError: false,
			error: null
		};
	}
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			error
		};
	}
	componentDidCatch(error, errorInfo) {
		addBreadcrumb("react.error_boundary", error.message, { componentStack: errorInfo.componentStack });
		reportClientError({
			serviceName: this.props.serviceName || "shell-app",
			errorType: error.name || "ReactErrorBoundaryException",
			message: error.message,
			stackTrace: (error.stack || "") + "\nComponent Stack:" + (errorInfo.componentStack || ""),
			severity: "CRITICAL"
		});
	}
	render() {
		if (this.state.hasError) {
			if (this.props.fallback) return this.props.fallback;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style: {
					padding: "32px",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "300px"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					style: {
						padding: "32px",
						maxWidth: "500px",
						backgroundColor: "#111827",
						border: "1px solid #1F2937",
						borderRadius: "12px",
						textAlign: "center",
						color: "#F8FAFC"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							style: {
								margin: "0 0 8px 0",
								color: "#EF4444",
								fontWeight: 800
							},
							children: "Something went wrong"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							style: {
								margin: "0 0 24px 0",
								color: "#94A3B8",
								fontSize: "14px"
							},
							children: "An unexpected application error has been safely captured by the Error Stack service for diagnosis."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: this.handleRetry,
							style: {
								backgroundColor: "#4F46E5",
								color: "#FFFFFF",
								border: "none",
								padding: "10px 20px",
								borderRadius: "8px",
								fontWeight: 700,
								cursor: "pointer"
							},
							children: "Try Again"
						})
					]
				})
			});
		}
		return this.props.children;
	}
};
// ../shared-library/src/config/applicationRegistry.ts
var APPLICATION_CODES = [
	"SUPER_ADMIN",
	"ECOMMERCE_ADMIN",
	"STOREFRONT",
	"INVENTORY",
	"ACCOUNTING",
	"DELIVERY_OPS",
	"VENDOR_PORTAL",
	"CRM",
	"QUALITY_CENTER",
	"CUSTOMER_SUPPORT"
];
var APPLICATION_REGISTRY = {
	SUPER_ADMIN: {
		code: "SUPER_ADMIN",
		displayName: "Super Admin Portal",
		status: "ACTIVE",
		origin: "",
		loginPath: "/login"
	},
	ECOMMERCE_ADMIN: {
		code: "ECOMMERCE_ADMIN",
		displayName: "E-commerce Admin",
		status: "PLANNED",
		origin: "",
		loginPath: "/login"
	},
	STOREFRONT: {
		code: "STOREFRONT",
		displayName: "Customer Storefront",
		status: "PLANNED",
		origin: "",
		loginPath: "/login"
	},
	INVENTORY: {
		code: "INVENTORY",
		displayName: "Inventory Management",
		status: "ACTIVE",
		origin: "",
		loginPath: "/login"
	},
	ACCOUNTING: {
		code: "ACCOUNTING",
		displayName: "Accounting and Finance",
		status: "PLANNED",
		origin: "",
		loginPath: "/login"
	},
	DELIVERY_OPS: {
		code: "DELIVERY_OPS",
		displayName: "Delivery Operations",
		status: "ACTIVE",
		origin: "",
		loginPath: "/login"
	},
	VENDOR_PORTAL: {
		code: "VENDOR_PORTAL",
		displayName: "Vendor and Restaurant Portal",
		status: "PLANNED",
		origin: "",
		loginPath: "/login"
	},
	CRM: {
		code: "CRM",
		displayName: "CRM",
		status: "PLANNED",
		origin: "",
		loginPath: "/login"
	},
	QUALITY_CENTER: {
		code: "QUALITY_CENTER",
		displayName: "Tester / Quality Center",
		status: "ACTIVE",
		origin: "",
		loginPath: "/login"
	},
	CUSTOMER_SUPPORT: {
		code: "CUSTOMER_SUPPORT",
		displayName: "Customer Support",
		status: "PLANNED",
		origin: "",
		loginPath: "/login"
	}
};
function isApplicationCode(value) {
	return typeof value === "string" && APPLICATION_CODES.includes(value);
}
/**
* Builds the registry from runtime-supplied origins. Only ACTIVE applications
* need an origin; a missing or non-HTTPS origin for an ACTIVE application
* (outside localhost) is rejected so misconfiguration fails at startup.
*/
function buildApplicationRegistry(origins) {
	const registry = { ...APPLICATION_REGISTRY };
	for (const code of APPLICATION_CODES) {
		const definition = APPLICATION_REGISTRY[code];
		if (definition.status !== "ACTIVE") continue;
		const origin = origins[code];
		if (!origin) throw new Error(`Missing origin for active application ${code}`);
		const normalized = normalizeOrigin(origin);
		if (!normalized) throw new Error(`Invalid origin for application ${code}`);
		registry[code] = {
			...definition,
			origin: normalized
		};
	}
	return registry;
}
/** Returns the origin (scheme://host[:port]) when it is HTTPS or localhost HTTP, otherwise null. */
function normalizeOrigin(value) {
	let url;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
	if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) return null;
	if (url.username || url.password || url.search || url.hash) return null;
	if (url.pathname !== "/" && url.pathname !== "") return null;
	return url.origin;
}
/**
* Accepts a post-login redirect only when it points at the registered origin of
* the application, or is a relative path on the current application. Anything
* else returns null so the caller falls back to the application home page.
*/
function resolveSafeRedirect(target, applicationCode, registry) {
	if (!target) return null;
	const app = registry[applicationCode];
	if (!app.origin) return null;
	if (target.startsWith("/") && !target.startsWith("//") && !target.includes("\\")) return new URL(target, app.origin).toString();
	let url;
	try {
		url = new URL(target);
	} catch {
		return null;
	}
	return url.origin === app.origin ? url.toString() : null;
}
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
/** True when the platform session carries the permission (or the wildcard). Display decisions only. */
function hasPlatformPermission(session, permission) {
	return Boolean(session && (session.permissions.includes("*") || session.permissions.includes(permission)));
}
var PLATFORM_KEY = "ucp.session.PLATFORM";
/** True when the token is an unexpired platform token (no tenant or application scope). */
function isUsablePlatformToken(token, nowMs = Date.now()) {
	const claims = decodeTokenClaims(token);
	if (!claims || claims.tenant_id !== void 0 || claims.application_code !== void 0) return false;
	return typeof claims.exp === "number" && claims.exp * 1e3 > nowMs;
}
/**
* Signs in through the platform login. When requiredRole is given, a token for another role is
* rejected with 403 so the portal can explain the restriction before making protected calls.
*/
async function signInToPlatform(request, requiredRole, fetchImpl = fetch, apiBaseUrl = "") {
	let response;
	try {
		response = await fetchImpl(`${apiBaseUrl}/api/users/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: request.email.trim(),
				password: request.password
			})
		});
	} catch {
		throw new ApplicationSignInError("The sign-in service could not be reached. Try again shortly.", 0);
	}
	const body = await response.json().catch(() => null);
	if (!response.ok) throw new ApplicationSignInError({
		...DEFAULT_ERRORS,
		403: "This account is deactivated."
	}[response.status] ?? "Sign in failed. Please try again.", response.status);
	const token = body && typeof body.token === "string" ? body.token : "";
	if (!isUsablePlatformToken(token)) throw new ApplicationSignInError("The sign-in response was not a valid platform session.", response.status);
	const session = toPlatformSession(token);
	if (requiredRole && session.role !== requiredRole) throw new ApplicationSignInError("This portal is limited to platform administrators.", 403);
	return session;
}
function storePlatformSession(session, storage) {
	storage.setItem(PLATFORM_KEY, session.token);
}
/** Returns the stored platform session, clearing it if it is malformed, tenant-scoped or expired. */
function readPlatformSession(storage, nowMs = Date.now()) {
	const token = storage.getItem(PLATFORM_KEY);
	if (token && isUsablePlatformToken(token, nowMs)) return toPlatformSession(token);
	storage.removeItem(PLATFORM_KEY);
	return null;
}
function clearPlatformSession(storage) {
	storage.removeItem(PLATFORM_KEY);
}
function toPlatformSession(token) {
	const claims = decodeTokenClaims(token) ?? {};
	return {
		token,
		email: typeof claims.sub === "string" ? claims.sub : "",
		role: typeof claims.role === "string" ? claims.role : "",
		permissions: Array.isArray(claims.permissions) ? claims.permissions.filter((p) => typeof p === "string") : []
	};
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
// ../shared-library/src/storefront/activeStorefront.ts
/** Thrown when the storefront service cannot be reached, so a page can say so instead of showing another catalog. */
var StorefrontLookupError = class extends Error {
	constructor(message = "The store could not be reached. Please try again shortly.") {
		super(message);
		this.name = "StorefrontLookupError";
	}
};
var STOREFRONT_KEY = "ucp.storefront";
var SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
var PUBLIC_API = "/api/products/public/storefront";
/** Hosts that can never be a storefront address: bare localhost and IP literals. */
function isPlatformHost(hostname) {
	const host = hostname.trim().toLowerCase();
	return host === "" || host === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}
/** The slug named in the address (`?storefront=acme`), lower-cased, or null when absent or malformed. */
function storefrontFromQuery(search) {
	const value = new URLSearchParams(search).get("storefront");
	const slug = value ? value.trim().toLowerCase() : "";
	return SLUG_PATTERN.test(slug) ? slug : null;
}
function readActiveStorefront(storage) {
	try {
		const raw = storage.getItem(STOREFRONT_KEY);
		const value = raw ? JSON.parse(raw) : null;
		if (value && typeof value.slug === "string" && SLUG_PATTERN.test(value.slug)) return {
			slug: value.slug,
			name: typeof value.name === "string" ? value.name : value.slug
		};
	} catch {}
	storage.removeItem(STOREFRONT_KEY);
	return null;
}
function storeActiveStorefront(storefront, storage) {
	storage.setItem(STOREFRONT_KEY, JSON.stringify(storefront));
}
function clearActiveStorefront(storage) {
	storage.removeItem(STOREFRONT_KEY);
}
/** GETs a public storefront resource: the body on 200, null on 404, StorefrontLookupError on anything else. */
async function getPublic(path, fetchImpl, apiBaseUrl) {
	let response;
	try {
		response = await fetchImpl(`${apiBaseUrl}${PUBLIC_API}${path}`, { headers: { Accept: "application/json" } });
	} catch {
		throw new StorefrontLookupError();
	}
	if (response.status === 404) return null;
	const body = response.ok ? await response.json().catch(() => null) : null;
	if (!body || typeof body !== "object") throw new StorefrontLookupError();
	return body;
}
/**
* Works out the storefront for this visit and remembers it for the browser session:
* 1. the address itself, when it is a verified custom domain or `<slug>.<platform storefront domain>`;
* 2. otherwise a `?storefront=` parameter;
* 3. otherwise the storefront remembered from earlier in the session.
* A named storefront that is unknown or inactive is forgotten, and the shopper gets the platform's default
* catalog (null). An unreachable storefront service throws StorefrontLookupError rather than guessing.
*/
async function resolveActiveStorefront(location, storage, fetchImpl = fetch, apiBaseUrl = "") {
	const remembered = readActiveStorefront(storage);
	let requested = null;
	if (!isPlatformHost(location.hostname)) {
		const host = await getPublic(`/resolve?host=${encodeURIComponent(location.hostname.toLowerCase())}`, fetchImpl, apiBaseUrl);
		requested = host && typeof host.slug === "string" ? host.slug : null;
	}
	requested = requested ?? storefrontFromQuery(location.search);
	if (!requested) return remembered;
	if (remembered && remembered.slug === requested) return remembered;
	const site = await getPublic(`/${encodeURIComponent(requested)}`, fetchImpl, apiBaseUrl);
	if (!site) {
		clearActiveStorefront(storage);
		return null;
	}
	const storefront = {
		slug: requested,
		name: typeof site.name === "string" && site.name ? site.name : requested
	};
	storeActiveStorefront(storefront, storage);
	return storefront;
}
/** The `?storefront=` query a storefront-scoped API call needs, or an empty object for the default catalog. */
function storefrontParams(storefront) {
	return storefront ? { storefront: storefront.slug } : {};
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
var { useEffect, useState } = await importShared("react");
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
	const [session, setSession] = useState(() => readApplicationSession(applicationCode, sessionStorage));
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
		style: styles.bar,
		"data-testid": "application-session-bar",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			style: styles.muted,
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
			style: styles.linkButton,
			children: "Switch workspace"
		})]
	}), children] });
}
function ApplicationSignIn({ applicationCode, applicationName, onAuthenticated }) {
	const [tenantSlug, setTenantSlug] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [workspaces, setWorkspaces] = useState(null);
	const [showForm, setShowForm] = useState(false);
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
		style: styles.page,
		children: quickList ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: styles.card,
			"aria-label": `Choose a workspace for ${applicationName}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					style: styles.title,
					children: ["Open ", applicationName]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: styles.muted,
					children: "Choose the client workspace to work in. You stay signed in with your account."
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "alert",
					style: styles.error,
					children: error
				}),
				workspaces.map((workspace) => {
					const role = workspace.applications.find((app) => app.applicationCode === applicationCode)?.role;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: submitting,
						style: styles.workspace,
						onClick: () => void run(() => exchangeForApplication({
							applicationCode,
							tenantSlug: workspace.slug
						}, token)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: workspace.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							style: styles.muted,
							children: [workspace.slug, role ? ` · ${role}` : ""]
						})]
					}, workspace.tenantId);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setShowForm(true),
					style: styles.linkButton,
					children: "Use a different account"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: signIn,
			style: styles.card,
			"aria-label": `Sign in to ${applicationName}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					style: styles.title,
					children: ["Sign in to ", applicationName]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					style: styles.muted,
					children: token && workspaces && workspaces.length === 0 ? "Your account has no workspace with this application. Sign in with an account that has access, or ask your client owner." : "Use your client workspace and account. Access is checked for this application."
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "alert",
					style: styles.error,
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					style: styles.label,
					children: ["Client workspace", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						style: styles.input,
						value: tenantSlug,
						onChange: (e) => setTenantSlug(e.target.value),
						placeholder: "legacy",
						autoComplete: "organization",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					style: styles.label,
					children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						style: styles.input,
						value: email,
						onChange: (e) => setEmail(e.target.value),
						autoComplete: "username",
						type: "email",
						required: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					style: styles.label,
					children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						style: styles.input,
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
					style: styles.primary,
					children: submitting ? "Signing in…" : `Continue to ${applicationName}`
				}),
				token && workspaces && workspaces.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setShowForm(false),
					style: styles.linkButton,
					children: "Back to my workspaces"
				})
			]
		})
	});
}
var styles = {
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
export { ANY_SIGNED_IN, APPLICATION_CODES, APPLICATION_REGISTRY, ApplicationGate, ApplicationSignIn, ApplicationSignInError, AuthService, ErrorBoundary, ProtectedRoute, RoleGuard, StorefrontLookupError, addBreadcrumb, addToCart, applicationForRequest, buildApplicationRegistry, clearActiveStorefront, clearApplicationSession, clearCart, clearPlatformSession, decodeTokenClaims, exchangeForApplication, fetchMyApplications, hasPlatformPermission, initGlobalErrorHandlers, isApplicationCode, isPlatformHost, isUsableApplicationToken, isUsablePlatformToken, loginSuccess, logout, normalizeOrigin, parseMyApplications, readActiveStorefront, readApplicationSession, readPlatformSession, removeFromCart, reportClientError, requestPath, requestToken, resolveActiveStorefront, resolveSafeRedirect, routeAllowed, sessionStorageKey, signInToApplication, signInToPlatform, store, storeActiveStorefront, storeApplicationSession, storePlatformSession, storefrontFromQuery, storefrontParams, updateQuantity, workspacesFor };
