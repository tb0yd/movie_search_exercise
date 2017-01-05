// https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
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
  var val = document.getElementById('searchInput').value.replace(/\s+$/,'');

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
          newHtml +=    '<a class=\'icon-heart\'></a> \
                      </li></a>';
        }
        list.innerHTML = newHtml;

        window.location.hash = '';
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
    var DONE = 4; // readyState 4 means the request is done.
    var OK = 200; // status 200 is a successful return.
    if (xhr.readyState === DONE) {
      if (xhr.status === OK) {
        var resp = JSON.parse(xhr.responseText);
        var newHtml = '<h4>'+resp.Title+'</h4> \
                        <p>Year: '+resp.Year+'</p> \
                        <p>Rated: '+resp.Rated+'</p> \
                        <p>Genre: '+resp.Genre+'</p> \
                        <p>Plot: '+resp.Plot+'</p> \
                        <p>Cast: '+resp.Actors+'</p> \
                        <a class=\'icon-heart\'></a>';
        detailsBody.innerHTML = newHtml;
      } else {
        console.log('Error: ' + xhr.status); // An error occurred during the request.
      }
    }
  }

  xhr.send(null);
}

function searchInputOnchange() {
  debounce(searchInputUpdate, 250)();
}

function router() {
  var hash = window.location.hash;

  if (hash) {
    initDetailsView();
    listView.style.display = 'none';
    detailsView.style.display = 'block';
  } else {
    detailsView.style.display = 'none';
    listView.style.display = 'block';
  }
}

window.onhashchange = router;
router();
