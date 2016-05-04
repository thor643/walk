/*
* En este archivo se encuentra toda la lógica relacionada con la geolocalización
* Proyecto: Walkability Capturer
* Autor: David Puerto Caldero
*/

//Variable para controlar las veces que se supera la velocidad máxima que determina que una ruta se realiza a pie
var velocidadSuperada = 0;
/*Temporizador que se activa al detectar que el usuario se ha parado (velocidad < 1 km/h) y 
se desactiva si el usuario se aleja X metros del punto de parada*/
var temporizadorParada = 0;
//Temporizador que se activa cada vez que se recoge un punto. Si llega a 0, pasa al estado 1
var temporizadorPunto = 0;
//Variable que determina los distintos estados por los que pasa una ruta
var estado = 1;
//Aqui se almacenan los objetos Punto para después almacenarlos en la BD
var ruta = new Array();
//Se almacenan las coordenadas de los puntos de la ruta para medir la distancia de la ruta desde el origen
var pathRuta = new Array();
//Variable para almacenar la distancia desde el origen
var distanciaTotal = 0;
//Variable en la que almacenamos el punto de parada para tenerlo como referencia
var punto_parada;

//Para pruebas
var rutas = new Array();


function iniciarSeguimiento(){
    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app. 
    backgroundGeoLocation.start();
    opcion.seguimiento = true;
    mostrarTexto("Seguimiento iniciado<br>");
    console.log("Seguimiento iniciado");
}

function pararSeguimiento(){
    backgroundGeoLocation.stop();
    mostrarTexto("Seguimiento parado<br>");
    console.log("Seguimiento parado");
}

function configurarBackgroundGeoLocation(){

    var callbackFn = function(location) {

        //Se obtiene el objeto LatLng de la libreria de Google Maps con las coordenadas necesarias para su posterior uso
        latlon = new google.maps.LatLng(location.latitude, location.longitude);
        //Se crea el marcador y se almacena para su posterior uso
        marcador = new google.maps.Marker({
                map: map, //Objeto Map sobre el que se muestra el marcador 
                icon: {
                    path: google.maps.SymbolPath.CIRCLE, //Tipo de símbolo del marcador
                    scale: 3, //Tamaño
                    fillColor: 'blue', //Color de relleno
                    strokeColor: 'blue', //Color de línea del símbolo
                    strokeWeight: 5 //Anchura de la línea del símbolo
                },
                position: latlon //Posición en el mapa
            });
        //Con cada nuevo punto, se mueve el marcador creado en walkability.js/initMap()
        marker.setPosition(latlon);
        //Con cada nuevo punto, se situa el centro del mapa en ese punto
        map.setCenter(latlon);
        //La velocidad es devuelta en m/s, por lo que se realiza la conversión a km/h
        velocidad = (location.speed*3600)/1000;

        if (estado == 1) {
            //Para pruebas
            mostrarTexto('Estado 1<br>');

            //Por seguridad, en el caso de que el array ruta tenga algún elemento, se inicializan todas las variables
            if (ruta.length != 0) {
                velocidadSuperada = 0;
                ruta = new Array();
                pathRuta = new Array();
                distanciaTotal = 0; 
            }

            if (temporizadorParada != 0) {
                    clearTimeout(temporizadorParada);
                    temporizadorParada = 0;
            }

            if (temporizadorPunto != 0) {
                    clearTimeout(temporizadorPunto);
                    temporizadorPunto = 0;
            }

            //Se vigila que la velocidad esté entre los valores estipulados
            //PONER VARIABLE vel_max
            if (velocidad > 0 && velocidad < 6) {
                //Se crea y almacena el punto
                crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                //Cambiamos al estado de presunta ruta, estado 2
                estado = 2;

                //Para pruebas
                mostrarTexto('Estado 2<br>');
            }
        } else {

            //Para pruebas
            /*
            if (estado == 2) {
                mostrarTexto('Estado 2<br>');
            } else {
                mostrarTexto('Estado 3<br>');
            }*/

            //Si el temporizador de recogida de punto está activo, se para
            if (temporizadorPunto != 0) {

                //Para pruebas
                mostrarTexto('Temporizador ' + temporizadorPunto + ' parado<br>');

                clearTimeout(temporizadorPunto);
                temporizadorPunto = 0;
            }
            //Si la velocidad en dos períodos es mayor que la velocidad máxima permitida, volver a estado 1
            //PONER VARIABLE vel_max
            if (velocidad > 6) {
                velocidadMaxSuperada(location.latitude, location.longitude, location.accuracy, latlon);
            } else {
                velocidadMaxNoSuperada(location.latitude, location.longitude, location.accuracy, latlon, velocidad);
            }
        }

        /*
        switch(estado){
        //Estado 1 No ruta
        case 1:

            //Para pruebas
            mostrarTexto('Estado 1<br>');

            //Por seguridad, en el caso de que el array ruta tenga algún elemento, se inicializan todas las variables
            if (ruta.length != 0) {
                velocidadSuperada = 0;
                ruta = new Array();
                pathRuta = new Array();
                distanciaTotal = 0; 
            }

            if (temporizadorParada != 0) {
                    clearTimeout(temporizadorParada);
                    temporizadorParada = 0;
            }

            if (temporizadorPunto != 0) {
                    clearTimeout(temporizadorPunto);
                    temporizadorPunto = 0;
            }

            //Se vigila que la velocidad esté entre los valores estipulados
            //PONER VARIABLE vel_max
            if (velocidad > 0 && velocidad < 6) {
                //Se crea y almacena el punto
                crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                //Cambiamos al estado de presunta ruta, estado 2
                estado = 2;
                activarTempPunto();
            }
        break;
        //Estado 2 Presunta ruta
        case 2:

            //Para pruebas
            mostrarTexto('Estado 2<br>');

            //Si el temporizador de recogida de punto está activo, se para
            if (temporizadorPunto != 0) {
                    clearTimeout(temporizadorPunto);
                    temporizadorPunto = 0;
            }
            //Si la velocidad en dos períodos es mayor que la velocidad máxima permitida, volver a estado 1
            //PONER VARIABLE vel_max
            if (velocidad > 6) {
                velocidadMaxSuperada(location.latitude, location.longitude, location.accuracy, latlon);
            } else {
                velocidadMaxNoSuperada(location.latitude, location.longitude, location.accuracy, latlon, velocidad);
            }
        break;
        case 3:

            //Para pruebas
            mostrarTexto('Estado 3<br>');

            //Si el temporizador de recogida de punto está activo, se para
            if (temporizadorPunto != 0) {
                    clearTimeout(temporizadorPunto);
                    temporizadorPunto = 0;
            }
            //Si la velocidad en dos períodos es mayor que la velocidad máxima permitida, volver a estado 1
            //PONER VARIABLE vel_max
            if (velocidad > 6) {
                velocidadMaxSuperada(location.latitude, location.longitude, location.accuracy, latlon);
            } else {
                velocidadMaxNoSuperada(location.latitude, location.longitude, location.accuracy, latlon, velocidad);
            }
        break;
        }*/

        backgroundGeoLocation.finish();

    }

    var failureFn = function(error){
        console.log('BackgroundGeoLocation error');
        mostrarTexto("BackgroundGeoLocation error<br>");
    }

    // BackgroundGeoLocation is highly configurable. See platform specific configuration options 
    backgroundGeoLocation.configure(callbackFn, failureFn, {
        desiredAccuracy: 10,
        stationaryRadius: 50,
        distanceFilter: 10,
        locationTimeout: 30,
        debug:true,
        stopOnTerminate: true // <-- enable this to clear background location settings when the app terminates 
    });
}

