<?php

	// These constants should have been inside a configuration file or injected
	define('USER_BASE_FILE_LOCATION', './json/data.json');
	define('DATE_FORMAT', 'm/d/Y');

	class userSearchAndReport {
		private static $userBase = null;
	
		// A pseudo-singleton pattern is used to avoid loading data more than once
		function __construct() {
			if (null == self::$userBase) {
				self::$userBase = json_decode(file_get_contents(USER_BASE_FILE_LOCATION), true);
			}
		}
		
		// This information may have beed also stored inside the "repository", but wouldn't have been simple
		// to do in a real-life case, and thus avoided. Also, the age calculation may also have been performed 
		// in the view.
		// Possible enhancement: also ID and birthday may be removed
		private function formatEntry($entry) {
			$entry['age'] = (new DateTime())->diff(DateTime::createFromFormat(DATE_FORMAT, $entry['birthday']))->y;
			unset($entry['birthday']);
			
			return $entry;
		}
		
		// Regex are used to match the query string with name, surname or both
		public function query($query) {
			$results = array();
			
			foreach (self::$userBase as $key => $value) {
				if (preg_match("/" . $query . "/mi", $value["name"])) {
					array_push($results, $this->formatEntry($value));
				}
			}
			
			// Sorting is made taking advantage of closures (finally)
			usort($results, function($a, $b) {
				if ($a['name'] == $b['name']) {
					return 0;
				} else {
					return ($a['name'] < $b['name']) ? -1 : 1;
				}
			});
			
			return $results;
		}
	}

	// This is dirty, but without modRewrite there was no chance to create a real action
	// Anyway a JSON response is produced, or a 400 error
	// Possible enhancement: results caching
	if (array_key_exists('id', $_GET) && array_key_exists('query', $_GET) && 
		is_numeric($_GET['id']) && $_GET['id'] >= 0 && strlen($_GET['query']) > 0) {
		$id = $_GET['id'];
		$query = preg_replace('/^ +| {2,}| $/mi', '', $_GET['query']);

		$search = new userSearchAndReport();
		$results = $search->query($query);
		$response = array('id' => $id, 'query' => $query, 'results' => $results);
		
		header('Content-Type: application/json');
		echo json_encode($response, JSON_UNESCAPED_SLASHES);	
	} else {
		http_response_code(400);
	}

