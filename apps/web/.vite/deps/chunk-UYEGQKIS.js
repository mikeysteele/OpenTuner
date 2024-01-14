// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/platform.js
var $global = function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  try {
    return new Function("return this")();
  } catch (_a) {
    return {};
  }
}();
if ($global.trustedTypes === void 0) {
  $global.trustedTypes = { createPolicy: (n, r) => r };
}
var propConfig = {
  configurable: false,
  enumerable: false,
  writable: false
};
if ($global.FAST === void 0) {
  Reflect.defineProperty($global, "FAST", Object.assign({ value: /* @__PURE__ */ Object.create(null) }, propConfig));
}
var FAST = $global.FAST;
if (FAST.getById === void 0) {
  const storage = /* @__PURE__ */ Object.create(null);
  Reflect.defineProperty(FAST, "getById", Object.assign({ value(id, initialize) {
    let found = storage[id];
    if (found === void 0) {
      found = initialize ? storage[id] = initialize() : null;
    }
    return found;
  } }, propConfig));
}
var emptyArray = Object.freeze([]);
function createMetadataLocator() {
  const metadataLookup = /* @__PURE__ */ new WeakMap();
  return function(target) {
    let metadata = metadataLookup.get(target);
    if (metadata === void 0) {
      let currentTarget = Reflect.getPrototypeOf(target);
      while (metadata === void 0 && currentTarget !== null) {
        metadata = metadataLookup.get(currentTarget);
        currentTarget = Reflect.getPrototypeOf(currentTarget);
      }
      metadata = metadata === void 0 ? [] : metadata.slice(0);
      metadataLookup.set(target, metadata);
    }
    return metadata;
  };
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/dom.js
var updateQueue = $global.FAST.getById(1, () => {
  const tasks = [];
  const pendingErrors = [];
  function throwFirstError() {
    if (pendingErrors.length) {
      throw pendingErrors.shift();
    }
  }
  function tryRunTask(task) {
    try {
      task.call();
    } catch (error) {
      pendingErrors.push(error);
      setTimeout(throwFirstError, 0);
    }
  }
  function process() {
    const capacity = 1024;
    let index = 0;
    while (index < tasks.length) {
      tryRunTask(tasks[index]);
      index++;
      if (index > capacity) {
        for (let scan = 0, newLength = tasks.length - index; scan < newLength; scan++) {
          tasks[scan] = tasks[scan + index];
        }
        tasks.length -= index;
        index = 0;
      }
    }
    tasks.length = 0;
  }
  function enqueue(callable) {
    if (tasks.length < 1) {
      $global.requestAnimationFrame(process);
    }
    tasks.push(callable);
  }
  return Object.freeze({
    enqueue,
    process
  });
});
var fastHTMLPolicy = $global.trustedTypes.createPolicy("fast-html", {
  createHTML: (html2) => html2
});
var htmlPolicy = fastHTMLPolicy;
var marker = `fast-${Math.random().toString(36).substring(2, 8)}`;
var _interpolationStart = `${marker}{`;
var _interpolationEnd = `}${marker}`;
var DOM = Object.freeze({
  /**
   * Indicates whether the DOM supports the adoptedStyleSheets feature.
   */
  supportsAdoptedStyleSheets: Array.isArray(document.adoptedStyleSheets) && "replace" in CSSStyleSheet.prototype,
  /**
   * Sets the HTML trusted types policy used by the templating engine.
   * @param policy - The policy to set for HTML.
   * @remarks
   * This API can only be called once, for security reasons. It should be
   * called by the application developer at the start of their program.
   */
  setHTMLPolicy(policy) {
    if (htmlPolicy !== fastHTMLPolicy) {
      throw new Error("The HTML policy can only be set once.");
    }
    htmlPolicy = policy;
  },
  /**
   * Turns a string into trusted HTML using the configured trusted types policy.
   * @param html - The string to turn into trusted HTML.
   * @remarks
   * Used internally by the template engine when creating templates
   * and setting innerHTML.
   */
  createHTML(html2) {
    return htmlPolicy.createHTML(html2);
  },
  /**
   * Determines if the provided node is a template marker used by the runtime.
   * @param node - The node to test.
   */
  isMarker(node) {
    return node && node.nodeType === 8 && node.data.startsWith(marker);
  },
  /**
   * Given a marker node, extract the {@link HTMLDirective} index from the placeholder.
   * @param node - The marker node to extract the index from.
   */
  extractDirectiveIndexFromMarker(node) {
    return parseInt(node.data.replace(`${marker}:`, ""));
  },
  /**
   * Creates a placeholder string suitable for marking out a location *within*
   * an attribute value or HTML content.
   * @param index - The directive index to create the placeholder for.
   * @remarks
   * Used internally by binding directives.
   */
  createInterpolationPlaceholder(index) {
    return `${_interpolationStart}${index}${_interpolationEnd}`;
  },
  /**
   * Creates a placeholder that manifests itself as an attribute on an
   * element.
   * @param attributeName - The name of the custom attribute.
   * @param index - The directive index to create the placeholder for.
   * @remarks
   * Used internally by attribute directives such as `ref`, `slotted`, and `children`.
   */
  createCustomAttributePlaceholder(attributeName, index) {
    return `${attributeName}="${this.createInterpolationPlaceholder(index)}"`;
  },
  /**
   * Creates a placeholder that manifests itself as a marker within the DOM structure.
   * @param index - The directive index to create the placeholder for.
   * @remarks
   * Used internally by structural directives such as `repeat`.
   */
  createBlockPlaceholder(index) {
    return `<!--${marker}:${index}-->`;
  },
  /**
   * Schedules DOM update work in the next async batch.
   * @param callable - The callable function or object to queue.
   */
  queueUpdate: updateQueue.enqueue,
  /**
   * Immediately processes all work previously scheduled
   * through queueUpdate.
   * @remarks
   * This also forces nextUpdate promises
   * to resolve.
   */
  processUpdates: updateQueue.process,
  /**
   * Resolves with the next DOM update.
   */
  nextUpdate() {
    return new Promise(updateQueue.enqueue);
  },
  /**
   * Sets an attribute value on an element.
   * @param element - The element to set the attribute value on.
   * @param attributeName - The attribute name to set.
   * @param value - The value of the attribute to set.
   * @remarks
   * If the value is `null` or `undefined`, the attribute is removed, otherwise
   * it is set to the provided value using the standard `setAttribute` API.
   */
  setAttribute(element, attributeName, value) {
    if (value === null || value === void 0) {
      element.removeAttribute(attributeName);
    } else {
      element.setAttribute(attributeName, value);
    }
  },
  /**
   * Sets a boolean attribute value.
   * @param element - The element to set the boolean attribute value on.
   * @param attributeName - The attribute name to set.
   * @param value - The value of the attribute to set.
   * @remarks
   * If the value is true, the attribute is added; otherwise it is removed.
   */
  setBooleanAttribute(element, attributeName, value) {
    value ? element.setAttribute(attributeName, "") : element.removeAttribute(attributeName);
  },
  /**
   * Removes all the child nodes of the provided parent node.
   * @param parent - The node to remove the children from.
   */
  removeChildNodes(parent) {
    for (let child = parent.firstChild; child !== null; child = parent.firstChild) {
      parent.removeChild(child);
    }
  },
  /**
   * Creates a TreeWalker configured to walk a template fragment.
   * @param fragment - The fragment to walk.
   */
  createTemplateWalker(fragment) {
    return document.createTreeWalker(
      fragment,
      133,
      // element, text, comment
      null,
      false
    );
  }
});

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/observation/notifier.js
var SubscriberSet = class {
  /**
   * Creates an instance of SubscriberSet for the specified source.
   * @param source - The object source that subscribers will receive notifications from.
   * @param initialSubscriber - An initial subscriber to changes.
   */
  constructor(source, initialSubscriber) {
    this.sub1 = void 0;
    this.sub2 = void 0;
    this.spillover = void 0;
    this.source = source;
    this.sub1 = initialSubscriber;
  }
  /**
   * Checks whether the provided subscriber has been added to this set.
   * @param subscriber - The subscriber to test for inclusion in this set.
   */
  has(subscriber) {
    return this.spillover === void 0 ? this.sub1 === subscriber || this.sub2 === subscriber : this.spillover.indexOf(subscriber) !== -1;
  }
  /**
   * Subscribes to notification of changes in an object's state.
   * @param subscriber - The object that is subscribing for change notification.
   */
  subscribe(subscriber) {
    const spillover = this.spillover;
    if (spillover === void 0) {
      if (this.has(subscriber)) {
        return;
      }
      if (this.sub1 === void 0) {
        this.sub1 = subscriber;
        return;
      }
      if (this.sub2 === void 0) {
        this.sub2 = subscriber;
        return;
      }
      this.spillover = [this.sub1, this.sub2, subscriber];
      this.sub1 = void 0;
      this.sub2 = void 0;
    } else {
      const index = spillover.indexOf(subscriber);
      if (index === -1) {
        spillover.push(subscriber);
      }
    }
  }
  /**
   * Unsubscribes from notification of changes in an object's state.
   * @param subscriber - The object that is unsubscribing from change notification.
   */
  unsubscribe(subscriber) {
    const spillover = this.spillover;
    if (spillover === void 0) {
      if (this.sub1 === subscriber) {
        this.sub1 = void 0;
      } else if (this.sub2 === subscriber) {
        this.sub2 = void 0;
      }
    } else {
      const index = spillover.indexOf(subscriber);
      if (index !== -1) {
        spillover.splice(index, 1);
      }
    }
  }
  /**
   * Notifies all subscribers.
   * @param args - Data passed along to subscribers during notification.
   */
  notify(args) {
    const spillover = this.spillover;
    const source = this.source;
    if (spillover === void 0) {
      const sub1 = this.sub1;
      const sub2 = this.sub2;
      if (sub1 !== void 0) {
        sub1.handleChange(source, args);
      }
      if (sub2 !== void 0) {
        sub2.handleChange(source, args);
      }
    } else {
      for (let i = 0, ii = spillover.length; i < ii; ++i) {
        spillover[i].handleChange(source, args);
      }
    }
  }
};
var PropertyChangeNotifier = class {
  /**
   * Creates an instance of PropertyChangeNotifier for the specified source.
   * @param source - The object source that subscribers will receive notifications from.
   */
  constructor(source) {
    this.subscribers = {};
    this.sourceSubscribers = null;
    this.source = source;
  }
  /**
   * Notifies all subscribers, based on the specified property.
   * @param propertyName - The property name, passed along to subscribers during notification.
   */
  notify(propertyName) {
    var _a;
    const subscribers = this.subscribers[propertyName];
    if (subscribers !== void 0) {
      subscribers.notify(propertyName);
    }
    (_a = this.sourceSubscribers) === null || _a === void 0 ? void 0 : _a.notify(propertyName);
  }
  /**
   * Subscribes to notification of changes in an object's state.
   * @param subscriber - The object that is subscribing for change notification.
   * @param propertyToWatch - The name of the property that the subscriber is interested in watching for changes.
   */
  subscribe(subscriber, propertyToWatch) {
    var _a;
    if (propertyToWatch) {
      let subscribers = this.subscribers[propertyToWatch];
      if (subscribers === void 0) {
        this.subscribers[propertyToWatch] = subscribers = new SubscriberSet(this.source);
      }
      subscribers.subscribe(subscriber);
    } else {
      this.sourceSubscribers = (_a = this.sourceSubscribers) !== null && _a !== void 0 ? _a : new SubscriberSet(this.source);
      this.sourceSubscribers.subscribe(subscriber);
    }
  }
  /**
   * Unsubscribes from notification of changes in an object's state.
   * @param subscriber - The object that is unsubscribing from change notification.
   * @param propertyToUnwatch - The name of the property that the subscriber is no longer interested in watching.
   */
  unsubscribe(subscriber, propertyToUnwatch) {
    var _a;
    if (propertyToUnwatch) {
      const subscribers = this.subscribers[propertyToUnwatch];
      if (subscribers !== void 0) {
        subscribers.unsubscribe(subscriber);
      }
    } else {
      (_a = this.sourceSubscribers) === null || _a === void 0 ? void 0 : _a.unsubscribe(subscriber);
    }
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/observation/observable.js
var Observable = FAST.getById(2, () => {
  const volatileRegex = /(:|&&|\|\||if)/;
  const notifierLookup = /* @__PURE__ */ new WeakMap();
  const queueUpdate = DOM.queueUpdate;
  let watcher = void 0;
  let createArrayObserver = (array) => {
    throw new Error("Must call enableArrayObservation before observing arrays.");
  };
  function getNotifier(source) {
    let found = source.$fastController || notifierLookup.get(source);
    if (found === void 0) {
      if (Array.isArray(source)) {
        found = createArrayObserver(source);
      } else {
        notifierLookup.set(source, found = new PropertyChangeNotifier(source));
      }
    }
    return found;
  }
  const getAccessors = createMetadataLocator();
  class DefaultObservableAccessor {
    constructor(name) {
      this.name = name;
      this.field = `_${name}`;
      this.callback = `${name}Changed`;
    }
    getValue(source) {
      if (watcher !== void 0) {
        watcher.watch(source, this.name);
      }
      return source[this.field];
    }
    setValue(source, newValue) {
      const field = this.field;
      const oldValue = source[field];
      if (oldValue !== newValue) {
        source[field] = newValue;
        const callback = source[this.callback];
        if (typeof callback === "function") {
          callback.call(source, oldValue, newValue);
        }
        getNotifier(source).notify(this.name);
      }
    }
  }
  class BindingObserverImplementation extends SubscriberSet {
    constructor(binding, initialSubscriber, isVolatileBinding = false) {
      super(binding, initialSubscriber);
      this.binding = binding;
      this.isVolatileBinding = isVolatileBinding;
      this.needsRefresh = true;
      this.needsQueue = true;
      this.first = this;
      this.last = null;
      this.propertySource = void 0;
      this.propertyName = void 0;
      this.notifier = void 0;
      this.next = void 0;
    }
    observe(source, context) {
      if (this.needsRefresh && this.last !== null) {
        this.disconnect();
      }
      const previousWatcher = watcher;
      watcher = this.needsRefresh ? this : void 0;
      this.needsRefresh = this.isVolatileBinding;
      const result = this.binding(source, context);
      watcher = previousWatcher;
      return result;
    }
    disconnect() {
      if (this.last !== null) {
        let current = this.first;
        while (current !== void 0) {
          current.notifier.unsubscribe(this, current.propertyName);
          current = current.next;
        }
        this.last = null;
        this.needsRefresh = this.needsQueue = true;
      }
    }
    watch(propertySource, propertyName) {
      const prev = this.last;
      const notifier = getNotifier(propertySource);
      const current = prev === null ? this.first : {};
      current.propertySource = propertySource;
      current.propertyName = propertyName;
      current.notifier = notifier;
      notifier.subscribe(this, propertyName);
      if (prev !== null) {
        if (!this.needsRefresh) {
          let prevValue;
          watcher = void 0;
          prevValue = prev.propertySource[prev.propertyName];
          watcher = this;
          if (propertySource === prevValue) {
            this.needsRefresh = true;
          }
        }
        prev.next = current;
      }
      this.last = current;
    }
    handleChange() {
      if (this.needsQueue) {
        this.needsQueue = false;
        queueUpdate(this);
      }
    }
    call() {
      if (this.last !== null) {
        this.needsQueue = true;
        this.notify(this);
      }
    }
    records() {
      let next = this.first;
      return {
        next: () => {
          const current = next;
          if (current === void 0) {
            return { value: void 0, done: true };
          } else {
            next = next.next;
            return {
              value: current,
              done: false
            };
          }
        },
        [Symbol.iterator]: function() {
          return this;
        }
      };
    }
  }
  return Object.freeze({
    /**
     * @internal
     * @param factory - The factory used to create array observers.
     */
    setArrayObserverFactory(factory) {
      createArrayObserver = factory;
    },
    /**
     * Gets a notifier for an object or Array.
     * @param source - The object or Array to get the notifier for.
     */
    getNotifier,
    /**
     * Records a property change for a source object.
     * @param source - The object to record the change against.
     * @param propertyName - The property to track as changed.
     */
    track(source, propertyName) {
      if (watcher !== void 0) {
        watcher.watch(source, propertyName);
      }
    },
    /**
     * Notifies watchers that the currently executing property getter or function is volatile
     * with respect to its observable dependencies.
     */
    trackVolatile() {
      if (watcher !== void 0) {
        watcher.needsRefresh = true;
      }
    },
    /**
     * Notifies subscribers of a source object of changes.
     * @param source - the object to notify of changes.
     * @param args - The change args to pass to subscribers.
     */
    notify(source, args) {
      getNotifier(source).notify(args);
    },
    /**
     * Defines an observable property on an object or prototype.
     * @param target - The target object to define the observable on.
     * @param nameOrAccessor - The name of the property to define as observable;
     * or a custom accessor that specifies the property name and accessor implementation.
     */
    defineProperty(target, nameOrAccessor) {
      if (typeof nameOrAccessor === "string") {
        nameOrAccessor = new DefaultObservableAccessor(nameOrAccessor);
      }
      getAccessors(target).push(nameOrAccessor);
      Reflect.defineProperty(target, nameOrAccessor.name, {
        enumerable: true,
        get: function() {
          return nameOrAccessor.getValue(this);
        },
        set: function(newValue) {
          nameOrAccessor.setValue(this, newValue);
        }
      });
    },
    /**
     * Finds all the observable accessors defined on the target,
     * including its prototype chain.
     * @param target - The target object to search for accessor on.
     */
    getAccessors,
    /**
     * Creates a {@link BindingObserver} that can watch the
     * provided {@link Binding} for changes.
     * @param binding - The binding to observe.
     * @param initialSubscriber - An initial subscriber to changes in the binding value.
     * @param isVolatileBinding - Indicates whether the binding's dependency list must be re-evaluated on every value evaluation.
     */
    binding(binding, initialSubscriber, isVolatileBinding = this.isVolatileBinding(binding)) {
      return new BindingObserverImplementation(binding, initialSubscriber, isVolatileBinding);
    },
    /**
     * Determines whether a binding expression is volatile and needs to have its dependency list re-evaluated
     * on every evaluation of the value.
     * @param binding - The binding to inspect.
     */
    isVolatileBinding(binding) {
      return volatileRegex.test(binding.toString());
    }
  });
});
function observable(target, nameOrAccessor) {
  Observable.defineProperty(target, nameOrAccessor);
}
function volatile(target, name, descriptor) {
  return Object.assign({}, descriptor, {
    get: function() {
      Observable.trackVolatile();
      return descriptor.get.apply(this);
    }
  });
}
var contextEvent = FAST.getById(3, () => {
  let current = null;
  return {
    get() {
      return current;
    },
    set(event) {
      current = event;
    }
  };
});
var ExecutionContext = class {
  constructor() {
    this.index = 0;
    this.length = 0;
    this.parent = null;
    this.parentContext = null;
  }
  /**
   * The current event within an event handler.
   */
  get event() {
    return contextEvent.get();
  }
  /**
   * Indicates whether the current item within a repeat context
   * has an even index.
   */
  get isEven() {
    return this.index % 2 === 0;
  }
  /**
   * Indicates whether the current item within a repeat context
   * has an odd index.
   */
  get isOdd() {
    return this.index % 2 !== 0;
  }
  /**
   * Indicates whether the current item within a repeat context
   * is the first item in the collection.
   */
  get isFirst() {
    return this.index === 0;
  }
  /**
   * Indicates whether the current item within a repeat context
   * is somewhere in the middle of the collection.
   */
  get isInMiddle() {
    return !this.isFirst && !this.isLast;
  }
  /**
   * Indicates whether the current item within a repeat context
   * is the last item in the collection.
   */
  get isLast() {
    return this.index === this.length - 1;
  }
  /**
   * Sets the event for the current execution context.
   * @param event - The event to set.
   * @internal
   */
  static setEvent(event) {
    contextEvent.set(event);
  }
};
Observable.defineProperty(ExecutionContext.prototype, "index");
Observable.defineProperty(ExecutionContext.prototype, "length");
var defaultExecutionContext = Object.seal(new ExecutionContext());

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/html-directive.js
var HTMLDirective = class {
  constructor() {
    this.targetIndex = 0;
  }
};
var TargetedHTMLDirective = class extends HTMLDirective {
  constructor() {
    super(...arguments);
    this.createPlaceholder = DOM.createInterpolationPlaceholder;
  }
};
var AttachedBehaviorHTMLDirective = class extends HTMLDirective {
  /**
   *
   * @param name - The name of the behavior; used as a custom attribute on the element.
   * @param behavior - The behavior to instantiate and attach to the element.
   * @param options - Options to pass to the behavior during creation.
   */
  constructor(name, behavior, options) {
    super();
    this.name = name;
    this.behavior = behavior;
    this.options = options;
  }
  /**
   * Creates a placeholder string based on the directive's index within the template.
   * @param index - The index of the directive within the template.
   * @remarks
   * Creates a custom attribute placeholder.
   */
  createPlaceholder(index) {
    return DOM.createCustomAttributePlaceholder(this.name, index);
  }
  /**
   * Creates a behavior for the provided target node.
   * @param target - The node instance to create the behavior for.
   * @remarks
   * Creates an instance of the `behavior` type this directive was constructed with
   * and passes the target and options to that `behavior`'s constructor.
   */
  createBehavior(target) {
    return new this.behavior(target, this.options);
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/binding.js
function normalBind(source, context) {
  this.source = source;
  this.context = context;
  if (this.bindingObserver === null) {
    this.bindingObserver = Observable.binding(this.binding, this, this.isBindingVolatile);
  }
  this.updateTarget(this.bindingObserver.observe(source, context));
}
function triggerBind(source, context) {
  this.source = source;
  this.context = context;
  this.target.addEventListener(this.targetName, this);
}
function normalUnbind() {
  this.bindingObserver.disconnect();
  this.source = null;
  this.context = null;
}
function contentUnbind() {
  this.bindingObserver.disconnect();
  this.source = null;
  this.context = null;
  const view = this.target.$fastView;
  if (view !== void 0 && view.isComposed) {
    view.unbind();
    view.needsBindOnly = true;
  }
}
function triggerUnbind() {
  this.target.removeEventListener(this.targetName, this);
  this.source = null;
  this.context = null;
}
function updateAttributeTarget(value) {
  DOM.setAttribute(this.target, this.targetName, value);
}
function updateBooleanAttributeTarget(value) {
  DOM.setBooleanAttribute(this.target, this.targetName, value);
}
function updateContentTarget(value) {
  if (value === null || value === void 0) {
    value = "";
  }
  if (value.create) {
    this.target.textContent = "";
    let view = this.target.$fastView;
    if (view === void 0) {
      view = value.create();
    } else {
      if (this.target.$fastTemplate !== value) {
        if (view.isComposed) {
          view.remove();
          view.unbind();
        }
        view = value.create();
      }
    }
    if (!view.isComposed) {
      view.isComposed = true;
      view.bind(this.source, this.context);
      view.insertBefore(this.target);
      this.target.$fastView = view;
      this.target.$fastTemplate = value;
    } else if (view.needsBindOnly) {
      view.needsBindOnly = false;
      view.bind(this.source, this.context);
    }
  } else {
    const view = this.target.$fastView;
    if (view !== void 0 && view.isComposed) {
      view.isComposed = false;
      view.remove();
      if (view.needsBindOnly) {
        view.needsBindOnly = false;
      } else {
        view.unbind();
      }
    }
    this.target.textContent = value;
  }
}
function updatePropertyTarget(value) {
  this.target[this.targetName] = value;
}
function updateClassTarget(value) {
  const classVersions = this.classVersions || /* @__PURE__ */ Object.create(null);
  const target = this.target;
  let version = this.version || 0;
  if (value !== null && value !== void 0 && value.length) {
    const names = value.split(/\s+/);
    for (let i = 0, ii = names.length; i < ii; ++i) {
      const currentName = names[i];
      if (currentName === "") {
        continue;
      }
      classVersions[currentName] = version;
      target.classList.add(currentName);
    }
  }
  this.classVersions = classVersions;
  this.version = version + 1;
  if (version === 0) {
    return;
  }
  version -= 1;
  for (const name in classVersions) {
    if (classVersions[name] === version) {
      target.classList.remove(name);
    }
  }
}
var HTMLBindingDirective = class extends TargetedHTMLDirective {
  /**
   * Creates an instance of BindingDirective.
   * @param binding - A binding that returns the data used to update the DOM.
   */
  constructor(binding) {
    super();
    this.binding = binding;
    this.bind = normalBind;
    this.unbind = normalUnbind;
    this.updateTarget = updateAttributeTarget;
    this.isBindingVolatile = Observable.isVolatileBinding(this.binding);
  }
  /**
   * Gets/sets the name of the attribute or property that this
   * binding is targeting.
   */
  get targetName() {
    return this.originalTargetName;
  }
  set targetName(value) {
    this.originalTargetName = value;
    if (value === void 0) {
      return;
    }
    switch (value[0]) {
      case ":":
        this.cleanedTargetName = value.substr(1);
        this.updateTarget = updatePropertyTarget;
        if (this.cleanedTargetName === "innerHTML") {
          const binding = this.binding;
          this.binding = (s, c) => DOM.createHTML(binding(s, c));
        }
        break;
      case "?":
        this.cleanedTargetName = value.substr(1);
        this.updateTarget = updateBooleanAttributeTarget;
        break;
      case "@":
        this.cleanedTargetName = value.substr(1);
        this.bind = triggerBind;
        this.unbind = triggerUnbind;
        break;
      default:
        this.cleanedTargetName = value;
        if (value === "class") {
          this.updateTarget = updateClassTarget;
        }
        break;
    }
  }
  /**
   * Makes this binding target the content of an element rather than
   * a particular attribute or property.
   */
  targetAtContent() {
    this.updateTarget = updateContentTarget;
    this.unbind = contentUnbind;
  }
  /**
   * Creates the runtime BindingBehavior instance based on the configuration
   * information stored in the BindingDirective.
   * @param target - The target node that the binding behavior should attach to.
   */
  createBehavior(target) {
    return new BindingBehavior(target, this.binding, this.isBindingVolatile, this.bind, this.unbind, this.updateTarget, this.cleanedTargetName);
  }
};
var BindingBehavior = class {
  /**
   * Creates an instance of BindingBehavior.
   * @param target - The target of the data updates.
   * @param binding - The binding that returns the latest value for an update.
   * @param isBindingVolatile - Indicates whether the binding has volatile dependencies.
   * @param bind - The operation to perform during binding.
   * @param unbind - The operation to perform during unbinding.
   * @param updateTarget - The operation to perform when updating.
   * @param targetName - The name of the target attribute or property to update.
   */
  constructor(target, binding, isBindingVolatile, bind, unbind, updateTarget, targetName) {
    this.source = null;
    this.context = null;
    this.bindingObserver = null;
    this.target = target;
    this.binding = binding;
    this.isBindingVolatile = isBindingVolatile;
    this.bind = bind;
    this.unbind = unbind;
    this.updateTarget = updateTarget;
    this.targetName = targetName;
  }
  /** @internal */
  handleChange() {
    this.updateTarget(this.bindingObserver.observe(this.source, this.context));
  }
  /** @internal */
  handleEvent(event) {
    ExecutionContext.setEvent(event);
    const result = this.binding(this.source, this.context);
    ExecutionContext.setEvent(null);
    if (result !== true) {
      event.preventDefault();
    }
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/compiler.js
var sharedContext = null;
var CompilationContext = class _CompilationContext {
  addFactory(factory) {
    factory.targetIndex = this.targetIndex;
    this.behaviorFactories.push(factory);
  }
  captureContentBinding(directive) {
    directive.targetAtContent();
    this.addFactory(directive);
  }
  reset() {
    this.behaviorFactories = [];
    this.targetIndex = -1;
  }
  release() {
    sharedContext = this;
  }
  static borrow(directives) {
    const shareable = sharedContext || new _CompilationContext();
    shareable.directives = directives;
    shareable.reset();
    sharedContext = null;
    return shareable;
  }
};
function createAggregateBinding(parts) {
  if (parts.length === 1) {
    return parts[0];
  }
  let targetName;
  const partCount = parts.length;
  const finalParts = parts.map((x) => {
    if (typeof x === "string") {
      return () => x;
    }
    targetName = x.targetName || targetName;
    return x.binding;
  });
  const binding = (scope, context) => {
    let output = "";
    for (let i = 0; i < partCount; ++i) {
      output += finalParts[i](scope, context);
    }
    return output;
  };
  const directive = new HTMLBindingDirective(binding);
  directive.targetName = targetName;
  return directive;
}
var interpolationEndLength = _interpolationEnd.length;
function parseContent(context, value) {
  const valueParts = value.split(_interpolationStart);
  if (valueParts.length === 1) {
    return null;
  }
  const bindingParts = [];
  for (let i = 0, ii = valueParts.length; i < ii; ++i) {
    const current = valueParts[i];
    const index = current.indexOf(_interpolationEnd);
    let literal;
    if (index === -1) {
      literal = current;
    } else {
      const directiveIndex = parseInt(current.substring(0, index));
      bindingParts.push(context.directives[directiveIndex]);
      literal = current.substring(index + interpolationEndLength);
    }
    if (literal !== "") {
      bindingParts.push(literal);
    }
  }
  return bindingParts;
}
function compileAttributes(context, node, includeBasicValues = false) {
  const attributes = node.attributes;
  for (let i = 0, ii = attributes.length; i < ii; ++i) {
    const attr2 = attributes[i];
    const attrValue = attr2.value;
    const parseResult = parseContent(context, attrValue);
    let result = null;
    if (parseResult === null) {
      if (includeBasicValues) {
        result = new HTMLBindingDirective(() => attrValue);
        result.targetName = attr2.name;
      }
    } else {
      result = createAggregateBinding(parseResult);
    }
    if (result !== null) {
      node.removeAttributeNode(attr2);
      i--;
      ii--;
      context.addFactory(result);
    }
  }
}
function compileContent(context, node, walker) {
  const parseResult = parseContent(context, node.textContent);
  if (parseResult !== null) {
    let lastNode = node;
    for (let i = 0, ii = parseResult.length; i < ii; ++i) {
      const currentPart = parseResult[i];
      const currentNode = i === 0 ? node : lastNode.parentNode.insertBefore(document.createTextNode(""), lastNode.nextSibling);
      if (typeof currentPart === "string") {
        currentNode.textContent = currentPart;
      } else {
        currentNode.textContent = " ";
        context.captureContentBinding(currentPart);
      }
      lastNode = currentNode;
      context.targetIndex++;
      if (currentNode !== node) {
        walker.nextNode();
      }
    }
    context.targetIndex--;
  }
}
function compileTemplate(template, directives) {
  const fragment = template.content;
  document.adoptNode(fragment);
  const context = CompilationContext.borrow(directives);
  compileAttributes(context, template, true);
  const hostBehaviorFactories = context.behaviorFactories;
  context.reset();
  const walker = DOM.createTemplateWalker(fragment);
  let node;
  while (node = walker.nextNode()) {
    context.targetIndex++;
    switch (node.nodeType) {
      case 1:
        compileAttributes(context, node);
        break;
      case 3:
        compileContent(context, node, walker);
        break;
      case 8:
        if (DOM.isMarker(node)) {
          context.addFactory(directives[DOM.extractDirectiveIndexFromMarker(node)]);
        }
    }
  }
  let targetOffset = 0;
  if (
    // If the first node in a fragment is a marker, that means it's an unstable first node,
    // because something like a when, repeat, etc. could add nodes before the marker.
    // To mitigate this, we insert a stable first node. However, if we insert a node,
    // that will alter the result of the TreeWalker. So, we also need to offset the target index.
    DOM.isMarker(fragment.firstChild) || // Or if there is only one node and a directive, it means the template's content
    // is *only* the directive. In that case, HTMLView.dispose() misses any nodes inserted by
    // the directive. Inserting a new node ensures proper disposal of nodes added by the directive.
    fragment.childNodes.length === 1 && directives.length
  ) {
    fragment.insertBefore(document.createComment(""), fragment.firstChild);
    targetOffset = -1;
  }
  const viewBehaviorFactories = context.behaviorFactories;
  context.release();
  return {
    fragment,
    viewBehaviorFactories,
    hostBehaviorFactories,
    targetOffset
  };
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/view.js
var range = document.createRange();
var HTMLView = class {
  /**
   * Constructs an instance of HTMLView.
   * @param fragment - The html fragment that contains the nodes for this view.
   * @param behaviors - The behaviors to be applied to this view.
   */
  constructor(fragment, behaviors) {
    this.fragment = fragment;
    this.behaviors = behaviors;
    this.source = null;
    this.context = null;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
  }
  /**
   * Appends the view's DOM nodes to the referenced node.
   * @param node - The parent node to append the view's DOM nodes to.
   */
  appendTo(node) {
    node.appendChild(this.fragment);
  }
  /**
   * Inserts the view's DOM nodes before the referenced node.
   * @param node - The node to insert the view's DOM before.
   */
  insertBefore(node) {
    if (this.fragment.hasChildNodes()) {
      node.parentNode.insertBefore(this.fragment, node);
    } else {
      const end = this.lastChild;
      if (node.previousSibling === end)
        return;
      const parentNode = node.parentNode;
      let current = this.firstChild;
      let next;
      while (current !== end) {
        next = current.nextSibling;
        parentNode.insertBefore(current, node);
        current = next;
      }
      parentNode.insertBefore(end, node);
    }
  }
  /**
   * Removes the view's DOM nodes.
   * The nodes are not disposed and the view can later be re-inserted.
   */
  remove() {
    const fragment = this.fragment;
    const end = this.lastChild;
    let current = this.firstChild;
    let next;
    while (current !== end) {
      next = current.nextSibling;
      fragment.appendChild(current);
      current = next;
    }
    fragment.appendChild(end);
  }
  /**
   * Removes the view and unbinds its behaviors, disposing of DOM nodes afterward.
   * Once a view has been disposed, it cannot be inserted or bound again.
   */
  dispose() {
    const parent = this.firstChild.parentNode;
    const end = this.lastChild;
    let current = this.firstChild;
    let next;
    while (current !== end) {
      next = current.nextSibling;
      parent.removeChild(current);
      current = next;
    }
    parent.removeChild(end);
    const behaviors = this.behaviors;
    const oldSource = this.source;
    for (let i = 0, ii = behaviors.length; i < ii; ++i) {
      behaviors[i].unbind(oldSource);
    }
  }
  /**
   * Binds a view's behaviors to its binding source.
   * @param source - The binding source for the view's binding behaviors.
   * @param context - The execution context to run the behaviors within.
   */
  bind(source, context) {
    const behaviors = this.behaviors;
    if (this.source === source) {
      return;
    } else if (this.source !== null) {
      const oldSource = this.source;
      this.source = source;
      this.context = context;
      for (let i = 0, ii = behaviors.length; i < ii; ++i) {
        const current = behaviors[i];
        current.unbind(oldSource);
        current.bind(source, context);
      }
    } else {
      this.source = source;
      this.context = context;
      for (let i = 0, ii = behaviors.length; i < ii; ++i) {
        behaviors[i].bind(source, context);
      }
    }
  }
  /**
   * Unbinds a view's behaviors from its binding source.
   */
  unbind() {
    if (this.source === null) {
      return;
    }
    const behaviors = this.behaviors;
    const oldSource = this.source;
    for (let i = 0, ii = behaviors.length; i < ii; ++i) {
      behaviors[i].unbind(oldSource);
    }
    this.source = null;
  }
  /**
   * Efficiently disposes of a contiguous range of synthetic view instances.
   * @param views - A contiguous range of views to be disposed.
   */
  static disposeContiguousBatch(views) {
    if (views.length === 0) {
      return;
    }
    range.setStartBefore(views[0].firstChild);
    range.setEndAfter(views[views.length - 1].lastChild);
    range.deleteContents();
    for (let i = 0, ii = views.length; i < ii; ++i) {
      const view = views[i];
      const behaviors = view.behaviors;
      const oldSource = view.source;
      for (let j = 0, jj = behaviors.length; j < jj; ++j) {
        behaviors[j].unbind(oldSource);
      }
    }
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/template.js
var ViewTemplate = class {
  /**
   * Creates an instance of ViewTemplate.
   * @param html - The html representing what this template will instantiate, including placeholders for directives.
   * @param directives - The directives that will be connected to placeholders in the html.
   */
  constructor(html2, directives) {
    this.behaviorCount = 0;
    this.hasHostBehaviors = false;
    this.fragment = null;
    this.targetOffset = 0;
    this.viewBehaviorFactories = null;
    this.hostBehaviorFactories = null;
    this.html = html2;
    this.directives = directives;
  }
  /**
   * Creates an HTMLView instance based on this template definition.
   * @param hostBindingTarget - The element that host behaviors will be bound to.
   */
  create(hostBindingTarget) {
    if (this.fragment === null) {
      let template;
      const html2 = this.html;
      if (typeof html2 === "string") {
        template = document.createElement("template");
        template.innerHTML = DOM.createHTML(html2);
        const fec = template.content.firstElementChild;
        if (fec !== null && fec.tagName === "TEMPLATE") {
          template = fec;
        }
      } else {
        template = html2;
      }
      const result = compileTemplate(template, this.directives);
      this.fragment = result.fragment;
      this.viewBehaviorFactories = result.viewBehaviorFactories;
      this.hostBehaviorFactories = result.hostBehaviorFactories;
      this.targetOffset = result.targetOffset;
      this.behaviorCount = this.viewBehaviorFactories.length + this.hostBehaviorFactories.length;
      this.hasHostBehaviors = this.hostBehaviorFactories.length > 0;
    }
    const fragment = this.fragment.cloneNode(true);
    const viewFactories = this.viewBehaviorFactories;
    const behaviors = new Array(this.behaviorCount);
    const walker = DOM.createTemplateWalker(fragment);
    let behaviorIndex = 0;
    let targetIndex = this.targetOffset;
    let node = walker.nextNode();
    for (let ii = viewFactories.length; behaviorIndex < ii; ++behaviorIndex) {
      const factory = viewFactories[behaviorIndex];
      const factoryIndex = factory.targetIndex;
      while (node !== null) {
        if (targetIndex === factoryIndex) {
          behaviors[behaviorIndex] = factory.createBehavior(node);
          break;
        } else {
          node = walker.nextNode();
          targetIndex++;
        }
      }
    }
    if (this.hasHostBehaviors) {
      const hostFactories = this.hostBehaviorFactories;
      for (let i = 0, ii = hostFactories.length; i < ii; ++i, ++behaviorIndex) {
        behaviors[behaviorIndex] = hostFactories[i].createBehavior(hostBindingTarget);
      }
    }
    return new HTMLView(fragment, behaviors);
  }
  /**
   * Creates an HTMLView from this template, binds it to the source, and then appends it to the host.
   * @param source - The data source to bind the template to.
   * @param host - The Element where the template will be rendered.
   * @param hostBindingTarget - An HTML element to target the host bindings at if different from the
   * host that the template is being attached to.
   */
  render(source, host, hostBindingTarget) {
    if (typeof host === "string") {
      host = document.getElementById(host);
    }
    if (hostBindingTarget === void 0) {
      hostBindingTarget = host;
    }
    const view = this.create(hostBindingTarget);
    view.bind(source, defaultExecutionContext);
    view.appendTo(host);
    return view;
  }
};
var lastAttributeNameRegex = (
  /* eslint-disable-next-line no-control-regex */
  /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/
);
function html(strings, ...values) {
  const directives = [];
  let html2 = "";
  for (let i = 0, ii = strings.length - 1; i < ii; ++i) {
    const currentString = strings[i];
    let value = values[i];
    html2 += currentString;
    if (value instanceof ViewTemplate) {
      const template = value;
      value = () => template;
    }
    if (typeof value === "function") {
      value = new HTMLBindingDirective(value);
    }
    if (value instanceof TargetedHTMLDirective) {
      const match = lastAttributeNameRegex.exec(currentString);
      if (match !== null) {
        value.targetName = match[2];
      }
    }
    if (value instanceof HTMLDirective) {
      html2 += value.createPlaceholder(directives.length);
      directives.push(value);
    } else {
      html2 += value;
    }
  }
  html2 += strings[strings.length - 1];
  return new ViewTemplate(html2, directives);
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/styles/element-styles.js
var ElementStyles = class {
  constructor() {
    this.targets = /* @__PURE__ */ new WeakSet();
  }
  /** @internal */
  addStylesTo(target) {
    this.targets.add(target);
  }
  /** @internal */
  removeStylesFrom(target) {
    this.targets.delete(target);
  }
  /** @internal */
  isAttachedTo(target) {
    return this.targets.has(target);
  }
  /**
   * Associates behaviors with this set of styles.
   * @param behaviors - The behaviors to associate.
   */
  withBehaviors(...behaviors) {
    this.behaviors = this.behaviors === null ? behaviors : this.behaviors.concat(behaviors);
    return this;
  }
};
ElementStyles.create = (() => {
  if (DOM.supportsAdoptedStyleSheets) {
    const styleSheetCache = /* @__PURE__ */ new Map();
    return (styles) => (
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      new AdoptedStyleSheetsStyles(styles, styleSheetCache)
    );
  }
  return (styles) => new StyleElementStyles(styles);
})();
function reduceStyles(styles) {
  return styles.map((x) => x instanceof ElementStyles ? reduceStyles(x.styles) : [x]).reduce((prev, curr) => prev.concat(curr), []);
}
function reduceBehaviors(styles) {
  return styles.map((x) => x instanceof ElementStyles ? x.behaviors : null).reduce((prev, curr) => {
    if (curr === null) {
      return prev;
    }
    if (prev === null) {
      prev = [];
    }
    return prev.concat(curr);
  }, null);
}
var prependToAdoptedStyleSheetsSymbol = Symbol("prependToAdoptedStyleSheets");
function separateSheetsToPrepend(sheets) {
  const prepend = [];
  const append = [];
  sheets.forEach((x) => (x[prependToAdoptedStyleSheetsSymbol] ? prepend : append).push(x));
  return { prepend, append };
}
var addAdoptedStyleSheets = (target, sheets) => {
  const { prepend, append } = separateSheetsToPrepend(sheets);
  target.adoptedStyleSheets = [...prepend, ...target.adoptedStyleSheets, ...append];
};
var removeAdoptedStyleSheets = (target, sheets) => {
  target.adoptedStyleSheets = target.adoptedStyleSheets.filter((x) => sheets.indexOf(x) === -1);
};
if (DOM.supportsAdoptedStyleSheets) {
  try {
    document.adoptedStyleSheets.push();
    document.adoptedStyleSheets.splice();
    addAdoptedStyleSheets = (target, sheets) => {
      const { prepend, append } = separateSheetsToPrepend(sheets);
      target.adoptedStyleSheets.splice(0, 0, ...prepend);
      target.adoptedStyleSheets.push(...append);
    };
    removeAdoptedStyleSheets = (target, sheets) => {
      for (const sheet of sheets) {
        const index = target.adoptedStyleSheets.indexOf(sheet);
        if (index !== -1) {
          target.adoptedStyleSheets.splice(index, 1);
        }
      }
    };
  } catch (e) {
  }
}
var AdoptedStyleSheetsStyles = class extends ElementStyles {
  constructor(styles, styleSheetCache) {
    super();
    this.styles = styles;
    this.styleSheetCache = styleSheetCache;
    this._styleSheets = void 0;
    this.behaviors = reduceBehaviors(styles);
  }
  get styleSheets() {
    if (this._styleSheets === void 0) {
      const styles = this.styles;
      const styleSheetCache = this.styleSheetCache;
      this._styleSheets = reduceStyles(styles).map((x) => {
        if (x instanceof CSSStyleSheet) {
          return x;
        }
        let sheet = styleSheetCache.get(x);
        if (sheet === void 0) {
          sheet = new CSSStyleSheet();
          sheet.replaceSync(x);
          styleSheetCache.set(x, sheet);
        }
        return sheet;
      });
    }
    return this._styleSheets;
  }
  addStylesTo(target) {
    addAdoptedStyleSheets(target, this.styleSheets);
    super.addStylesTo(target);
  }
  removeStylesFrom(target) {
    removeAdoptedStyleSheets(target, this.styleSheets);
    super.removeStylesFrom(target);
  }
};
var styleClassId = 0;
function getNextStyleClass() {
  return `fast-style-class-${++styleClassId}`;
}
var StyleElementStyles = class extends ElementStyles {
  constructor(styles) {
    super();
    this.styles = styles;
    this.behaviors = null;
    this.behaviors = reduceBehaviors(styles);
    this.styleSheets = reduceStyles(styles);
    this.styleClass = getNextStyleClass();
  }
  addStylesTo(target) {
    const styleSheets = this.styleSheets;
    const styleClass = this.styleClass;
    target = this.normalizeTarget(target);
    for (let i = 0; i < styleSheets.length; i++) {
      const element = document.createElement("style");
      element.innerHTML = styleSheets[i];
      element.className = styleClass;
      target.append(element);
    }
    super.addStylesTo(target);
  }
  removeStylesFrom(target) {
    target = this.normalizeTarget(target);
    const styles = target.querySelectorAll(`.${this.styleClass}`);
    for (let i = 0, ii = styles.length; i < ii; ++i) {
      target.removeChild(styles[i]);
    }
    super.removeStylesFrom(target);
  }
  isAttachedTo(target) {
    return super.isAttachedTo(this.normalizeTarget(target));
  }
  normalizeTarget(target) {
    return target === document ? document.body : target;
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/components/attributes.js
var AttributeConfiguration = Object.freeze({
  /**
   * Locates all attribute configurations associated with a type.
   */
  locate: createMetadataLocator()
});
var booleanConverter = {
  toView(value) {
    return value ? "true" : "false";
  },
  fromView(value) {
    if (value === null || value === void 0 || value === "false" || value === false || value === 0) {
      return false;
    }
    return true;
  }
};
var nullableNumberConverter = {
  toView(value) {
    if (value === null || value === void 0) {
      return null;
    }
    const number = value * 1;
    return isNaN(number) ? null : number.toString();
  },
  fromView(value) {
    if (value === null || value === void 0) {
      return null;
    }
    const number = value * 1;
    return isNaN(number) ? null : number;
  }
};
var AttributeDefinition = class _AttributeDefinition {
  /**
   * Creates an instance of AttributeDefinition.
   * @param Owner - The class constructor that owns this attribute.
   * @param name - The name of the property associated with the attribute.
   * @param attribute - The name of the attribute in HTML.
   * @param mode - The {@link AttributeMode} that describes the behavior of this attribute.
   * @param converter - A {@link ValueConverter} that integrates with the property getter/setter
   * to convert values to and from a DOM string.
   */
  constructor(Owner, name, attribute = name.toLowerCase(), mode = "reflect", converter) {
    this.guards = /* @__PURE__ */ new Set();
    this.Owner = Owner;
    this.name = name;
    this.attribute = attribute;
    this.mode = mode;
    this.converter = converter;
    this.fieldName = `_${name}`;
    this.callbackName = `${name}Changed`;
    this.hasCallback = this.callbackName in Owner.prototype;
    if (mode === "boolean" && converter === void 0) {
      this.converter = booleanConverter;
    }
  }
  /**
   * Sets the value of the attribute/property on the source element.
   * @param source - The source element to access.
   * @param value - The value to set the attribute/property to.
   */
  setValue(source, newValue) {
    const oldValue = source[this.fieldName];
    const converter = this.converter;
    if (converter !== void 0) {
      newValue = converter.fromView(newValue);
    }
    if (oldValue !== newValue) {
      source[this.fieldName] = newValue;
      this.tryReflectToAttribute(source);
      if (this.hasCallback) {
        source[this.callbackName](oldValue, newValue);
      }
      source.$fastController.notify(this.name);
    }
  }
  /**
   * Gets the value of the attribute/property on the source element.
   * @param source - The source element to access.
   */
  getValue(source) {
    Observable.track(source, this.name);
    return source[this.fieldName];
  }
  /** @internal */
  onAttributeChangedCallback(element, value) {
    if (this.guards.has(element)) {
      return;
    }
    this.guards.add(element);
    this.setValue(element, value);
    this.guards.delete(element);
  }
  tryReflectToAttribute(element) {
    const mode = this.mode;
    const guards = this.guards;
    if (guards.has(element) || mode === "fromView") {
      return;
    }
    DOM.queueUpdate(() => {
      guards.add(element);
      const latestValue = element[this.fieldName];
      switch (mode) {
        case "reflect":
          const converter = this.converter;
          DOM.setAttribute(element, this.attribute, converter !== void 0 ? converter.toView(latestValue) : latestValue);
          break;
        case "boolean":
          DOM.setBooleanAttribute(element, this.attribute, latestValue);
          break;
      }
      guards.delete(element);
    });
  }
  /**
   * Collects all attribute definitions associated with the owner.
   * @param Owner - The class constructor to collect attribute for.
   * @param attributeLists - Any existing attributes to collect and merge with those associated with the owner.
   * @internal
   */
  static collect(Owner, ...attributeLists) {
    const attributes = [];
    attributeLists.push(AttributeConfiguration.locate(Owner));
    for (let i = 0, ii = attributeLists.length; i < ii; ++i) {
      const list = attributeLists[i];
      if (list === void 0) {
        continue;
      }
      for (let j = 0, jj = list.length; j < jj; ++j) {
        const config = list[j];
        if (typeof config === "string") {
          attributes.push(new _AttributeDefinition(Owner, config));
        } else {
          attributes.push(new _AttributeDefinition(Owner, config.property, config.attribute, config.mode, config.converter));
        }
      }
    }
    return attributes;
  }
};
function attr(configOrTarget, prop) {
  let config;
  function decorator($target, $prop) {
    if (arguments.length > 1) {
      config.property = $prop;
    }
    AttributeConfiguration.locate($target.constructor).push(config);
  }
  if (arguments.length > 1) {
    config = {};
    decorator(configOrTarget, prop);
    return;
  }
  config = configOrTarget === void 0 ? {} : configOrTarget;
  return decorator;
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/components/fast-definitions.js
var defaultShadowOptions = { mode: "open" };
var defaultElementOptions = {};
var fastRegistry = FAST.getById(4, () => {
  const typeToDefinition = /* @__PURE__ */ new Map();
  return Object.freeze({
    register(definition) {
      if (typeToDefinition.has(definition.type)) {
        return false;
      }
      typeToDefinition.set(definition.type, definition);
      return true;
    },
    getByType(key) {
      return typeToDefinition.get(key);
    }
  });
});
var FASTElementDefinition = class {
  /**
   * Creates an instance of FASTElementDefinition.
   * @param type - The type this definition is being created for.
   * @param nameOrConfig - The name of the element to define or a config object
   * that describes the element to define.
   */
  constructor(type, nameOrConfig = type.definition) {
    if (typeof nameOrConfig === "string") {
      nameOrConfig = { name: nameOrConfig };
    }
    this.type = type;
    this.name = nameOrConfig.name;
    this.template = nameOrConfig.template;
    const attributes = AttributeDefinition.collect(type, nameOrConfig.attributes);
    const observedAttributes = new Array(attributes.length);
    const propertyLookup = {};
    const attributeLookup = {};
    for (let i = 0, ii = attributes.length; i < ii; ++i) {
      const current = attributes[i];
      observedAttributes[i] = current.attribute;
      propertyLookup[current.name] = current;
      attributeLookup[current.attribute] = current;
    }
    this.attributes = attributes;
    this.observedAttributes = observedAttributes;
    this.propertyLookup = propertyLookup;
    this.attributeLookup = attributeLookup;
    this.shadowOptions = nameOrConfig.shadowOptions === void 0 ? defaultShadowOptions : nameOrConfig.shadowOptions === null ? void 0 : Object.assign(Object.assign({}, defaultShadowOptions), nameOrConfig.shadowOptions);
    this.elementOptions = nameOrConfig.elementOptions === void 0 ? defaultElementOptions : Object.assign(Object.assign({}, defaultElementOptions), nameOrConfig.elementOptions);
    this.styles = nameOrConfig.styles === void 0 ? void 0 : Array.isArray(nameOrConfig.styles) ? ElementStyles.create(nameOrConfig.styles) : nameOrConfig.styles instanceof ElementStyles ? nameOrConfig.styles : ElementStyles.create([nameOrConfig.styles]);
  }
  /**
   * Indicates if this element has been defined in at least one registry.
   */
  get isDefined() {
    return !!fastRegistry.getByType(this.type);
  }
  /**
   * Defines a custom element based on this definition.
   * @param registry - The element registry to define the element in.
   */
  define(registry = customElements) {
    const type = this.type;
    if (fastRegistry.register(this)) {
      const attributes = this.attributes;
      const proto = type.prototype;
      for (let i = 0, ii = attributes.length; i < ii; ++i) {
        Observable.defineProperty(proto, attributes[i]);
      }
      Reflect.defineProperty(type, "observedAttributes", {
        value: this.observedAttributes,
        enumerable: true
      });
    }
    if (!registry.get(this.name)) {
      registry.define(this.name, type, this.elementOptions);
    }
    return this;
  }
};
FASTElementDefinition.forType = fastRegistry.getByType;

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/components/controller.js
var shadowRoots = /* @__PURE__ */ new WeakMap();
var defaultEventOptions = {
  bubbles: true,
  composed: true,
  cancelable: true
};
function getShadowRoot(element) {
  return element.shadowRoot || shadowRoots.get(element) || null;
}
var Controller = class _Controller extends PropertyChangeNotifier {
  /**
   * Creates a Controller to control the specified element.
   * @param element - The element to be controlled by this controller.
   * @param definition - The element definition metadata that instructs this
   * controller in how to handle rendering and other platform integrations.
   * @internal
   */
  constructor(element, definition) {
    super(element);
    this.boundObservables = null;
    this.behaviors = null;
    this.needsInitialization = true;
    this._template = null;
    this._styles = null;
    this._isConnected = false;
    this.$fastController = this;
    this.view = null;
    this.element = element;
    this.definition = definition;
    const shadowOptions = definition.shadowOptions;
    if (shadowOptions !== void 0) {
      const shadowRoot = element.attachShadow(shadowOptions);
      if (shadowOptions.mode === "closed") {
        shadowRoots.set(element, shadowRoot);
      }
    }
    const accessors = Observable.getAccessors(element);
    if (accessors.length > 0) {
      const boundObservables = this.boundObservables = /* @__PURE__ */ Object.create(null);
      for (let i = 0, ii = accessors.length; i < ii; ++i) {
        const propertyName = accessors[i].name;
        const value = element[propertyName];
        if (value !== void 0) {
          delete element[propertyName];
          boundObservables[propertyName] = value;
        }
      }
    }
  }
  /**
   * Indicates whether or not the custom element has been
   * connected to the document.
   */
  get isConnected() {
    Observable.track(this, "isConnected");
    return this._isConnected;
  }
  setIsConnected(value) {
    this._isConnected = value;
    Observable.notify(this, "isConnected");
  }
  /**
   * Gets/sets the template used to render the component.
   * @remarks
   * This value can only be accurately read after connect but can be set at any time.
   */
  get template() {
    return this._template;
  }
  set template(value) {
    if (this._template === value) {
      return;
    }
    this._template = value;
    if (!this.needsInitialization) {
      this.renderTemplate(value);
    }
  }
  /**
   * Gets/sets the primary styles used for the component.
   * @remarks
   * This value can only be accurately read after connect but can be set at any time.
   */
  get styles() {
    return this._styles;
  }
  set styles(value) {
    if (this._styles === value) {
      return;
    }
    if (this._styles !== null) {
      this.removeStyles(this._styles);
    }
    this._styles = value;
    if (!this.needsInitialization && value !== null) {
      this.addStyles(value);
    }
  }
  /**
   * Adds styles to this element. Providing an HTMLStyleElement will attach the element instance to the shadowRoot.
   * @param styles - The styles to add.
   */
  addStyles(styles) {
    const target = getShadowRoot(this.element) || this.element.getRootNode();
    if (styles instanceof HTMLStyleElement) {
      target.append(styles);
    } else if (!styles.isAttachedTo(target)) {
      const sourceBehaviors = styles.behaviors;
      styles.addStylesTo(target);
      if (sourceBehaviors !== null) {
        this.addBehaviors(sourceBehaviors);
      }
    }
  }
  /**
   * Removes styles from this element. Providing an HTMLStyleElement will detach the element instance from the shadowRoot.
   * @param styles - the styles to remove.
   */
  removeStyles(styles) {
    const target = getShadowRoot(this.element) || this.element.getRootNode();
    if (styles instanceof HTMLStyleElement) {
      target.removeChild(styles);
    } else if (styles.isAttachedTo(target)) {
      const sourceBehaviors = styles.behaviors;
      styles.removeStylesFrom(target);
      if (sourceBehaviors !== null) {
        this.removeBehaviors(sourceBehaviors);
      }
    }
  }
  /**
   * Adds behaviors to this element.
   * @param behaviors - The behaviors to add.
   */
  addBehaviors(behaviors) {
    const targetBehaviors = this.behaviors || (this.behaviors = /* @__PURE__ */ new Map());
    const length = behaviors.length;
    const behaviorsToBind = [];
    for (let i = 0; i < length; ++i) {
      const behavior = behaviors[i];
      if (targetBehaviors.has(behavior)) {
        targetBehaviors.set(behavior, targetBehaviors.get(behavior) + 1);
      } else {
        targetBehaviors.set(behavior, 1);
        behaviorsToBind.push(behavior);
      }
    }
    if (this._isConnected) {
      const element = this.element;
      for (let i = 0; i < behaviorsToBind.length; ++i) {
        behaviorsToBind[i].bind(element, defaultExecutionContext);
      }
    }
  }
  /**
   * Removes behaviors from this element.
   * @param behaviors - The behaviors to remove.
   * @param force - Forces unbinding of behaviors.
   */
  removeBehaviors(behaviors, force = false) {
    const targetBehaviors = this.behaviors;
    if (targetBehaviors === null) {
      return;
    }
    const length = behaviors.length;
    const behaviorsToUnbind = [];
    for (let i = 0; i < length; ++i) {
      const behavior = behaviors[i];
      if (targetBehaviors.has(behavior)) {
        const count = targetBehaviors.get(behavior) - 1;
        count === 0 || force ? targetBehaviors.delete(behavior) && behaviorsToUnbind.push(behavior) : targetBehaviors.set(behavior, count);
      }
    }
    if (this._isConnected) {
      const element = this.element;
      for (let i = 0; i < behaviorsToUnbind.length; ++i) {
        behaviorsToUnbind[i].unbind(element);
      }
    }
  }
  /**
   * Runs connected lifecycle behavior on the associated element.
   */
  onConnectedCallback() {
    if (this._isConnected) {
      return;
    }
    const element = this.element;
    if (this.needsInitialization) {
      this.finishInitialization();
    } else if (this.view !== null) {
      this.view.bind(element, defaultExecutionContext);
    }
    const behaviors = this.behaviors;
    if (behaviors !== null) {
      for (const [behavior] of behaviors) {
        behavior.bind(element, defaultExecutionContext);
      }
    }
    this.setIsConnected(true);
  }
  /**
   * Runs disconnected lifecycle behavior on the associated element.
   */
  onDisconnectedCallback() {
    if (!this._isConnected) {
      return;
    }
    this.setIsConnected(false);
    const view = this.view;
    if (view !== null) {
      view.unbind();
    }
    const behaviors = this.behaviors;
    if (behaviors !== null) {
      const element = this.element;
      for (const [behavior] of behaviors) {
        behavior.unbind(element);
      }
    }
  }
  /**
   * Runs the attribute changed callback for the associated element.
   * @param name - The name of the attribute that changed.
   * @param oldValue - The previous value of the attribute.
   * @param newValue - The new value of the attribute.
   */
  onAttributeChangedCallback(name, oldValue, newValue) {
    const attrDef = this.definition.attributeLookup[name];
    if (attrDef !== void 0) {
      attrDef.onAttributeChangedCallback(this.element, newValue);
    }
  }
  /**
   * Emits a custom HTML event.
   * @param type - The type name of the event.
   * @param detail - The event detail object to send with the event.
   * @param options - The event options. By default bubbles and composed.
   * @remarks
   * Only emits events if connected.
   */
  emit(type, detail, options) {
    if (this._isConnected) {
      return this.element.dispatchEvent(new CustomEvent(type, Object.assign(Object.assign({ detail }, defaultEventOptions), options)));
    }
    return false;
  }
  finishInitialization() {
    const element = this.element;
    const boundObservables = this.boundObservables;
    if (boundObservables !== null) {
      const propertyNames = Object.keys(boundObservables);
      for (let i = 0, ii = propertyNames.length; i < ii; ++i) {
        const propertyName = propertyNames[i];
        element[propertyName] = boundObservables[propertyName];
      }
      this.boundObservables = null;
    }
    const definition = this.definition;
    if (this._template === null) {
      if (this.element.resolveTemplate) {
        this._template = this.element.resolveTemplate();
      } else if (definition.template) {
        this._template = definition.template || null;
      }
    }
    if (this._template !== null) {
      this.renderTemplate(this._template);
    }
    if (this._styles === null) {
      if (this.element.resolveStyles) {
        this._styles = this.element.resolveStyles();
      } else if (definition.styles) {
        this._styles = definition.styles || null;
      }
    }
    if (this._styles !== null) {
      this.addStyles(this._styles);
    }
    this.needsInitialization = false;
  }
  renderTemplate(template) {
    const element = this.element;
    const host = getShadowRoot(element) || element;
    if (this.view !== null) {
      this.view.dispose();
      this.view = null;
    } else if (!this.needsInitialization) {
      DOM.removeChildNodes(host);
    }
    if (template) {
      this.view = template.render(element, host, element);
    }
  }
  /**
   * Locates or creates a controller for the specified element.
   * @param element - The element to return the controller for.
   * @remarks
   * The specified element must have a {@link FASTElementDefinition}
   * registered either through the use of the {@link customElement}
   * decorator or a call to `FASTElement.define`.
   */
  static forCustomElement(element) {
    const controller = element.$fastController;
    if (controller !== void 0) {
      return controller;
    }
    const definition = FASTElementDefinition.forType(element.constructor);
    if (definition === void 0) {
      throw new Error("Missing FASTElement definition.");
    }
    return element.$fastController = new _Controller(element, definition);
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/components/fast-element.js
function createFASTElement(BaseType) {
  return class extends BaseType {
    constructor() {
      super();
      Controller.forCustomElement(this);
    }
    $emit(type, detail, options) {
      return this.$fastController.emit(type, detail, options);
    }
    connectedCallback() {
      this.$fastController.onConnectedCallback();
    }
    disconnectedCallback() {
      this.$fastController.onDisconnectedCallback();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      this.$fastController.onAttributeChangedCallback(name, oldValue, newValue);
    }
  };
}
var FASTElement = Object.assign(createFASTElement(HTMLElement), {
  /**
   * Creates a new FASTElement base class inherited from the
   * provided base type.
   * @param BaseType - The base element type to inherit from.
   */
  from(BaseType) {
    return createFASTElement(BaseType);
  },
  /**
   * Defines a platform custom element based on the provided type and definition.
   * @param type - The custom element type to define.
   * @param nameOrDef - The name of the element to define or a definition object
   * that describes the element to define.
   */
  define(type, nameOrDef) {
    return new FASTElementDefinition(type, nameOrDef).define().type;
  }
});
function customElement(nameOrDef) {
  return function(type) {
    new FASTElementDefinition(type, nameOrDef).define();
  };
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/styles/css-directive.js
var CSSDirective = class {
  /**
   * Creates a CSS fragment to interpolate into the CSS document.
   * @returns - the string to interpolate into CSS
   */
  createCSS() {
    return "";
  }
  /**
   * Creates a behavior to bind to the host element.
   * @returns - the behavior to bind to the host element, or undefined.
   */
  createBehavior() {
    return void 0;
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/styles/css.js
function collectStyles(strings, values) {
  const styles = [];
  let cssString = "";
  const behaviors = [];
  for (let i = 0, ii = strings.length - 1; i < ii; ++i) {
    cssString += strings[i];
    let value = values[i];
    if (value instanceof CSSDirective) {
      const behavior = value.createBehavior();
      value = value.createCSS();
      if (behavior) {
        behaviors.push(behavior);
      }
    }
    if (value instanceof ElementStyles || value instanceof CSSStyleSheet) {
      if (cssString.trim() !== "") {
        styles.push(cssString);
        cssString = "";
      }
      styles.push(value);
    } else {
      cssString += value;
    }
  }
  cssString += strings[strings.length - 1];
  if (cssString.trim() !== "") {
    styles.push(cssString);
  }
  return {
    styles,
    behaviors
  };
}
function css(strings, ...values) {
  const { styles, behaviors } = collectStyles(strings, values);
  const elementStyles = ElementStyles.create(styles);
  if (behaviors.length) {
    elementStyles.withBehaviors(...behaviors);
  }
  return elementStyles;
}
var CSSPartial = class extends CSSDirective {
  constructor(styles, behaviors) {
    super();
    this.behaviors = behaviors;
    this.css = "";
    const stylesheets = styles.reduce((accumulated, current) => {
      if (typeof current === "string") {
        this.css += current;
      } else {
        accumulated.push(current);
      }
      return accumulated;
    }, []);
    if (stylesheets.length) {
      this.styles = ElementStyles.create(stylesheets);
    }
  }
  createBehavior() {
    return this;
  }
  createCSS() {
    return this.css;
  }
  bind(el) {
    if (this.styles) {
      el.$fastController.addStyles(this.styles);
    }
    if (this.behaviors.length) {
      el.$fastController.addBehaviors(this.behaviors);
    }
  }
  unbind(el) {
    if (this.styles) {
      el.$fastController.removeStyles(this.styles);
    }
    if (this.behaviors.length) {
      el.$fastController.removeBehaviors(this.behaviors);
    }
  }
};
function cssPartial(strings, ...values) {
  const { styles, behaviors } = collectStyles(strings, values);
  return new CSSPartial(styles, behaviors);
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/observation/array-change-records.js
function newSplice(index, removed, addedCount) {
  return {
    index,
    removed,
    addedCount
  };
}
var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;
function calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd) {
  const rowCount = oldEnd - oldStart + 1;
  const columnCount = currentEnd - currentStart + 1;
  const distances = new Array(rowCount);
  let north;
  let west;
  for (let i = 0; i < rowCount; ++i) {
    distances[i] = new Array(columnCount);
    distances[i][0] = i;
  }
  for (let j = 0; j < columnCount; ++j) {
    distances[0][j] = j;
  }
  for (let i = 1; i < rowCount; ++i) {
    for (let j = 1; j < columnCount; ++j) {
      if (current[currentStart + j - 1] === old[oldStart + i - 1]) {
        distances[i][j] = distances[i - 1][j - 1];
      } else {
        north = distances[i - 1][j] + 1;
        west = distances[i][j - 1] + 1;
        distances[i][j] = north < west ? north : west;
      }
    }
  }
  return distances;
}
function spliceOperationsFromEditDistances(distances) {
  let i = distances.length - 1;
  let j = distances[0].length - 1;
  let current = distances[i][j];
  const edits = [];
  while (i > 0 || j > 0) {
    if (i === 0) {
      edits.push(EDIT_ADD);
      j--;
      continue;
    }
    if (j === 0) {
      edits.push(EDIT_DELETE);
      i--;
      continue;
    }
    const northWest = distances[i - 1][j - 1];
    const west = distances[i - 1][j];
    const north = distances[i][j - 1];
    let min;
    if (west < north) {
      min = west < northWest ? west : northWest;
    } else {
      min = north < northWest ? north : northWest;
    }
    if (min === northWest) {
      if (northWest === current) {
        edits.push(EDIT_LEAVE);
      } else {
        edits.push(EDIT_UPDATE);
        current = northWest;
      }
      i--;
      j--;
    } else if (min === west) {
      edits.push(EDIT_DELETE);
      i--;
      current = west;
    } else {
      edits.push(EDIT_ADD);
      j--;
      current = north;
    }
  }
  edits.reverse();
  return edits;
}
function sharedPrefix(current, old, searchLength) {
  for (let i = 0; i < searchLength; ++i) {
    if (current[i] !== old[i]) {
      return i;
    }
  }
  return searchLength;
}
function sharedSuffix(current, old, searchLength) {
  let index1 = current.length;
  let index2 = old.length;
  let count = 0;
  while (count < searchLength && current[--index1] === old[--index2]) {
    count++;
  }
  return count;
}
function intersect(start1, end1, start2, end2) {
  if (end1 < start2 || end2 < start1) {
    return -1;
  }
  if (end1 === start2 || end2 === start1) {
    return 0;
  }
  if (start1 < start2) {
    if (end1 < end2) {
      return end1 - start2;
    }
    return end2 - start2;
  }
  if (end2 < end1) {
    return end2 - start1;
  }
  return end1 - start1;
}
function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
  let prefixCount = 0;
  let suffixCount = 0;
  const minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
  if (currentStart === 0 && oldStart === 0) {
    prefixCount = sharedPrefix(current, old, minLength);
  }
  if (currentEnd === current.length && oldEnd === old.length) {
    suffixCount = sharedSuffix(current, old, minLength - prefixCount);
  }
  currentStart += prefixCount;
  oldStart += prefixCount;
  currentEnd -= suffixCount;
  oldEnd -= suffixCount;
  if (currentEnd - currentStart === 0 && oldEnd - oldStart === 0) {
    return emptyArray;
  }
  if (currentStart === currentEnd) {
    const splice2 = newSplice(currentStart, [], 0);
    while (oldStart < oldEnd) {
      splice2.removed.push(old[oldStart++]);
    }
    return [splice2];
  } else if (oldStart === oldEnd) {
    return [newSplice(currentStart, [], currentEnd - currentStart)];
  }
  const ops = spliceOperationsFromEditDistances(calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
  const splices = [];
  let splice = void 0;
  let index = currentStart;
  let oldIndex = oldStart;
  for (let i = 0; i < ops.length; ++i) {
    switch (ops[i]) {
      case EDIT_LEAVE:
        if (splice !== void 0) {
          splices.push(splice);
          splice = void 0;
        }
        index++;
        oldIndex++;
        break;
      case EDIT_UPDATE:
        if (splice === void 0) {
          splice = newSplice(index, [], 0);
        }
        splice.addedCount++;
        index++;
        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
      case EDIT_ADD:
        if (splice === void 0) {
          splice = newSplice(index, [], 0);
        }
        splice.addedCount++;
        index++;
        break;
      case EDIT_DELETE:
        if (splice === void 0) {
          splice = newSplice(index, [], 0);
        }
        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
    }
  }
  if (splice !== void 0) {
    splices.push(splice);
  }
  return splices;
}
var $push = Array.prototype.push;
function mergeSplice(splices, index, removed, addedCount) {
  const splice = newSplice(index, removed, addedCount);
  let inserted = false;
  let insertionOffset = 0;
  for (let i = 0; i < splices.length; i++) {
    const current = splices[i];
    current.index += insertionOffset;
    if (inserted) {
      continue;
    }
    const intersectCount = intersect(splice.index, splice.index + splice.removed.length, current.index, current.index + current.addedCount);
    if (intersectCount >= 0) {
      splices.splice(i, 1);
      i--;
      insertionOffset -= current.addedCount - current.removed.length;
      splice.addedCount += current.addedCount - intersectCount;
      const deleteCount = splice.removed.length + current.removed.length - intersectCount;
      if (!splice.addedCount && !deleteCount) {
        inserted = true;
      } else {
        let currentRemoved = current.removed;
        if (splice.index < current.index) {
          const prepend = splice.removed.slice(0, current.index - splice.index);
          $push.apply(prepend, currentRemoved);
          currentRemoved = prepend;
        }
        if (splice.index + splice.removed.length > current.index + current.addedCount) {
          const append = splice.removed.slice(current.index + current.addedCount - splice.index);
          $push.apply(currentRemoved, append);
        }
        splice.removed = currentRemoved;
        if (current.index < splice.index) {
          splice.index = current.index;
        }
      }
    } else if (splice.index < current.index) {
      inserted = true;
      splices.splice(i, 0, splice);
      i++;
      const offset = splice.addedCount - splice.removed.length;
      current.index += offset;
      insertionOffset += offset;
    }
  }
  if (!inserted) {
    splices.push(splice);
  }
}
function createInitialSplices(changeRecords) {
  const splices = [];
  for (let i = 0, ii = changeRecords.length; i < ii; i++) {
    const record = changeRecords[i];
    mergeSplice(splices, record.index, record.removed, record.addedCount);
  }
  return splices;
}
function projectArraySplices(array, changeRecords) {
  let splices = [];
  const initialSplices = createInitialSplices(changeRecords);
  for (let i = 0, ii = initialSplices.length; i < ii; ++i) {
    const splice = initialSplices[i];
    if (splice.addedCount === 1 && splice.removed.length === 1) {
      if (splice.removed[0] !== array[splice.index]) {
        splices.push(splice);
      }
      continue;
    }
    splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount, splice.removed, 0, splice.removed.length));
  }
  return splices;
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/observation/array-observer.js
var arrayObservationEnabled = false;
function adjustIndex(changeRecord, array) {
  let index = changeRecord.index;
  const arrayLength = array.length;
  if (index > arrayLength) {
    index = arrayLength - changeRecord.addedCount;
  } else if (index < 0) {
    index = arrayLength + changeRecord.removed.length + index - changeRecord.addedCount;
  }
  if (index < 0) {
    index = 0;
  }
  changeRecord.index = index;
  return changeRecord;
}
var ArrayObserver = class extends SubscriberSet {
  constructor(source) {
    super(source);
    this.oldCollection = void 0;
    this.splices = void 0;
    this.needsQueue = true;
    this.call = this.flush;
    Reflect.defineProperty(source, "$fastController", {
      value: this,
      enumerable: false
    });
  }
  subscribe(subscriber) {
    this.flush();
    super.subscribe(subscriber);
  }
  addSplice(splice) {
    if (this.splices === void 0) {
      this.splices = [splice];
    } else {
      this.splices.push(splice);
    }
    if (this.needsQueue) {
      this.needsQueue = false;
      DOM.queueUpdate(this);
    }
  }
  reset(oldCollection) {
    this.oldCollection = oldCollection;
    if (this.needsQueue) {
      this.needsQueue = false;
      DOM.queueUpdate(this);
    }
  }
  flush() {
    const splices = this.splices;
    const oldCollection = this.oldCollection;
    if (splices === void 0 && oldCollection === void 0) {
      return;
    }
    this.needsQueue = true;
    this.splices = void 0;
    this.oldCollection = void 0;
    const finalSplices = oldCollection === void 0 ? projectArraySplices(this.source, splices) : calcSplices(this.source, 0, this.source.length, oldCollection, 0, oldCollection.length);
    this.notify(finalSplices);
  }
};
function enableArrayObservation() {
  if (arrayObservationEnabled) {
    return;
  }
  arrayObservationEnabled = true;
  Observable.setArrayObserverFactory((collection) => {
    return new ArrayObserver(collection);
  });
  const proto = Array.prototype;
  if (proto.$fastPatch) {
    return;
  }
  Reflect.defineProperty(proto, "$fastPatch", {
    value: 1,
    enumerable: false
  });
  const pop = proto.pop;
  const push = proto.push;
  const reverse = proto.reverse;
  const shift = proto.shift;
  const sort = proto.sort;
  const splice = proto.splice;
  const unshift = proto.unshift;
  proto.pop = function() {
    const notEmpty = this.length > 0;
    const methodCallResult = pop.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0 && notEmpty) {
      o.addSplice(newSplice(this.length, [methodCallResult], 0));
    }
    return methodCallResult;
  };
  proto.push = function() {
    const methodCallResult = push.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0) {
      o.addSplice(adjustIndex(newSplice(this.length - arguments.length, [], arguments.length), this));
    }
    return methodCallResult;
  };
  proto.reverse = function() {
    let oldArray;
    const o = this.$fastController;
    if (o !== void 0) {
      o.flush();
      oldArray = this.slice();
    }
    const methodCallResult = reverse.apply(this, arguments);
    if (o !== void 0) {
      o.reset(oldArray);
    }
    return methodCallResult;
  };
  proto.shift = function() {
    const notEmpty = this.length > 0;
    const methodCallResult = shift.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0 && notEmpty) {
      o.addSplice(newSplice(0, [methodCallResult], 0));
    }
    return methodCallResult;
  };
  proto.sort = function() {
    let oldArray;
    const o = this.$fastController;
    if (o !== void 0) {
      o.flush();
      oldArray = this.slice();
    }
    const methodCallResult = sort.apply(this, arguments);
    if (o !== void 0) {
      o.reset(oldArray);
    }
    return methodCallResult;
  };
  proto.splice = function() {
    const methodCallResult = splice.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0) {
      o.addSplice(adjustIndex(newSplice(+arguments[0], methodCallResult, arguments.length > 2 ? arguments.length - 2 : 0), this));
    }
    return methodCallResult;
  };
  proto.unshift = function() {
    const methodCallResult = unshift.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0) {
      o.addSplice(adjustIndex(newSplice(0, [], arguments.length), this));
    }
    return methodCallResult;
  };
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/ref.js
var RefBehavior = class {
  /**
   * Creates an instance of RefBehavior.
   * @param target - The element to reference.
   * @param propertyName - The name of the property to assign the reference to.
   */
  constructor(target, propertyName) {
    this.target = target;
    this.propertyName = propertyName;
  }
  /**
   * Bind this behavior to the source.
   * @param source - The source to bind to.
   * @param context - The execution context that the binding is operating within.
   */
  bind(source) {
    source[this.propertyName] = this.target;
  }
  /**
   * Unbinds this behavior from the source.
   * @param source - The source to unbind from.
   */
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  unbind() {
  }
};
function ref(propertyName) {
  return new AttachedBehaviorHTMLDirective("fast-ref", RefBehavior, propertyName);
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/interfaces.js
var isFunction = (object) => typeof object === "function";

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/when.js
var noTemplate = () => null;
function normalizeBinding(value) {
  return value === void 0 ? noTemplate : isFunction(value) ? value : () => value;
}
function when(binding, templateOrTemplateBinding, elseTemplateOrTemplateBinding) {
  const dataBinding = isFunction(binding) ? binding : () => binding;
  const templateBinding = normalizeBinding(templateOrTemplateBinding);
  const elseBinding = normalizeBinding(elseTemplateOrTemplateBinding);
  return (source, context) => dataBinding(source, context) ? templateBinding(source, context) : elseBinding(source, context);
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/repeat.js
var defaultRepeatOptions = Object.freeze({
  positioning: false,
  recycle: true
});
function bindWithoutPositioning(view, items, index, context) {
  view.bind(items[index], context);
}
function bindWithPositioning(view, items, index, context) {
  const childContext = Object.create(context);
  childContext.index = index;
  childContext.length = items.length;
  view.bind(items[index], childContext);
}
var RepeatBehavior = class {
  /**
   * Creates an instance of RepeatBehavior.
   * @param location - The location in the DOM to render the repeat.
   * @param itemsBinding - The array to render.
   * @param isItemsBindingVolatile - Indicates whether the items binding has volatile dependencies.
   * @param templateBinding - The template to render for each item.
   * @param isTemplateBindingVolatile - Indicates whether the template binding has volatile dependencies.
   * @param options - Options used to turn on special repeat features.
   */
  constructor(location, itemsBinding, isItemsBindingVolatile, templateBinding, isTemplateBindingVolatile, options) {
    this.location = location;
    this.itemsBinding = itemsBinding;
    this.templateBinding = templateBinding;
    this.options = options;
    this.source = null;
    this.views = [];
    this.items = null;
    this.itemsObserver = null;
    this.originalContext = void 0;
    this.childContext = void 0;
    this.bindView = bindWithoutPositioning;
    this.itemsBindingObserver = Observable.binding(itemsBinding, this, isItemsBindingVolatile);
    this.templateBindingObserver = Observable.binding(templateBinding, this, isTemplateBindingVolatile);
    if (options.positioning) {
      this.bindView = bindWithPositioning;
    }
  }
  /**
   * Bind this behavior to the source.
   * @param source - The source to bind to.
   * @param context - The execution context that the binding is operating within.
   */
  bind(source, context) {
    this.source = source;
    this.originalContext = context;
    this.childContext = Object.create(context);
    this.childContext.parent = source;
    this.childContext.parentContext = this.originalContext;
    this.items = this.itemsBindingObserver.observe(source, this.originalContext);
    this.template = this.templateBindingObserver.observe(source, this.originalContext);
    this.observeItems(true);
    this.refreshAllViews();
  }
  /**
   * Unbinds this behavior from the source.
   * @param source - The source to unbind from.
   */
  unbind() {
    this.source = null;
    this.items = null;
    if (this.itemsObserver !== null) {
      this.itemsObserver.unsubscribe(this);
    }
    this.unbindAllViews();
    this.itemsBindingObserver.disconnect();
    this.templateBindingObserver.disconnect();
  }
  /** @internal */
  handleChange(source, args) {
    if (source === this.itemsBinding) {
      this.items = this.itemsBindingObserver.observe(this.source, this.originalContext);
      this.observeItems();
      this.refreshAllViews();
    } else if (source === this.templateBinding) {
      this.template = this.templateBindingObserver.observe(this.source, this.originalContext);
      this.refreshAllViews(true);
    } else {
      this.updateViews(args);
    }
  }
  observeItems(force = false) {
    if (!this.items) {
      this.items = emptyArray;
      return;
    }
    const oldObserver = this.itemsObserver;
    const newObserver = this.itemsObserver = Observable.getNotifier(this.items);
    const hasNewObserver = oldObserver !== newObserver;
    if (hasNewObserver && oldObserver !== null) {
      oldObserver.unsubscribe(this);
    }
    if (hasNewObserver || force) {
      newObserver.subscribe(this);
    }
  }
  updateViews(splices) {
    const childContext = this.childContext;
    const views = this.views;
    const bindView = this.bindView;
    const items = this.items;
    const template = this.template;
    const recycle = this.options.recycle;
    const leftoverViews = [];
    let leftoverIndex = 0;
    let availableViews = 0;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      const splice = splices[i];
      const removed = splice.removed;
      let removeIndex = 0;
      let addIndex = splice.index;
      const end = addIndex + splice.addedCount;
      const removedViews = views.splice(splice.index, removed.length);
      const totalAvailableViews = availableViews = leftoverViews.length + removedViews.length;
      for (; addIndex < end; ++addIndex) {
        const neighbor = views[addIndex];
        const location = neighbor ? neighbor.firstChild : this.location;
        let view;
        if (recycle && availableViews > 0) {
          if (removeIndex <= totalAvailableViews && removedViews.length > 0) {
            view = removedViews[removeIndex];
            removeIndex++;
          } else {
            view = leftoverViews[leftoverIndex];
            leftoverIndex++;
          }
          availableViews--;
        } else {
          view = template.create();
        }
        views.splice(addIndex, 0, view);
        bindView(view, items, addIndex, childContext);
        view.insertBefore(location);
      }
      if (removedViews[removeIndex]) {
        leftoverViews.push(...removedViews.slice(removeIndex));
      }
    }
    for (let i = leftoverIndex, ii = leftoverViews.length; i < ii; ++i) {
      leftoverViews[i].dispose();
    }
    if (this.options.positioning) {
      for (let i = 0, ii = views.length; i < ii; ++i) {
        const currentContext = views[i].context;
        currentContext.length = ii;
        currentContext.index = i;
      }
    }
  }
  refreshAllViews(templateChanged = false) {
    const items = this.items;
    const childContext = this.childContext;
    const template = this.template;
    const location = this.location;
    const bindView = this.bindView;
    let itemsLength = items.length;
    let views = this.views;
    let viewsLength = views.length;
    if (itemsLength === 0 || templateChanged || !this.options.recycle) {
      HTMLView.disposeContiguousBatch(views);
      viewsLength = 0;
    }
    if (viewsLength === 0) {
      this.views = views = new Array(itemsLength);
      for (let i = 0; i < itemsLength; ++i) {
        const view = template.create();
        bindView(view, items, i, childContext);
        views[i] = view;
        view.insertBefore(location);
      }
    } else {
      let i = 0;
      for (; i < itemsLength; ++i) {
        if (i < viewsLength) {
          const view = views[i];
          bindView(view, items, i, childContext);
        } else {
          const view = template.create();
          bindView(view, items, i, childContext);
          views.push(view);
          view.insertBefore(location);
        }
      }
      const removed = views.splice(i, viewsLength - i);
      for (i = 0, itemsLength = removed.length; i < itemsLength; ++i) {
        removed[i].dispose();
      }
    }
  }
  unbindAllViews() {
    const views = this.views;
    for (let i = 0, ii = views.length; i < ii; ++i) {
      views[i].unbind();
    }
  }
};
var RepeatDirective = class extends HTMLDirective {
  /**
   * Creates an instance of RepeatDirective.
   * @param itemsBinding - The binding that provides the array to render.
   * @param templateBinding - The template binding used to obtain a template to render for each item in the array.
   * @param options - Options used to turn on special repeat features.
   */
  constructor(itemsBinding, templateBinding, options) {
    super();
    this.itemsBinding = itemsBinding;
    this.templateBinding = templateBinding;
    this.options = options;
    this.createPlaceholder = DOM.createBlockPlaceholder;
    enableArrayObservation();
    this.isItemsBindingVolatile = Observable.isVolatileBinding(itemsBinding);
    this.isTemplateBindingVolatile = Observable.isVolatileBinding(templateBinding);
  }
  /**
   * Creates a behavior for the provided target node.
   * @param target - The node instance to create the behavior for.
   */
  createBehavior(target) {
    return new RepeatBehavior(target, this.itemsBinding, this.isItemsBindingVolatile, this.templateBinding, this.isTemplateBindingVolatile, this.options);
  }
};
function repeat(itemsBinding, templateOrTemplateBinding, options = defaultRepeatOptions) {
  const templateBinding = typeof templateOrTemplateBinding === "function" ? templateOrTemplateBinding : () => templateOrTemplateBinding;
  return new RepeatDirective(itemsBinding, templateBinding, Object.assign(Object.assign({}, defaultRepeatOptions), options));
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/node-observation.js
function elements(selector) {
  if (selector) {
    return function(value, index, array) {
      return value.nodeType === 1 && value.matches(selector);
    };
  }
  return function(value, index, array) {
    return value.nodeType === 1;
  };
}
var NodeObservationBehavior = class {
  /**
   * Creates an instance of NodeObservationBehavior.
   * @param target - The target to assign the nodes property on.
   * @param options - The options to use in configuring node observation.
   */
  constructor(target, options) {
    this.target = target;
    this.options = options;
    this.source = null;
  }
  /**
   * Bind this behavior to the source.
   * @param source - The source to bind to.
   * @param context - The execution context that the binding is operating within.
   */
  bind(source) {
    const name = this.options.property;
    this.shouldUpdate = Observable.getAccessors(source).some((x) => x.name === name);
    this.source = source;
    this.updateTarget(this.computeNodes());
    if (this.shouldUpdate) {
      this.observe();
    }
  }
  /**
   * Unbinds this behavior from the source.
   * @param source - The source to unbind from.
   */
  unbind() {
    this.updateTarget(emptyArray);
    this.source = null;
    if (this.shouldUpdate) {
      this.disconnect();
    }
  }
  /** @internal */
  handleEvent() {
    this.updateTarget(this.computeNodes());
  }
  computeNodes() {
    let nodes = this.getNodes();
    if (this.options.filter !== void 0) {
      nodes = nodes.filter(this.options.filter);
    }
    return nodes;
  }
  updateTarget(value) {
    this.source[this.options.property] = value;
  }
};

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/slotted.js
var SlottedBehavior = class extends NodeObservationBehavior {
  /**
   * Creates an instance of SlottedBehavior.
   * @param target - The slot element target to observe.
   * @param options - The options to use when observing the slot.
   */
  constructor(target, options) {
    super(target, options);
  }
  /**
   * Begins observation of the nodes.
   */
  observe() {
    this.target.addEventListener("slotchange", this);
  }
  /**
   * Disconnects observation of the nodes.
   */
  disconnect() {
    this.target.removeEventListener("slotchange", this);
  }
  /**
   * Retrieves the nodes that should be assigned to the target.
   */
  getNodes() {
    return this.target.assignedNodes(this.options);
  }
};
function slotted(propertyOrOptions) {
  if (typeof propertyOrOptions === "string") {
    propertyOrOptions = { property: propertyOrOptions };
  }
  return new AttachedBehaviorHTMLDirective("fast-slotted", SlottedBehavior, propertyOrOptions);
}

// ../../node_modules/.deno/@microsoft+fast-element@1.14.0/node_modules/@microsoft/fast-element/dist/esm/templating/children.js
var ChildrenBehavior = class extends NodeObservationBehavior {
  /**
   * Creates an instance of ChildrenBehavior.
   * @param target - The element target to observe children on.
   * @param options - The options to use when observing the element children.
   */
  constructor(target, options) {
    super(target, options);
    this.observer = null;
    options.childList = true;
  }
  /**
   * Begins observation of the nodes.
   */
  observe() {
    if (this.observer === null) {
      this.observer = new MutationObserver(this.handleEvent.bind(this));
    }
    this.observer.observe(this.target, this.options);
  }
  /**
   * Disconnects observation of the nodes.
   */
  disconnect() {
    this.observer.disconnect();
  }
  /**
   * Retrieves the nodes that should be assigned to the target.
   */
  getNodes() {
    if ("subtree" in this.options) {
      return Array.from(this.target.querySelectorAll(this.options.selector));
    }
    return Array.from(this.target.childNodes);
  }
};
function children(propertyOrOptions) {
  if (typeof propertyOrOptions === "string") {
    propertyOrOptions = {
      property: propertyOrOptions
    };
  }
  return new AttachedBehaviorHTMLDirective("fast-children", ChildrenBehavior, propertyOrOptions);
}

export {
  $global,
  FAST,
  emptyArray,
  createMetadataLocator,
  DOM,
  SubscriberSet,
  PropertyChangeNotifier,
  Observable,
  observable,
  volatile,
  ExecutionContext,
  defaultExecutionContext,
  HTMLDirective,
  TargetedHTMLDirective,
  AttachedBehaviorHTMLDirective,
  HTMLBindingDirective,
  BindingBehavior,
  compileTemplate,
  HTMLView,
  ViewTemplate,
  html,
  ElementStyles,
  prependToAdoptedStyleSheetsSymbol,
  AttributeConfiguration,
  booleanConverter,
  nullableNumberConverter,
  AttributeDefinition,
  attr,
  FASTElementDefinition,
  Controller,
  FASTElement,
  customElement,
  CSSDirective,
  css,
  cssPartial,
  enableArrayObservation,
  RefBehavior,
  ref,
  when,
  RepeatBehavior,
  RepeatDirective,
  repeat,
  elements,
  SlottedBehavior,
  slotted,
  ChildrenBehavior,
  children
};
//# sourceMappingURL=chunk-UYEGQKIS.js.map
