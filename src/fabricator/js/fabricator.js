"use strict";

/**
 * Global `fabricator` object
 * @namespace
 */
var fabricator = window.fabricator = {};


/**
 * Default options
 * @type {Object}
 */
fabricator.options = {
	toggles: {
		details: true,
		code: false
	}
};

/**
 * Feature detection
 * @type {Object}
 */
fabricator.test = {};

// test for localstorage
fabricator.test.localStorage = (function () {
	var mod = "fabricator";
	try {
		localStorage.setItem(mod, mod);
		localStorage.removeItem(mod);
		return true;
	} catch(e) {
		return false;
	}
}());

// create storage object if it doesn't exist; store options
if (fabricator.test.localStorage) {
	localStorage.fabricator = localStorage.fabricator || JSON.stringify(fabricator.options);
}


/**
 * Cache DOM
 * @type {Object}
 */
fabricator.dom = {
	primaryMenu: document.querySelector(".f-menu"),
	menuItems: document.querySelectorAll(".f-menu li a"),
	menuToggle: document.querySelector(".f-menu-toggle"),
	prototype: document.getElementById("prototype")
};


/**
 * AJAX call for JSON
 * @param  {Function} callback
 * @return {Object} fabricator
 */
fabricator.getData = function (callback) {

	var url = "assets/json/data.json",
		data;

	// get data
	var getData = new XMLHttpRequest();
	getData.open("GET", url, false);
	getData.send();

	data = JSON.parse(getData.responseText);

	// send data to callback
	if (typeof callback === "function") {
		callback(data);
	}

	return this;

};


/**
 * Build color chips
 */
fabricator.buildColorChips = function () {

	var chips = document.querySelectorAll(".f-color-chip"),
		color;

	for (var i = chips.length - 1; i >= 0; i--) {
		color = chips[i].querySelector(".f-color-chip__color").innerHTML;
		chips[i].style.borderTopColor = color;
	}

	return this;

};


/**
 * Add `f-active` class to active menu item
 */
fabricator.setActiveItem = function () {

	/**
	 * @return {Array} Sorted array of menu item "ids"
	 */
	var parsedItems = function () {

		var items = [],
			id, href;

		for (var i = fabricator.dom.menuItems.length - 1; i >= 0; i--) {

			// remove active class from items
			fabricator.dom.menuItems[i].classList.remove("f-active");

			// get item href
			href = fabricator.dom.menuItems[i].getAttribute("href");

			// get id
			if (href.indexOf("#") > -1) {
				id = href.split("#").pop();
			} else {
				id = href.split("/").pop().replace(/\.[^/.]+$/, "");
			}

			items.push(id);

		}

		return items.reverse();

	};


	/**
	 * Match the "id" in the window location with the menu item, set menu item as active
	 */
	var setActive = function () {

		var href = window.location.href,
			items = parsedItems(),
			id, index;

		// get window "id"
		if (href.indexOf("#") > -1) {
			id = window.location.hash.replace("#", "");
		} else {
			id = window.location.pathname.split("/").pop().replace(/\.[^/.]+$/, "");
		}

		// find the window id in the items array
		index = (items.indexOf(id) > -1) ? items.indexOf(id) : 0;

		// set the matched item as active
		fabricator.dom.menuItems[index].classList.add("f-active");

	};

	window.addEventListener("hashchange", setActive);

	setActive();

	return this;

};


/**
 * Inject prototype content into page
 * @param  {String} id prototype identifier
 * @return {Object} fabricator
 */
fabricator.templatePrototype = function (id) {

	var content;

	// get data
	this.getData(function (data) {
		for (var i = data.prototypes.length - 1; i >= 0; i--) {
			if (data.prototypes[i].id === id) {
				content = data.prototypes[i].content;
				fabricator.dom.prototype.innerHTML = content;
			}
		}

	});

	return this;

};


/**
 * Click handler to primary menu toggle
 * @return {Object} fabricator
 */
fabricator.primaryMenuControls = function () {

	// shortcut menu DOM
	var toggle = fabricator.dom.menuToggle;

	// toggle classes on certain elements
	var toggleClasses = function () {
		document.querySelector("html").classList.toggle("state--menu-active");
		fabricator.dom.menuToggle.classList.toggle("f-icon-menu");
		fabricator.dom.menuToggle.classList.toggle("f-icon-close");
	};

	// toggle classes on click
	toggle.addEventListener("click", function () {
		toggleClasses();
	});

	// close menu when clicking on item (for collapsed menu view)
	var closeMenu = function () {
		toggleClasses();
	};

	for (var i = 0; i < fabricator.dom.menuItems.length; i++) {
		fabricator.dom.menuItems[i].addEventListener("click", closeMenu);
	}

	return this;

};

/**
 * Handler for preview and code toggles
 * @return {Object} fabricator
 */
fabricator.allItemsToggles = function () {

	var items = {
		details: document.querySelectorAll("[data-toggle=\"details\"]"),
		code: document.querySelectorAll("[data-toggle=\"code\"]")
	};

	var toggleAllControls = document.querySelectorAll(".f-controls [data-toggle-control]");


	var options = (fabricator.test.localStorage) ? JSON.parse(localStorage.fabricator) : fabricator.options;


	// toggle all
	var toggleAllItems = function (type, value) {

		var button = document.querySelector(".f-controls [data-toggle-control=" + type + "]"),
			_items = items[type];

		for (var i = 0; i < _items.length; i++) {
			if (value) {
				_items[i].classList.remove("f-item-hidden");
			} else {
				_items[i].classList.add("f-item-hidden");
			}
		}

		// toggle styles
		if (value) {
			button.classList.add("f-active");
		} else {
			button.classList.remove("f-active");
		}

		// update options
		options.toggles[type] = value;

		if (fabricator.test.localStorage) {
			localStorage.setItem("fabricator", JSON.stringify(options));
		}

	};

	for (var ii = 0; ii < toggleAllControls.length; ii++) {

		toggleAllControls[ii].addEventListener("click", function (e) {

			// extract info from target node
			var type = e.target.getAttribute("data-toggle-control"),
				value = e.target.className.indexOf("f-active") < 0;

			// toggle the items
			toggleAllItems(type, value);

		});

	}

	// persist toggle options from page to page
	for (var toggle in options.toggles) {
		if (options.toggles.hasOwnProperty(toggle)) {
			toggleAllItems(toggle, options.toggles[toggle]);
		}
	}

	return this;

};

/**
 * Handler for single item code toggling
 */
fabricator.singleItemCodeToggle = function () {

	var itemToggleSingle = document.querySelectorAll(".f-toggle");

	// toggle single
	var toggleSingleItemCode = function () {
		var group = this.parentNode.parentNode.parentNode,
			toggle = this.attributes["data-toggle-control"].value;

		group.querySelector("[data-toggle=\"code\"]").classList.toggle("f-item-hidden");
	};

	for (var i = 0; i < itemToggleSingle.length; i++) {
		itemToggleSingle[i].addEventListener("click", toggleSingleItemCode);
	}

	return this;

};


////////////////////////////////////////////////////////
// Init
////////////////////////////////////////////////////////
(function () {

	// invoke
	fabricator
		.primaryMenuControls()
		.allItemsToggles()
		.singleItemCodeToggle()
		.buildColorChips()
		.setActiveItem();

	// if prototype page, template accordingly
	if (fabricator.dom.prototype && location.hash) {
		fabricator.templatePrototype(location.hash.replace(/#/, ""));
	}

	// syntax highlighting
	Prism.highlightAll();

}());