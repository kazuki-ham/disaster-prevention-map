// function searchShelter(prefecture, city) {
//   var rootURL = "http://www.hinanjyo.jp/";
//   // 避難所サイトへアクセス

//   // 要素取得
//   var preElements = document.querySelectorAll('div[id="rightSideShelter"]>ul>li');
//   preElements.forEach(element => {
//     if (element.childNodes[0].childNodes[0].innerText === prefecture){
//       element.childNodes[0].click();
//     }
//   });

//   var cityElements = document.querySelectorAll('div[id="rightSideShelter"]>ul>li');
//   cityElements.forEach(element => {
//     if (element.childNodes[0].childNodes[0].innerText === city){
//       element.childNodes[0].click();
//     }
//   });

//   var shelterList = []; 
//   document.querySelectorAll('span[class="shelterName"]').forEach(element => {
//     shelterList.push(element.innerText);
//   });
  
//   return shelterList;
// }

function calcAndDisplayRoute(origin, destination, map) {
  var directionsService = new google.maps.DirectionsService();
  var directionsRenderer = new google.maps.DirectionsRenderer();
  var request = {
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.WALKING,
    unitSystem: google.maps.DirectionsUnitSystem.METRIC,
    optimizeWaypoints: true
  }
  directionsRenderer.setMap(map);
  directionsService.route(request, function(response, status) {
    if (status === "OK") {
      directionsRenderer.setDirections(response);
    } else {
      alert("Directions request failed due to " + status);
    }
  });
}

function calcDistance(start, end) {
  var r = 6371.0710;  // Radius of the Earth in km
  var rlatStart = start.lat * (Math.PI/180);  // Convert degress to radians 
  var rlatEnd = end.lat() * (Math.PI/180);
  var difflat = rlatEnd - rlatStart;  // Radian difference (latitudes)
  var difflon = (end.lng() - start.lng) * (Math.PI/180);  // Radian difference (longitudes)

  var d = 2 * r * Math.asin(Math.sqrt(Math.sin(difflat/2) * Math.sin(difflat/2) + Math.cos(rlatStart) * Math.cos(rlatEnd) * Math.sin(difflon/2) * Math.sin(difflon/2)));
  return d;
}

async function getLocation(locationName) {
  return await new Promise((resolve, reject) => {
    var geocoder = new google.maps.Geocoder();  // ジオコーダのコンストラクタ
    // geocodeリクエストを実行...第1引数はGeocodeRequest. latLngプロパティ, 第2引数はコールバック関数
    geocoder.geocode({address: locationName}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        return resolve(results[0].geometry.location);
      } else {
        alert("Geocoder faild due to: " + status);
        return reject(null);
      }
    });
  });
}

async function getShelters(prefecture, city) {
  return await new Promise((resolve, reject) => {
    var script = document.createElement('script');
    script.async = 'async';
    script.src = 'C:/Users/葉室　和樹/Desktop/report_yoshida/shelters/' + prefecture + '.json.js';
    document.body.appendChild(script);
    script.onload = function() {
      var shelters = jsonData[city];
      return resolve(shelters);
    };
    script.onerror = function() {
      alert("Error loading shelters.");
      return reject(null);
    };
  });
  
}

function splitRegion(address_components) {
  var prefecture;
  var city;
  address_components.forEach(element => {
    if (element["types"][0] == "administrative_area_level_1") {
      prefecture = element["long_name"];
    } else if (element["types"][0] == "locality") {
      city = element["long_name"];
    }
  });  

  return [prefecture, city];
}

async function getAddress(latlng) {
  return await new Promise((resolve, reject) => {
    var geocoder = new google.maps.Geocoder();  // ジオコーダのコンストラクタ
    // geocodeリクエストを実行...第1引数はGeocodeRequest. latLngプロパティ, 第2引数はコールバック関数
    geocoder.geocode({latLng: latlng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results[0].geometry) {
          return resolve(results[0].address_components);
        } else {
          alert("No results found");
          return reject(null);
        }
      } else {
        alert("Geocoder faild due to: " + status);
        return reject(null);
      }
    });
  });
}

async function getGPS() {
  //ブラウザが Geolocation に対応しているかを判定
  //対応していない場合の処理
  if(!navigator.geolocation){ 
    alert('Geolocation に対応していません。');
  }
  
  //ブラウザが対応している場合、position にユーザーの位置情報が入る
  return await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(function(position) {
      return resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    }, function() {  //位置情報の取得をユーザーがブロックした場合のコールバック
      alert('Error: Geolocation が無効です。');
      return reject(null);
    });
  });
}

function displayUserLocation(map, position) {
  new google.maps.Marker({
    position: position,
    map,
    title: 'Current Position',
    icon: {
      fillColor: "#0040FF",                //塗り潰し色
      fillOpacity: 0.8,                    //塗り潰し透過率
      path: google.maps.SymbolPath.CIRCLE, //円を指定
      scale: 8,                           //円のサイズ
      strokeColor: "#FFFFFF",              //枠の色
      strokeWeight: 3.0
    }
  });
  new google.maps.Marker({
    position: position,
    map,
    icon: {
      fillColor: "#00BFFF",                //塗り潰し色
      fillOpacity: 0.2,                    //塗り潰し透過率
      path: google.maps.SymbolPath.CIRCLE, //円を指定
      scale: 24,
      strokeColor: "#0040FF",              //枠の色
      strokeWeight: 0                      //円のサイズ
    }
  });
}

let map, adrComp;
function initMap() {
  // マップを生成して表示
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 35.681167, lng: 139.767052},
    zoom: 16
  });

  getGPS().then(latlng => {
    map.setCenter(latlng);
    displayUserLocation(map, latlng);
    getAddress(latlng).then(address_components => {
      var [prefecture, city] = splitRegion(address_components);
      getShelters(prefecture, city).then(shelters => {
        var sheltersLocation = [];
        var sheltersDistance = [];
        var shelLen = 4;
        for (var i = 0; i < shelLen; ++i) {
          getLocation(prefecture + city + shelters[i]).then(location => {
            sheltersLocation.push(location);
            new google.maps.Marker({
              position: location,
              map,
              label: shelters[i]
            });
            sheltersDistance.push(calcDistance(latlng, location));
          }).then(function() {
            if (sheltersDistance.length == shelLen && sheltersLocation.length == shelLen) {
              var minIndex = sheltersDistance.indexOf(sheltersDistance.reduce(function(a, b) {
                return Math.min(a, b);
              }));
              calcAndDisplayRoute(latlng, sheltersLocation[minIndex], map);
            }
          });
        }
      });
    });
  });
}