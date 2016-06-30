/*
* En este archivo se encuentra toda la lógica relacionada con el cuestionario
* Proyecto: Walkability Capturer
* Autor: David Puerto Caldero
*/

var rutaBorrada = false;

function obtenerHoraCuestionario(){
	db.transaction(function(tx) {
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion', [], function(tx, rs) {
			res = rs;
			if (rs.rows.length != 0) {
				console.log(rs.rows.item(0).realizar_cuestionario);
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

	db.transaction(function (tx) {
		tx.executeSql('SELECT idruta FROM  fecha_ruta WHERE (dia = ? AND hora >= ?) OR (dia = ? AND hora <= ?)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			console.log("RUTAS REALIZADAS: " + rs.rows.length);
			if (rs.rows.length > 0) {
				recuperarRutasRealizadasNuevas(fechaAyer, fechaHoy, hora);
			} else {
				enviosPendientes();
				if (rutaBorrada) {
					noHayMasRutas();
				}
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
	momento = new Date(fecha.getTime() + 3600*1000);
	db.transaction(function (tx) {
		tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE (dia = ? AND hora >= ? AND fecha_ruta.en_servidor = 0 AND ruta.copia_de IS NULL) OR (dia = ? AND hora <= ? AND fecha_ruta.en_servidor = 0 AND ruta.copia_de IS NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			console.log("RUTAS REALIZADAS NUEVAS: " + rs.rows.length);
			if (rs.rows.length > 0) {
				rutasRecuperadas = rs.rows;
				if (rutasRecuperadas.length == 1) {
					//Comprobar si esta activa la notificacion. Si esta activa, realizar cuestionario. Sino, activar
					console.log("Notificacion cuestionario");
					comprobarNotificacion(rutasRecuperadas.item(0).idruta, rutasRecuperadas.item(0).idfecha_ruta, momento);
				} else {
					var aleatorio = Math.round(Math.random()*rutasRecuperadas.length);
					console.log(aleatorio);
					if (aleatorio == rutasRecuperadas.length) {
						aleatorio = aleatorio - 1;
					}
					comprobarNotificacion(rutasRecuperadas.item(aleatorio).idruta, rutasRecuperadas.item(aleatorio).idfecha_ruta, momento);
				}
			} else {
				recuperarRutasRealizadasYNoValoradas(fechaAyer, fechaHoy, hora);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function recuperarRutasRealizadasYNoValoradas(fechaAyer, fechaHoy, hora){
	momento = new Date(fecha.getTime() + 3600*1000);
	db.transaction(function (tx) {
		tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta LEFT JOIN ruta_valorada ON fecha_ruta.idfecha_ruta = ruta_valorada.fecha_ruta_idfecha_ruta WHERE (dia = ? AND hora >= ? AND ruta_valorada.fecha_ruta_idfecha_ruta IS NULL) OR (dia = ? AND hora <= ? AND ruta_valorada.fecha_ruta_idfecha_ruta IS NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			console.log("RUTAS REALIZADAS NO VALORADAS: " + rs.rows.length);
			if (rs.rows.length > 0) {
				rutasRecuperadas = rs.rows;
				if (rutasRecuperadas.length == 1) {
					//Comprobar si esta activa la notificacion. Si esta activa, realizar cuestionario. Sino, activar
					console.log("Notificacion cuestionario");
					comprobarNotificacion(rutasRecuperadas.item(0).idruta, rutasRecuperadas.item(0).idfecha_ruta, momento);
				} else {
					var aleatorio = Math.round(Math.random()*rutasRecuperadas.length);
					if (aleatorio == rutasRecuperadas.length) {
						aleatorio = aleatorio - 1;
					}
					comprobarNotificacion(rutasRecuperadas.item(aleatorio).idruta, rutasRecuperadas.item(aleatorio).idfecha_ruta, momento);
				}
			} else {
				recuperarRutasRealizadasYValoradas(fechaAyer, fechaHoy, hora);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function recuperarRutasRealizadasYValoradas(fechaAyer, fechaHoy, hora){
	rutasMes = new Array();
	momento = new Date(fecha.getTime() + 3600*1000);
	db.transaction(function (tx) {
		tx.executeSql('SELECT ruta.copia_de FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE (dia = ? AND hora >= ?) OR (dia = ? AND hora <= ?)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			console.log("RUTAS REALIZADAS VALORADAS: " + rs.rows.length);
			if (rs.rows.length > 0) {
				idsrutas = rs.rows;
				j = 0;
				numrutas = idsrutas.length;
				for (var i = 0; i < idsrutas.length; i++) {
					tx.executeSql('SELECT fecha_cuestionario.dia, fecha_ruta.idfecha_ruta, fecha_ruta.idruta FROM fecha_ruta INNER JOIN ruta_valorada ON fecha_ruta.idfecha_ruta = ruta_valorada.fecha_ruta_idfecha_ruta INNER JOIN fecha_cuestionario ON ruta_valorada.fecha_cuestionario_idfecha_cuestionario = fecha_cuestionario.idfecha_cuestionario WHERE fecha_ruta.idruta = ? ORDER BY fecha_cuestionario.dia DESC', [idsrutas.item(i).idruta], function(tx, rs){
						console.log("VALORACIONES: " + rs.rows.length);
						j++;
						if (rs.rows.length > 0) {
							fechaValorada = rs.rows.item(0).dia;
							total = fechaHoy - fechaValorada;
							if (total >= 100) {
								rutaVal = {idruta: rs.rows.item(0).idruta, idfecha_ruta: rs.rows.item(0).idfecha_ruta};
								rutasMes.push(rutaVal);
							}

							if(j == numrutas){
								if(rutasMes.length > 0){
									if (rutasMes.length == 1) {
										tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE ((dia = ? AND hora >= ?) OR (dia = ? AND hora <= ?)) AND ruta.copia_de = ?', [fechaAyer, hora, fechaHoy, hora, rutasMes(0).idruta], function(tx, rs) {
											if (rs.rows.length != 0) {
												//Comprobar si esta activa la notificacion. Si esta activa, realizar cuestionario. Sino, activar
												console.log("Notificacion cuestionario");
												comprobarNotificacion(rs.rows.item(0).idruta, rs.rows.item(0).idfecha_ruta, momento);
												/*cordova.plugins.notification.local.isScheduled(10, function(a){
													if(a){
														cordova.plugins.notification.local.update({id:10, at:momento, data:{idruta: rs.rows.item(0).idruta, idfecha_ruta: rs.rows.item(0).idfecha_ruta}});
														realizarCuestionario(rutasMes(0).idruta, rutasMes(0).idfecha_ruta);
													}else{
														activarNotificacionCuestionario(rs.rows.item(0).idruta, rs.rows.item(0).idfecha_ruta);
													}
												});*/
											}
										});
									} else {
										if (rutasMes.length > 1) {
											var aleatorio = Math.round(Math.random()*rutasMes.length);
											if (aleatorio == rutasMes.length) {
												aleatorio = aleatorio - 1;
											}
											tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE ((dia = ? AND hora >= ?) OR (dia = ? AND hora <= ?)) AND ruta.copia_de = ?', [fechaAyer, hora, fechaHoy, hora, rutasMes(aleatorio).idruta], function(tx, rs) {
												if (rs.rows.length != 0) {
													//Comprobar si esta activa la notificacion. Si esta activa, realizar cuestionario. Sino, activar
													console.log("Notificacion cuestionario");
													comprobarNotificacion(rs.rows.item(0).idruta, rs.rows.item(0).idfecha_ruta, momento);
												}
											});
										} 
									}
								} else {
									noHayMasRutas();
								}
							}
						}
					});
				}
			} else {
				noHayMasRutas();
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function noHayMasRutas(){
	if (rutaBorrada) {
		enviarDatosDiarios();
	}
	alert("No hay más rutas pendientes de valoración");
	rutaBorrada = false;
	cordova.plugins.notification.local.cancel(10, function(){console.log("Notificacion cancelada")});
	window.location.href="#app";
	$('#principal').show();
	$('#configuracion').hide();
	$('#acerca').hide();
}

function comprobarNotificacion(idruta, idfecha_ruta, momento){
	cordova.plugins.notification.local.isScheduled(10, function(a){
		if(a){
			cordova.plugins.notification.local.update({id:10, at:momento, data:{idruta: idruta, idfecha_ruta: idfecha_ruta}});
			realizarCuestionario(idruta, idfecha_ruta);
		}else{
			console.log("Idruta: " + rutasRecuperadas.item(0).idruta + " - Idfecha_ruta: " + rutasRecuperadas.item(0).idfecha_ruta);
			activarNotificacionCuestionario(idruta, idfecha_ruta);
		}
	});
}

function activarNotificacionCuestionario(idruta, idfecha_ruta){
	cordova.plugins.notification.local.schedule({
		text: "Tienes una ruta pendiente de valoración",
		id: 10,
		every: "hour",
		data: {idruta: idruta, idfecha_ruta: idfecha_ruta}
	});
}

function realizarCuestionario(idruta, idfecha_ruta){

	$("body").addClass("loading");
	window.location.href="#cuestionarioPage";

	$('#inicioCuestionario').attr("name", idfecha_ruta);
	$("#inicioCuestionario").show();
	$("#txtTitulo").show();
	$("#btnsCuestionario").show();
	$('#categorias').hide();
	$('#cuestionario').hide();
	recuperarHoraInicioFin(idruta);
	recuperarRuta(idruta, "mapaCuestionario");
	$(document).on("pageshow", "#cuestionarioPage", function() {
		recuperarHoraInicioFin(idruta);
		recuperarRuta(idruta, "mapaCuestionario");
		$("body").removeClass("loading");
	});

	$("body").removeClass("loading");
}

function recuperarHoraInicioFin(idruta){
	db.transaction(function (tx) {
		tx.executeSql('SELECT hora FROM punto_intermedio WHERE idruta = ? AND orden = 1', [idruta], function(tx, rs) {
			if (rs.rows.length != 0) {
				horaIni = rs.rows.item(0).hora;
				horasMinutosIni = horaIni.slice(0,5);
				$("#horaIni").text("Hora aproximada de inicio: " + horasMinutosIni);
			}
		});
		tx.executeSql('SELECT hora FROM punto_intermedio WHERE idruta = ? ORDER BY orden DESC', [idruta], function(tx, rs) {
			if (rs.rows.length != 0) {
				horaFin = rs.rows.item(0).hora;
				horasMinutosFin = horaFin.slice(0,5);
				$("#horaFin").text("Hora aproximada de fin: " + horasMinutosFin);	
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

$(document).ready(function(e) {

	$("#btnSi").on("click", function(){
		$("body").addClass("loading");
		$("#txtTitulo").hide();
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
					$("body").removeClass("loading");
				}
		});
	});

	$("#btnNo").on("click", function(){
		borrarRuta($('#inicioCuestionario').attr("name"));
		rutaBorrada = true;
		obtenerHoraCuestionario();
	});

	$("#btnSiguiente").on("click", function(){
		$("body").addClass("loading");
		$("#inicioCuestionario").hide();
		categoria = parseInt($("#rdBtnCategoria :checked").val());
		idfecha_ruta = $("#inicioCuestionario").attr("name");
		solicitarPreguntas(categoria, idfecha_ruta);
	});

	$("#btnEnviarCuestionario").on("click", function() {
		alert("Cuestionario guardado. Gracias por tu colaboración");
		reasignarFechaRuta($('#inicioCuestionario').attr("name"));
		almacenarRespuestas();
		cordova.plugins.notification.local.cancel(10, function(){console.log("Notificacion cancelada")});
		window.location.href="#app";
		$('#principal').show();
		$('#configuracion').hide();
		$('#acerca').hide();
	})
});

function solicitarPreguntas(categoria, idfecha_ruta){
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

						datos = [{categoria:categoria, genero:genero, horario:horario}];
						datosJSON = JSON.stringify(datos);

						$.ajax({type: "POST", 
								url: "http://galan.ehu.eus/dpuerto001/WEB/solicitarPreguntas.php",
								data: {dato:datosJSON},
								success: function(data){
											console.log(data);
											crearCuestionario(data);
										},
								error: function(e){
											console.log("ERROR");
											alert("Fallo de conexión. Por favor, inténtelo de nuevo. Si el problema persiste, contáctenos");
											$("#inicioCuestionario").show();
											$("body").removeClass("loading");
								}
						});
					}
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function crearCuestionario(data){
	//Si existe alguna pregunta, elimina
	if ($("#preguntas div[id^='pregunta']").length != 0) {
		$("#preguntas").empty();
	}

	preguntasRespuestas = data.preguntasRespuestas;
	for (var i = 0; i < preguntasRespuestas.length; i++) {
		var enunciado = $("<legend>", {id:"texto"+ (i+1), text:preguntasRespuestas[i].textoPregunta});
		$("#preguntas").append(enunciado);
		var pregunta = $("<div>", {id:"pregunta"+ (i+1), name:preguntasRespuestas[i].idPregunta});
		$("#preguntas").append(pregunta);
		var tipoRespuesta = preguntasRespuestas[i].tipoRespuesta;
		for (var j = 0; j < preguntasRespuestas[i].respuestas.length; j++) {
			var respuesta = preguntasRespuestas[i].respuestas[j];
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
	$("#cuestionario").attr("name", data.version);
	$("#cuestionario").show();
	$("body").removeClass("loading");
}

function reasignarFechaRuta(idfecha_ruta){
	db.transaction(function(tx) {
		tx.executeSql('SELECT fecha_ruta.idruta, ruta.copia_de FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE idfecha_ruta = ? AND copia_de IS NOT NULL', [idfecha_ruta], function(tx, rs) {
			if (rs.rows.length != 0) {
				idruta_copia = rs.rows.item(0).idruta;
				idruta_original = rs.rows.item(0).copia_de;
				tx.executeSql('UPDATE fecha_ruta SET idruta = ? WHERE idfecha_ruta = ?', [idruta_original, idfecha_ruta], function(tx, rs) {
					if (rs.rowsAffected != 0) {
						tx.executeSql('SELECT dia, hora, en_servidor, configuracion_idconfiguracion FROM fecha_ruta WHERE idfecha_ruta = ?', [idfecha_ruta], function(tx, rs) {
							if (rs.rows.length != 0) {
								dia = rs.rows.item(0).dia;
								hora = rs.rows.item(0).hora;
								en_servidor = rs.rows.item(0).en_servidor;
								configuracion_idconfiguracion = rs.rows.item(0).configuracion_idconfiguracion;
								fecha = new Date();
								uuid = device.uuid;
								idfecha_ruta_nueva = uuid.concat(fecha.getTime());
								tx.executeSql('INSERT INTO fecha_ruta (idfecha_ruta, dia, hora, idruta, en_servidor, configuracion_version) VALUES (?,?,?,?,?,?)', [idfecha_ruta_nueva, dia, hora, idruta_copia, en_servidor, configuracion_idconfiguracion], function(tx, rs) {
									if (rs.rowsAffected != 0) {
										aumentarCuantas(idruta_original);
										tx.executeSql('SELECT idruta FROM ruta WHERE idruta = ?, en_servidor = 1', [idruta_original], function(tx, rs) {
											if (rs.rows.length != 0) {
												enviarFechaRuta(idfecha_ruta);
												enviarRuta(idfecha_ruta_nueva);
											} else {
												enviarRuta(idfecha_ruta);
												enviarRuta(idfecha_ruta_nueva);
											}
										});
									}
								});
							}
						});							
					}
				});	
			} else {
				enviarRuta(idfecha_ruta);
			}
		});		
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("TODO OK reasignarFechaRuta");});
}

function almacenarRespuestas() {
	idfecha_ruta = $('#inicioCuestionario').attr("name");
	uuid = device.uuid;
	time = new Date();
	idfecha_cuestionario = uuid.concat(time.getTime());

	diaHoy = fecha.getDate();
	mesHoy = fecha.getMonth() + 1;
	anyoHoy = fecha.getFullYear();
	fechaHoy = (anyoHoy * 10000) + (mesHoy * 100) + diaHoy;

	hora = fecha.toLocaleTimeString();
	horasMinutos = hora.slice(0,5);
	horaMod = horasMinutos.replace(/:/g,"");
	horaInt = parseInt(horaMod);

	version = $("#cuestionario").attr("name");

	db.transaction(function (tx) {
		tx.executeSql('INSERT INTO fecha_cuestionario (idfecha_cuestionario, dia, hora, version) VALUES (?,?,?,?)', [idfecha_cuestionario, fechaHoy, horaInt, version], function(tx, rs){
			if (rs.rowsAffected != 0) {
				numero = time.getTime() * 10;
				for (var i = 0; i < $("#preguntas div[id^='pregunta']").length; i++) {
					id = numero + (i+1);
					idpregunta = $("#pregunta" + (i+1)).attr("name");
					for (var j = 0; j < $("#pregunta" + (i+1) + " :checked").length; j++) {
						numero2 = id * 10;
						id2 = numero2 + (j+1);
						idrespuesta_usuario = uuid.concat(id2);
						opcion_elegida = $("#pregunta" + (i+1) + " :checked")[j].id;
						categoria = parseInt($("#rdBtnCategoria :checked").val());
						tx.executeSql('INSERT INTO respuesta_usuario (idrespuesta_usuario, idpregunta, opcion_elegida) VALUES (?,?,?)', [idrespuesta_usuario, idpregunta, opcion_elegida], function(tx, rs){});
						tx.executeSql('INSERT INTO ruta_valorada (fecha_ruta_idfecha_ruta, fecha_cuestionario_idfecha_cuestionario, respuesta_usuario_idrespuesta_usuario, en_servidor, categoria) VALUES (?,?,?,?,?)', [idfecha_ruta, idfecha_cuestionario, idrespuesta_usuario, 0, categoria], function(tx, rs){});
					}
				}
			}			
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {enviarCuestionario(idfecha_ruta)});
}

function enviarCuestionario(idfecha_ruta){
	identificadores = 0;
	db.transaction(function (tx) {
		tx.executeSql('SELECT fecha_cuestionario_idfecha_cuestionario, categoria FROM ruta_valorada WHERE fecha_ruta_idfecha_ruta = ?', [idfecha_ruta], function(tx, rs){
			if (rs.rows.length != 0) {
				idfecha_cuestionario = rs.rows.item(0).fecha_cuestionario_idfecha_cuestionario;
				categoria = rs.rows.item(0).categoria;
				tx.executeSql('SELECT dia, hora, version FROM fecha_cuestionario WHERE idfecha_cuestionario = ?', [idfecha_cuestionario], function(tx, rs){
					if (rs.rows.length != 0) {
						dia = rs.rows.item(0).dia;
						hora = rs.rows.item(0).hora;
						version = rs.rows.item(0).version;
						
						tx.executeSql('SELECT respuesta_usuario_idrespuesta_usuario FROM ruta_valorada WHERE fecha_ruta_idfecha_ruta = ?', [idfecha_ruta], function(tx, rs){
							if (rs.rows.length != 0) {
								identificadores = rs.rows;
							}
						});
					}
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {
		if (identificadores != 0) {
			db.transaction(function (tx) {
				respuestas = new Array();
				for (var i = 0; i < identificadores.length; i++) {
					idrespuesta_usuario = identificadores.item(i).respuesta_usuario_idrespuesta_usuario;
					tx.executeSql('SELECT idpregunta, opcion_elegida FROM respuesta_usuario WHERE idrespuesta_usuario = ?', [idrespuesta_usuario], function(tx, rs){
						if (rs.rows.length != 0) {
							idpregunta = rs.rows.item(0).idpregunta;
							opcion_elegida = rs.rows.item(0).opcion_elegida;
							respuestas.push({idpregunta:idpregunta, idrespuesta:opcion_elegida});
						}
					});
				}					
			}, function(err){console.log("ERROR: " + err.message);}, function () {
				datos = [{idfecha_cuestionario: idfecha_cuestionario, categoria:categoria, dia:dia, hora:hora, idusuario:idusuario, idfecha_ruta:idfecha_ruta, version:version, respuestas:respuestas}];
				datosJSON = JSON.stringify(datos);
				$.ajax({type: "POST",
						url: "http://galan.ehu.eus/dpuerto001/WEB/enviarCuestionario.php",
						data: {dato:datosJSON},
						success: function(data){
									console.log("ENVIADO");
									db.transaction(function(tx) {
										tx.executeSql('UPDATE ruta_valorada SET en_servidor = 1 WHERE fecha_ruta_idfecha_ruta = ?', [data[0].idfecha_ruta], function(tx, rs) {
											enviarDatosDiarios();	
										});
									}, function(err){console.log('ERROR UPDATE enviarCuestionario: ' + err.message);}, function(){console.log('TODO OK UPDATE enviarCuestionario');});
						},
						error: function(e){console.log("ERROR");}
					});
			});
		}
	});
}

function enviarCuestionarioPendiente(){
	fecha = new Date();
	diaHoy = fecha.getDate();
	mesHoy = fecha.getMonth() + 1;
	anyoHoy = fecha.getFullYear();
	fechaAyer = diaAnterior(diaHoy, mesHoy, anyoHoy);

	db.transaction(function (tx) {
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion', [], function(tx, rs) {
			if (rs.rows.length != 0) {
				hora = rs.rows.item(0).realizar_cuestionario;
				tx.executeSql('SELECT respuesta_usuario_idrespuesta_usuario FROM ruta_valorada INNER JOIN fecha_cuestionario ON fecha_cuestionario_idfecha_cuestionario = idfecha_cuestionario WHERE ((dia = ? AND hora < ?) OR dia < ?) AND en_servidor = 0', [fechaAyer, hora, fechaAyer], function(tx, rs){
					if (rs.rows.length > 0) {
						idsrespuestas = rs.rows;
						for (var i = 0; i < idsrespuestas.length; i++) {
							tx.executeSql('SELECT respuesta_usuario_idrespuesta_usuario, fecha_cuestionario_idfecha_cuestionario, categoria, dia, hora, fecha_ruta_idfecha_ruta, version, idpregunta, opcion_elegida FROM fecha_cuestionario INNER JOIN ruta_valorada ON idfecha_cuestionario = fecha_cuestionario_idfecha_cuestionario INNER JOIN respuesta_usuario ON respuesta_usuario_idrespuesta_usuario = idrespuesta_usuario WHERE respuesta_usuario_idrespuesta_usuario = ?', [idsrespuestas.item(i).respuesta_usuario_idrespuesta_usuario], function(tx, rs){
								if (rs.rows.length > 0) {
									idfecha_cuestionario = rs.rows.item(0).fecha_cuestionario_idfecha_cuestionario;
									categoria = rs.rows.item(0).categoria;
									dia = rs.rows.item(0).dia;
									hora = rs.rows.item(0).hora;
									idfecha_ruta = rs.rows.item(0).fecha_ruta_idfecha_ruta;
									version = rs.rows.item(0).version;
									idpregunta = rs.rows.item(0).idpregunta;
									opcion_elegida = rs.rows.item(0).opcion_elegida;
									idrespuesta_usuario = rs.rows.item(0).respuesta_usuario_idrespuesta_usuario;

									datos = {idfecha_cuestionario: idfecha_cuestionario, categoria:categoria, dia:dia, hora:hora, idusuario:idusuario, idfecha_ruta:idfecha_ruta, version:version, idpregunta:idpregunta, opcion_elegida:opcion_elegida, idrespuesta_usuario:idrespuesta_usuario};
									datosJSON = JSON.stringify(datos);
									$.ajax({type: "POST",
											url: "http://galan.ehu.eus/dpuerto001/WEB/enviarCuestionarioPendiente.php",
											data: {dato:datosJSON},
											success: function(data){
														db.transaction(function(tx) {
															tx.executeSql('UPDATE ruta_valorada SET en_servidor = 1 WHERE respuesta_usuario_idrespuesta_usuario = ?', [data[0].idrespuesta_usuario], function(tx, rs) {
																enviarDatosDiarios();	
															});
														}, function(err){console.log('ERROR UPDATE enviarCuestionario: ' + err.message);}, function(){console.log('TODO OK UPDATE enviarCuestionario');});
											},
											error: function(e){console.log("ERROR");}
									});
								}
							});
						}
					}
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function enviarDatosDiarios(){
	fecha = new Date();
	diaHoy = fecha.getDate();
	mesHoy = fecha.getMonth() + 1;
	anyoHoy = fecha.getFullYear();
	fechaHoy = (anyoHoy * 10000) + (mesHoy * 100) + diaHoy;
	fechaAyer = diaAnterior(diaHoy, mesHoy, anyoHoy);

	db.transaction(function (tx) {
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion', [], function(tx, rs) {
			if (rs.rows.length != 0) {
				hora = rs.rows.item(0).realizar_cuestionario;
				tx.executeSql('SELECT idfecha_ruta FROM fecha_ruta WHERE (dia = ? AND hora >= ? AND en_servidor = 0) OR (dia = ? AND hora <= ? AND en_servidor = 0)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
					if (rs.rows.length != 0) {
						filas = rs.rows;
						for (var i = 0; i < filas.length; i++) {
							reasignarFechaRuta(filas.item(i).idfecha_ruta);
						}
					}
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {console.log("TODO OK enviarDatosDiarios"); enviosPendientes()});
}