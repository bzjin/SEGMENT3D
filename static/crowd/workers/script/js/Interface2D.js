window.onload = function() {
	
	var canvas = d3.select("#grid2d").append("canvas")
		.attr("id", "grid2d")
		.attr("width",  750)
		.attr("height", 800);

	context = canvas.node().getContext("2d");
	context.fillStyle =("white");

	context.font = "10px Effra";
	context.textAlign = "start";
	context.textBaseline = "hanging";

	context.fillStyle = 'black';
	context.fillRect(50, 100, 300, 300);

	context.fillStyle = 'black';
	context.fillRect(400, 100, 300, 300);

}