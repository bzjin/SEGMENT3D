window.onload = function() {
	/* XZ view */

	var canvas = d3.select("#grid2d").append("canvas")
		.attr("id", "grid2d")
		.attr("width",  400)
		.attr("height", 500);

	var canvas2 = d3.select("#container2").append("canvas")
		.attr("id", "keycanvas")
		.attr("width",  500)
		.attr("height", 500);

	context = canvas.node().getContext("2d");
	context2 = canvas2.node().getContext("2d");
	
	context.fillStyle =("white");

	context2.font = "10px Effra";
	context2.fillStyle = "white"
	context2.beginPath();
	context2.lineWidth="5";
	context2.strokeStyle = '#F2B333';
	context2.strokeRect(97, 122, 256, 256);

	context2.strokeStyle = 'white';
	context2.lineWidth="50";
	context2.strokeStyle = 'rgba(255, 255, 255, .3)';
	context2.strokeRect(125, 150, 200, 200);

	context2.lineWidth="1";
	context2.strokeStyle = 'white';

	context.font = "10px Effra";
	context.textAlign = "start";
	context.textBaseline = "hanging";

	context.fillText("Slice 1", 307, 125);
	context.fillText("Slice 60", 307, 375);

	context.beginPath();
	context.lineWidth="5";
	context.fillStyle = 'black';
	context.strokeStyle = '#FF0058';
	context.fillRect(50, 125, 250, 250);
    context.strokeRect(48, 123, 252, 252);
	context.lineWidth="1";
	context.strokeStyle = 'white';

	//console.log(CoseGUI.meshLabels)

	document.getElementById("container").addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(evt);
        if ((mousePos.x >= 0 && mousePos.x <= 250) && (mousePos.y >= 0 && mousePos.y <= 250)){
        	changeXZPlane(mousePos.x, mousePos.y, slicen);
        }
      }, false);

	document.getElementById("container").addEventListener('scroll', function(evt) {
	});

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

 	    context.fillStyle = '#21A9CC';
		context.fillRect(xPos + 50, 125, 1, 250); //vertical crosshair
		context.fillStyle = '#F2B333';
		context.fillRect(50, sliceD + 125, 250, 1); //horizontal crosshair

		drawCube(120, 225, 80, 100, 100, sliceMini, xPos/250, yPos/250);
    }

	var minimap = d3.select("#minimap").append("canvas")
			.attr("id", "minimapc")
			.attr("width",  250)
			.attr("height", 250);

    var mapctx = minimap.node().getContext("2d");
    mapctx.strokeStyle = "white";
    
	function drawCube(x, y, wx, wy, h, slice, xCh, yCh) {
		mapctx.clearRect(0, 0, 300, 300);

	    mapctx.fillStyle = "#F2B333";
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
	    mapctx.strokeStyle = "#21A9CC";
	    mapctx.beginPath();
	    mapctx.moveTo(x, y - 100 + slice);
	   	mapctx.lineTo(x - wx, y - h - wx * 0.5 + slice);
		mapctx.closePath();
	    mapctx.stroke();
        mapctx.translate(-lengthx*Math.sin(Math.PI/3) - (xCh * 2), lengthx*Math.cos(Math.PI/3) - (xCh * 5));

        var lengthy = Math.hypot(wx, -100 + h + wx * 0.5) * yCh;
        mapctx.strokeStyle = "#FF0058";
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
	
	

	 return null;

}