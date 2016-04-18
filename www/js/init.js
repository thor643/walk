/*
*
*
*
*/

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	
	$("body").addClass("loading");
	rellenarSelect();
	abrirBD();
	existeBD();

	document.addEventListener("backbutton", onBackKeyDown, false);
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

$(document).ready(function(e) {

	$(".ps-prov option[value=01]").removeAttr("selected");
	$(".ps-prov option[value=-1]").attr("selected", "selected");

});

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
			error: function(e){console.log("ERROR");},
			});
}