function velocidadMaxSuperada(latitude, longitude, accuracy, latlon){
    //Si el temporizador está activo
    if (temporizadorParada != 0) {
        //Hay que comprobar si el usuario se ha movido más de X metros del punto de referencia 
        distanciaEntrePuntos = punto_parada.distanciaConmigo(latitude, longitude);
        //Si se ha alejado más de X metros
        //PONER VARIABLE radio_parada
        if(distanciaEntrePuntos >= 100){
            //Se para el temporizador ya que se supone que continua su ruta
            clearTimeout(temporizadorParada);
            temporizadorParada = 0;
            //Se comprueban las veces que ha sido superada la velocidad máxima
            comprobarVelSuperada(latitude, longitude, accuracy, latlon);
        }else{
            //Se activa el temporizador de recogida de punto, ya que el GPS ha devuelto un punto nuevo
            activarTempPunto();
        }
    }else{
        //Si el temporizador no está activo
        //Se comprueban las veces que ha sido superada la velocidad máxima
        comprobarVelSuperada(latitude, longitude, accuracy, latlon);
    }
}

function comprobarVelSuperada(latitude, longitude, accuracy, latlon){
    //Se contabilizan las veces que se ha superado la velocidad maxima
    velocidadSuperada++;
    //Al ser superada dicha velocidad por segunda vez consecutiva, se pasa al estado 1
    if (velocidadSuperada == 2) {
        if (estado == 3) {
            //ALMACENAR RUTA EN BD
            anadirRuta(ruta, distanciaTotal,0);
        }

        //Para pruebas
        rutas.push(ruta);

        estado = 1;
    } else {
        //Si no, se crea y almacena un punto nuevo
        crearYAlmacenarPunto(latitude, longitude, accuracy, latlon);
    }
}

function velocidadMaxNoSuperada(latitude, longitude, accuracy, latlon, velocidad){
    //Si la velocidad maxima solo es superada una vez, se continua en este estado. Por tanto, el contador se reestablece a 0
    velocidadSuperada = 0;
    //Si el usuario se para
    if (velocidad < 1) {
        //Si el temporizador no está activo
        if (temporizadorParada == 0) {
            //Se activa el temporizador. Si el temporizador llega a 0, se pasa al estado 1
            activarTempParada(latitude, longitude, accuracy, latlon);       
        }
    } else {
        //Si el temporizador está activo
        if (temporizadorParada != 0) {
            //Hay que comprobar si el usuario se ha movido más de X metros del punto de referencia
            distanciaEntrePuntos = punto_parada.distanciaConmigo(latitude, longitude);
            //Si se ha alejado más de X metros
            //PONER VARIABLE radio_parada
            if(distanciaEntrePuntos >= 100){
                //Se para el temporizador ya que se supone que continua su ruta
                clearTimeout(temporizadorParada);
                temporizadorParada = 0;
                //Se almacena el punto
                crearYAlmacenarPunto(latitude, longitude, accuracy, latlon);
            }else{
                //Se activa el temporizador de recogida de punto, ya que el GPS ha devuelto un punto nuevo
                activarTempPunto();
            }
        }else{
            //Si no, se crea y almacena un punto nuevo
            crearYAlmacenarPunto(latitude, longitude, accuracy, latlon);    
        }
    }
}


