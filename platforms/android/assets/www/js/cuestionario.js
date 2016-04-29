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
	fechaAyer = fechaAyer(diaHoy, mesHoy, anyoHoy);

	//Para pruebas
	console.log("Fecha hoy: " + fechaHoy);
	console.log("Fecha ayer: " + fechaAyer);
	console.log("Hora: " + hora);

	db.transaction(function (tx) {
		tx.executeSql('SELECT idruta FROM  fecha_ruta WHERE (dia = ? AND hora > ?) OR (dia = ? AND hora < ?)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			if (rs.rows.length > 0) {
				recuperarRutasRealizadasNuevas(fechaAyer, fechaHoy, hora);
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function () {});
}

function fechaAyer(dia, mes, anyo){

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
		tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE (dia = ? AND hora > ? AND categoria is NULL AND en_servidor is NULL) OR (dia = ? AND hora < ?  AND categoria is NULL AND en_servidor is NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
			if (rs.rows.length > 0) {
				rutasRecuperadas = rs.rows;
				if (rutasRecuperadas.length == 1) {
					realizarCuestionario(rutasRecuperadas.item(0));
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
		tx.executeSql('SELECT fecha_ruta.idruta, fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE (dia = ? AND hora > ? AND categoria is NULL) OR (dia = ? AND hora < ?  AND categoria is NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
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
		tx.executeSql('SELECT fecha_ruta.idruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta INNER JOIN ruta_valorada ON fecha_ruta.idfecha_ruta = ruta_valorada.fecha_ruta_idfecha_ruta INNER JOIN fecha_cuestionario ON ruta_valorada.fecha_cuestionario_idfecha_cuestionario = fecha_cuestionario.idfecha_cuestionario WHERE (fecha_ruta.dia = ? AND fecha_ruta.hora > ? AND ruta.categoria is not NULL AND ruta.en_servidor is not NULL) OR (fecha_ruta.dia = ? AND fecha_ruta.hora < ?  AND ruta.categoria is not NULL AND ruta.en_servidor is not NULL)', [fechaAyer, hora, fechaHoy, hora], function(tx, rs){
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

function realizarCuestionario(idruta){
	
	recuperarRuta(data.item(aleatorio).idruta, "mapaCuestionario");
//Cambiar texto label

$("#rdBtnCategoria label[for='cat"+ idcategori +"']").text(textocategoria);
}

function realizarCuestionarioMensual(){

}