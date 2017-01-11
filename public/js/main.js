'use strict'

var detailsBody = document.getElementById('details-body');
var listBody = document.getElementById('list-body');
var favoritesBody = document.getElementById('favorites-body');
var detailsView = document.getElementById('details-view');
var listView = document.getElementById('list-view');
var favoritesView = document.getElementById('favorites-view');
var floatyHeaderDeatils = document.getElementById('floaty-header-details');

// https://davidwalsh.name/javascript-debounce-function
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
                        <a data-id=\''+resp.imdbID+'\' \
                           data-name=\''+resp.Title.replace("'","\'")+'\' \
                           onclick=\'clickFavoriteIcon(this)\' \
                           class=\'favorite icon-heart\'></a>';
        console.log(newHtml);
        detailsBody.innerHTML = newHtml;

        refreshFavoriteIcons();
      } else {
        console.log('Error: ' + xhr.status); // An error occurred during the request.
      }
    }
  }

  xhr.send(null);
}

function initFavoritesView() {
  favoritesBody.innerHTML = '';
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

var favorites = null;

function refreshFavorites() {
  if (!favorites) {
    debounce(refreshFavoritesXHR.bind(this, refreshFavoriteIcons), 250, true)();
    return
  }

  refreshFavoriteIcons();
}

function addFavorite(id, name) {
  addFavoriteXHR(id, name);
  refreshFavoriteIcons();
}

function deleteFavorite(id, name) {
  deleteFavoriteXHR(id, name);
  refreshFavoriteIcons();
}

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

      favoritesBusy = false;
    }
  }

  xhr.send(JSON.stringify({oid: id, name: name}));
}

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

      favoritesBusy = false;
    }
  }

  xhr.send(JSON.stringify({oid: id, name: name}));
}

function refreshFavoritesXHR(continued) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/favorites');
  xhr.onreadystatechange = function () {
    var DONE = 4;
    var OK = 200;
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {
        if (favorites === null) { favorites = {}; }

        var resp = JSON.parse(xhr.responseText);
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

function refreshFavoriteIcons() {
  var favoriteIcons = document.getElementsByClassName('favorite');
  for(var ix = 0; ix < favoriteIcons.length; ix++) {
    var favoriteIcon = favoriteIcons[ix];

    if (favorites[favoriteIcon.getAttribute('data-id')]) {
      if (!favoriteIcon.className.match(/active/)) {
        favoriteIcon.className += ' active';
      }
    } else {
      favoriteIcon.className = favoriteIcon.className.replace(/active/, '');
    }
  }
}

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

function searchInputOnkeyup() {
  debounce(searchInputUpdate, 250)();
}

function router() {
  var hash = window.location.hash.substr(1, window.location.hash.length-1);

  if (hash == 'favorites') {
    initFavoritesView();
    listView.style.display = 'none';
    detailsView.style.display = 'none';
    favoritesView.style.display = 'block';
    refreshFavorites();
  } else if (hash) {
    initDetailsView();
    listView.style.display = 'none';
    favoritesView.style.display = 'none';
    detailsView.style.display = 'block';
    refreshFavorites();
  } else {
    detailsView.style.display = 'none';
    favoritesView.style.display = 'none';
    listView.style.display = 'block';
    refreshFavorites();
  }
}

window.onhashchange = router;
router();
