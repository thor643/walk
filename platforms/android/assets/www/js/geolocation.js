var velocidadSuperada = 0;
var temporizador = 0;
var estado = 1;
var ruta = new Array();
var pathRuta = new Array();
var distanciaTotal = 0;

function posicionInstantanea(){

    var callbackFn = function(location) {

        latlon = new google.maps.LatLng(location.latitude, location.longitude);
        marcador = new google.maps.Marker({
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 3,
                    fillColor: 'blue',
                    strokeColor: 'blue',
                    strokeWeight: 5
                },
                position: latlon
            });

        marker.setPosition(latlon);
        map.setCenter(latlon);
    
        velocidad = (location.speed*3600)/1000;

        switch(estado){
        //Estado 1 No ruta
        case 1:
            document.getElementById("prueba").innerHTML = document.getElementById("prueba").innerHTML + 'Estado 1<br>';
            //Por seguridad, en el caso de que el array ruta tenga algun elemento, se inicializan todas las variables
            if (ruta.length != 0) {
                ruta = new Array();
                pathRuta = new Array();
                distanciaTotal = 0;
                temporizador = 0;
                velocidadSuperada = 0;
            }
            //Se vigila que la velocidad este entre los valores necesarios
            if (velocidad > 0 && velocidad < 6) {
                crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                //Cambiamos al estado de presunta ruta, estado 2
                estado = 2;
            }
        break;
        //Estado 2 Presunta ruta
        case 2:
            document.getElementById("prueba").innerHTML = document.getElementById("prueba").innerHTML + 'Estado 2<br>';
            //Si la velocidad en dos periodos es mayor que la velocidad maxima permitida, volver a estado 1
            if (velocidad > 6) {
                //Si el temporizador esta activo, se para
                if (temporizador != 0) {
                    clearTimeout(temporizador);
                    temporizador = 0;
                }
                //Se contabilizan las veces que se ha superado la velocidad maxima
                velocidadSuperada++;
                //Al ser superada dicha velocidad por segunda vez consecutiva, se pasa al estado 1
                if (velocidadSuperada == 2) {
                    estado = 1;
                } else {
                    crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                }
            } else {
                //Si la velocidad maxima solo es superada una vez, se continua en este estado. Por tanto, el contador se reestablece a 0
                velocidadSuperada = 0;
                //Si el usuario se para por un tiempo maximo al establecido, se pasa al estado 1
                if (velocidad == 0) {
                    if (temporizador == 0) {
                        temporizador = setTimeout(function() {
                                    estado = 1;
                                }, 600000);
                    }
                    crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                } else {
                    //Si antes de que se cumple el tiempo maximo, el usuario se mueve, se para el temporizador
                    if (temporizador != 0) {
                        clearTimeout(temporizador);
                        temporizador = 0;
                    }
                    crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                }
            }
        break;
        case 3:
            document.getElementById("prueba").innerHTML = document.getElementById("prueba").innerHTML + 'Estado 3<br>';
            if (velocidad > 6) {
                //Si antes de que se cumple el tiempo maximo, el usuario se mueve, se para el temporizador
                if (temporizador != 0) {
                    clearTimeout(temporizador);
                    temporizador = 0;
                }
                velocidadSuperada++;
                if (velocidadSuperada >= 2) {
                    estado = 1;
                    //ALMACENAR RUTA EN BD
                }else{
                    crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                }
            } else {
                velocidadSuperada = 0;
                crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                if (velocidad == 0) {
                    if (temporizador != 0) {
                        temporizador = setTimeout(function(){ 
                                    estado = 1;
                                    //ALMACENAR RUTA EN BD
                                }, 600000);        
                    }
                } else {
                    //Si antes de que se cumpla el tiempo maximo, el usuario se mueve, se para el temporizador
                    if (temporizador != 0) {
                        clearTimeout(temporizador);
                        temporizador = 0;
                    }
                }
            }
        break;
        }

        backgroundGeoLocation.finish();

    }

    var failureFn = function(error){
        console.log('BackgroundGeoLocation error');
        document.getElementById("prueba").innerHTML = "BackgroundGeoLocation error";
    }

    // BackgroundGeoLocation is highly configurable. See platform specific configuration options 
    backgroundGeoLocation.configure(callbackFn, failureFn, {
        desiredAccuracy: 10,
        stationaryRadius: 10,
        distanceFilter: 10,
        stopOnTerminate: true, // <-- enable this to clear background location settings when the app terminates 
    });

    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app. 
    backgroundGeoLocation.start();

}

function pararSeguimiento(){
    backgroundGeoLocation.stop();
}

//Constructor punto
function Punto(latitud, longitud, precision){
    this.latitud = latitud;
    this.longitud = longitud;
    this.precision = precision;
    var tiempo = new Date();
    this.hora = tiempo.toLocaleTimeString();

    this.distanciaConmigo = function(lati, longi){

        var punto1 = new google.maps.LatLng(this.latitud, this.longitud);
        var punto2 = new google.maps.LatLng(lat, longi);

        var distancia = google.maps.geometry.spherical.computeDistanceBetween(punto1, punto2);
    }
}

function crearYAlmacenarPunto(latitude, longitude, accuracy, latlon){
    //Se crea un nuevo punto
    punto = new Punto(latitude, longitude, accuracy);
    //Se inserta al final del array ruta
    ruta.push(punto);
    pathRuta.push(latlon);
    document.getElementById("prueba").innerHTML = document.getElementById("prueba").innerHTML + 'Coordenada: ' + latlon + '<br>';

    if (estado = 2) {
        //Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        distanciaTotal = google.maps.geometry.spherical.computeLength(pathRuta);
        //Se comprueba la distancia total de la ruta hasta el momento. Si la distancia es superior a la establecida, se pasa al estado 3
        if (distanciaTotal > 500) {
            estado = 3;
        }
    }
}