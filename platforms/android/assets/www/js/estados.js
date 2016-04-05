
var posicionInstantanea;
var timeOut;

function estado1(){

	posicionInstantanea = navigator.geolocation.watchPosition(onSuccess, showError, { enableHighAccuracy: true});
}

function onSuccess(position){

	var speed = (position.coords.speed*3600)/1000;

	if (speed > 0 && speed <= 6) {
		navigator.geolocation.clearWatch(posicionInstantanea);
		estado2();
	};
}

function estado2(){

	posicionInstantanea = navigator.geolocation.watchPosition(onSuccess, showError, { enableHighAccuracy: true});

}

function onSuccess(position){

	var speed = (position.coords.speed*3600)/1000;

	if (speed > 6) {

		navigator.geolocation.clearWatch(posicionInstantanea);
		estado1();

	} else{
		if (speed = 0) {
			//Vigilar si hay cambios
			navigator.geolocation.clearWatch(posicionInstantanea);
			vigilarCambios();	
		} else{
			//Almacenar coordenadas
			if (distTotal > 1km) {
				navigator.geolocation.clearWatch(posicionInstantanea);
				estado3();
			};
		};
	};

}

function vigilarCambios(){

	posicionInstantanea = navigator.geolocation.watchPosition(onSuccess, showError, { enableHighAccuracy: true});

}

function onSuccess(position){

	var speed = (position.coords.speed*3600)/1000;

	if (speed >0) {
		//Volver al principio
		navigator.geolocation.clearWatch(posicionInstantanea);
		estado2();
		if (timeOut != 0) {
			clearTimeout(timeOut);
		};
	} else{
		if (timeOut = 0) {
			var timeOut = setTimeout(function() {
				navigator.geolocation.clearWatch(posicionInstantanea);
				estado1();
			}, 600000);
		};
	};

}

function estado3(){

}

//fuera de la funcion
var cont1 = 0;
var temporizador = 0;
var estado = 1;
var ruta = new Array();
var distanciaTotal = 0;

//funcion

velocidad = (location.speed*3600)/1000;

switch(estado) {
    //Estado 1 No ruta
    case 1:
    	//Por seguridad, en el caso de que el array ruta tenga algun elemento, se sobreescribe con uno nuevo para eliminar el anterior
    	if (ruta.length != 0) {
        	ruta = new Array();
        	distanciaTotal = 0;
        };
    	//Se vigila que la velocidad este entre los valores necesarios
        if (velocidad > 0 && velocidad < 6) {
        	//Se crea un nuevo objeto Punto
        	//RELLENAR CONSTRUCTOR
        	punto = new Punto();
        	//Se inserta en el array ruta que tendra todos los puntos de la posible ruta
        	ruta.push(punto);
        	//Cambiamos al estado de presunta ruta, estado 2
        	estado = 2;
        };
        break;
    //Estado 2 Presunta ruta
    case 2:
    	//Si la velocidad en dos periodos es mayor que la velocidad maxima permitida, volver a estado 1
        if (velocidad > 6) {
        	//Si el temporizador está activo, se para
        	if (temporizador != 0) {
        		clearTimeout(temporizador);
        		temporizador = 0;
        	};
        	//Se puede dar el caso de que la velocidad solo se supere durante un periodo, por ejemplo al pasar un semaforo. En este caso se almacenara el punto en cuestion
        	//RELLENAR CONSTRUCTOR
        	punto = new Punto();
        	//Se inserta al final del array ruta
        	ruta.push(punto);
        	//Se contabilizan las veces que se ha superado la velocidad maxima
        	cont1++;
        	//Al ser superada dicha velocidad por segunda vez consecutiva, se pasa al estado 1
        	if (cont1 == 2) {
        		estado = 1;
        		cont1 = 0;
        	}else{
        		//Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        		dist2puntos = ruta.[ruta.length-2].distanciaConmigo(punto.latitud, punto.longitud);
        		distanciaTotal = distanciaTotal + dist2puntos;
        		if (distanciaTotal > 1000) {
        			estado = 3;
        		};
        	};
        } else{
        	//Si la velocidad maxima solo es superada una vez, se continua en este estado. Por tanto, el contador se reestablece a 0
        	cont1 = 0;
        	//Si el usuario se para por un tiempo maximo al establecido, se pasa al estado 1
        	if (velocidad == 0) {
        		temporizador = setTimeout(function(){ 
        							estado = 1;
        						 }, 600000);
        	} else{
        		//Si antes de que se cumpla el tiempo maximo, el usuario se mueve, se para el temporizador
				if (temporizador != 0) {
        			clearTimeout(temporizador);
        			temporizador = 0;
        		};
        		//Se crea un nuevo punto
        		//RELLENAR CONSTRUCTOR
        		punto = new Punto();
        		//Se inserta al final del array ruta
        		ruta.push(punto);
        		//Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        		dist2puntos = ruta.[ruta.length-2].distanciaConmigo(punto.latitud, punto.longitud);
        		distanciaTotal = distanciaTotal + dist2puntos;
        		//Se comprueba la distancia total de la ruta hasta el momento. Si la distancia es superior a la establecida, se pasa al estado 3
        		if (distanciaTotal > 1000) {
        			estado = 3;
        		};
        	};
        };
        break;
    //Estado 3 Ruta
    case 3:
    	if (velocidad > 6) {
    		cont1++;
    		if (cont1 == 2) {
    			estado = 1;
    			cont1 = 0;
    			//Se crea un nuevo punto
        		//RELLENAR CONSTRUCTOR
        		punto = new Punto();
        		//Se inserta al final del array ruta
        		ruta.push(punto);
        		//Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        		dist2puntos = ruta.[ruta.length-2].distanciaConmigo(punto.latitud, punto.longitud);
        		distanciaTotal = distanciaTotal + dist2puntos;
        		//ALMACENAR RUTA EN BD
    		} else{
    			//Se crea un nuevo punto
        		//RELLENAR CONSTRUCTOR
        		punto = new Punto();
        		//Se inserta al final del array ruta
        		ruta.push(punto);
        		//Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        		dist2puntos = ruta.[ruta.length-2].distanciaConmigo(punto.latitud, punto.longitud);
        		distanciaTotal = distanciaTotal + dist2puntos;
    		};
    	} else{
    		cont1 = 0;
    		if (velocidad == 0) {
    			temporizador = setTimeout(function(){ 
        							estado = 1;
        							//Se crea un nuevo punto
        							//RELLENAR CONSTRUCTOR
        							punto = new Punto();
        							//Se inserta al final del array ruta
        							ruta.push(punto);
        							//Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        							dist2puntos = ruta.[ruta.length-2].distanciaConmigo(punto.latitud, punto.longitud);
        							distanciaTotal = distanciaTotal + dist2puntos;
        							//ALMACENAR RUTA EN BD
        						 }, 600000);
    		} else{
    			//Se crea un nuevo punto
        		//RELLENAR CONSTRUCTOR
        		punto = new Punto();
        		//Se inserta al final del array ruta
        		ruta.push(punto);
        		//Se comprueba la distancia entre el punto actual y el anterior. Al haber sido insertado el actual, se debe comprobar la distancia con el penultimo introducido
        		dist2puntos = ruta.[ruta.length-2].distanciaConmigo(punto.latitud, punto.longitud);
        		distanciaTotal = distanciaTotal + dist2puntos;
    		};
    	};
    	break;
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