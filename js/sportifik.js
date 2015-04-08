{
	// JS is structured an object with only private methods
	// A demonstrative, but useless, enhancement may have been declaring a:
	//
	//       this.checkNow = function() { ... };
	//
	// to be run from outside the object at "ready"-time
	var searcher = function() {
		var input = document.getElementById('search');
		var results = document.getElementById('results-list');
		var message = document.getElementById('no-results');
		var counter = -1;
		var defaultDelay = 300;
		var latestQuery = null;
		
		// Queries are cleaned from useless additional spaces
		var cleanQuery = function(query) {
			return query.replace(/^ +| {2,}| $/gmi, '');
		};
		
		// Each ajax call is delayed a little to avoid performing too many calls
		// Each update to the query string is associated to an ID; the latest id is
		// recorded to check if it is correct to first ask search for results, and
		// then to decide if displaying them or not
		// Also a double-check is made to avoid repeating the exact last query
		// Possible enhancement: local call cache
		var prepareAndWait = function(query) {
			query = cleanQuery(query);
			
			if (query != latestQuery) {
				latestQuery = query;
				setTimeout(check, defaultDelay, ++counter, query);
			}
			
			// Resetting the query field cleans the page
			if (query == '') {
				clearCurrentResponses();
				hideMessage();
			}
		};
		
		// As previously stated, obsolete and empty queries are stopped
		var check = function(count, query) {
			if (count == counter && query != '') {
				ask(count, query);
			}
		};
		
		var ask = function(count, query) {
			var request = new XMLHttpRequest();
			
			request.onreadystatechange = function() {
				if (request.readyState == 4 && request.status == 200) {
					var response = JSON.parse(request.responseText);
					
					if (!response.results || response.results.length == 0) {
						displayNoResults();
					} else {
						displayResponse(response);
					}
				}
			}
			
			// My first choice would have been the definition of a "query-URL" like: .../search/"query string"/"query ID"
			// but would have required modRewrite, that was probably too much for this exercise
			request.open("GET", "/search.php?id=" + count + "&query=" + query, true);
			request.send();
		};
		
		var displayNoResults = function() {
			clearCurrentResponses();
			displayMessage();
		};

		var displayResponse = function(response) {
			if (response.id == counter) {
				clearCurrentResponses();
				hideMessage();
				
				for (var i=0; i < response.results.length; i++) {
					insertNewResponse(response.results[i]['image'], response.results[i]['name'],
						response.results[i]['gender'], response.results[i]['age'], response.query);
				}
			}
		};
		
		var hideMessage = function() {
			if (message.className.indexOf('hidden') == -1) {
				message.className += ' hidden';
			}
		};
		
		var displayMessage = function() {
			message.className = message.className.replace('hidden', '');
		};
		
		var clearCurrentResponses = function() {
			while (results.firstChild) {
				results.removeChild(results.firstChild);
			}
		};
		
		var insertNewResponse = function(url, name, gender, age, query) {
			var image_container = document.createElement("P");
			var image = document.createElement("IMG");
			image.src = url;
			image_container.appendChild(image);
			
			// The parts of the name/surname that matched the query are split to be underlined
			// That's also why the query string has been brought till here
			var name_container = document.createElement("P");
			while ((position = name.toLowerCase().indexOf(query.toLowerCase())) != -1) {
				if (position > 0) {
					name_container.appendChild(document.createTextNode(name.substring(0, position)));
				}
				
				var container = document.createElement("SPAN");
				container.appendChild(document.createTextNode(name.substring(position, position + query.length)));
				name_container.appendChild(container);
				
				name = name.substring(position + query.length);
			}
			if (name.length > 0) {
				name_container.appendChild(document.createTextNode(name));
			}
			
			var gender_container = document.createElement("P");
			gender_container.appendChild(document.createTextNode(gender));
			
			var age_container = document.createElement("P");
			age_container.appendChild(document.createTextNode(age + " year" + (age > 1 ? "s" : "") + " old"));
			
			var li = document.createElement("LI");
			li.appendChild(image_container);
			li.appendChild(name_container);
			li.appendChild(gender_container);
			li.appendChild(age_container);
			
			results.appendChild(li);
		};
		
		// Default check at "ready"-state; as stated before this may have been done from outside this object
		if (input.value != '') {
			prepareAndWait(input.value);
		}
		
		// ...and the same is for this
		input.addEventListener('input', function(event) {
			event.preventDefault();
			prepareAndWait(event.target.value);
		});
	}();
};
