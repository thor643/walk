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

var puntoAnterior = 0;
var duracionAnterior = 0;
var puntoNuevo = 0;
var duracionNueva = 0;
var estadoAnterior = 1;

function iniciarSeguimiento(){ 
    backgroundGeoLocation.start();
}

function pararSeguimiento(){
    backgroundGeoLocation.stop();
}

function configurarBackgroundGeoLocation(){

    var callbackFn = function(location) {

        if (location.accuracy < 55) {
            //Si el temporizador de recogida de punto está activo, se para
            if (temporizadorPunto != 0) {
                clearTimeout(temporizadorPunto);
                temporizadorPunto = 0;
            }

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

            if (puntoNuevo != 0) {
                puntoAnterior = puntoNuevo;
                duracionAnterior = duracionNueva;
            }

            puntoNuevo = latlon;
            duracionNueva = new Date();

            if (puntoAnterior == 0) {
                velocidad = 0;
            } else {
                separacion = google.maps.geometry.spherical.computeDistanceBetween(puntoAnterior, puntoNuevo);
                separacionKM = separacion / 1000;
                tiempoEntrePuntos = duracionNueva - duracionAnterior;
                console.log(separacion + " metros de separacion en " + (tiempoEntrePuntos / 1000) + " segundos");
                tiempoH = (tiempoEntrePuntos / 1000) / 3600;
                velocidad = separacionKM / tiempoH;
            }

            if (estado == 1) {
                //Por seguridad, en el caso de que el array ruta tenga algún elemento, se inicializan todas las variables
                if (ruta.length != 0) {
                    velocidadSuperada = 0;
                    estadoAnterior = 1;
                    ruta = new Array();
                    pathRuta = new Array();
                    distanciaTotal = 0; 
                }

                if (temporizadorParada != 0) {
                    clearTimeout(temporizadorParada);
                    temporizadorParada = 0;
                }

                //Se vigila que la velocidad esté entre los valores estipulados
                if (velocidad > 0 && velocidad < vel_max) {
                    //Se crea y almacena el punto
                    crearYAlmacenarPunto(location.latitude, location.longitude, location.accuracy, latlon);
                    //Cambiamos al estado de presunta ruta, estado 2
                    estado = 2;
                }
            } else {
                //Si la velocidad en dos períodos es mayor que la velocidad máxima permitida, volver a estado 1
                if (velocidad > vel_max) {
                    velocidadMaxSuperada(location.latitude, location.longitude, location.accuracy, latlon);
                } else {
                    velocidadMaxNoSuperada(location.latitude, location.longitude, location.accuracy, latlon, velocidad);
                }
            }
        }

        backgroundGeoLocation.finish();

    }

    var failureFn = function(error){
        console.log('BackgroundGeoLocation error');
    }

    backgroundGeoLocation.configure(callbackFn, failureFn, {
        desiredAccuracy: 10,
        stationaryRadius: 30,
        distanceFilter: 100,
        locationTimeout: 30,
        debug: false,
        stopOnTerminate: true,
        locationService: backgroundGeoLocation.service.ANDROID_FUSED_LOCATION,
        interval: 150000,
        fastestInterval: 5000,
        activitiesInterval: 10000,
        notificationTitle: "Geolocalización",
        notificationText: "Localización activada"
    });
}

