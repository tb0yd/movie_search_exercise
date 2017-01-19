'use strict'

// useful DOM elements
var detailsBody = document.getElementById('details-body');
var listBody = document.getElementById('list-body');
var favoritesBody = document.getElementById('favorites-body');
var detailsView = document.getElementById('details-view');
var listView = document.getElementById('list-view');
var favoritesView = document.getElementById('favorites-view');
var floatyHeaderDeatils = document.getElementById('floaty-header-details');

// window.debounce()
// arguments:
//    * func (function): the function to debounce
//    * wait (number): time interval (milliseconds)
//    * immediate (boolean): when true, calls the function immediately.
// returns: function
// source: https://davidwalsh.name/javascript-debounce-function
//
//    "Debounces" a function. Debouncing is when you eliminate the effects of
//    rapid, repetitive calling, such as when a user double-clicks on a button
//    or an event is triggered in several different places at once. A debounced
//    function will only execute once within a specified interval of time,
//    regardless of how many times it is called. The arguments passed to it after
//    this interval will be determined from the most recent call to the function.
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

// window.searchInputUpdate()
// arguments: --
// returns: --
//
//    Reads the value of the search input field and sends a request to OMDB to
//    get the first page of movies matching the query. When the response is
//    received, an HTML fragment is built up from the data for each movie and
//    appended to the list div.
function searchInputUpdate() {
  var val = document.getElementById('search-input').value.replace(/\s+$/,'');

  var xhr = new XMLHttpRequest();
  xhr.open('GET', encodeURI('http://www.omdbapi.com/?type=movie&s=' + val));
  xhr.onreadystatechange = function () {
    var DONE = 4; // readyState 4 means the request is done.
    var OK = 200; // status 200 is a successful return.
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {
        var list = document.getElementById('list');
        list.innerHTML = '';

        var newHtml = '';
        var resp = JSON.parse(xhr.responseText);

        // resp.Search contains the movie data.
        for(var idx in resp.Search) {

          var item = resp.Search[idx];
          newHtml +=  '<a href="#'+item.imdbID+'"><li> \
                        <h4>'+item.Title+'</h4>'
          if (item.Poster !== 'N/A') {
            newHtml +=  '<img src="'+item.Poster+'">';
          }
          newHtml +=    '</li></a>';
          newHtml +=    '<a data-id=\''+item.imdbID+'\' \
                            data-name=\''+item.Title.replace("'","\'")+'\' \
                            onclick=\'clickFavoriteIcon(this)\' \
                            class=\'favorite icon-heart\'></a> \
                         <hr />';
        }
        list.innerHTML = newHtml;

        window.location.hash = '';
        refreshFavoriteIcons();
      } else {
        console.log('Error: ' + xhr.status); // An error occurred during the request.
      }
    }
  }

  xhr.send(null);
}

// window.initDetailsView()
// arguments: --
// returns: --
//
//    Pulls the OMDB ID of the movie being displayed from the hash fragment of
//    the URL, fires an AJAX request to get the full details, then builds an
//    HTML fragment from the response data.
function initDetailsView() {
  detailsBody.innerHTML = '';

  var imdbID = window.location.hash.substr(1, window.location.hash.length-1);

  var xhr = new XMLHttpRequest();
  xhr.open('GET', encodeURI('http://www.omdbapi.com/?i='+imdbID+'&plot=short&r=json'));
  xhr.onreadystatechange = function () {
    var DONE = 4;
    var OK = 200;
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {
        var resp = JSON.parse(xhr.responseText);

        // easter egg -- i love star wars.
        if (resp.Title == "Star Wars: Episode IV - A New Hope") {
          var plot = "A homeless man, a cowboy, and a young potato farmer team up with Bigfoot \
                      and a frog in a plot to destroy the moon.";
        } else {
          var plot = resp.Plot;
        }

        var newHtml = '<h4>'+resp.Title+'</h4> \
                        <p>Year: '+resp.Year+'</p> \
                        <p>Rated: '+resp.Rated+'</p> \
                        <p>Genre: '+resp.Genre+'</p> \
                        <p>Plot: '+plot+'</p> \
                        <p>Cast: '+resp.Actors+'</p> \
                        <a data-id=\''+resp.imdbID+'\' '

        // replacing single-quotes here because we are enclosing the data in single-quotes
        newHtml +=        'data-name=\''+resp.Title.replace("'","\'")+'\''

        newHtml +=        'onclick=\'clickFavoriteIcon(this)\' \
                           class=\'favorite icon-heart\'></a>';
        detailsBody.innerHTML = newHtml;

        refreshFavoriteIcons();
      } else {
        console.log('Error: ' + xhr.status); // An error occurred during the request.
      }
    }
  }

  xhr.send(null);
}

// window.initFavoritesView()
// arguments: --
// returns: --
//
//    Fetches the currently recorded favorites and builds the HTML fragment from
//    the response data.
function initFavoritesView() {
  favoritesBody.innerHTML = '';

  // passing continuation here so we can reuse the refreshFavoritesXHR function in a
  // different place.
  refreshFavoritesXHR(function() {
    favoritesBody.innerHTML += '<h4>Favorites</h4>';
    favoritesBody.innerHTML += '<ul>';
    for(var key in favorites) {
      favoritesBody.innerHTML += '<li>'+favorites[key]+' \
                                    <a data-id=\''+key+'\' \
                                    data-name=\''+favorites[key].replace("'","\'")+'\' \
                                    onclick=\'clickFavoriteIcon(this)\' \
                                    class=\'favorite icon-heart\'></a> \
                                  </li>';
    }
    favoritesBody.innerHTML += '</ul>';

    refreshFavoriteIcons();
  });
}