//Constructor punto
function Punto(latitud, longitud, precision){
    this.latitud = latitud;
    this.longitud = longitud;
    this.precision = precision;
    var tiempo = new Date();
    this.hora = tiempo.toLocaleTimeString();
    uuid = device.uuid;
    this.identificador = uuid.concat(tiempo.getTime());

    this.distanciaConmigo = function(lati, longi){

        var punto1 = new google.maps.LatLng(this.latitud, this.longitud);
        var punto2 = new google.maps.LatLng(lati, longi);

        var distancia = google.maps.geometry.spherical.computeDistanceBetween(punto1, punto2);
        return distancia;
    }
}

function crearYAlmacenarPunto(latitude, longitude, accuracy, latlon){
    
    //Se crea un nuevo punto
    punto = new Punto(latitude, longitude, accuracy);
    //Se inserta al final del array ruta
    ruta.push(punto);
    //Se inserta el objeto Latlon en el array con las coordenadas del punto
    pathRuta.push(latlon);

    //Para pruebas
    mostrarTexto('Hora: '+ punto.hora +' - Coordenada: ' + latlon + '<br>');

    if (estado == 2) {
        //Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        distanciaTotal = google.maps.geometry.spherical.computeLength(pathRuta);
        //Se comprueba la distancia total de la ruta hasta el momento. Si la distancia es superior a la establecida, se pasa al estado 3
        if (distanciaTotal > 500) {
            estado = 3;

            //Para pruebas
            mostrarTexto('Estado 3<br>');

        }
    }
    activarTempPunto();    
}

function activarTempPunto(){

    temporizadorPunto = setTimeout(function(){ 
                                    estadoAnterior = estado;
                                    estado = 1;

                                    //Para pruebas
                                    console.log("Tiempo máximo de espera de punto excedido");
                                    tiempo = new Date();
                                    hora = tiempo.toLocaleTimeString();
                                    mostrarTexto('Hora: ' + hora + ' - Tiempo espera excedido<br>');

                                    if (estadoAnterior == 3) {
                                        //ALMACENAR RUTA EN BD
                                        anadirRuta(ruta, distanciaTotal, 0);     
                                    }

                                    //Para pruebas
                                    rutas.push(ruta);

                                    for (var i = 0; i < 2; i++) {
                                        $("#btnSeguimiento").trigger("click");
                                    }

                                    //opcion.seguimiento = false;

                                    //backgroundGeoLocation.finish();
                                }, 900000);

    //Para pruebas
    tiempo = new Date();
    hora = tiempo.toLocaleTimeString();
    mostrarTexto('Hora: ' + hora +'Temporizador ' + temporizadorPunto + ' activo<br>');

}

function activarTempParada(latitude, longitude, accuracy, latlon){

    //Se activa el temporizador. Si el temporizador llega a 0, se pasa al estado 1
    temporizadorParada = setTimeout(function() {
                                    estadoAnterior = estado;
                                    estado = 1;

                                    //Para pruebas
                                    console.log("Tiempo máximo de parada excedido");
                                    tiempo = new Date();
                                    hora = tiempo.toLocaleTimeString();
                                    mostrarTexto('Hora: ' + hora + ' - Tiempo parada excedido<br>');

                                    if (estadoAnterior == 3) {
                                        //ALMACENAR RUTA EN BD
                                        anadirRuta(ruta, distanciaTotal,0);
                                    }

                                    //Para pruebas
                                    rutas.push(ruta);

                                    //backgroundGeoLocation.finish();
                                    
                                    for (var i = 0; i < 2; i++) {
                                        $("#btnSeguimiento").trigger("click");
                                        mostrarTexto("AUTO<br>");
                                    }

                                    //opcion.seguimiento = false; 
                                    
                                    //PONER VARIABLE tiempo_parada
                                }, 300000);

    //Para pruebas
    console.log("Temporizador de parada activo");
    tiempo = new Date();
    hora = tiempo.toLocaleTimeString();
    mostrarTexto('Hora: ' + hora + ' - Parada activa<br>');

    //Se crea y almacena un nuevo punto
    crearYAlmacenarPunto(latitude, longitude, accuracy, latlon);
    //Se almacena el último punto para tomarlo como referencia
    punto_parada = ruta[ruta.length-1]; 
}



/*
*
* Para pruebas
*
*/
function mostrarTexto(texto){
    document.getElementById("pruebas").innerHTML = document.getElementById("pruebas").innerHTML + texto;
}