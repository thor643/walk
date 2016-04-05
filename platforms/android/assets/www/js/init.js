document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	
	$("body").addClass("loading");
	rellenarSelect();
	abrirBD();
	existeBD();
	

	document.addEventListener("backbutton", onBackKeyDown, false);
}

function onBackKeyDown() { alert('Back button clicked!'); }

$(document).ready(function(e) {

	$(".ps-prov option[value=01]").removeAttr("selected");
	$(".ps-prov option[value=-1]").attr("selected", "selected");

});