/*
* En este archivo se encuentra la lógica relacionada con la inicialización de la aplicación
* Proyecto: Walkability Capturer
* Autor: David Puerto Caldero
*/

//El evento deviceready es lanzado por el dispositivo tras cargar todo lo necesario para su funcionamiento. Hasta que no se lanza, los plugins no se encuentran disponibles
document.addEventListener("deviceready", onDeviceReady, false);

//Tras lanzarse el evento deviceready, se ejecuta la siguient función
function onDeviceReady() {
	//Por si hubiera alguna notificación activa, se cancelan todas
	cordova.plugins.notification.local.cancelAll(function(){},this);
	//Se configura la geolocalización (geolocation.js)
	configurarBackgroundGeoLocation();
	//Esta utilidad proporcionada por el plugin de geolocalización permite controlar si la localización está activa en el dispositivo.
    backgroundGeoLocation.isLocationEnabled(locationCheck, fail);
    backgroundGeoLocation.watchLocationMode(locationCheck, fail);
	//Para evitar que el usuario utilice la aplicación antes de que esté disponible, se muestra una pantalla de espera
	$("body").addClass("loading");
	//Se solicita la apertura de la BD y también su creación en el caso de que no exista (data_base.js)
	abrirBD();
	//Se comprueba si la BD contiene un esquema de tablas o no
	existeBD();
	//Se definen dos eventlistener para las notificaciones.
	cordova.plugins.notification.local.on("trigger", onTrigger);
	cordova.plugins.notification.local.on("click", onNotificationClick);

	//Con el evento backbutton se controla la acción del botón atrás en Android 
	document.addEventListener("backbutton", onBackKeyDown, false);
}

//Si la localización está desactivada en el dispositivo, solicita al usuario abrir los ajustes y activarla
function locationCheck(enabled){
	if (!enabled) {
		var showSettings = window.confirm("Ubicación desactivada. ¿Puedo abrir los ajustes de localización?");
		if (showSettings == true) {
    		backgroundGeoLocation.showLocationSettings();
		}
	}
}

function fail() {
	console.log("SETTING NOT FOUND EXCEPTION");
}

//Cuando una notificación es lanzada
function onTrigger(notification){
	//Se comprueba que sea la diaria (por defecto tiene el ID 1)
	if(notification.id == 1){
		//Se cancela para que no se muestre y no molestar al usuario en caso de que no tenga nada pendiente de valorar
		cordova.plugins.notification.local.cancel(1, function(){
			console.log("Notificacion id " + notification.id + " quitada");
			//Se vuelve a programar para el día siguiente (data_base.js)
			reactivarNotificacionDiaria();
			//Se comprueba si hay alguna ruta que valorar (cuestionario.js)
			obtenerHoraCuestionario();
		});
		
	}
}

//Cuando se hace click en una notificación
function onNotificationClick(notification){
	//Se comprueba que sea la lanzada tras detectar que hay rutas pendientes de valoración (por defecto tiene el ID 10)
	if (notification.id == 10) {
		//La notificación almacena en formato JSON el ID de la ruta y el de la fecha_ruta. Se transforma a texto
		parseado = JSON.parse(notification.data);
		//Tras la transformación a texto, se lanza el cuestionario (cuestionario.js)
		realizarCuestionario(parseado.idruta, parseado.idfecha_ruta);
	}
}

function onBackKeyDown() { alert('Para el correcto funcionamiento de la app este botón ha sido desactivado'); }

//Genera el select de los años de nacimiento
function rellenarSelect(){
    var anyos = document.getElementById("anyoNacimiento");
    var cont = 1;
    var fecha = new Date();
    var anyo = fecha.getFullYear() - 9; 
    anyos.options[0] = new Option("Seleccione un año", -1, true);
    for (var i = anyo; i > (fecha.getFullYear() - 90); i--) {
        anyos.options[cont] = new Option(i, i);
        cont++;
    }
}

//En caso de que el usuario no encuentre su municipio, se le muestra un campo de texto libre
function showContent() {
	element = document.getElementById("content");
	check = document.getElementById("check");
	if (check.checked) {
		element.style.display='block';
	} else {
		element.style.display='none';
	}
}

//Mediante jQuery se controla que ningún campo de los datos necesarios del usuario esté vacío
$(document).ready(function(e) {

	$(".ps-prov option[value=01]").removeAttr("selected");
	$(".ps-prov option[value=-1]").attr("selected", "selected");

	$("#botonTest").on("click", function(){
		//Se comprueba si se ha seleccionado un año
		if ($("#anyoNacimiento option:selected").val() == -1) {
			alert("Por favor, seleccione un año");
		} else {
			//Se comprueba si se ha seleccionado una hora
			if ($("#hora").val().length == 0) {
				alert("Por favor, seleccione una hora")
			} else {
				//En caso de que se haya seleccionado el checkbox
				if ($("#check").prop('checked')) {
					//Se comprueba que el area de texto no esté vacío
					municipio = $("#municipio").val(); 
					if (municipio.length == 0 || /^\s+$/.test(municipio)) {
						alert("Por favor, inserte un municipio");
					} else {
						//Se comprueba que solo se inserten letras
						if (/^([a-zA-Z\s\xc0-\xff]+)$/i.test(municipio)) {
							//Si está todo correcto, se muestra al usuario para que confirme los datos
							confirmarUsuario();
						} else {
							alert("Por favor, utilice letras nada más");
						}
					}
				} else {
					//En caso contrario, se comprueban los selects
					if ($(".ps-prov option:selected").val() == -1) {
						alert("Por favor, seleccione una provincia");
					} else {
						if ($(".ps-mun option:selected").val() == -1) {
							alert("Por favor, seleccione un municipio");
						} else {
							//Si está todo correcto, se muestra al usuario para que confirme los datos
							confirmarUsuario();		
						}
					}	
				}
			}
		}
	});
});

//Antes de añadir el usuario a la BD, se le muestran los datos introducidos para que los confirme
function confirmarUsuario(){
	genero = $("#genero label[for="+$("#genero :radio:checked").attr("id")+"]").text();
	fechaNac = $("#anyoNacimiento option:selected").text();
	mov = $("#movilidad label[for="+$("#movilidad :radio:checked").attr("id")+"]").text();
	hora = $("#hora").val();
	if ($("#check").prop('checked')) {
		mun = $("#municipio").val();
	} else {
		mun = $(".ps-mun option:selected").text();
	}
	navigator.notification.confirm(
    	"Los datos ofrecidos son:\n -Genero: " + genero +
		"\n-Fecha de nacimiento: " + fechaNac +
		"\n-Municipio: " + mun +
		"\n-Problemas de movilidad: " + mov +
		"\n-Horario cuestionario: " + hora, // mensaje mostrado al usuario
     	anadirUsuario, // callback a invocar con el ID del botón presionado (data_base.js)
    	'Confirmar datos', // título
    	['Sí','No'] // nombre de los botones
	);
}