function velocidadMaxSuperada(latitude, longitude, accuracy, latlon){
    //Si el temporizador está activo
    if (temporizadorParada != 0) {
        //Hay que comprobar si el usuario se ha movido más de X metros del punto de referencia 
        distanciaEntrePuntos = punto_parada.distanciaConmigo(latitude, longitude);
        //Si se ha alejado más de X metros
        if(distanciaEntrePuntos >= radio_parada){
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

        if (estado == 3 && estadoAnterior == 3) {
            //ALMACENAR RUTA EN BD
            ruta.pop();
            recogerRutas(ruta, distanciaTotal);
        }

        estado = 1;
    } else {
        //Si no, se crea y almacena un punto nuevo
        crearYAlmacenarPunto(latitude, longitude, accuracy, latlon);
    }
}

function velocidadMaxNoSuperada(latitude, longitude, accuracy, latlon, velocidad){
    //Si la velocidad maxima solo es superada una vez, se continua en este estado. Por tanto, el contador se reestablece a 0
    velocidadSuperada = 0;
    estadoAnterior = estado;
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
            if(distanciaEntrePuntos >= radio_parada){
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
    
	marcador = new google.maps.Marker({
                map: map, //Objeto Map sobre el que se muestra el marcador 
                icon: {
                    path: google.maps.SymbolPath.CIRCLE, //Tipo de símbolo del marcador
                    scale: 3, //Tamaño
                    fillColor: 'green', //Color de relleno
                    strokeColor: 'green', //Color de línea del símbolo
                    strokeWeight: 5 //Anchura de la línea del símbolo
                },
                position: latlon //Posición en el mapa
            });

    //Se crea un nuevo punto
    punto = new Punto(latitude, longitude, accuracy);
    //Se inserta al final del array ruta
    ruta.push(punto);
    //Se inserta el objeto Latlon en el array con las coordenadas del punto
    pathRuta.push(latlon);

    if (estado == 2) {
        //Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        distanciaTotal = google.maps.geometry.spherical.computeLength(pathRuta);
        //Se comprueba la distancia total de la ruta hasta el momento. Si la distancia es superior a la establecida, se pasa al estado 3
        if (distanciaTotal > dist_min_ruta) {
            estadoAnterior = 2;
            estado = 3;
        }
    }
    activarTempPunto();    
}

function activarTempPunto(){

    temporizadorPunto = setTimeout(function(){

                                    if (temporizadorParada != 0) {
                                        clearTimeout(temporizadorParada);
                                        temporizadorParada = 0;
                                    }

                                    estadoPrevio = estado;
                                    estado = 1;

                                    if (estadoPrevio == 3) {
                                        //ALMACENAR RUTA EN BD
                                        recogerRutas(ruta, distanciaTotal);
                                    } 
                                }, 900000);

}

function activarTempParada(latitude, longitude, accuracy, latlon){

    //Se activa el temporizador. Si el temporizador llega a 0, se pasa al estado 1
    temporizadorParada = setTimeout(function() {

                                    if (temporizadorPunto != 0) {
                                        //Para pruebas
                                        mostrarTexto('Temporizador ' + temporizadorPunto + ' parado<br>', "pruebas");

                                        clearTimeout(temporizadorPunto);
                                        temporizadorPunto = 0;
                                    }

                                    estadoPrevio = estado;
                                    estado = 1;

                                    if (estadoPrevio == 3) {
                                        //ALMACENAR RUTA EN BD
                                        recogerRutas(ruta, distanciaTotal);
                                    }

                                }, tiempo_parada);

    //Se crea y almacena un nuevo punto
    crearYAlmacenarPunto(latitude, longitude, accuracy, latlon);
    //Se almacena el último punto para tomarlo como referencia
    punto_parada = ruta[ruta.length-1]; 
}

var rutasRecogidas;

//Función para recuperar de la BD todas las rutas originales
function recogerRutas(rutaNueva, distanciaRuta){
    rutasRecogidas = new Array();
    j = 0;
    db.transaction(function(tx) {
        //Se seleccionan idruta, duracion, punto_inicio y punto_fin de las rutas originales
        tx.executeSql('SELECT idruta, duracion, punto_inicio, punto_fin FROM ruta WHERE copia_de IS NULL', [], function(tx, rs) {
            if (rs.rows.length != 0) {
                filas = rs.rows;
                for (var i = 0; i < filas.length; i++) {
                    recorrido = new Array();
                    //Cada tupla devuelta se almacena en el array
                    rutasRecogidas.push({idruta:filas.item(i).idruta, duracion:filas.item(i).duracion, punto_inicio:filas.item(i).punto_inicio, punto_fin:filas.item(i).punto_fin, recorrido:recorrido});
                }
            }
        });
    }, function(err){console.log("ERROR: " + err.message);}, function(){
        //Si hay rutas originales, se comparan con la recién registrada. Si no, se añade directamente a la BD
        if (rutasRecogidas.length != 0) {
            rutaARuta(0, rutasRecogidas.length-1, rutasRecogidas, rutaNueva, distanciaRuta);
        } else {
            anadirRuta(rutaNueva, distanciaRuta, 0);
        }
    });
}

//Función para recuperar los datos de las rutas originales
function rutaARuta(indice, limite, rutasRecogidas, rutaNueva, distanciaRuta){
    db.transaction(function(tx) {
        tx.executeSql('SELECT latitud, longitud FROM punto WHERE idpunto = ?', [rutasRecogidas[indice].punto_inicio], function(tx, rs) {
            if (rs.rows.length != 0) {
                //Se crea un nuevo punto
                punto_nuevo = new PuntoRecorrido(rs.rows.item(0).latitud, rs.rows.item(0).longitud);
                //Se añade al recorrido
                rutasRecogidas[indice].recorrido.push(punto_nuevo);
                //Se seleccionan los puntos intermedios de la ruta
                tx.executeSql('SELECT latitud, longitud, idruta FROM punto INNER JOIN punto_intermedio ON punto.idpunto = punto_intermedio.idpunto WHERE idruta = ? ORDER BY orden ASC', [rutasRecogidas[indice].idruta], function(tx, rs) {
                    if (rs.rows.length != 0) {
                        puntos = rs.rows;
                        //Por cada uno, se crea y se añade al array de recorrido
                        for (var k = 0; k < puntos.length; k++) {
                            punto_nuevo = new PuntoRecorrido(puntos.item(k).latitud, puntos.item(k).longitud);
                            rutasRecogidas[indice].recorrido.push(punto_nuevo);
                        }
                        //Se selecciona el punto final y se almacena
                        tx.executeSql('SELECT latitud, longitud FROM punto WHERE idpunto = ?', [rutasRecogidas[indice].punto_fin], function(tx, rs) {
                            if (rs.rows.length != 0) {
                                punto_nuevo = new PuntoRecorrido(rs.rows.item(0).latitud, rs.rows.item(0).longitud);
                                rutasRecogidas[indice].recorrido.push(punto_nuevo);
                            }
                        });
                    }
                });
            }
        });
    }, function(err){console.log("ERROR: " + err.message);}, function(){
        if (indice == limite) {
            compararRutas(rutasRecogidas, rutaNueva, distanciaRuta);
        } else {
            rutaARuta(indice+1, limite, rutasRecogidas, rutaNueva, distanciaRuta);
        }
    });
}

//Clase Punto usada para comparar las rutas
function PuntoRecorrido(latitud, longitud){
    this.latitud = latitud;
    this.longitud = longitud;

    this.distanciaConmigo = function(lati, longi){

        var punto1 = new google.maps.LatLng(this.latitud, this.longitud);
        var punto2 = new google.maps.LatLng(lati, longi);

        var distancia = google.maps.geometry.spherical.computeDistanceBetween(punto1, punto2);
        return distancia;
    }
}


//Función para comparar la ruta registrada con las originales
function compararRutas(rutasRecogidas, rutaNueva, distanciaRuta){
    duracion = calcularDuracion(rutaNueva[0].hora, rutaNueva[rutaNueva.length-1].hora);
    punto_inicio = rutaNueva[0];
    punto_fin = rutaNueva[rutaNueva.length-1];
    copia_de = {idruta: 0, puntosIguales: 0};
    puntosIguales = 0;
    for (var i = 0; i < rutasRecogidas.length; i++) {
        //Comparar inicio y fin
        punto_inicio_guardada = rutasRecogidas[i].recorrido[0];
        punto_fin_guardada = rutasRecogidas[i].recorrido[rutasRecogidas[i].recorrido.length-1];
        comparacion_inicio = punto_inicio.distanciaConmigo(punto_inicio_guardada.latitud, punto_inicio_guardada.longitud);
        comparacion_fin = punto_fin.distanciaConmigo(punto_fin_guardada.latitud, punto_fin_guardada.longitud);
        //Si los puntos de inicio y de fin de ambas rutas coinciden
        if (comparacion_inicio <= dist_puntos && comparacion_fin <= dist_puntos) {
            //Comparar duracion    
            duracion_guardada = rutasRecogidas[i].duracion;
            diferencia_duracion = duracion_guardada * (dif_duracion/100);
            //Si la diferencia en la duracion de ambas rutas es inferior a la máxima permitida
            if ((duracion >= (duracion_guardada - diferencia_duracion)) && (duracion <= (duracion_guardada + diferencia_duracion))) {
                extension_nueva = rutaNueva.length;
                extension_guardada = rutasRecogidas[i].recorrido.length;
                //Se compara la cantidad de puntos de cada ruta. Se identifica la que menos puntos tenga para tomarla como referencia
                if (extension_nueva >= extension_guardada) {
                    puntosIguales = compararRutaConRuta(rutaNueva, rutasRecogidas[i].recorrido);
                } else {
                    puntosIguales = compararRutaConRuta(rutasRecogidas[i].recorrido, rutaNueva);
                }
                //Si la variable copia_de.puntosIguales es 0
                if (copia_de.puntosIguales == 0) {
                    //Si compararRutas devuelve un valor distinto de 0, se almacena en copia_de
                    if (puntosIguales != 0) {
                        copia_de.idruta = rutasRecogidas[i].idruta;
                        copia_de.puntosIguales = puntosIguales;
                    }
                } else {
                    //Si el valor devuelto es mayor al almacenado, se almacena
                    if (puntosIguales != 0) {
                        if (copia_de.puntosIguales < puntosIguales) {
                        copia_de.idruta = rutasRecogidas[i].idruta;
                        copia_de.puntosIguales = puntosIguales;
                        }
                    }
                }
            }
        }
    }

    //Si no se ha almacenado ningún dato, la ruta es original
    if (copia_de.puntosIguales == 0) {
        anadirRuta(rutaNueva, distanciaRuta, 0);
    } else {
        db.transaction(function(tx){
            tx.executeSql('SELECT dia, hora FROM fecha_ruta WHERE idruta = ? ORDER BY dia ASC',[copia_de.idruta],function(tx,rs){
                if(rs.rows.length != 0){
                    fecha = rs.rows.item(0).dia;
                    fecha = fecha.toString();
                    anyo = fecha.slice(0,4);
                    mes = fecha.slice(4,6);
                    dia = fecha.slice(6,8);
                    horario = rs.rows.item(0).hora;
                    horario = horario.toString();
                    hora = horario.slice(0,2); 
                    minutos = horario.slice(2,4);
                }
            });
        }, function(err){console.log("ERROR: " + err.message);}, function(){});
        anadirRuta(rutaNueva, distanciaRuta, copia_de.idruta);
        console.log("RUTA COPIA");
        console.log("Puntos iguales: " + copia_de.puntosIguales);
    }
}

//Función para comparar dos rutas punto a punto
function compararRutaConRuta(rutaLarga, rutaCorta){
    var i = 1;
    var j = 1;
    var ultimoIgual = 1;
    var puntosDistintos = 0;
    var puntosIguales = 0;
    
    max_distintos = Math.round(rutaCorta.length * (puntos_distintos/100));
    
    // mientras haya puntos en la ruta nueva por comparar
    while(i < rutaCorta.length && puntosDistintos < max_distintos){
        console.log("Comparando " + i + " de " + (rutaCorta.length) + " con " + j + " de " + (rutaLarga.length));
        mayor = compararPuntos(rutaCorta[i], rutaLarga[j]);

        if (mayor) {
            j++;
        } else{
            console.log("Punto igual");
            i++;
            ultimoIgual = j;
            puntosIguales++;
            j++;
        };

        if (j == (rutaLarga.length-1)) {
            console.log("Fin ruta");
            puntosDistintos++;
            j = ultimoIgual + 1;
            i++;
        };
    }

    if (puntosDistintos > max_distintos) {
        puntosIguales = 0;
        return puntosIguales;
    } else {
        //IGUALES
        return puntosIguales;
    }
}

function compararPuntos(p1, p2){

    var distancia = p1.distanciaConmigo(p2.latitud, p2.longitud);

    if (distancia > dist_puntos) {
        return true;
    } else {
        return false;
    };

}

/*
*
* Para pruebas
*
*/
function mostrarTexto(texto, div){
    document.getElementById(div).innerHTML = document.getElementById(div).innerHTML + texto;
}