// local cache of favorites.
var favorites = null;

// window.refreshFavorites()
// arguments: --
// returns: --
//
//    Refreshes the favorite icons. A debouncer is used to avoid overwhelming the
//    server in the case that multiple UI processes call this function.
function refreshFavorites() {
  if (!favorites) {
    debounce(refreshFavoritesXHR.bind(this, refreshFavoriteIcons), 250, true)();
    return
  }

  refreshFavoriteIcons();
}

// window.addFavorite()
// arguments: id (string): the value of the data-id attribute inside the movie
//                         HTML fragment
//            name (string): the name of the movie
// returns: --
//
//    Result of a favorite icon click when the favorite icon is inactive.
function addFavorite(id, name) {
  addFavoriteXHR(id, name);
  refreshFavoriteIcons();
}

// window.deleteFavorite()
// arguments: id (string): the value of the data-id attribute inside the movie
//                         HTML fragment
//            name (string): the name of the movie
// returns: --
//
//    Result of a favorite icon click when the favorite icon is active.
function deleteFavorite(id, name) {
  deleteFavoriteXHR(id, name);
  refreshFavoriteIcons();
}

// window.addFavoriteXHR()
// arguments: id (string): the value of the data-id attribute inside the movie
//                         HTML fragment
//            name (string): the name of the movie
// returns: --
//
//    Execute the AJAX request that will add the favorite on the server side.
function addFavoriteXHR(id, name) {
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', '/favorites');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
    var DONE = 4;
    var OK = 200;
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {
      } else {
        console.log('Error: ' + xhr.status); // An error occurred during the request.
      }
    }
  }

  xhr.send(JSON.stringify({oid: id, name: name}));
}

// window.deleteFavoriteXHR()
// arguments: id (string): the value of the data-id attribute inside the movie
//                         HTML fragment
//            name (string): the name of the movie
// returns: --
//
//    Execute the AJAX request that will delete the favorite on the server side.
function deleteFavoriteXHR(id, name) {
  var xhr = new XMLHttpRequest();
  xhr.open('DELETE', '/favorites');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
    var DONE = 4;
    var OK = 200;
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {
      } else {
        console.log('Error: ' + xhr.status); // An error occurred during the request.
      }
    }
  }

  xhr.send(JSON.stringify({oid: id, name: name}));
}

// window.refreshFavoritesXHR()
// arguments: continued (function): function to call when the response is received.
// returns: --
//
//    Performs the AJAX request for getting the current favorites, then calls a
//    continuation function.
function refreshFavoritesXHR(continued) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/favorites');
  xhr.onreadystatechange = function () {
    var DONE = 4;
    var OK = 200;
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {

        // initialize local cache.
        if (favorites === null) { favorites = {}; }

        var resp = JSON.parse(xhr.responseText);

        // iterate through each response item and add it to the local cache.
        for(var ix = 0; ix < resp.length; ix++) {
          favorites[resp[ix].oid] = resp[ix].name;
        }

        continued();
      } else {
        console.log('Error: ' + xhr.status); // An error occurred during the request.
      }
    }
  }

  xhr.send(null);
}

// window.refreshFavoriteIcons()
// arguments: --
// returns: --
//
//    Updates each heart icon shown currently on the screen to reflect the
//    local cache of favorites.
function refreshFavoriteIcons() {
  var favoriteIcons = document.getElementsByClassName('favorite');
  for(var ix = 0; ix < favoriteIcons.length; ix++) {
    var favoriteIcon = favoriteIcons[ix];

    if (favorites[favoriteIcon.getAttribute('data-id')]) {
      if (!favoriteIcon.className.match(/active/)) {

        // make favorite icon active
        favoriteIcon.className += ' active';
      }
    } else {

      // make icon inactive
      favoriteIcon.className = favoriteIcon.className.replace(/active/, '');
    }
  }
}

// window.clickFavoriteIcon()
// arguments: e (object): event object
// returns: --
//
//    Callback for favorite icon click event (set via HTML attribute). Manages local
//    cache of favorites and updates server asynchronously.
function clickFavoriteIcon(e) {
  var favoriteIcon = e;
  var id = favoriteIcon.getAttribute('data-id');
  var name = favoriteIcon.getAttribute('data-name');

  if (favoriteIcon.className.match(/active/)) {
    delete favorites[id];
    deleteFavorite(id, name);
  } else {
    favorites[id] = name;
    addFavorite(id, name);
  }

  refreshFavoriteIcons();
}

// window.searchInputOnkeyup()
// arguments: --
// returns: --
//
//    Callback for search input field. Debounced to 250ms interval (see: debounce())
function searchInputOnkeyup() {
  debounce(searchInputUpdate, 250)();
}

// window.router()
// arguments: --
// returns: --
//
//    Simple, hand-rolled JS router to centralize page transitions. Being a single-page
//    application, there are no real "page transitions," but it is a good idea to have all
//    screen-switching code centralized in one "router" function.
function router() {
  var hash = window.location.hash.substr(1, window.location.hash.length-1);

  // ?#favorites: favorites view
  if (hash == 'favorites') {
    initFavoritesView();
    listView.style.display = 'none';
    detailsView.style.display = 'none';
    favoritesView.style.display = 'block';
    refreshFavorites();

  // ?#ID: details view
  } else if (hash) {
    initDetailsView();
    listView.style.display = 'none';
    favoritesView.style.display = 'none';
    detailsView.style.display = 'block';
    refreshFavorites();

  // ?#: list view
  } else {
    detailsView.style.display = 'none';
    favoritesView.style.display = 'none';
    listView.style.display = 'block';
    refreshFavorites();
  }
}

window.onhashchange = router;
router();
