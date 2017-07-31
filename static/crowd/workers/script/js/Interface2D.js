window.onload = function() {
	/* XZ view */
	var canvas = d3.select("#grid2d").append("canvas")
		.attr("id", "grid2d")
		.attr("width",  400)
		.attr("height", 500);

	var canvas2 = d3.select("#container").append("canvas")
		.attr("id", "keycanvas")
		.attr("width",  500)
		.attr("height", 500);

	context = canvas.node().getContext("2d");
	context.fillStyle =("white");

	context2 = canvas2.node().getContext("2d");
	context2.beginPath();
	context2.lineWidth="5";
	context2.strokeStyle = 'white';
	context2.strokeRect(95, 120, 260, 260);
	context2.lineWidth="1";
	context2.fillText("Scroll up and", 120, 70);
	context2.fillText("down through", 120, 80);
	context2.fillText("these slices", 120, 90);

	context.font = "10px Effra";
	context.textAlign = "start";
	context.textBaseline = "hanging";

	context.beginPath();
	context.lineWidth="1";
	context.fillStyle = 'black';
	context.strokeStyle = 'white';
	context.fillRect(50, 125, 250, 250);

	context.fillText("Slice 1", 305, 125);
	context.fillText("Slice 60", 305, 375);

	drawKey(175, 100, 20, 25, 25, 10);
	drawKey2(225, 100, 20, 25, 25, 10);

	console.log(CoseGUI.meshLabels)

	document.getElementById("container").addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(evt);
        if ((mousePos.x >= 0 && mousePos.x <= 250) && (mousePos.y >= 0 && mousePos.y <= 250)){
        	changeXZPlane(mousePos.x, mousePos.y, slicen);
        }
      }, false);

	function getMousePos(evt) {
        var rect = document.getElementById("container").getBoundingClientRect();
        return {
        	x: evt.clientX-rect.left - 110,
			y: evt.clientY-rect.top - 135
        };
      }

   function changeXZPlane(xPos, yPos){
	  	var xzurl = "";
	  	var ySlice = Math.floor(yPos/250*60);
		  
		  if (ySlice < 10) { 
		  	xzurl = 'slices/xz_000' + ySlice + '.jpg';}
		  else { 
			xzurl = 'slices/xz_00' + ySlice + '.jpg';}
        
        xzsq = new Image();

	    xzsq.src =  xzurl;

	    context.drawImage(xzsq, 50, 125, 250, 250);

	    /*drawnScribblesY[ySlice].scribbles.forEach(function(d){
			context.beginPath();
        	context.arc(d.x + 350, d.y, 5, 0, 2 * Math.PI, false);
         	context.fillStyle = 'yellow';
         	context.fill();
 	 	 })*/
 	 	//console.log(globalD);
 	 	var sliceD =  Math.floor((+globalD + .866)/(2*.866) * 250);
 	 	var sliceMini =  Math.floor((+globalD + .866)/(2*.866) * 100);

 	    context.fillStyle = 'white';
		context.fillRect(xPos + 50, 125, 1, 250); //vertical crosshair
		context.fillRect(50, sliceD + 125, 250, 1); //horizontal crosshair

		drawCube(250, 225, 80, 100, 100, sliceMini, xPos/250, yPos/250);
    }

	var minimap = d3.select("#minimap").append("canvas")
			.attr("id", "minimapc")
			.attr("width",  400)
			.attr("height", 300);

    var mapctx = minimap.node().getContext("2d");
    mapctx.strokeStyle = "white";
    
	function drawCube(x, y, wx, wy, h, slice, xCh, yCh) {
		mapctx.clearRect(0, 0, 400, 300);

	    mapctx.fillStyle = "orange";
	    mapctx.beginPath();
	    mapctx.moveTo(x, y - 100 + slice);
	    mapctx.lineTo(x - wx, y - h - wx * 0.5 + slice);
	    mapctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5) + slice);
	    mapctx.lineTo(x + wy, y - h - wy * 0.5 + slice);
	    mapctx.closePath();
	    mapctx.fill();
	    mapctx.stroke();

	    var lengthx = Math.hypot(wy, wy * 0.5) * xCh;
        mapctx.translate(lengthx*Math.sin(Math.PI/3) + (xCh * 2), -lengthx*Math.cos(Math.PI/3) + (xCh * 5));
	    mapctx.strokeStyle = "red";
	    mapctx.beginPath();
	    mapctx.moveTo(x, y - 100 + slice);
	   	mapctx.lineTo(x - wx, y - h - wx * 0.5 + slice);
		mapctx.closePath();
	    mapctx.stroke();
        mapctx.translate(-lengthx*Math.sin(Math.PI/3) - (xCh * 2), lengthx*Math.cos(Math.PI/3) - (xCh * 5));

        var lengthy = Math.hypot(wx, -100 + h + wx * 0.5) * yCh;
        mapctx.translate(lengthy*Math.sin(Math.PI/3) + (yCh * 5), +lengthy*Math.cos(Math.PI/3) - (yCh * 2));
	    mapctx.beginPath();
	    mapctx.moveTo(x - wx, y - h - wx * 0.5 + slice);
	    mapctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5) + slice);
		mapctx.closePath();
	    mapctx.stroke();
        mapctx.translate(- lengthy*Math.sin(Math.PI/3) - (yCh * 5), -lengthy*Math.cos(Math.PI/3) + (yCh * 2));


    	mapctx.strokeStyle = "white";
	    mapctx.beginPath();
	    mapctx.moveTo(x, y);
	    mapctx.lineTo(x - wx, y - wx * 0.5);
	    mapctx.lineTo(x - wx, y - h - wx * 0.5);
	    mapctx.lineTo(x, y - h * 1);
	    mapctx.closePath();
    	mapctx.stroke();

	    mapctx.beginPath();
	    mapctx.moveTo(x, y);
	    mapctx.lineTo(x + wy, y - wy * 0.5);
	    mapctx.lineTo(x + wy, y - h - wy * 0.5);
	    mapctx.lineTo(x, y - h * 1);
	    mapctx.closePath();
    	mapctx.stroke();

	    mapctx.beginPath();
	    mapctx.moveTo(x, y - h);
	    mapctx.lineTo(x - wx, y - h - wx * 0.5);
	    mapctx.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5));
	    mapctx.lineTo(x + wy, y - h - wy * 0.5);
	    mapctx.closePath();
	    mapctx.stroke();
	 }

	 function drawKey(x, y, wx, wy, h, slice) {
	 	var b = 5;
	    context.fillStyle = "orange";
	    context.beginPath();
	    context.moveTo(x - slice, y - b);
	    context.lineTo(x + wy - slice, y - wy * 0.5 - b);
	    context.lineTo(x + wy - slice, y - h - wy * 0.5 - b);
	    context.lineTo(x - slice, y - h * 1 - b);
	    context.closePath();
	    context.fill();
	    context.stroke();

    	context.strokeStyle = "white";
	    context.beginPath();
	    context.moveTo(x, y);
	    context.lineTo(x - wx, y - wx * 0.5);
	    context.lineTo(x - wx, y - h - wx * 0.5);
	    context.lineTo(x, y - h * 1);
	    context.closePath();
    	context.stroke();

	    context.beginPath();
	    context.moveTo(x, y);
	    context.lineTo(x + wy, y - wy * 0.5);
	    context.lineTo(x + wy, y - h - wy * 0.5);
	    context.lineTo(x, y - h * 1);
	    context.closePath();
    	context.stroke();

	    context.beginPath();
	    context.moveTo(x, y - h);
	    context.lineTo(x - wx, y - h - wx * 0.5);
	    context.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5));
	    context.lineTo(x + wy, y - h - wy * 0.5);
	    context.closePath();
	    context.stroke();
	 }

	 function drawKey2(x, y, wx, wy, h, slice) {
	 	context2.strokeStyle = "white";
	 	context2.fillStyle = "orange";
	    context2.beginPath();
	    context2.moveTo(x, y - 25 + slice);
	    context2.lineTo(x - wx, y - h - wx * 0.5 + slice);
	    context2.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5) + slice);
	    context2.lineTo(x + wy, y - h - wy * 0.5 + slice);
	    context2.closePath();
	    context2.fill();
	    context2.stroke();

	    context2.beginPath();
	    context2.moveTo(x, y);
	    context2.lineTo(x - wx, y - wx * 0.5);
	    context2.lineTo(x - wx, y - h - wx * 0.5);
	    context2.lineTo(x, y - h * 1);
	    context2.closePath();
    	context2.stroke();

	    context2.beginPath();
	    context2.moveTo(x, y);
	    context2.lineTo(x + wy, y - wy * 0.5);
	    context2.lineTo(x + wy, y - h - wy * 0.5);
	    context2.lineTo(x, y - h * 1);
	    context2.closePath();
    	context2.stroke();

	    context2.beginPath();
	    context2.moveTo(x, y - h);
	    context2.lineTo(x - wx, y - h - wx * 0.5);
	    context2.lineTo(x - wx + wy, y - h - (wx * 0.5 + wy * 0.5));
	    context2.lineTo(x + wy, y - h - wy * 0.5);
	    context2.closePath();
	    context2.stroke();
	 }

	 return null;

}