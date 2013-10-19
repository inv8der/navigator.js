describe("Navigator responder behavior/interface validation", function() {

	function delayedExpect(testRunner,delay) {
		delay = delay || 1;
		var delayReached = false;
		setTimeout(function() {
			delayReached = true;
		}, delay);

		waitsFor(function() {
			return delayReached;
		}, "Waiting for delay", delay * 2);//Travis CI hack? Else it will complain about giving a timeout

		runs(testRunner);
	}

	beforeEach(function() {
	});

	describe("Retrieving interface inheritance chain", function() {
		it("Returns an empty array when no interface argument is supplied", function() {
			var interfaces = navigatorjs.NavigationResponderBehaviors.getInterfaceInheritanceChain();
			expect(interfaces).toEqual([]);
		});

		it("Returns an array of one element that is equal to the input when just a toplevel (IHasStateInitialization) interface is defined", function() {
			var interfaces = navigatorjs.NavigationResponderBehaviors.getInterfaceInheritanceChain("IHasStateInitialization");
			expect(interfaces).toEqual(["IHasStateInitialization"]);
		});

		it("Returns an empty array when an invalid interface argument is supplied", function() {
			var interfaces = navigatorjs.NavigationResponderBehaviors.getInterfaceInheritanceChain("IHasInvalidStateInitialization");
			expect(interfaces).toEqual([]);
		});

		it("Returns an empty array when a method (getInterfaceInheritanceChain) as the interface argument is supplied", function() {
			var interfaces = navigatorjs.NavigationResponderBehaviors.getInterfaceInheritanceChain("getInterfaceInheritanceChain");
			expect(interfaces).toEqual([]);
		});

		it("Returns simple inheritance chain", function() {
			var interfaces = navigatorjs.NavigationResponderBehaviors.getInterfaceInheritanceChain("IHasStateValidationOptional");
			expect(interfaces).toEqual(["IHasStateValidationOptional", "IHasStateValidation"]);
		});

		it("Returns an advanced inheritance chain and filters out duplicate interfaces", function() {
			var interfaces = navigatorjs.NavigationResponderBehaviors.getInterfaceInheritanceChain("IHasStateValidationOptionalAsync");
			expect(interfaces).toEqual(["IHasStateValidationOptionalAsync", "IHasStateValidationAsync", "IHasStateValidation", "IHasStateValidationOptional"]);
		});
	});

	describe("Retrieving methods by interface", function() {
		it("Returns no methods for an invalid interface", function() {
			var methods = navigatorjs.NavigationResponderBehaviors.getInterfaceMethods([]);
			expect(methods).toEqual([]);

			methods = navigatorjs.NavigationResponderBehaviors.getInterfaceMethods();
			expect(methods).toEqual([]);

			methods = navigatorjs.NavigationResponderBehaviors.getInterfaceMethods(["NonExistingInterface"]);
			expect(methods).toEqual([]);
		});

		it("Returns a list of unique methods within a simple inheritance chain", function() {
			var methods = navigatorjs.NavigationResponderBehaviors.getInterfaceMethods(["IHasStateInitialization"]);
			expect(methods).toEqual(["initializeByNavigator"]);
		});

		it("Returns a list of unique methods within an advanced inheritance chain", function() {
			var methods = navigatorjs.NavigationResponderBehaviors.getInterfaceMethods(["IHasStateValidationOptionalAsync"]);
			expect(methods).toEqual(["prepareValidation", "validate", "willValidate"]);
		});

		it("Returns a list of unique methods within a list of multiple interfaces and advanced inheritance chain", function() {
			var methods = navigatorjs.NavigationResponderBehaviors.getInterfaceMethods(["IHasStateInitialization", "IHasStateValidationOptionalAsync"]);
			expect(methods).toEqual(["initializeByNavigator", "prepareValidation", "validate", "willValidate"]);
		});
	});

	describe("Validate interface implementation", function() {

		it("Has state initialization but no state transition", function() {
			var object = {
				navigatorBehaviors: ["IHasStateInitialization"],
				initializeByNavigator: function() {}
			};

			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateInitialization")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateTransition")).toBeFalsy();
		});

		it("Has state transition but no state initialization", function() {
			var object = {
				navigatorBehaviors: ["IHasStateTransition"],
				transitionIn: function(callOnComplete) {},
				transitionOut: function(callOnComplete) {}
			};
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateTransition")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateInitialization")).toBeFalsy();
		});

		it("Checks inherited behaviours", function() {
			var object = {
				navigatorBehaviors: ["IHasStateValidationOptional"],
				validate: function(truncatedState, fullState) {}, //IHasStateValidation, IHasStateValidationAsync, IHasStateValidationOptional, IHasStateValidationOptionalAsync, IHasStateRedirection
				willValidate: function(truncatedState, fullState) {/*return bool*/} //IHasStateValidationOptional, IHasStateValidationOptionalAsync
			};

			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidationOptional")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidation")).toBeTruthy();
		});

		it("Has implemented all behaviors", function() {
			var object = {
				navigatorBehaviors: ["IHasStateInitialization", "IHasStateValidation", "IHasStateValidationAsync", "IHasStateValidationOptional", "IHasStateValidationOptionalAsync", "IHasStateRedirection", "IHasStateSwap", "IHasStateTransition", "IHasStateUpdate"],

				initializeByNavigator: function() {}, //IHasStateInitialization
				validate: function(truncatedState, fullState) {}, //IHasStateValidation, IHasStateValidationAsync, IHasStateValidationOptional, IHasStateValidationOptionalAsync, IHasStateRedirection
				prepareValidation: function(truncatedState, fullState, callOnPrepared) {}, //IHasStateValidationAsync, IHasStateValidationOptionalAsync
				willValidate: function(truncatedState, fullState) {/*return bool*/}, //IHasStateValidationOptional, IHasStateValidationOptionalAsync
				redirect: function(truncatedState, fullState) {/*return NavigationState*/}, //IHasStateRedirection
				willSwapToState: function(truncatedState, fullState) {/*return bool*/}, //IHasStateSwap
				swapOut: function(callOnSwapOutComplete) {}, //IHasStateSwap
				swapIn: function(truncatedState, fullState) {}, //IHasStateSwap
				transitionIn: function(callOnComplete) {}, //IHasStateTransition
				transitionOut: function(callOnComplete) {}, //IHasStateTransition
				updateState: function(truncatedState, fullState) {} //IHasStateUpdate
			};

			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateInitialization")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidation")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidationAsync")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidationOptional")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidationOptionalAsync")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateRedirection")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateSwap")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateTransition")).toBeTruthy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateUpdate")).toBeTruthy();
		});

		it("Doesn't validate when a behavior has a missing method", function() {
			var object = {
				navigatorBehaviors: ["IHasStateInitialization", "IHasStateValidation", "IHasStateValidationAsync", "IHasStateValidationOptional", "IHasStateValidationOptionalAsync", "IHasStateRedirection", "IHasStateSwap", "IHasStateTransition", "IHasStateUpdate"]
			};

			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateInitialization")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidation")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidationAsync")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidationOptional")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateValidationOptionalAsync")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateRedirection")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateSwap")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateTransition")).toBeFalsy();
			expect(navigatorjs.NavigationResponderBehaviors.implementsBehaviorInterface(object, "IHasStateUpdate")).toBeFalsy();
		});

	});

	describe("navigator state flow integration", function() {

		var njs,
			Responder,
			responder;

		beforeEach(function() {
			njs = new navigatorjs.Navigator();
		});

		describe("initialization", function() {
			//TODO write tests for how this works. In current implementation IHasStateInitialization will only be called when it also implements one of the other interfaces
		});

		describe("transitions", function() {
			beforeEach(function() {
				Responder = function() {};
				Responder.prototype = {
					navigatorBehaviors: ["IHasStateTransition"],
					inCallComplete: null,
					outCallComplete: null,
					transitionIn: function(callOnComplete) {
						this.inCallComplete = callOnComplete;
					},

					transitionOut: function(callOnComplete) {
						this.outCallComplete = callOnComplete;
					}
				};

				responder = new Responder();

				spyOn(responder, 'transitionIn').andCallThrough();
				spyOn(responder, 'transitionOut').andCallThrough();

				njs.add({}, "/");
				njs.add(responder, "home");
			});

			it("calls the transitionIn method when entering the state", function() {
				njs.start("/");
				expect(responder.transitionIn).not.toHaveBeenCalled();
				njs.request("home");
				expect(responder.transitionIn).toHaveBeenCalled();
			});

			it("calls the transitionOut once we leave the mapped state", function() {
				njs.start("/");
				expect(responder.transitionOut).not.toHaveBeenCalled();
				njs.request("home");
				expect(responder.transitionOut).not.toHaveBeenCalled();
				njs.request("/");
				expect(responder.transitionOut).toHaveBeenCalled();
			});

			it("calls the transitionOut method despite of the transitionIn call to be completed", function() {
				njs.start("/");
				expect(responder.transitionOut).not.toHaveBeenCalled();
				njs.request("home");
				njs.request("/");
				expect(responder.transitionOut).toHaveBeenCalled();
			});

			it("doesn't call the transitionIn of a new state before the previous state has transitioned out", function() {
				var contact = new Responder();
				spyOn(contact, 'transitionIn').andCallThrough();
				spyOn(contact, 'transitionOut').andCallThrough();
				
				njs.add(contact, "contact");
				njs.start("/");
				njs.request("home");
				njs.request("contact");
				expect(contact.transitionIn).not.toHaveBeenCalled();
				responder.outCallComplete();
				expect(contact.transitionIn).toHaveBeenCalled();
			});

			it("it updates the currentState immediately, even though transitions are running", function() {
				njs.start("/");
				njs.request("home");
				expect(njs.getCurrentState().getPath()).toEqual('/home/');
				njs.request("/");
				expect(njs.getCurrentState().getPath()).toEqual('/');
			});
		});

		describe("redirection", function() {
			beforeEach(function() {
				Responder = function() {};
				Responder.prototype = {
					navigatorBehaviors: ["IHasStateRedirection"],

					validate: function(truncatedState, fullState) {
						return false;
					},

					redirect: function(truncatedState, fullState) {
						return new navigatorjs.NavigationState("contact");
					}
				};

				responder = new Responder();

				njs.add({}, "/");
			});

			it("redirects to another state", function() {
				njs.add({}, "contact");
				njs.add(responder, "home");
				njs.start("/");
				njs.request("home");
				expect(njs.getCurrentState().getPath()).toEqual('/contact/');
			});

			it("doesn't redirect when there is no responder for the state it redirects to", function() {
				njs.add(responder, "home");
				njs.start("/");
				njs.request("home");
				expect(njs.getCurrentState().getPath()).toEqual('/');
			});

			it("throws an error when it redirects to itself", function() {
				njs.add(responder, "contact");
				njs.start("/");

				expect(function() {njs.request("contact");}).toThrow();
			});

			it("doens't throw an error when we redirect to a substate, as long as the validate doesn't return false for the substate", function() {
				responder.validate = function(truncatedState, fullState) { return !fullState.equals('home')};
				responder.redirect = function(truncatedState, fullState) {return new navigatorjs.NavigationState("home/test")};
				njs.add(responder, "home");
				njs.add({}, "home/test");
				njs.start("/");
				expect(function() {njs.request("home");}).not.toThrow();
				expect(njs.getCurrentState().getPath()).toEqual('/home/test/');
			});

			it("is ignored when a native navigatorjs redirect is known", function() {
				njs.add({}, "contact");
				njs.add({}, "about");
				njs.add(responder, "home");
				njs.registerRedirect("home", "about");
				njs.start("/");
				njs.request("home");
				expect(njs.getCurrentState().getPath()).toEqual('/about/');
			});

			it("can chain redirects", function() {
				var contact = new Responder();
				contact.redirect = function(truncatedState, fullState) {return new navigatorjs.NavigationState("about")};

				njs.add(contact, "contact");
				njs.add({}, "about");
				njs.add(responder, "home");
				njs.start("/");
				njs.request("home");
				expect(njs.getCurrentState().getPath()).toEqual('/about/');
			});

			it("can chain with native redirects", function() {
				njs.add({}, "about");
				njs.add(responder, "home");
				njs.registerRedirect("contact", "about");
				njs.start("/");
				njs.request("home");
				expect(njs.getCurrentState().getPath()).toEqual('/about/');
			});
		});

		describe("swapping", function() {
			beforeEach(function() {
				Responder = function() {};
				Responder.prototype = {
					navigatorBehaviors: ["IHasStateSwap"],
					callOnSwapOutComplete: null,
					willSwapToStateReturnValue: true,

					willSwapToStateCount: 0,
					swapInCount: 0,
					swapOutCount: 0,

					willSwapToState: function(truncatedState, fullState) {
						this.willSwapToStateCount++;
						return this.willSwapToStateReturnValue;
					},

					swapIn: function(truncatedState, fullState) {
						this.swapInCount++;
					},

					swapOut: function(callOnSwapOutComplete) {
						this.swapOutCount++;
						this.callOnSwapOutComplete = callOnSwapOutComplete;
					}

				};

				responder = new Responder();
				spyOn(responder, 'willSwapToState').andCallThrough();
				spyOn(responder, 'swapOut').andCallThrough();
				spyOn(responder, 'swapIn').andCallThrough();

				njs.add({}, "/");
			});

			it("Swaps swap in when we arrive at the mapped state when willSwapToState returns true", function() {
				njs.add(responder, "swapper");
				njs.start("/");
				njs.request("swapper");

				expect(responder.willSwapToState).toHaveBeenCalled();
				expect(responder.swapIn).toHaveBeenCalled();
				expect(responder.swapOut).not.toHaveBeenCalled();
			});

			it("Won't swap in when we arrive at the mapped state when willSwapToState returns false", function() {
				responder.willSwapToStateReturnValue = false;
				njs.add(responder, "swapper");
				njs.start("/");
				njs.request("swapper");

				expect(responder.willSwapToState).toHaveBeenCalled();
				expect(responder.swapIn).not.toHaveBeenCalled();
				expect(responder.swapOut).not.toHaveBeenCalled();
			});

			it("Calls the swapout when we swap to a child state", function() {
				njs.add(responder, "swapper");
				njs.add({}, "swapper/*");
				njs.start("/");
				njs.request("swapper");
				njs.request("swapper/test1");

				expect(responder.willSwapToState).toHaveBeenCalled();
				expect(responder.swapIn).toHaveBeenCalled();
				expect(responder.swapOut).toHaveBeenCalled();
			});

			it("Won't swap in till the previous swap out has completed", function() {
				njs.add(responder, "swapper");
				njs.add({}, "swapper/*");
				njs.start("/");
				njs.request("swapper");
				njs.request("swapper/test1");
				expect(responder.swapInCount).toEqual(1);
				responder.callOnSwapOutComplete();
				expect(responder.swapInCount).toEqual(2);
			});

//			it("tests", function() {
//				njs.add(responder, "swapper");
//				njs.add({}, "swapper/test");
//				njs.start("/");
//				njs.request("swapper");
//				njs.request("swapper/test");
//				njs.request("/");
//
//			});

		});

		describe("updating", function() {

		});

		describe("validation", function() {

			describe("synchronous", function() {

			});

			describe("asynchronous", function() {

			var Responder1, Responder2,
				responder1ValidateCalls,
				responder2ValidateCalls;

			beforeEach(function() {
				responder1ValidateCalls = responder2ValidateCalls = 0;

				Responder1 = function() {};
				Responder1.prototype = {
					navigatorBehaviors: ["IHasStateValidationOptionalAsync"],
					willValidate: function(truncatedState, fullState) {
						return true;
					},

					prepareValidation: function(truncatedState, fullState, callOnPrepared) {
						callOnPrepared();
					},

					validate: function(truncatedState, fullState) {
						responder1ValidateCalls++;
						return true;
					}
				};

				Responder2 = function() {};
				Responder2.prototype = {
					navigatorBehaviors: ["IHasStateValidationOptionalAsync"],
					willValidate: function(truncatedState, fullState) {
						return true;
					},

					prepareValidation: function(truncatedState, fullState, callOnPrepared) {
						callOnPrepared();
					},

					validate: function(truncatedState, fullState) {
						responder2ValidateCalls++;
						return true;
					}
				};

				njs.add(new Responder1(), "/*/");
//				njs.add({}, "/*/");
				njs.add(new Responder2(), "/*/test/*/");
				njs.start("/");
			});

			it("allows us to visit the /hello/ state", function() {
				njs.request("hello");

				expect(njs.getCurrentState().getPath()).toEqual("/hello/");
			});

			it("doesn't allow us to visit the /hello/world/ state", function() {
				njs.request("hello/world");

				expect(njs.getCurrentState().getPath()).toEqual("/");
			});

			it("allows us to visit the /hello/test/world/ state", function() {
				njs.request("hello/test/world");

				expect(njs.getCurrentState().getPath()).toEqual("/hello/test/world/");
			});

			it("doesn't allow us to visit the /hello/test/world/and/space/ state", function() {
				njs.request("hello/test/world/and/space");

				expect(njs.getCurrentState().getPath()).toEqual("/");
			});

			it("validates the any of the first segment changes with Responder1", function() {
				njs.request("hello");

				expect(responder1ValidateCalls).toEqual(1);
				expect(responder2ValidateCalls).toEqual(0);
			});

			it("first validates responder 1 and on success responder 2", function() {
				njs.request("hello/test/world");

				expect(responder1ValidateCalls).toEqual(1);
				expect(responder2ValidateCalls).toEqual(1);
			});

		})
		});

		describe("implementing all behaviors", function() {

		});
	});

});