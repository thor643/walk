function obtenerHoraCuestionario(){
	db.transaction(function(tx) {
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion', [], function(tx, rs) {
			res = rs;
			if (rs.rows.length != 0) {
				console.log(rs.rows.item(0).realizar_cuestionario);
				/*return rs.rows.item(0).realizar_cuestionario;*/
				recuperarRutasRealizadas(rs.rows.item(0).realizar_cuestionario);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){});
}

function recuperarRutasRealizadas(hora){
	fecha = new Date();
	diaHoy = fecha.getDate();
	mesHoy = fecha.getMonth() + 1;
	anyoHoy = fecha.getFullYear();
	fechaHoy = (anyoHoy * 10000) + (mesHoy * 100) + diaHoy;
	fechaAyer = diaAnterior(diaHoy, mesHoy, anyoHoy);

	//Para pruebas
	console.log("Fecha hoy: " + fechaHoy);
	console.log("Fecha ayer: " + fechaAyer);
	console.log("Hora: " + hora);

	db.transaction(function (tx) {
		tx.executeSql('SELECT idruta FROM  fecha_ruta WHERE (dia = ? AND hora >= ?) OR (dia = ? AND hora <= ?)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			if (rs.rows.length > 0) {
				recuperarRutasRealizadasNuevas(fechaAyer, fechaHoy, hora);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function diaAnterior(dia, mes, anyo){

	diaAyer = dia - 1;

	if (diaAyer == 0) {
		mesAyer = mes - 1;

		if (mesAyer == 0) {
			mesAyer = 12;
			anyo = anyo - 1;
		}

		if (mesAyer == 1 || mesAyer == 3 || mesAyer == 5 || mesAyer == 7 || mesAyer == 8 || mesAyer == 10 || mesAyer == 12) {
			diaAyer = 31;
		} else {
			if (mesAyer == 4 || mesAyer == 6 || mesAyer == 9 || mesAyer == 11) {
				diaAyer = 30;
			} else {
				if (((anyo % 4) == 0) && (((anyo % 100) != 0) || (anyo % 400) == 0)) {
					diaAyer = 29;
				} else {
					diaAyer = 28;
				}
			}
		}
	} else {
		mesAyer = mes;
	}

	fechaAyer = (anyo * 10000) + (mesAyer * 100) + diaAyer;

	return fechaAyer; 
}

var rutasRecuperadas;

function recuperarRutasRealizadasNuevas(fechaAyer, fechaHoy, hora){
	db.transaction(function (tx) {
		tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE (dia = ? AND hora >= ? AND categoria is NULL AND ruta.en_servidor is NULL) OR (dia = ? AND hora <= ?  AND categoria is NULL AND ruta.en_servidor is NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			if (rs.rows.length > 0) {
				rutasRecuperadas = rs.rows;
				if (rutasRecuperadas.length == 1) {
					//Comprobar si esta activa la notificacion. Si esta activa, realizar cuestionario. Sino, activar
					cordova.plugins.notification.local.isScheduled(10, function(a){
						if(a){
							realizarCuestionario(rutasRecuperadas.item(0).idruta, rutasRecuperadas.item(0).idfecha_ruta);
						}else{
							activarNotificacionCuestionario(rutasRecuperadas.item(0).idruta, rutasRecuperadas.item(0).idfecha_ruta);
						}
					});
					
				} else {
					var aleatorio = Math.round(Math.random()*rutasRecuperadas.length);
					if (aleatorio == data.length) {
						aleatorio = aleatorio - 1;
					}
					realizarCuestionario(rutasRecuperadas.item(0));
				}
			} else {
				recuperarRutasRealizadasYValoradas(fechaAyer, fechaHoy, hora);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function recuperarRutasRealizadasYNoValoradas(fechaAyer, fechaHoy, hora){
	db.transaction(function (tx) {
		tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE (dia = ? AND hora >= ? AND categoria is NULL) OR (dia = ? AND hora <= ?  AND categoria is NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			if (rs.rows.length > 0) {
				rutasRecuperadas = rs.rows;
				realizarCuestionario();
			} else {
				recuperarRutasRealizadasYValoradas(fechaAyer, fechaHoy, hora);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function recuperarRutasRealizadasYValoradas(fechaAyer, fechaHoy, hora){
	db.transaction(function (tx) {
		tx.executeSql('SELECT fecha_ruta.idruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta INNER JOIN ruta_valorada ON fecha_ruta.idfecha_ruta = ruta_valorada.fecha_ruta_idfecha_ruta INNER JOIN fecha_cuestionario ON ruta_valorada.fecha_cuestionario_idfecha_cuestionario = fecha_cuestionario.idfecha_cuestionario WHERE (fecha_ruta.dia = ? AND fecha_ruta.hora >= ? AND ruta.categoria is not NULL AND ruta.en_servidor is not NULL) OR (fecha_ruta.dia = ? AND fecha_ruta.hora <= ?  AND ruta.categoria is not NULL AND ruta.en_servidor is not NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			if (rs.rows.length > 0) {
				verificarRutas(rs.rows, fechaHoy);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function verificarRutas(data, fechaHoy){
	for (var i = 0; i < data.length; i--) {
		verificarMensualidad(data.item(i).idruta, fechaHoy);
		console.log("Longitud array rutasMes: " + rutasMes.length);
	}
}
var rutasMes = new Array();

function verificarMensualidad(idruta, fechaHoy){
	db.transaction(function (tx) {
		tx.executeSql('SELECT fecha_cuestionario.dia, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta_valorada ON fecha_ruta.idfecha_ruta = ruta_valorada.fecha_ruta_idfecha_ruta INNER JOIN fecha_cuestionario ON ruta_valorada.fecha_cuestionario_idfecha_cuestionario = fecha_cuestionario.idfecha_cuestionario WHERE fecha_ruta.idruta = ? ORDER BY fecha_cuestionario.dia DESC', [idruta], function(tx, rs){
			if (rs.rows.length > 0) {
				fechaValorada = rs.rows.item(0).dia;
				total = fechaHoy - fechaValorada;
				if (total >= 100) {
					ruta = {idruta: idruta, idfecha_ruta: rs.rows.item(0).idfecha_ruta};
					rutasMes.push(ruta);
				}
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

var elegida = true;

function realizarCuestionario(idruta, idfecha_ruta){

	$("body").addClass("loading");
	//cambiar redireccion
	window.location.href="#cuestionarioPage";

	$('#inicioCuestionario').attr("name", idfecha_ruta);
	$('#categorias').hide();
	recuperarRuta(idruta, "mapaCuestionario");
	$("body").removeClass("loading");
//Cambiar texto label

//$("#rdBtnCategoria label[for='cat"+ idcategori +"']").text(textocategoria);
}

function realizarCuestionarioMensual(){

}

function activarNotificacionCuestionario(idruta, idfecha_ruta){
	cordova.plugins.notification.local.schedule({
		text: "Tienes una ruta pendiente de valoración",
		id: 10,
		every: "hour",
		data: {idruta: idruta, idfecha_ruta: idfecha_ruta}
	});
}

function solicitarPreguntas(categoria, idfecha_ruta){
	//genero
	//horario
	db.transaction(function (tx) {
		tx.executeSql('SELECT genero FROM usuario', [], function(tx, rs){
			if (rs.rows.length > 0) {
				genero = rs.rows.item(0).genero;
				tx.executeSql('SELECT hora FROM fecha_ruta WHERE idfecha_ruta = ?', [idfecha_ruta], function(tx, rs){
					if (rs.rows.length > 0) {
						hora = rs.rows.item(0).hora;
						if (hora >= 700 || hora <= 2259) {
							//Mañana
							horario = 1;
						} else {
							//Noche
							horario = 2;
						}

						//Pruebas
						/*categoria = 4;
						genero = 0;
						horario = 1;*/

						datos = [{categoria:categoria, genero:genero, horario:horario}];
						datosJSON = JSON.stringify(datos);

						$.ajax({type: "POST", 
								url: "http://galan.ehu.eus/dpuerto001/WEB/solicitarPreguntas.php",
								data: {dato:datosJSON},
								success: function(data){
											console.log(data);
											crearCuestionario(data);
										},
								error: function(e){console.log("ERROR");},
						});
					}
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function crearCuestionario(data){
	for (var i = 0; i < data.length; i++) {
		var enunciado = $("<legend>", {id:"texto"+ (i+1), text:data[i].textoPregunta});
		$("#preguntas").append(enunciado);
		var pregunta = $("<div>", {id:"pregunta"+ (i+1), name:data[i].idPregunta});
		$("#preguntas").append(pregunta);
		var tipoRespuesta = data[i].tipoRespuesta;
		for (var j = 0; j < data[i].respuestas.length; j++) {
			var respuesta = data[i].respuestas[j];
			var label = $("<label>", {for: respuesta.idRespuesta, text: respuesta.textoRespuesta});
			$("#pregunta"+ (i+1)).append(label);
			if (tipoRespuesta == 0) {
				var opcion = $("<input>", {type:"radio", name:"pregunta"+ (i+1), id:respuesta.idRespuesta});
			} else {
				var opcion = $("<input>", {type:"checkbox", name:"pregunta"+ (i+1), id:respuesta.idRespuesta});
			}
			$("#pregunta"+ (i+1)).append(opcion);
		}
		$("#pregunta"+ (i+1)).controlgroup();
	}
	$("#cuestionario").show();
	$("body").removeClass("loading");
}

/*
var enunciado = $("<legend>", {id:"texto"+ 1, text:"Esto es un enunciado"});
$("#preguntas").append(enunciado)
var pregunta = $("<div>", {id:"pregunta"+ 1});
$("#preguntas").append(pregunta)
var label = $("<label>", {for: "prueba1", text: "PRUEBA DE FUEGO"})
$("#pregunta"+ 1).append(label)
var radio = $("<input>", {type:"radio", name:"pregunta"+ 1 +"", id:"prueba1"})
$("#pregunta"+ 1).append(radio)
$("#pregunta"+ 1).controlgroup()
*/

$(document).ready(function(e) {

	$("#btnSi").on("click", function(){
		$("body").addClass("loading");
		$("#btnsCuestionario").hide();

		$.ajax({url: "http://galan.ehu.eus/dpuerto001/WEB/solicitarCategorias.php",
				success: function(data){
					categorias = new Array();
					for (var i = 0; i < data.length; i++) {
						categorias.push(data[i].categoria);
					}

					for (var i = 0; i < categorias.length; i++) {
						$("#rdBtnCategoria label[for='cat"+ (i+1) +"']").text(categorias[i]);
					}

					$("#categorias").show();
					$("body").removeClass("loading");
				},
				error: function(e){
					console.log("ERROR");
					alert("Fallo de conexión. Por favor, inténtelo de nuevo. Si el problema persiste, contáctenos");
					$("#btnsCuestionario").show();
					$("body").addClass("loading");
				}
		});
/*
		$.getJSON('http://galan.ehu.eus/dpuerto001/WEB/solicitarCategorias.php',function(data){
			categorias = new Array();
			for (var i = 0; i < data.length; i++) {
				categorias.push(data[i].categoria);
			}

			for (var i = 0; i < categorias.length; i++) {
				$("#rdBtnCategoria label[for='cat"+ (i+1) +"']").text(categorias[i]);
			}

			$("#categorias").show();
			$("body").removeClass("loading");
		});
*/
	});

	$("#btnNo").on("click", function(){
		
	});

	$("#btnSiguiente").on("click", function(){
		$("body").addClass("loading");
		$("#inicioCuestionario").hide();
		categoria = parseInt($("#rdBtnCategoria :checked").val());
		idfecha_ruta = $("#inicioCuestionario").attr("name");
		//solicitarPreguntas(categoria, "6e232468a2fe79231462028282836");
		solicitarPreguntas(categoria, idfecha_ruta);
	});
});

//Para conseguir todos los controlgroup
$("#preguntas div[id^='pregunta']")