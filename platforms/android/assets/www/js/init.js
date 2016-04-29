/*
*
*
*
*/

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	cordova.plugins.notification.local.cancelAll(function(){alert("done");},this);
	configurarBackgroundGeoLocation();
    backgroundGeoLocation.watchLocationMode(locationCheck);
	$("body").addClass("loading");
	rellenarSelect();
	abrirBD();
	existeBD();

	document.addEventListener("backbutton", onBackKeyDown, false);
}

function locationCheck(enabled){
	if (!enabled) {
		var showSettings = window.confirm("Ubicación desactivada. ¿Puedo abrir los ajustes de localización?");
		if (showSettings == true) {
    		backgroundGeoLocation.showLocationSettings();
		}
	}
}

function onBackKeyDown() { alert('Back button clicked!'); }

function rellenarSelect(){
    var anyos = document.getElementById("anyoNacimiento");
    var cont = 1;
    var fecha = new Date();
    var anyo = fecha.getFullYear() + 1; 
    anyos.options[0] = new Option("Seleccione un año", -1, true);
    for (var i = 1900; i < anyo; i++) {
        anyos.options[cont] = new Option(i, i);
        cont++;
    }
}

function showContent() {
	element = document.getElementById("content");
	check = document.getElementById("check");
	if (check.checked) {
		element.style.display='block';
	} else {
		element.style.display='none';
	}
}

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
		"\n-Horario cuestionario: " + hora, // message
     	anadirUsuario,  // callback to invoke with index of button pressed
    	'Confirmar datos',           // title
    	['Sí','No']     // buttonLabels
	);
}

$(document).ready(function(e) {

	$(".ps-prov option[value=01]").removeAttr("selected");
	$(".ps-prov option[value=-1]").attr("selected", "selected");

	$("#botonTest").on("click", function(){
		if ($("#anyoNacimiento option:selected").val() == -1) {
			alert("Por favor, seleccione un año");
		} else {
			if ($("#hora").val().length == 0) {
				alert("Por favor, seleccione una hora")
			} else {
				if ($("#check").prop('checked')) {
					//Mirar area de texto
					municipio = $("#municipio").val(); 
					if (municipio.length == 0 || /^\s+$/.test(municipio)) {
						alert("Por favor, inserte un municipio");
					} else {
						if (/^([a-zA-Z\s\xc0-\xff]+)$/i.test(municipio)) {
							confirmarUsuario();
						} else {
							alert("Por favor, utilice letras nada más");
						}
					}
				} else {
					//Mirar selects
					if ($(".ps-prov option:selected").val() == -1) {
						alert("Por favor, seleccione una provincia");
					} else {
						if ($(".ps-mun option:selected").val() == -1) {
							alert("Por favor, seleccione un municipio");
						} else {
							confirmarUsuario();		
						}
					}	
				}
			}
		}
	});
});

function activarNotificacion(){
	db.transaction(function(tx) {
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion WHERE idconfiguracion = 1', [], function(tx, rs) {
			if (rs.rows.length != 0) {
				cuestionario = rs.rows.item(0).realizar_cuestionario;
				fecha = new Date();
				hora = fecha.toLocaleTimeString();
				horasMinutos = hora.slice(0,5);
				horaMod = horasMinutos.replace(/:/g,"");
				horaInt = parseInt(horaMod);

				if (cuestionario == horaInt) {
					momento = fecha;
				} else {

					if (cuestionario < horaInt) {
						dia = fecha.getDate() + 1;
					} else {
						dia = fecha.getDate();
					}

					anyo = fecha.getFullYear();
					mes = fecha.getMonth();
					horaSt = cuestionario.toString();

					if (horaSt.length <= 2) {
						hora = 0;
						minutos = cuestionario;
					} else {
						if (horaSt.length == 3) {
							hora = parseInt(horaSt.substr(0,1));
							minutos = parseInt(horaSt.substr(1,3));
						} else {
							hora = parseInt(horaSt.substr(0,2));
							minutos = parseInt(horaSt.substr(2,4));
						}
					}
					console.log(anyo + " " + mes+ " " + dia + " " + hora + " " + minutos);
					momento = new Date(anyo, mes, dia, hora, minutos, 0, 0);
					console.log(momento);
				}
				/*momento = new Date();
				_5_segundos = new Date(momento.getTime() + 5*1000);
				console.log(_5_segundos);*/
				cordova.plugins.notification.local.schedule({
					text: "Verificacion diaria",
					every: "day",
					//at: _5_segundos
					at:momento
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){});
}

/*
*
* Pruebas
*
*/
function pruebaRemoto(){
	$.getJSON('http://galan.ehu.eus/dpuerto001/WEB/respuesta.php',function(data){
				console.log(JSON.stringify(data));	
			  	res = JSON.parse(data);
			  });
}

var res;

function pruebaAgregar(){
	datos = [{"vel_max":"10","dist_min_ruta":"1000","tiempo_parada":"700"},{"vel_max":"20","dist_min_ruta":"2000","tiempo_parada":"400"}];
	datosJSON = JSON.stringify(datos);
	$.ajax({type: "POST", 
			url: "http://galan.ehu.eus/dpuerto001/WEB/agregar.php",
			data: {dato:datosJSON},
			success: function(data){console.log("ENVIADO");},
			error: function(e){console.log("ERROR");}
			});
}

